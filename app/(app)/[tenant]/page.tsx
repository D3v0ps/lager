"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { listProducts } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/database.types";
import { ErrorPage, SkeletonTable } from "@/app/_components/ui";
import { inputClass } from "@/lib/form-classes";

import { QuickAdjustCell } from "./_components/quick-adjust-cell";

type SortKey =
  | "name-asc"
  | "name-desc"
  | "qty-asc"
  | "qty-desc"
  | "price-asc"
  | "price-desc";

type StockFilter = "all" | "low" | "out";

export default function ProductsPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sort, setSort] = useState<SortKey>("name-asc");

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch((e: Error) => setError(e.message));
  }, []);

  const categories = useMemo(() => {
    if (!products) return [] as string[];
    const set = new Set<string>();
    for (const p of products) {
      if (p.category) set.add(p.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "sv"));
  }, [products]);

  const filtersActive =
    search.trim() !== "" || category !== "" || stockFilter !== "all";

  const visible = useMemo(() => {
    if (!products) return [] as Product[];
    const q = search.trim().toLowerCase();
    const filtered = products.filter((p) => {
      if (q) {
        const inName = p.name.toLowerCase().includes(q);
        const inSku = p.sku.toLowerCase().includes(q);
        if (!inName && !inSku) return false;
      }
      if (category && p.category !== category) return false;
      if (stockFilter === "low" && !(p.quantity <= p.reorder_point)) return false;
      if (stockFilter === "out" && p.quantity !== 0) return false;
      return true;
    });
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sort) {
        case "name-asc":
          return a.name.localeCompare(b.name, "sv");
        case "name-desc":
          return b.name.localeCompare(a.name, "sv");
        case "qty-asc":
          return a.quantity - b.quantity;
        case "qty-desc":
          return b.quantity - a.quantity;
        case "price-asc":
          return a.unit_price - b.unit_price;
        case "price-desc":
          return b.unit_price - a.unit_price;
      }
    });
    return sorted;
  }, [products, search, category, stockFilter, sort]);

  function clearFilters() {
    setSearch("");
    setCategory("");
    setStockFilter("all");
  }

  if (error) {
    return (
      <ErrorPage
        title="Kunde inte hämta produkter"
        message={error}
        retry={() => {
          setError(null);
          listProducts()
            .then(setProducts)
            .catch((e: Error) => setError(e.message));
        }}
      />
    );
  }

  if (products === null) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Produkter</h1>
        <SkeletonTable rows={8} />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-semibold mb-2">Inga produkter än</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Lägg till din första produkt för att komma igång.
        </p>
        <Link
          href={`/${tenant}/products/new/`}
          className="inline-block rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2"
        >
          + Ny produkt
        </Link>
      </div>
    );
  }

  const countLabel = filtersActive
    ? `${visible.length} av ${products.length} produkter`
    : `${products.length} st`;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Produkter</h1>
        <span className="text-sm text-neutral-500">{countLabel}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök på namn eller SKU"
          aria-label="Sök produkter"
          className={`${inputClass} sm:flex-1 sm:min-w-[14rem]`}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filtrera på kategori"
          className={inputClass}
        >
          <option value="">Alla kategorier</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as StockFilter)}
          aria-label="Filtrera på lagerstatus"
          className={inputClass}
        >
          <option value="all">Alla</option>
          <option value="low">Lågt lager</option>
          <option value="out">Slutsålt</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sortera"
          className={inputClass}
        >
          <option value="name-asc">Namn (A–Ö)</option>
          <option value="name-desc">Namn (Ö–A)</option>
          <option value="qty-asc">Lagerantal (lägst först)</option>
          <option value="qty-desc">Lagerantal (högst först)</option>
          <option value="price-asc">Pris (lägst)</option>
          <option value="price-desc">Pris (högst)</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Inga produkter matchar dina filter
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Rensa filter
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">SKU</th>
                <th className="px-4 py-2 font-medium">Namn</th>
                <th className="px-4 py-2 font-medium">Kategori</th>
                <th className="px-4 py-2 font-medium text-right">Pris</th>
                <th className="px-4 py-2 font-medium text-right">Antal</th>
                <th className="px-4 py-2 font-medium text-right">Beställ vid</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const low = p.quantity <= p.reorder_point;
                return (
                  <tr
                    key={p.id}
                    className="border-t border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                  >
                    <td className="px-4 py-2 font-mono">{p.sku}</td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/${tenant}/product/?id=${p.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-neutral-500">
                      {p.category ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatPrice(p.unit_price)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <QuickAdjustCell
                        productId={p.id}
                        quantity={p.quantity}
                        low={low}
                        onSaved={(newQty) =>
                          setProducts((prev) =>
                            prev
                              ? prev.map((x) =>
                                  x.id === p.id
                                    ? { ...x, quantity: newQty }
                                    : x,
                                )
                              : prev,
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-2 text-right text-neutral-500">
                      {p.reorder_point}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
