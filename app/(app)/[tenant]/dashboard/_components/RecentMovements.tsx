"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import type { MovementWithProduct } from "@/lib/data";
import { formatDate, movementLabel } from "@/lib/format";
import { Card, CardHeader } from "@/app/_components/ui";

type Props = {
  movements: MovementWithProduct[];
};

export default function RecentMovements({ movements }: Props) {
  const { tenant } = useParams<{ tenant: string }>();

  return (
    <Card>
      <CardHeader
        title="Senaste rörelser"
        subtitle="Realtid · senaste 10"
        actions={
          <Link
            href={`/${tenant}/movements/`}
            className="text-xs text-foreground-muted hover:text-foreground transition-colors"
          >
            Se alla →
          </Link>
        }
      />
      {movements.length === 0 ? (
        <p className="px-5 py-8 text-sm text-foreground-muted text-center">
          Inga lagerrörelser registrerade än.
        </p>
      ) : (
        <ul className="divide-y divide-white/5">
          {movements.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
            >
              <DeltaBadge type={m.type} quantity={m.quantity} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/${tenant}/product/?id=${m.product_id}`}
                    className="text-sm hover:text-amber-400 transition-colors truncate"
                  >
                    {m.products?.name ?? "Okänd produkt"}
                  </Link>
                  <span className="text-[11px] text-foreground-muted shrink-0 tabular-nums">
                    {formatDate(m.created_at)}
                  </span>
                </div>
                <p className="text-[11px] text-foreground-muted truncate mt-0.5">
                  <span>{movementLabel(m.type)}</span>
                  {m.note ? <span> · {m.note}</span> : null}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function DeltaBadge({
  type,
  quantity,
}: {
  type: "in" | "out" | "adjust";
  quantity: number;
}) {
  const sign = type === "in" ? "+" : type === "out" ? "−" : "=";
  const tone =
    type === "in"
      ? "bg-emerald-500/10 text-emerald-400"
      : type === "out"
        ? "bg-rose-500/10 text-rose-400"
        : "bg-violet-500/10 text-violet-400";
  return (
    <div
      className={`shrink-0 h-9 w-12 rounded-md flex items-center justify-center font-mono text-sm font-medium tabular-nums ${tone}`}
    >
      {sign}
      {Math.abs(quantity)}
    </div>
  );
}
