"use client";

import { formatPrice } from "@/lib/format";
import { Card, CardHeader } from "@/app/_components/ui";

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
      <Card>
        <CardHeader title="Lagervärde per kategori" />
        <p className="px-5 py-8 text-sm text-foreground-muted text-center">
          Inga produkter att visa.
        </p>
      </Card>
    );
  }

  const max = Math.max(...stats.map((s) => s.value), 1);
  const total = stats.reduce((acc, s) => acc + s.value, 0);

  return (
    <Card>
      <CardHeader
        title="Lagervärde per kategori"
        subtitle={`${stats.length} kategorier · ${formatPrice(total)} totalt`}
      />
      <div className="px-5 sm:px-6 py-5 space-y-3">
        {stats.map((s) => {
          const pct = (s.value / max) * 100;
          const share = total > 0 ? (s.value / total) * 100 : 0;
          return (
            <div key={s.category}>
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-sm truncate">{s.category}</span>
                  <span className="text-[10.5px] text-foreground-muted tabular-nums">
                    {s.count} st
                  </span>
                </div>
                <div className="flex items-baseline gap-2 shrink-0">
                  <span className="text-[10.5px] text-foreground-muted tabular-nums">
                    {share.toFixed(1)}%
                  </span>
                  <span className="text-sm font-medium tabular-nums">
                    {formatPrice(s.value)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: "var(--brand-gradient)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
