import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4">
        <h2 className="font-semibold mb-1">Kunde inte hämta produkter</h2>
        <p className="text-sm">{error.message}</p>
        <p className="text-sm mt-2">
          Kontrollera att <code>NEXT_PUBLIC_SUPABASE_URL</code> och{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> är satta i{" "}
          <code>.env.local</code> och att migrationen är körd.
        </p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-semibold mb-2">Inga produkter än</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Lägg till din första produkt för att komma igång.
        </p>
        <Link
          href="/products/new"
          className="inline-block rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2"
        >
          + Ny produkt
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Produkter</h1>
        <span className="text-sm text-neutral-500">{products.length} st</span>
      </div>
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
            {products.map((p) => {
              const low = p.quantity <= p.reorder_point;
              return (
                <tr
                  key={p.id}
                  className="border-t border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                >
                  <td className="px-4 py-2 font-mono">{p.sku}</td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/products/${p.id}`}
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
                  <td
                    className={`px-4 py-2 text-right font-medium ${
                      low ? "text-red-600 dark:text-red-400" : ""
                    }`}
                  >
                    {p.quantity}
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
    </div>
  );
}
