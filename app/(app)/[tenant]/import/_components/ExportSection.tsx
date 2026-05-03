"use client";

import { useState } from "react";

import { listProducts } from "@/lib/data";

import {
  downloadTextFile,
  exportFilename,
  serializeProducts,
} from "../_lib/products-csv";

type Status =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "done"; count: number }
  | { kind: "error"; message: string };

export function ExportSection() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleExport() {
    setStatus({ kind: "busy" });
    try {
      const products = await listProducts();
      const csv = serializeProducts(products);
      downloadTextFile(csv, exportFilename());
      setStatus({ kind: "done", count: products.length });
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return (
    <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Exportera produkter</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Ladda ner alla produkter som CSV. Bra för backup eller redigering i
          Excel.
        </p>
      </div>
      <button
        type="button"
        onClick={handleExport}
        disabled={status.kind === "busy"}
        className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {status.kind === "busy" ? "Hämtar…" : "Ladda ner CSV"}
      </button>
      {status.kind === "done" && (
        <p className="text-sm text-green-700 dark:text-green-400">
          {status.count} {status.count === 1 ? "produkt" : "produkter"}{" "}
          exporterade.
        </p>
      )}
      {status.kind === "error" && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-sm">
          Kunde inte exportera: {status.message}
        </div>
      )}
    </section>
  );
}
