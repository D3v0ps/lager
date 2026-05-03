"use client";

import { formatPrice } from "@/lib/format";

export type ValuePoint = {
  /** ISO date (YYYY-MM-DD), oldest first. */
  date: string;
  /** Estimated total lagervärde at end of that day. */
  value: number;
};

type Props = {
  series: ValuePoint[];
};

export default function ValueOverTimeChart({ series }: Props) {
  if (series.length === 0) {
    return (
      <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
        <h2 className="text-base font-semibold mb-2">Lagervärde över tid</h2>
        <p className="text-sm text-neutral-500">Ingen historik ännu.</p>
      </section>
    );
  }

  const first = series[0].value;
  const last = series[series.length - 1].value;
  const change = last - first;
  const pct = first > 0 ? (change / first) * 100 : 0;
  const changeLabel = first > 0
    ? `${change >= 0 ? "+" : ""}${pct.toFixed(1).replace(".", ",")}% vs förra månaden`
    : "—";

  // Build the sparkline path
  const width = 800;
  const height = 120;
  const padding = 8;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const min = Math.min(...series.map((p) => p.value));
  const max = Math.max(...series.map((p) => p.value));
  const range = Math.max(1, max - min);

  const points = series.map((p, i) => {
    const x = padding + (i / Math.max(1, series.length - 1)) * innerW;
    const y = padding + innerH - ((p.value - min) / range) * innerH;
    return { x, y };
  });

  const linePath = points
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
    .join(" ");

  const areaPath =
    `M ${points[0].x.toFixed(2)} ${(padding + innerH).toFixed(2)} ` +
    points
      .map((pt) => `L ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
      .join(" ") +
    ` L ${points[points.length - 1].x.toFixed(2)} ${(padding + innerH).toFixed(2)} Z`;

  const positive = change >= 0;
  const lineClass = positive
    ? "stroke-green-500 dark:stroke-green-400"
    : "stroke-red-500 dark:stroke-red-400";
  const areaClass = positive
    ? "fill-green-500/15 dark:fill-green-400/10"
    : "fill-red-500/15 dark:fill-red-400/10";

  return (
    <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <div className="flex items-baseline justify-between mb-3 gap-2 flex-wrap">
        <div>
          <h2 className="text-base font-semibold">Lagervärde över tid</h2>
          <p className="text-xs text-neutral-500">
            Senaste 30 dagar (uppskattning bakåt från dagens värde)
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">{formatPrice(last)}</div>
          <div
            className={`text-xs ${
              positive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {changeLabel}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          preserveAspectRatio="none"
          role="img"
          aria-label="Lagervärde över tid"
        >
          <path d={areaPath} className={areaClass} />
          <path
            d={linePath}
            fill="none"
            strokeWidth={2}
            className={lineClass}
          />
        </svg>
      </div>
    </section>
  );
}
