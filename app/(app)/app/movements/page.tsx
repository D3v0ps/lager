"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listAllMovements, type MovementWithProduct } from "@/lib/data";
import { formatDate, movementLabel } from "@/lib/format";

export default function MovementsPage() {
  const [movements, setMovements] = useState<MovementWithProduct[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAllMovements()
      .then(setMovements)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4">
        {error}
      </div>
    );
  }

  if (movements === null) {
    return <p className="text-sm text-neutral-500">Laddar…</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Rörelser</h1>
      {movements.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Inga rörelser registrerade ännu.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Tid</th>
                <th className="px-4 py-2 font-medium">Produkt</th>
                <th className="px-4 py-2 font-medium">Typ</th>
                <th className="px-4 py-2 font-medium text-right">Antal</th>
                <th className="px-4 py-2 font-medium">Anteckning</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr
                  key={m.id}
                  className="border-t border-neutral-200 dark:border-neutral-800"
                >
                  <td className="px-4 py-2 text-neutral-500">
                    {formatDate(m.created_at)}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/app/product/?id=${m.product_id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {m.products?.name ?? "Okänd"}
                    </Link>
                    <span className="text-neutral-500 font-mono ml-2">
                      {m.products?.sku}
                    </span>
                  </td>
                  <td className="px-4 py-2">{movementLabel(m.type)}</td>
                  <td className="px-4 py-2 text-right font-medium">
                    {m.type === "out" ? "-" : m.type === "in" ? "+" : "="}
                    {Math.abs(m.quantity)}
                  </td>
                  <td className="px-4 py-2 text-neutral-500">{m.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
