"use client";

import Link from "next/link";

import type { Product } from "@/lib/database.types";

type Props = {
  products: Product[];
};

export default function LowStockTable({ products }: Props) {
  return (
    <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <header className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-base font-semibold">Lågnivå-tabell</h2>
      </header>
      {products.length === 0 ? (
        <p className="px-4 py-6 text-sm text-neutral-500">Inget lågt lager</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">SKU</th>
                <th className="px-4 py-2 font-medium">Namn</th>
                <th className="px-4 py-2 font-medium text-right">Antal</th>
                <th className="px-4 py-2 font-medium text-right">
                  Beställningspunkt
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-neutral-200 dark:border-neutral-800"
                >
                  <td className="px-4 py-2 font-mono">{p.sku}</td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/app/product/?id=${p.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-medium ${
                      p.quantity === 0 ? "text-red-600 dark:text-red-400" : ""
                    }`}
                  >
                    {p.quantity}
                  </td>
                  <td className="px-4 py-2 text-right text-neutral-500">
                    {p.reorder_point}
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
