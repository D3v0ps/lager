"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createProduct, updateProduct } from "@/lib/data";
import type { Product } from "@/lib/database.types";

type Props = {
  product?: Product;
  submitLabel: string;
};

const inputClass =
  "w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500";
const labelClass = "block text-sm font-medium mb-1";

export function ProductForm({ product, submitLabel }: Props) {
  const router = useRouter();
  const isEdit = product != null;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData(e.currentTarget);
      const sku = String(fd.get("sku") ?? "").trim();
      const name = String(fd.get("name") ?? "").trim();
      const category = String(fd.get("category") ?? "").trim() || null;
      const unit_price = Number(fd.get("unit_price") ?? 0);
      const reorder_point = Number(fd.get("reorder_point") ?? 0);
      const notes = String(fd.get("notes") ?? "").trim() || null;
      if (!sku || !name) throw new Error("SKU och namn krävs");

      if (isEdit && product) {
        await updateProduct(product.id, {
          sku,
          name,
          category,
          unit_price,
          reorder_point,
          notes,
        });
        router.push(`/product/?id=${product.id}`);
      } else {
        const quantity = Number(fd.get("quantity") ?? 0);
        const created = await createProduct({
          sku,
          name,
          category,
          unit_price,
          quantity,
          reorder_point,
          notes,
        });
        router.push(`/product/?id=${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="sku" className={labelClass}>
            SKU *
          </label>
          <input
            id="sku"
            name="sku"
            required
            defaultValue={product?.sku ?? ""}
            className={`${inputClass} font-mono`}
          />
        </div>
        <div>
          <label htmlFor="category" className={labelClass}>
            Kategori
          </label>
          <input
            id="category"
            name="category"
            defaultValue={product?.category ?? ""}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label htmlFor="name" className={labelClass}>
          Namn *
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={product?.name ?? ""}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="unit_price" className={labelClass}>
            Pris (SEK)
          </label>
          <input
            id="unit_price"
            name="unit_price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={product?.unit_price ?? 0}
            className={inputClass}
          />
        </div>
        {!isEdit && (
          <div>
            <label htmlFor="quantity" className={labelClass}>
              Startantal
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="0"
              step="1"
              defaultValue={0}
              className={inputClass}
            />
          </div>
        )}
        <div>
          <label htmlFor="reorder_point" className={labelClass}>
            Beställningspunkt
          </label>
          <input
            id="reorder_point"
            name="reorder_point"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.reorder_point ?? 0}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label htmlFor="notes" className={labelClass}>
          Anteckningar
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={product?.notes ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Sparar…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
