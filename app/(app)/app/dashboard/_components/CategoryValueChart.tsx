"use client";

import { formatPrice } from "@/lib/format";

export type CategoryStat = {
  category: string;
  value: number;
  count: number;
};

type Props = {
  stats: CategoryStat[];
};

export default function CategoryValueChart({ stats }: Props) {
  if (stats.length === 0) {
    return (
      <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
        <h2 className="text-base font-semibold mb-2">Lagervärde per kategori</h2>
        <p className="text-sm text-neutral-500">Inga produkter att visa.</p>
      </section>
    );
  }

  const max = Math.max(...stats.map((s) => s.value), 1);
  const rowHeight = 32;
  const gap = 8;
  const labelWidth = 160;
  const valueWidth = 140;
  const barAreaWidth = 320;
  const totalWidth = labelWidth + barAreaWidth + valueWidth + 24;
  const totalHeight = stats.length * (rowHeight + gap);

  return (
    <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <h2 className="text-base font-semibold mb-3">Lagervärde per kategori</h2>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          width="100%"
          height={totalHeight}
          role="img"
          aria-label="Lagervärde per kategori"
        >
          {stats.map((s, i) => {
            const y = i * (rowHeight + gap);
            const barWidth = Math.max(2, (s.value / max) * barAreaWidth);
            return (
              <g key={s.category} transform={`translate(0, ${y})`}>
                <text
                  x={0}
                  y={rowHeight / 2}
                  dominantBaseline="middle"
                  className="fill-neutral-700 dark:fill-neutral-300"
                  fontSize="13"
                >
                  {s.category.length > 22
                    ? `${s.category.slice(0, 21)}…`
                    : s.category}
                </text>
                <text
                  x={labelWidth - 8}
                  y={rowHeight / 2}
                  dominantBaseline="middle"
                  textAnchor="end"
                  className="fill-neutral-500"
                  fontSize="11"
                >
                  {s.count} st
                </text>
                <rect
                  x={labelWidth}
                  y={4}
                  width={barAreaWidth}
                  height={rowHeight - 8}
                  rx={4}
                  className="fill-neutral-100 dark:fill-neutral-800"
                />
                <rect
                  x={labelWidth}
                  y={4}
                  width={barWidth}
                  height={rowHeight - 8}
                  rx={4}
                  className="fill-blue-500 dark:fill-blue-600"
                />
                <text
                  x={labelWidth + barAreaWidth + 8}
                  y={rowHeight / 2}
                  dominantBaseline="middle"
                  className="fill-neutral-700 dark:fill-neutral-300"
                  fontSize="13"
                >
                  {formatPrice(s.value)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
