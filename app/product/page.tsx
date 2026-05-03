"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import {
  deleteProduct,
  getProduct,
  listProductMovements,
  recordMovement,
} from "@/lib/data";
import { formatDate, formatPrice, movementLabel } from "@/lib/format";
import type { MovementType, Product, StockMovement } from "@/lib/database.types";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Laddar…</p>}>
      <ProductDetail />
    </Suspense>
  );
}

function ProductDetail() {
  const params = useSearchParams();
  const id = params.get("id");
  const router = useRouter();

  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [p, m] = await Promise.all([
        getProduct(id),
        listProductMovements(id),
      ]);
      setProduct(p);
      setMovements(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!id) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4">
        Saknar produkt-id.
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4">
        {error}
      </div>
    );
  }

  if (product === undefined) {
    return <p className="text-sm text-neutral-500">Laddar…</p>;
  }

  if (product === null) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-semibold mb-2">Produkten hittades inte</h1>
        <Link
          href="/"
          className="inline-block rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 mt-4"
        >
          Tillbaka till listan
        </Link>
      </div>
    );
  }

  const low = product.quantity <= product.reorder_point;

  async function handleDelete() {
    if (!product) return;
    if (!confirm(`Ta bort ${product.name}?`)) return;
    try {
      await deleteProduct(product.id);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

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
        <MovementForm
          productId={product.id}
          currentQuantity={product.quantity}
          onDone={reload}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Senaste rörelser</h2>
        {movements.length === 0 ? (
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
                    <td className="px-4 py-2 text-neutral-500">
                      {m.note ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex items-center justify-between gap-3 border-t border-neutral-200 dark:border-neutral-800 pt-6">
        <Link
          href={`/product/edit/?id=${product.id}`}
          className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
        >
          Redigera produkt
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-md border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-950/40"
        >
          Ta bort produkt
        </button>
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

function MovementForm({
  productId,
  currentQuantity,
  onDone,
}: {
  productId: string;
  currentQuantity: number;
  onDone: () => void;
}) {
  const [type, setType] = useState<MovementType>("in");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData(e.currentTarget);
      const quantity = Math.floor(Number(fd.get("quantity") ?? 0));
      const note = String(fd.get("note") ?? "").trim() || null;
      if (type !== "adjust" && quantity <= 0) {
        throw new Error("Antal måste vara större än 0");
      }
      await recordMovement({ productId, type, quantity, note });
      e.currentTarget.reset();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-3"
    >
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-2 text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="type">
            Typ
          </label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as MovementType)}
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
          >
            <option value="in">Inleverans (+)</option>
            <option value="out">Uttag (-)</option>
            <option value="adjust">Justera till</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="quantity">
            {type === "adjust" ? "Nytt antal" : "Antal"}
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={type === "adjust" ? 0 : 1}
            step={1}
            required
            defaultValue={type === "adjust" ? currentQuantity : 1}
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="note">
            Anteckning
          </label>
          <input
            id="note"
            name="note"
            type="text"
            placeholder="Valfritt"
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {busy ? "Registrerar…" : "Registrera"}
      </button>
    </form>
  );
}
