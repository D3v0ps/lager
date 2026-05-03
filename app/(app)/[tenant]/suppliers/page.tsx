"use client";

import { useEffect, useState } from "react";

import {
  countActivePosBySupplier,
  deleteSupplier,
  listSuppliers,
  type Supplier,
} from "@/lib/suppliers";

import SupplierForm from "./_components/supplier-form";

type Mode =
  | { kind: "list" }
  | { kind: "new" }
  | { kind: "edit"; supplier: Supplier };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [activeCounts, setActiveCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: "list" });

  async function reload() {
    try {
      setError(null);
      const [list, counts] = await Promise.all([
        listSuppliers(),
        countActivePosBySupplier(),
      ]);
      setSuppliers(list);
      setActiveCounts(counts);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function handleDelete(s: Supplier) {
    if (
      !confirm(
        `Ta bort leverantören "${s.name}"? Den kan inte tas bort om den används av en inköpsorder.`,
      )
    )
      return;
    try {
      await deleteSupplier(s.id);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (error && suppliers === null) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4">
        <h2 className="font-semibold mb-1">Kunde inte hämta leverantörer</h2>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (suppliers === null) {
    return <p className="text-sm text-neutral-500">Laddar leverantörer…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Leverantörer</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Hantera dina leverantörer och kontakter.
          </p>
        </div>
        {mode.kind === "list" && (
          <button
            type="button"
            onClick={() => setMode({ kind: "new" })}
            className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-3 py-2 text-sm font-medium"
          >
            + Ny leverantör
          </button>
        )}
      </div>

      {error && suppliers !== null && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-sm">
          {error}
        </div>
      )}

      {mode.kind === "new" && (
        <SupplierForm
          onCancel={() => setMode({ kind: "list" })}
          onSaved={async () => {
            setMode({ kind: "list" });
            await reload();
          }}
        />
      )}

      {mode.kind === "edit" && (
        <SupplierForm
          supplier={mode.supplier}
          onCancel={() => setMode({ kind: "list" })}
          onSaved={async () => {
            setMode({ kind: "list" });
            await reload();
          }}
        />
      )}

      {suppliers.length === 0 && mode.kind === "list" ? (
        <div className="text-center py-16 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <h2 className="text-lg font-semibold mb-2">Inga leverantörer än</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            Lägg till din första leverantör för att kunna skapa inköpsorder.
          </p>
          <button
            type="button"
            onClick={() => setMode({ kind: "new" })}
            className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium"
          >
            + Ny leverantör
          </button>
        </div>
      ) : suppliers.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Namn</th>
                <th className="px-4 py-2 font-medium">Kontaktperson</th>
                <th className="px-4 py-2 font-medium">E-post</th>
                <th className="px-4 py-2 font-medium">Telefon</th>
                <th className="px-4 py-2 font-medium text-right">Aktiva PO</th>
                <th className="px-4 py-2 font-medium text-right">Åtgärder</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => {
                const active = activeCounts[s.id] ?? 0;
                return (
                  <tr
                    key={s.id}
                    className="border-t border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                  >
                    <td className="px-4 py-2 font-medium">{s.name}</td>
                    <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                      {s.contact_name ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                      {s.email ? (
                        <a
                          href={`mailto:${s.email}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {s.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                      {s.phone ?? "—"}
                    </td>
                    <td
                      className={`px-4 py-2 text-right ${
                        active > 0 ? "font-medium" : "text-neutral-500"
                      }`}
                    >
                      {active}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setMode({ kind: "edit", supplier: s })}
                          className="rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                          Redigera
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s)}
                          className="rounded-md border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 px-2 py-1 text-xs hover:bg-red-50 dark:hover:bg-red-950/40"
                        >
                          Ta bort
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
