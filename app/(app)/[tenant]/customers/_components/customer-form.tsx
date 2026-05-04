"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createCustomer,
  updateCustomer,
  type Customer,
} from "@/lib/orders";
import { useTenant } from "@/lib/tenant-context";

const inputClass =
  "w-full rounded-md border border-white/15 bg-background-elevated/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500";
const labelClass = "block text-sm font-medium mb-1";

type Props = {
  customer?: Customer;
  submitLabel: string;
  /** Where to redirect after a successful create. Defaults to the customer list. */
  onCreated?: (customer: Customer) => void;
  /** Where to redirect after a successful update. Defaults to the edit page. */
  onUpdated?: (customer: Customer) => void;
};

export function CustomerForm({
  customer,
  submitLabel,
  onCreated,
  onUpdated,
}: Props) {
  const router = useRouter();
  const tenant = useTenant();
  const isEdit = customer != null;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData(e.currentTarget);
      const name = String(fd.get("name") ?? "").trim();
      const email = String(fd.get("email") ?? "").trim() || null;
      const phone = String(fd.get("phone") ?? "").trim() || null;
      const org_number = String(fd.get("org_number") ?? "").trim() || null;
      const billing_address =
        String(fd.get("billing_address") ?? "").trim() || null;
      const shipping_address =
        String(fd.get("shipping_address") ?? "").trim() || null;
      const notes = String(fd.get("notes") ?? "").trim() || null;
      if (!name) throw new Error("Namn krävs");

      if (isEdit && customer) {
        const updated = await updateCustomer(customer.id, {
          name,
          email,
          phone,
          org_number,
          billing_address,
          shipping_address,
          notes,
        });
        if (onUpdated) onUpdated(updated);
        else router.push(`/${tenant?.slug}/customers/edit/?id=${updated.id}`);
      } else {
        if (!tenant) throw new Error("Saknar tenant-kontext");
        const created = await createCustomer({
          tenant_id: tenant.id,
          name,
          email,
          phone,
          org_number,
          billing_address,
          shipping_address,
          notes,
        });
        if (onCreated) onCreated(created);
        else router.push(`/${tenant.slug}/customers/edit/?id=${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
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
          defaultValue={customer?.name ?? ""}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="email" className={labelClass}>
            E-post
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={customer?.email ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            Telefon
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={customer?.phone ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="org_number" className={labelClass}>
            Org-nr
          </label>
          <input
            id="org_number"
            name="org_number"
            defaultValue={customer?.org_number ?? ""}
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="billing_address" className={labelClass}>
            Faktureringsadress
          </label>
          <textarea
            id="billing_address"
            name="billing_address"
            rows={3}
            defaultValue={customer?.billing_address ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="shipping_address" className={labelClass}>
            Leveransadress
          </label>
          <textarea
            id="shipping_address"
            name="shipping_address"
            rows={3}
            defaultValue={customer?.shipping_address ?? ""}
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
          defaultValue={customer?.notes ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Sparar…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
