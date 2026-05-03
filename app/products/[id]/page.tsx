import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice, movementLabel } from "@/lib/format";
import { deleteProduct, recordMovement } from "@/app/actions";
import { MovementForm } from "@/app/products/_components/movement-form";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: product, error: productError }, { data: movements }] =
    await Promise.all([
      supabase.from("products").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("stock_movements")
        .select("*")
        .eq("product_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  if (productError) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4">
        {productError.message}
      </div>
    );
  }
  if (!product) notFound();

  const recordForProduct = recordMovement.bind(null, product.id);
  const deleteForProduct = deleteProduct.bind(null, product.id);
  const low = product.quantity <= product.reorder_point;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          ← Tillbaka
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <p className="text-sm text-neutral-500 font-mono mt-1">
              {product.sku}
              {product.category ? ` · ${product.category}` : ""}
            </p>
          </div>
          <div className="text-right">
            <div
              className={`text-3xl font-semibold ${
                low ? "text-red-600 dark:text-red-400" : ""
              }`}
            >
              {product.quantity}
            </div>
            <div className="text-xs text-neutral-500">i lager</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Pris" value={formatPrice(product.unit_price)} />
        <Stat label="Beställningspunkt" value={String(product.reorder_point)} />
        <Stat label="Uppdaterad" value={formatDate(product.updated_at)} />
      </div>

      {product.notes && (
        <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-sm whitespace-pre-wrap">
          {product.notes}
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Registrera rörelse</h2>
        <MovementForm action={recordForProduct} currentQuantity={product.quantity} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Senaste rörelser</h2>
        {!movements || movements.length === 0 ? (
          <p className="text-sm text-neutral-500">Inga rörelser ännu.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Tid</th>
                  <th className="px-4 py-2 font-medium">Typ</th>
                  <th className="px-4 py-2 font-medium text-right">Antal</th>
                  <th className="px-4 py-2 font-medium">Anteckning</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr
                    key={m.id}
                    className="border-t border-neutral-200 dark:border-neutral-800"
                  >
                    <td className="px-4 py-2 text-neutral-500">
                      {formatDate(m.created_at)}
                    </td>
                    <td className="px-4 py-2">{movementLabel(m.type)}</td>
                    <td className="px-4 py-2 text-right font-medium">
                      {m.type === "out" ? "-" : m.type === "in" ? "+" : "="}
                      {Math.abs(m.quantity)}
                    </td>
                    <td className="px-4 py-2 text-neutral-500">{m.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex items-center justify-between gap-3 border-t border-neutral-200 dark:border-neutral-800 pt-6">
        <Link
          href={`/products/${product.id}/edit`}
          className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
        >
          Redigera produkt
        </Link>
        <form action={deleteForProduct}>
          <button
            type="submit"
            className="rounded-md border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            Ta bort produkt
          </button>
        </form>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <div className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="text-lg font-medium mt-1">{value}</div>
    </div>
  );
}
