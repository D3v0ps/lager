"use client";

import { useEffect, useMemo, useState } from "react";

import {
  listAllMovements,
  listProducts,
  type MovementWithProduct,
} from "@/lib/data";
import type { Product } from "@/lib/database.types";
import { useTenant } from "@/lib/tenant-context";

import CategoryValueChart, {
  type CategoryStat,
} from "./_components/CategoryValueChart";
import DeadStockTable, {
  type DeadStockRow,
} from "./_components/DeadStockTable";
import ExportButton, { type ExportRow } from "./_components/ExportButton";
import ReportKpiCards from "./_components/ReportKpiCards";
import TopMoversTable, { type TopMoverRow } from "./_components/TopMoversTable";
import ValueByProductTable, {
  type ValueRow,
} from "./_components/ValueByProductTable";
import ValueOverTimeChart, {
  type ValuePoint,
} from "./_components/ValueOverTimeChart";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 90;
const SPARKLINE_DAYS = 30;

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; products: Product[]; movements: MovementWithProduct[] };

export default function ReportsPage() {
  const tenant = useTenant();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    Promise.all([listProducts(), listAllMovements(500)])
      .then(([products, movements]) => {
        if (cancelled) return;
        setState({ kind: "ready", products, movements });
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setState({ kind: "error", message: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const analytics = useMemo(() => {
    if (state.kind !== "ready") return null;
    return computeAnalytics(state.products, state.movements);
  }, [state]);

  if (state.kind === "error") {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4">
        <h2 className="font-semibold mb-1">Kunde inte ladda rapporter</h2>
        <p className="text-sm">{state.message}</p>
      </div>
    );
  }

  if (state.kind === "loading" || !analytics) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Rapporter</h1>
        <p className="text-sm text-neutral-500">Laddar rapporter…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Rapporter</h1>
          <p className="text-sm text-neutral-500">
            Operativ analys av lager och rörelser.
          </p>
        </div>
        <ExportButton
          rows={analytics.exportRows}
          tenantSlug={tenant?.slug ?? ""}
        />
      </div>

      <ReportKpiCards
        totalValue={analytics.totalValue}
        productCount={analytics.productCount}
        turnover90d={analytics.turnover90d}
        averageValuePerProduct={analytics.averageValuePerProduct}
      />

      <ValueByProductTable rows={analytics.valueRows} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeadStockTable rows={analytics.deadStockRows} />
        <TopMoversTable rows={analytics.topMoverRows} />
      </div>

      <CategoryValueChart stats={analytics.categoryStats} />

      <ValueOverTimeChart series={analytics.valueSeries} />
    </div>
  );
}

type Analytics = {
  totalValue: number;
  productCount: number;
  turnover90d: number;
  averageValuePerProduct: number;
  valueRows: ValueRow[];
  deadStockRows: DeadStockRow[];
  topMoverRows: TopMoverRow[];
  categoryStats: CategoryStat[];
  valueSeries: ValuePoint[];
  exportRows: ExportRow[];
};

function computeAnalytics(
  products: Product[],
  movements: MovementWithProduct[],
): Analytics {
  const now = Date.now();
  const cutoff90 = now - WINDOW_DAYS * DAY_MS;

  const productById = new Map<string, Product>();
  for (const p of products) productById.set(p.id, p);

  const totalValue = products.reduce(
    (acc, p) => acc + p.quantity * p.unit_price,
    0,
  );
  const productCount = products.length;
  const averageValuePerProduct =
    productCount > 0 ? totalValue / productCount : 0;

  // Per-product aggregates from movements
  const lastMovementByProduct = new Map<string, string>(); // ISO ts
  const sold90ByProduct = new Map<string, number>(); // sum of OUT qty
  let outValue90 = 0;

  for (const m of movements) {
    const ts = new Date(m.created_at).getTime();
    const prev = lastMovementByProduct.get(m.product_id);
    if (!prev || new Date(prev).getTime() < ts) {
      lastMovementByProduct.set(m.product_id, m.created_at);
    }
    if (m.type === "out" && ts >= cutoff90) {
      const qty = Math.abs(m.quantity);
      sold90ByProduct.set(
        m.product_id,
        (sold90ByProduct.get(m.product_id) ?? 0) + qty,
      );
      const product = productById.get(m.product_id);
      if (product) outValue90 += qty * product.unit_price;
    }
  }

  const turnover90d = totalValue > 0 ? outValue90 / totalValue : 0;

  // Section 2 — Värde per produkt (sorted desc)
  const valueRows: ValueRow[] = products
    .map<ValueRow>((p) => {
      const value = p.quantity * p.unit_price;
      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        quantity: p.quantity,
        value,
        share: totalValue > 0 ? value / totalValue : 0,
      };
    })
    .sort((a, b) => b.value - a.value);

  // Section 3 — Döda lager: qty>0 AND zero OUT in last 90 days
  const deadStockRows: DeadStockRow[] = products
    .filter((p) => {
      if (p.quantity <= 0) return false;
      const sold = sold90ByProduct.get(p.id) ?? 0;
      return sold === 0;
    })
    .map<DeadStockRow>((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      quantity: p.quantity,
      value: p.quantity * p.unit_price,
      lastMovementAt: lastMovementByProduct.get(p.id) ?? null,
    }))
    .sort((a, b) => b.value - a.value);

  // Section 4 — Lagervärde per kategori (top 10)
  const byCategory = new Map<string, { value: number; count: number }>();
  for (const p of products) {
    const key = p.category?.trim() || "Okategoriserad";
    const cur = byCategory.get(key) ?? { value: 0, count: 0 };
    cur.value += p.quantity * p.unit_price;
    cur.count += 1;
    byCategory.set(key, cur);
  }
  const categoryStats: CategoryStat[] = Array.from(byCategory.entries())
    .map(([category, v]) => ({ category, value: v.value, count: v.count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Section 5 — Top movers (top 15)
  const topMoverRows: TopMoverRow[] = Array.from(sold90ByProduct.entries())
    .map<TopMoverRow | null>(([productId, sold90d]) => {
      const product = productById.get(productId);
      if (!product) return null;
      const perWeek = sold90d / 13; // ~13 weeks in 90d
      const weeksLeft =
        perWeek > 0 ? product.quantity / perWeek : Number.POSITIVE_INFINITY;
      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        sold90d,
        currentQty: product.quantity,
        weeksLeft,
      };
    })
    .filter((r): r is TopMoverRow => r !== null)
    .sort((a, b) => b.sold90d - a.sold90d)
    .slice(0, 15);

  // Section 6 — Lagervärde över tid (approximate, walking backwards)
  const valueSeries = computeValueSeries(products, movements, SPARKLINE_DAYS);

  // Section 7 — Export rows: union of all products with their analytics
  const valueByProduct = new Map(valueRows.map((r) => [r.id, r] as const));
  const deadIdSet = new Set(deadStockRows.map((r) => r.id));
  const exportRows: ExportRow[] = products
    .map<ExportRow>((p) => {
      const v = valueByProduct.get(p.id);
      const sold = sold90ByProduct.get(p.id) ?? 0;
      const last = lastMovementByProduct.get(p.id) ?? null;
      let status: string;
      if (p.quantity === 0) status = "sold-out";
      else if (deadIdSet.has(p.id)) status = "dead";
      else status = "active";
      return {
        sku: p.sku,
        name: p.name,
        category: p.category ?? "",
        quantity: p.quantity,
        value: v ? v.value : p.quantity * p.unit_price,
        sold_90d: sold,
        last_movement_date: last ? last.slice(0, 10) : "",
        status,
      };
    })
    .sort((a, b) => b.value - a.value);

  return {
    totalValue,
    productCount,
    turnover90d,
    averageValuePerProduct,
    valueRows,
    deadStockRows,
    topMoverRows,
    categoryStats,
    valueSeries,
    exportRows,
  };
}

/**
 * Estimate the historical lagervärde by walking the current value
 * backwards through movements. Movements after a given day undo their
 * effect on that day's snapshot.
 *
 * Net effect of a movement on lagervärde:
 *   in  → +qty × unit_price
 *   out → -qty × unit_price
 *   adjust → unknown (we treat the recorded `quantity` as an absolute set,
 *            so we can't reconstruct the delta. We ignore adjust.)
 */
function computeValueSeries(
  products: Product[],
  movements: MovementWithProduct[],
  days: number,
): ValuePoint[] {
  if (products.length === 0) return [];

  const priceById = new Map<string, number>();
  for (const p of products) priceById.set(p.id, p.unit_price);

  const today = new Date();
  // Anchor on local-day boundaries so the rightmost point is "now"
  today.setHours(23, 59, 59, 999);
  const todayMs = today.getTime();

  // Pre-compute net-value-delta per movement
  type Delta = { ts: number; delta: number };
  const deltas: Delta[] = [];
  for (const m of movements) {
    if (m.type === "adjust") continue;
    const price = priceById.get(m.product_id);
    if (price == null) continue;
    const qty = Math.abs(m.quantity);
    const sign = m.type === "in" ? 1 : -1;
    deltas.push({ ts: new Date(m.created_at).getTime(), delta: sign * qty * price });
  }
  deltas.sort((a, b) => a.ts - b.ts);

  const currentValue = products.reduce(
    (acc, p) => acc + p.quantity * p.unit_price,
    0,
  );

  // For each end-of-day going backwards, subtract deltas with ts > endOfDay.
  // We sweep with a pointer from the end of the (sorted) deltas array.
  const series: ValuePoint[] = [];
  let pointer = deltas.length - 1;
  let valueAtDayEnd = currentValue;

  // Build day buckets newest → oldest, then reverse
  for (let i = 0; i < days; i++) {
    const dayEnd = new Date(todayMs - i * DAY_MS);
    dayEnd.setHours(23, 59, 59, 999);
    const dayEndMs = dayEnd.getTime();
    // Subtract any movements that happened AFTER end of this day
    while (pointer >= 0 && deltas[pointer].ts > dayEndMs) {
      valueAtDayEnd -= deltas[pointer].delta;
      pointer--;
    }
    const iso = isoDate(dayEnd);
    series.push({ date: iso, value: valueAtDayEnd });
  }
  // Reverse so oldest is first
  series.reverse();
  return series;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
