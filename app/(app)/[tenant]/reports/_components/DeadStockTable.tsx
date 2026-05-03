"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { formatDate, formatPrice } from "@/lib/format";

export type DeadStockRow = {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  value: number;
  /** ISO timestamp of last movement of any kind, or null if never. */
  lastMovementAt: string | null;
};

type Props = {
  rows: DeadStockRow[];
};

export default function DeadStockTable({ rows }: Props) {
  const { tenant } = useParams<{ tenant: string }>();

  return (
    <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <header className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-base font-semibold">Döda lager</h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Inga uttag de senaste 90 dagarna men finns kvar i lager.
        </p>
      </header>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-neutral-500">
          Inga döda lager. Snyggt jobbat.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">SKU</th>
                <th className="px-4 py-2 font-medium">Namn</th>
                <th className="px-4 py-2 font-medium text-right">Antal</th>
                <th className="px-4 py-2 font-medium text-right">Värde</th>
                <th className="px-4 py-2 font-medium">Sista rörelse</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-neutral-200 dark:border-neutral-800"
                >
                  <td className="px-4 py-2 font-mono">{r.sku}</td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/${tenant}/product/?id=${r.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {r.quantity}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatPrice(r.value)}
                  </td>
                  <td className="px-4 py-2 text-neutral-500">
                    {r.lastMovementAt ? formatDate(r.lastMovementAt) : "Aldrig"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
