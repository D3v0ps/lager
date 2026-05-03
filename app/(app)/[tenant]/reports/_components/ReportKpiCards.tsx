"use client";

import { formatPrice } from "@/lib/format";

type Props = {
  totalValue: number;
  productCount: number;
  turnover90d: number;
  averageValuePerProduct: number;
};

export default function ReportKpiCards({
  totalValue,
  productCount,
  turnover90d,
  averageValuePerProduct,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card label="Lagervärde" value={formatPrice(totalValue)} />
      <Card label="Antal artiklar" value={String(productCount)} />
      <Card
        label="Lagrets omsättning (90d)"
        value={formatTurnover(turnover90d)}
        hint="per kvartal"
      />
      <Card
        label="Genomsnittligt värde / artikel"
        value={formatPrice(averageValuePerProduct)}
      />
    </div>
  );
}

function formatTurnover(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—";
  // Render with one decimal, swedish style
  return `${value.toFixed(1).replace(".", ",")}×`;
}

function Card({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <div className="text-sm text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {hint ? (
        <div className="text-xs text-neutral-500 mt-1">{hint}</div>
      ) : null}
    </div>
  );
}
