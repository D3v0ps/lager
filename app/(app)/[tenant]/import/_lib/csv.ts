// Minimal CSV parser/serializer with double-quote escaping.
// Handles: quoted fields, embedded commas/newlines inside quotes, "" -> " escape.
// Good enough for export-then-import roundtrip; not a full RFC 4180 implementation.

type CsvRow = string[];

/**
 * Parse CSV text into rows of string fields. Strips a UTF-8 BOM if present.
 * Recognizes \r\n, \n, and \r as record separators outside quoted fields.
 */
export function parseCsv(text: string): CsvRow[] {
  // Strip UTF-8 BOM
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const rows: CsvRow[] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // Lookahead for escaped quote
        if (i + 1 < len && text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }

    if (ch === "\r" || ch === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      // Consume \r\n as a single separator
      if (ch === "\r" && i + 1 < len && text[i + 1] === "\n") {
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    field += ch;
    i++;
  }

  // Flush trailing field/row (but skip a single empty trailing line)
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/** Quote a single field if needed and double-up internal quotes. */
function escapeField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

type CsvSerializeValue = string | number | null | undefined;

/**
 * Serialize a 2D array of values into CSV text. Numbers are emitted unquoted,
 * strings are quoted only when they contain comma, double-quote, or newline.
 * null/undefined become empty fields. Uses CRLF for Excel compatibility.
 */
export function serializeCsv(rows: CsvSerializeValue[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          if (cell == null) return "";
          if (typeof cell === "number") {
            if (!Number.isFinite(cell)) return "";
            return String(cell);
          }
          return escapeField(cell);
        })
        .join(","),
    )
    .join("\r\n");
}

/** UTF-8 BOM string for Excel compatibility. */
export const UTF8_BOM = "﻿";
