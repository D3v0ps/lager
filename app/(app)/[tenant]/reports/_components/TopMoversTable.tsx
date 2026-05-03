"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export type TopMoverRow = {
  id: string;
  sku: string;
  name: string;
  sold90d: number;
  currentQty: number;
  /** weeks of stock left at current rate. Infinity if no sales. */
  weeksLeft: number;
};

type Props = {
  rows: TopMoverRow[];
};

function formatWeeks(weeks: number): string {
  if (!Number.isFinite(weeks)) return "—";
  if (weeks <= 0) return "0";
  if (weeks >= 999) return "999+";
  if (weeks >= 100) return `${Math.round(weeks)}`;
  return weeks.toFixed(1).replace(".", ",");
}

export default function TopMoversTable({ rows }: Props) {
  const { tenant } = useParams<{ tenant: string }>();

  return (
    <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <header className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-base font-semibold">Snabbast omsatta produkter</h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Mest sålda de senaste 90 dagarna.
        </p>
      </header>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-neutral-500">
          Inga uttag senaste 90 dagarna.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">SKU</th>
                <th className="px-4 py-2 font-medium">Namn</th>
                <th className="px-4 py-2 font-medium text-right">
                  Sålt antal (90d)
                </th>
                <th className="px-4 py-2 font-medium text-right">
                  Nuvarande lager
                </th>
                <th className="px-4 py-2 font-medium text-right">
                  Veckors lager kvar
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const lowWeeks = Number.isFinite(r.weeksLeft) && r.weeksLeft < 2;
                return (
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
                      {r.sold90d}
                    </td>
                    <td className="px-4 py-2 text-right">{r.currentQty}</td>
                    <td
                      className={`px-4 py-2 text-right ${
                        lowWeeks
                          ? "text-red-600 dark:text-red-400 font-medium"
                          : "text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      {formatWeeks(r.weeksLeft)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
