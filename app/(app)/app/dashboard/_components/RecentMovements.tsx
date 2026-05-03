"use client";

import Link from "next/link";

import type { MovementWithProduct } from "@/lib/data";
import { formatDate, movementLabel } from "@/lib/format";

type Props = {
  movements: MovementWithProduct[];
};

function typeIcon(type: "in" | "out" | "adjust"): string {
  if (type === "in") return "+";
  if (type === "out") return "-";
  return "=";
}

export default function RecentMovements({ movements }: Props) {
  return (
    <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <header className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-base font-semibold">Senaste rörelser</h2>
      </header>
      {movements.length === 0 ? (
        <p className="px-4 py-6 text-sm text-neutral-500">
          Inga rörelser registrerade ännu.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {movements.map((m) => (
            <li key={m.id} className="px-4 py-3 text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <Link
                  href={`/app/product/?id=${m.product_id}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                >
                  {m.products?.name ?? "Okänd"}
                </Link>
                <span className="text-xs text-neutral-500 shrink-0">
                  {formatDate(m.created_at)}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <span
                  className={`font-mono font-medium ${
                    m.type === "in"
                      ? "text-green-600 dark:text-green-400"
                      : m.type === "out"
                        ? "text-red-600 dark:text-red-400"
                        : "text-neutral-500"
                  }`}
                >
                  {typeIcon(m.type)}
                  {Math.abs(m.quantity)}
                </span>
                <span className="text-neutral-500">{movementLabel(m.type)}</span>
                {m.note ? (
                  <span className="text-neutral-500 truncate">— {m.note}</span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
