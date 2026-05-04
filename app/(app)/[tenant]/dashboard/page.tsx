"use client";

import { useEffect, useMemo, useState } from "react";

import {
  listAllMovements,
  listProducts,
  type MovementWithProduct,
} from "@/lib/data";
import type { Product } from "@/lib/database.types";
import { formatPrice } from "@/lib/format";
import { useTenant } from "@/lib/tenant-context";
import {
  ErrorPage,
  KpiStrip,
  KpiTile,
  PageHeader,
  SkeletonRows,
  SkeletonTable,
} from "@/app/_components/ui";

import LowStockTable from "./_components/LowStockTable";
import RecentMovements from "./_components/RecentMovements";
import CategoryValueChart, {
  type CategoryStat,
} from "./_components/CategoryValueChart";
import SetupChecklist from "./_components/SetupChecklist";

export default function DashboardPage() {
  const tenant = useTenant();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [movements, setMovements] = useState<MovementWithProduct[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listProducts(), listAllMovements(10)])
      .then(([p, m]) => {
        if (cancelled) return;
        setProducts(p);
        setMovements(m);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    if (!products) return null;
    const totalValue = products.reduce(
      (acc, p) => acc + p.quantity * p.unit_price,
      0,
    );
    const lowStockCount = products.filter(
      (p) => p.quantity <= p.reorder_point && p.quantity > 0,
    ).length;
    const outOfStockCount = products.filter((p) => p.quantity === 0).length;

    const lowStock = products
      .filter((p) => p.quantity <= p.reorder_point)
      .slice()
      .sort((a, b) => a.quantity - b.quantity);

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
      .slice(0, 8);

    return {
      productCount: products.length,
      totalValue,
      lowStockCount,
      outOfStockCount,
      lowStock,
      categoryStats,
    };
  }, [products]);

  // Sync indicator subtitle — formatted in Stockholm time.
  const syncedAt = new Intl.DateTimeFormat("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm",
  }).format(new Date());

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Översikt"
        title={
          <>
            Dashboard
            {tenant ? (
              <span className="text-foreground-muted/80 font-normal">
                {" "}
                · {tenant.name}
              </span>
            ) : null}
          </>
        }
        subtitle={
          <span className="inline-flex items-center gap-2 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Synkad med Fortnox · {syncedAt}
          </span>
        }
      />

      <SetupChecklist />

      {error ? (
        <ErrorPage
          title="Kunde inte ladda dashboard"
          message={error}
          retry={() => {
            setError(null);
            Promise.all([listProducts(), listAllMovements(10)])
              .then(([p, m]) => {
                setProducts(p);
                setMovements(m);
              })
              .catch((e: Error) => setError(e.message));
          }}
        />
      ) : !stats || movements === null ? (
        <div className="space-y-6">
          <SkeletonRows rows={1} className="h-24" />
          <SkeletonTable rows={5} />
        </div>
      ) : (
        <>
          <KpiStrip>
            <KpiTile
              label="Produkter"
              value={stats.productCount.toLocaleString("sv-SE")}
              delta={`${stats.categoryStats.length} kategorier`}
              tone="neutral"
            />
            <KpiTile
              label="Lagervärde"
              value={formatPrice(stats.totalValue)}
              tone="positive"
              delta="totalt"
            />
            <KpiTile
              label="Lågt saldo"
              value={String(stats.lowStockCount)}
              tone={stats.lowStockCount > 0 ? "negative" : "neutral"}
              delta={
                stats.lowStockCount > 0
                  ? "behöver fyllas på"
                  : "alla över reorder-punkt"
              }
            />
            <KpiTile
              label="Slutsålt"
              value={String(stats.outOfStockCount)}
              tone={stats.outOfStockCount > 0 ? "negative" : "neutral"}
              delta={
                stats.outOfStockCount > 0
                  ? "kan inte säljas"
                  : "ingenting slut"
              }
            />
          </KpiStrip>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LowStockTable products={stats.lowStock} />
            <RecentMovements movements={movements} />
          </div>

          <CategoryValueChart stats={stats.categoryStats} />
        </>
      )}
    </div>
  );
}
