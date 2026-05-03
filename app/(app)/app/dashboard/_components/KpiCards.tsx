"use client";

import { formatPrice } from "@/lib/format";

type Props = {
  productCount: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
};

export default function KpiCards({
  productCount,
  totalValue,
  lowStockCount,
  outOfStockCount,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card label="Antal produkter" value={String(productCount)} />
      <Card label="Totalt lagervärde" value={formatPrice(totalValue)} />
      <Card
        label="Lågt lager"
        value={String(lowStockCount)}
        alert={lowStockCount > 0}
      />
      <Card
        label="Slutsålt"
        value={String(outOfStockCount)}
        alert={outOfStockCount > 0}
      />
    </div>
  );
}

function Card({
  label,
  value,
  alert,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <div className="text-sm text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
      <div
        className={`text-2xl font-semibold mt-1 ${
          alert ? "text-red-600 dark:text-red-400" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
