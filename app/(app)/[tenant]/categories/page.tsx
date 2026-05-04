"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { listProducts } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/database.types";

const NO_CATEGORY_LABEL = "Ingen kategori";

type CategoryRow = {
  key: string;
  label: string;
  isUncategorized: boolean;
  productCount: number;
  totalQuantity: number;
  totalValue: number;
  belowReorderCount: number;
  averagePrice: number;
};

function aggregate(products: Product[]): CategoryRow[] {
  const map = new Map<
    string,
    {
      label: string;
      isUncategorized: boolean;
      productCount: number;
      totalQuantity: number;
      totalValue: number;
      belowReorderCount: number;
      priceSum: number;
    }
  >();

  for (const p of products) {
    const isUncategorized = p.category === null;
    const key = isUncategorized ? "__none__" : p.category!;
    const label = isUncategorized ? NO_CATEGORY_LABEL : p.category!;
    const entry =
      map.get(key) ??
      {
        label,
        isUncategorized,
        productCount: 0,
        totalQuantity: 0,
        totalValue: 0,
        belowReorderCount: 0,
        priceSum: 0,
      };
    entry.productCount += 1;
    entry.totalQuantity += p.quantity;
    entry.totalValue += p.quantity * p.unit_price;
    entry.priceSum += p.unit_price;
    if (p.quantity <= p.reorder_point) entry.belowReorderCount += 1;
    map.set(key, entry);
  }

  const rows: CategoryRow[] = Array.from(map.entries()).map(([key, e]) => ({
    key,
    label: e.label,
    isUncategorized: e.isUncategorized,
    productCount: e.productCount,
    totalQuantity: e.totalQuantity,
    totalValue: e.totalValue,
    belowReorderCount: e.belowReorderCount,
    averagePrice: e.productCount > 0 ? e.priceSum / e.productCount : 0,
  }));

  rows.sort((a, b) => b.totalValue - a.totalValue);
  return rows;
}

export default function CategoriesPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch((e: Error) => setError(e.message));
  }, []);

  const rows = useMemo(
    () => (products ? aggregate(products) : []),
    [products],
  );

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4">
        <h2 className="font-semibold mb-1">Kunde inte hämta kategorier</h2>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (products === null) {
    return <p className="text-sm text-neutral-500">Laddar kategorier…</p>;
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-semibold mb-2">Kategorier</h1>
        <p className="text-foreground-muted">
          Inga produkter än. Lägg till en produkt för att börja.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Kategorier</h1>
          <p className="text-sm text-foreground-muted">
            Översikt av ditt sortiment per kategori.
          </p>
        </div>
        <span className="text-sm text-neutral-500">
          {rows.length} kategorier
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/10 bg-background-elevated/40">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.04] text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Kategori</th>
              <th className="px-4 py-2 font-medium text-right">
                Antal produkter
              </th>
              <th className="px-4 py-2 font-medium text-right">
                Totalt antal i lager
              </th>
              <th className="px-4 py-2 font-medium text-right">
                Totalt lagervärde
              </th>
              <th className="px-4 py-2 font-medium text-right">
                Under beställningspunkt
              </th>
              <th className="px-4 py-2 font-medium text-right">
                Genomsnittligt pris
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const href = r.isUncategorized
                ? `/${tenant}/`
                : `/${tenant}/?category=${encodeURIComponent(r.label)}`;
              return (
                <tr
                  key={r.key}
                  className="border-t border-white/10 hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-2">
                    <Link
                      href={href}
                      className="text-amber-400 hover:underline"
                    >
                      {r.isUncategorized ? (
                        <span className="text-neutral-500 italic">
                          {r.label}
                        </span>
                      ) : (
                        r.label
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right">{r.productCount}</td>
                  <td className="px-4 py-2 text-right">{r.totalQuantity}</td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatPrice(r.totalValue)}
                  </td>
                  <td
                    className={`px-4 py-2 text-right ${
                      r.belowReorderCount > 0
                        ? "text-red-400 font-medium"
                        : "text-neutral-500"
                    }`}
                  >
                    {r.belowReorderCount}
                  </td>
                  <td className="px-4 py-2 text-right text-neutral-500">
                    {formatPrice(r.averagePrice)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
