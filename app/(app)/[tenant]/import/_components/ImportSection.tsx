"use client";

import { useMemo, useRef, useState } from "react";

import { createProduct, listProducts, updateProduct } from "@/lib/data";
import { useTenant } from "@/lib/tenant-context";
import type { Product } from "@/lib/database.types";

import {
  downloadTextFile,
  parseProductsCsv,
  PRODUCT_COLUMNS,
  sampleProductsCsv,
  type ParsedRow,
  type ParseResult,
} from "../_lib/products-csv";

const PREVIEW_LIMIT = 10;

type ImportError = {
  lineNumber: number;
  sku: string;
  message: string;
};

type Summary = {
  created: number;
  updated: number;
  errors: ImportError[];
};

type ImportState =
  | { kind: "idle" }
  | { kind: "running"; current: number; total: number }
  | { kind: "done"; summary: Summary };

export function ImportSection() {
  const tenant = useTenant();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importState, setImportState] = useState<ImportState>({ kind: "idle" });
  const [errorsExpanded, setErrorsExpanded] = useState(false);

  const validRows = useMemo(
    () => (parseResult ? parseResult.rows.filter((r) => r.errors.length === 0) : []),
    [parseResult],
  );
  const invalidCount = useMemo(
    () =>
      parseResult ? parseResult.rows.filter((r) => r.errors.length > 0).length : 0,
    [parseResult],
  );

  function reset() {
    setFilename(null);
    setParseResult(null);
    setParseError(null);
    setImportState({ kind: "idle" });
    setErrorsExpanded(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setImportState({ kind: "idle" });
    setParseError(null);
    setParseResult(null);
    setErrorsExpanded(false);
    if (!file) {
      setFilename(null);
      return;
    }
    setFilename(file.name);
    try {
      const text = await file.text();
      const result = parseProductsCsv(text);
      setParseResult(result);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleImport() {
    if (!parseResult || validRows.length === 0) return;
    setImportState({ kind: "running", current: 0, total: validRows.length });

    let existing: Product[];
    try {
      existing = await listProducts();
    } catch (err) {
      setImportState({
        kind: "done",
        summary: {
          created: 0,
          updated: 0,
          errors: [
            {
              lineNumber: 0,
              sku: "",
              message: `Kunde inte hämta befintliga produkter: ${
                err instanceof Error ? err.message : String(err)
              }`,
            },
          ],
        },
      });
      return;
    }

    const bySku = new Map<string, Product>();
    for (const p of existing) bySku.set(p.sku, p);

    const summary: Summary = { created: 0, updated: 0, errors: [] };

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setImportState({
        kind: "running",
        current: i + 1,
        total: validRows.length,
      });
      try {
        const match = bySku.get(row.values.sku);
        if (match) {
          await updateProduct(match.id, {
            sku: row.values.sku,
            name: row.values.name,
            category: row.values.category,
            unit_price: row.values.unit_price,
            cost_price: row.values.cost_price,
            reorder_point: row.values.reorder_point,
            notes: row.values.notes,
          });
          summary.updated++;
        } else {
          if (!tenant) throw new Error("Saknar tenant-kontext");
          const created = await createProduct({
            ...row.values,
            tenant_id: tenant.id,
          });
          bySku.set(created.sku, created);
          summary.created++;
        }
      } catch (err) {
        summary.errors.push({
          lineNumber: row.lineNumber,
          sku: row.values.sku,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    setImportState({ kind: "done", summary });
  }

  function handleDownloadTemplate() {
    downloadTextFile(sampleProductsCsv(), "saldo-produkter-mall.csv");
  }

  const canImport =
    parseResult !== null &&
    parseResult.fileErrors.length === 0 &&
    invalidCount === 0 &&
    validRows.length > 0 &&
    importState.kind !== "running";

  return (
    <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Importera produkter</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Ladda upp en CSV med kolumnerna {PRODUCT_COLUMNS.join(", ")} (i den
          ordningen). Existerande SKU:er uppdateras, nya skapas.
        </p>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2"
        >
          Ladda ner mall
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800">
          Välj fil
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>
        {filename && (
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {filename}
          </span>
        )}
        {filename && (
          <button
            type="button"
            onClick={reset}
            className="text-sm text-neutral-500 hover:underline"
          >
            Rensa
          </button>
        )}
      </div>

      {parseError && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-sm">
          Kunde inte läsa filen: {parseError}
        </div>
      )}

      {parseResult && parseResult.fileErrors.length > 0 && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-sm space-y-1">
          {parseResult.fileErrors.map((m, i) => (
            <p key={i}>{m}</p>
          ))}
        </div>
      )}

      {parseResult && parseResult.fileErrors.length === 0 && (
        <PreviewTable rows={parseResult.rows} invalidCount={invalidCount} />
      )}

      {parseResult && parseResult.fileErrors.length === 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleImport}
            disabled={!canImport}
            className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {importState.kind === "running"
              ? `Importerar ${importState.current}/${importState.total}…`
              : `Importera ${validRows.length} ${
                  validRows.length === 1 ? "rad" : "rader"
                }`}
          </button>
          {invalidCount > 0 && (
            <span className="text-sm text-red-700 dark:text-red-400">
              {invalidCount}{" "}
              {invalidCount === 1
                ? "rad har fel — åtgärda i CSV:en innan import"
                : "rader har fel — åtgärda i CSV:en innan import"}
            </span>
          )}
        </div>
      )}

      {importState.kind === "done" && (
        <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 p-3 text-sm space-y-2">
          <p className="font-medium">
            {importState.summary.created} skapade,{" "}
            {importState.summary.updated} uppdaterade,{" "}
            {importState.summary.errors.length} fel
          </p>
          {importState.summary.errors.length > 0 && (
            <details
              open={errorsExpanded}
              onToggle={(e) =>
                setErrorsExpanded((e.target as HTMLDetailsElement).open)
              }
            >
              <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline">
                Visa fel ({importState.summary.errors.length})
              </summary>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                {importState.summary.errors.map((e, i) => (
                  <li key={i}>
                    {e.lineNumber > 0 && (
                      <>
                        Rad {e.lineNumber}
                        {e.sku ? ` (${e.sku})` : ""}:{" "}
                      </>
                    )}
                    {e.message}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  );
}

function PreviewTable({
  rows,
  invalidCount,
}: {
  rows: ParsedRow[];
  invalidCount: number;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-neutral-500">Inga datarader hittades i filen.</p>
    );
  }

  const previewRows = rows.slice(0, PREVIEW_LIMIT);
  const remaining = rows.length - previewRows.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-600 dark:text-neutral-400">
          {rows.length} {rows.length === 1 ? "rad" : "rader"} totalt
          {invalidCount > 0 && (
            <>
              {" "}·{" "}
              <span className="text-red-700 dark:text-red-400">
                {invalidCount} med fel
              </span>
            </>
          )}
        </span>
        {remaining > 0 && (
          <span className="text-neutral-500">
            visar första {previewRows.length}
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-xs">
          <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-left">
            <tr>
              <th className="px-2 py-1.5 font-medium">Rad</th>
              {PRODUCT_COLUMNS.map((c) => (
                <th key={c} className="px-2 py-1.5 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row) => {
              const bad = row.errors.length > 0;
              return (
                <tr
                  key={row.lineNumber}
                  className={`border-t border-neutral-200 dark:border-neutral-800 ${
                    bad ? "bg-red-50 dark:bg-red-950/30" : ""
                  }`}
                >
                  <td className="px-2 py-1.5 text-neutral-500">
                    {row.lineNumber}
                  </td>
                  {PRODUCT_COLUMNS.map((c) => (
                    <td
                      key={c}
                      className="px-2 py-1.5 align-top max-w-[14rem] truncate"
                      title={row.raw[c]}
                    >
                      {row.raw[c] || (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {previewRows.some((r) => r.errors.length > 0) && (
        <ul className="text-xs text-red-700 dark:text-red-400 space-y-1">
          {previewRows
            .filter((r) => r.errors.length > 0)
            .map((r) => (
              <li key={r.lineNumber}>
                Rad {r.lineNumber}: {r.errors.join("; ")}
              </li>
            ))}
        </ul>
      )}

      {invalidCount > previewRows.filter((r) => r.errors.length > 0).length && (
        <p className="text-xs text-red-700 dark:text-red-400">
          Fler ogiltiga rader finns nedanför förhandsvisningen.
        </p>
      )}
    </div>
  );
}
