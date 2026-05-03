import type { Product } from "@/lib/database.types";
import type { ProductInput } from "@/lib/data";

import { parseCsv, serializeCsv, UTF8_BOM } from "./csv";

/** Canonical column order for product CSV. */
export const PRODUCT_COLUMNS = [
  "sku",
  "name",
  "category",
  "unit_price",
  "quantity",
  "reorder_point",
  "notes",
] as const;

export type ProductColumn = (typeof PRODUCT_COLUMNS)[number];

export type ParsedRow = {
  /** 1-based row number from the source file (header is row 1, first data row is 2). */
  lineNumber: number;
  /** Raw cell values keyed by canonical column name. */
  raw: Record<ProductColumn, string>;
  /** Coerced product input ready to send to data layer. */
  values: ProductInput;
  /** Per-row validation errors. Empty when valid. */
  errors: string[];
};

export type ParseResult = {
  rows: ParsedRow[];
  /** File-level errors (missing/extra columns, empty file, etc). */
  fileErrors: string[];
};

function toFloat(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed === "") return 0;
  // Accept comma decimal separator as a courtesy
  const normalized = trimmed.replace(",", ".");
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : NaN;
}

function toInt(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed === "") return 0;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : NaN;
}

function buildFilename(today: Date): string {
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `saldo-produkter-${y}-${m}-${d}.csv`;
}

/** Build the CSV filename for export, e.g. "saldo-produkter-2026-05-03.csv". */
export function exportFilename(date: Date = new Date()): string {
  return buildFilename(date);
}

/** Serialize products to a CSV string with UTF-8 BOM. */
export function serializeProducts(products: Product[]): string {
  const header = PRODUCT_COLUMNS.slice();
  const dataRows = products.map((p) => [
    p.sku,
    p.name,
    p.category ?? "",
    p.unit_price,
    p.quantity,
    p.reorder_point,
    p.notes ?? "",
  ]);
  return UTF8_BOM + serializeCsv([header, ...dataRows]) + "\r\n";
}

/** Sample CSV (header + 2 example rows) for the "download template" link. */
export function sampleProductsCsv(): string {
  const header = PRODUCT_COLUMNS.slice();
  const rows: (string | number)[][] = [
    header.slice(),
    ["SKU-001", "Exempelprodukt", "Tillbehör", 99.5, 10, 2, "Anteckning"],
    ["SKU-002", "Annan produkt", "", 250, 0, 5, ""],
  ];
  return UTF8_BOM + serializeCsv(rows) + "\r\n";
}

/**
 * Parse a CSV file's text into rows + per-row validation. Maps source columns by
 * header name (case-insensitive), so column order is forgiving — but missing
 * required columns is a file-level error.
 */
export function parseProductsCsv(text: string): ParseResult {
  const fileErrors: string[] = [];
  const grid = parseCsv(text);

  // Drop trailing entirely-empty rows that come from a final newline.
  while (grid.length > 0) {
    const last = grid[grid.length - 1];
    if (last.length === 0 || last.every((c) => c.trim() === "")) {
      grid.pop();
    } else {
      break;
    }
  }

  if (grid.length === 0) {
    fileErrors.push("Filen är tom.");
    return { rows: [], fileErrors };
  }

  const headerRow = grid[0].map((h) => h.trim().toLowerCase());
  const indexByColumn: Record<ProductColumn, number> = {
    sku: -1,
    name: -1,
    category: -1,
    unit_price: -1,
    quantity: -1,
    reorder_point: -1,
    notes: -1,
  };
  for (const col of PRODUCT_COLUMNS) {
    indexByColumn[col] = headerRow.indexOf(col);
  }

  const missing = PRODUCT_COLUMNS.filter((c) => indexByColumn[c] === -1);
  if (missing.length > 0) {
    fileErrors.push(
      `Saknar kolumn(er): ${missing.join(", ")}. Förväntade kolumner: ${PRODUCT_COLUMNS.join(", ")}.`,
    );
    return { rows: [], fileErrors };
  }

  const rows: ParsedRow[] = [];
  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r];
    // Skip entirely-empty data rows silently
    if (cells.every((c) => c.trim() === "")) continue;

    const raw = {} as Record<ProductColumn, string>;
    for (const col of PRODUCT_COLUMNS) {
      raw[col] = (cells[indexByColumn[col]] ?? "").trim();
    }

    const errors: string[] = [];
    if (!raw.sku) errors.push("SKU saknas");
    if (!raw.name) errors.push("Namn saknas");

    const unitPrice = toFloat(raw.unit_price);
    if (Number.isNaN(unitPrice)) errors.push(`Ogiltigt pris: "${raw.unit_price}"`);
    else if (unitPrice < 0) errors.push("Pris kan inte vara negativt");

    const quantity = toInt(raw.quantity);
    if (Number.isNaN(quantity)) errors.push(`Ogiltigt antal: "${raw.quantity}"`);
    else if (quantity < 0) errors.push("Antal kan inte vara negativt");

    const reorderPoint = toInt(raw.reorder_point);
    if (Number.isNaN(reorderPoint))
      errors.push(`Ogiltig beställningspunkt: "${raw.reorder_point}"`);
    else if (reorderPoint < 0)
      errors.push("Beställningspunkt kan inte vara negativ");

    const values: ProductInput = {
      sku: raw.sku,
      name: raw.name,
      category: raw.category === "" ? null : raw.category,
      unit_price: Number.isNaN(unitPrice) ? 0 : unitPrice,
      quantity: Number.isNaN(quantity) ? 0 : quantity,
      reorder_point: Number.isNaN(reorderPoint) ? 0 : reorderPoint,
      notes: raw.notes === "" ? null : raw.notes,
    };

    rows.push({
      lineNumber: r + 1,
      raw,
      values,
      errors,
    });
  }

  // Detect duplicate SKUs within the file — would cause unpredictable upserts.
  const seen = new Map<string, number>();
  for (const row of rows) {
    if (!row.raw.sku) continue;
    const prev = seen.get(row.raw.sku);
    if (prev !== undefined) {
      row.errors.push(`Duplicerad SKU (även rad ${prev})`);
    } else {
      seen.set(row.raw.sku, row.lineNumber);
    }
  }

  return { rows, fileErrors };
}

/** Trigger a browser download of the given text as a file. */
export function downloadTextFile(
  text: string,
  filename: string,
  mime = "text/csv;charset=utf-8",
): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so browsers can finalize the download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
