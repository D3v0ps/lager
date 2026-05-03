"use client";

import { useEffect, useMemo, useState } from "react";

import { listAllMovements, listProducts, type MovementWithProduct } from "@/lib/data";
import type { Product } from "@/lib/database.types";

import KpiCards from "./_components/KpiCards";
import LowStockTable from "./_components/LowStockTable";
import RecentMovements from "./_components/RecentMovements";
import CategoryValueChart, {
  type CategoryStat,
} from "./_components/CategoryValueChart";

export default function DashboardPage() {
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

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4">
        <h2 className="font-semibold mb-1">Kunde inte ladda dashboard</h2>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!stats || movements === null) {
    return <p className="text-sm text-neutral-500">Laddar dashboard…</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <KpiCards
        productCount={stats.productCount}
        totalValue={stats.totalValue}
        lowStockCount={stats.lowStockCount}
        outOfStockCount={stats.outOfStockCount}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LowStockTable products={stats.lowStock} />
        <RecentMovements movements={movements} />
      </div>

      <CategoryValueChart stats={stats.categoryStats} />
    </div>
  );
}
