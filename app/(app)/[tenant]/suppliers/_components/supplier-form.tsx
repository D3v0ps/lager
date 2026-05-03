"use client";

import { useState } from "react";

import { createSupplier, updateSupplier, type Supplier } from "@/lib/suppliers";
import { useTenant } from "@/lib/tenant-context";

type Props = {
  supplier?: Supplier | null;
  onCancel: () => void;
  onSaved: (s: Supplier) => void;
};

const inputClass =
  "w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500";
const labelClass = "block text-sm font-medium mb-1";

export default function SupplierForm({ supplier, onCancel, onSaved }: Props) {
  const tenant = useTenant();
  const isEdit = supplier != null;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData(e.currentTarget);
      const name = String(fd.get("name") ?? "").trim();
      const contact_name = String(fd.get("contact_name") ?? "").trim() || null;
      const email = String(fd.get("email") ?? "").trim() || null;
      const phone = String(fd.get("phone") ?? "").trim() || null;
      const notes = String(fd.get("notes") ?? "").trim() || null;
      if (!name) throw new Error("Namn krävs");

      if (isEdit && supplier) {
        const saved = await updateSupplier(supplier.id, {
          name,
          contact_name,
          email,
          phone,
          notes,
        });
        onSaved(saved);
      } else {
        if (!tenant) throw new Error("Saknar tenant-kontext");
        const saved = await createSupplier({
          tenant_id: tenant.id,
          name,
          contact_name,
          email,
          phone,
          notes,
        });
        onSaved(saved);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-4"
    >
      <h2 className="text-base font-semibold">
        {isEdit ? "Redigera leverantör" : "Ny leverantör"}
      </h2>
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-sm">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="name" className={labelClass}>
          Namn *
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={supplier?.name ?? ""}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact_name" className={labelClass}>
            Kontaktperson
          </label>
          <input
            id="contact_name"
            name="contact_name"
            defaultValue={supplier?.contact_name ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            E-post
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={supplier?.email ?? ""}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label htmlFor="phone" className={labelClass}>
          Telefon
        </label>
        <input
          id="phone"
          name="phone"
          defaultValue={supplier?.phone ?? ""}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="notes" className={labelClass}>
          Anteckningar
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={supplier?.notes ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Sparar…" : isEdit ? "Spara ändringar" : "Skapa leverantör"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          Avbryt
        </button>
      </div>
    </form>
  );
}
