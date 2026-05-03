import type { Product } from "@/lib/database.types";

type Props = {
  action: (formData: FormData) => Promise<void>;
  product?: Product;
  submitLabel: string;
};

const inputClass =
  "w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500";
const labelClass = "block text-sm font-medium mb-1";

export function ProductForm({ action, product, submitLabel }: Props) {
  const isEdit = product != null;
  return (
    <form action={action} className="space-y-4 max-w-xl">
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
          className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
