"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { formatPrice } from "@/lib/format";

export type ValueRow = {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  value: number;
  share: number; // 0..1 of total lagervärde
};

type Props = {
  rows: ValueRow[];
};

export default function ValueByProductTable({ rows }: Props) {
  const { tenant } = useParams<{ tenant: string }>();
  const [expanded, setExpanded] = useState(false);
  const limit = expanded ? 50 : 20;
  const visible = rows.slice(0, limit);

  return (
    <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <header className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-base font-semibold">Marginal per produkt</h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Sorterat på lagervärde. Marginal beräknas från inköpspris — sätt
          inköpspris på produkten för att se siffror.
        </p>
      </header>
      {visible.length === 0 ? (
        <p className="px-4 py-6 text-sm text-neutral-500">
          Inga produkter att visa.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">SKU</th>
                  <th className="px-4 py-2 font-medium">Namn</th>
                  <th className="px-4 py-2 font-medium">Kategori</th>
                  <th className="px-4 py-2 font-medium text-right">Antal</th>
                  <th className="px-4 py-2 font-medium text-right">Värde</th>
                  <th className="px-4 py-2 font-medium text-right">
                    Inköpspris
                  </th>
                  <th className="px-4 py-2 font-medium text-right">
                    Marginal kr
                  </th>
                  <th className="px-4 py-2 font-medium text-right">
                    Marginal %
                  </th>
                  <th className="px-4 py-2 font-medium text-right">
                    % av lagervärde
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const zero = r.quantity === 0;
                  const hasCost = r.costPrice > 0;
                  const marginPerUnit = r.unitPrice - r.costPrice;
                  const marginKr = marginPerUnit * r.quantity;
                  const marginPct =
                    r.unitPrice > 0 ? (marginPerUnit / r.unitPrice) * 100 : 0;
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-neutral-200 dark:border-neutral-800"
                    >
                      <td className="px-4 py-2 font-mono">{r.sku}</td>
                      <td
                        className={`px-4 py-2 ${
                          zero ? "text-red-600 dark:text-red-400" : ""
                        }`}
                      >
                        <Link
                          href={`/${tenant}/product/?id=${r.id}`}
                          className="hover:underline"
                        >
                          {r.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-neutral-500">
                        {r.category ?? "—"}
                      </td>
                      <td
                        className={`px-4 py-2 text-right font-medium ${
                          zero ? "text-red-600 dark:text-red-400" : ""
                        }`}
                      >
                        {r.quantity}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatPrice(r.value)}
                      </td>
                      <td className="px-4 py-2 text-right text-neutral-500">
                        {hasCost ? formatPrice(r.costPrice) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {hasCost ? formatPrice(marginKr) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right text-neutral-500">
                        {hasCost
                          ? `${marginPct.toFixed(1).replace(".", ",")} %`
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-right text-neutral-500">
                        {(r.share * 100).toFixed(1).replace(".", ",")} %
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length > 20 ? (
            <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 text-sm">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {expanded
                  ? "Visa färre"
                  : `Visa fler (upp till ${Math.min(50, rows.length)})`}
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
