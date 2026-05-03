"use client";

import Link from "next/link";
import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { listProducts } from "@/lib/data";
import type { Product } from "@/lib/database.types";
import { formatPrice } from "@/lib/format";
import {
  createCustomer,
  createOrder,
  listCustomers,
  orderTotal,
  suggestOrderReference,
  type Customer,
  type SalesOrderItemDraft,
} from "@/lib/orders";
import { useTenant } from "@/lib/tenant-context";

const inputClass =
  "w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500";
const labelClass = "block text-sm font-medium mb-1";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Laddar…</p>}>
      <NewOrder />
    </Suspense>
  );
}

type Row = {
  key: string;
  product_id: string;
  search: string;
  quantity: number;
  unit_price: number;
};

function makeRow(): Row {
  return {
    key:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    product_id: "",
    search: "",
    quantity: 1,
    unit_price: 0,
  };
}

function NewOrder() {
  const router = useRouter();
  const tenant = useTenant();
  const { tenant: tenantSlug } = useParams<{ tenant: string }>();
  const params = useSearchParams();
  const presetCustomer = params.get("customer");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState<string>(presetCustomer ?? "");
  const [reference, setReference] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Row[]>([makeRow()]);

  const [showInlineCustomer, setShowInlineCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([listCustomers(), listProducts(), suggestOrderReference()])
      .then(([c, p, ref]) => {
        setCustomers(c);
        setProducts(p);
        setReference(ref);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  // When user picks a customer with a default shipping address, prefill it.
  useEffect(() => {
    if (!customerId || shippingAddress.trim() !== "") return;
    const c = customers.find((x) => x.id === customerId);
    if (c?.shipping_address) setShippingAddress(c.shipping_address);
  }, [customerId, customers, shippingAddress]);

  const total = useMemo(
    () =>
      orderTotal(
        rows
          .filter((r) => r.product_id)
          .map((r) => ({ quantity: r.quantity, unit_price: r.unit_price })),
      ),
    [rows],
  );

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((rs) => [...rs, makeRow()]);
  }

  function removeRow(key: string) {
    setRows((rs) => (rs.length === 1 ? rs : rs.filter((r) => r.key !== key)));
  }

  function pickProduct(rowKey: string, product: Product) {
    updateRow(rowKey, {
      product_id: product.id,
      search: `${product.sku} — ${product.name}`,
      unit_price: product.unit_price,
    });
  }

  async function handleCreateInlineCustomer() {
    if (!tenant) return;
    if (!newCustomerName.trim()) {
      setSubmitError("Kundnamn krävs");
      return;
    }
    setCreatingCustomer(true);
    setSubmitError(null);
    try {
      const created = await createCustomer({
        tenant_id: tenant.id,
        name: newCustomerName.trim(),
        email: newCustomerEmail.trim() || null,
        phone: null,
        org_number: null,
        billing_address: null,
        shipping_address: null,
        notes: null,
      });
      setCustomers((cs) =>
        [...cs, created].sort((a, b) => a.name.localeCompare(b.name, "sv")),
      );
      setCustomerId(created.id);
      setShowInlineCustomer(false);
      setNewCustomerName("");
      setNewCustomerEmail("");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreatingCustomer(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenant) return;
    setSubmitError(null);

    const items: SalesOrderItemDraft[] = rows
      .filter((r) => r.product_id && r.quantity > 0)
      .map((r) => ({
        product_id: r.product_id,
        quantity: Math.floor(r.quantity),
        unit_price: r.unit_price,
      }));

    if (items.length === 0) {
      setSubmitError("Lägg till minst en orderrad med produkt och antal.");
      return;
    }

    setBusy(true);
    try {
      const order = await createOrder({
        tenant_id: tenant.id,
        customer_id: customerId || null,
        reference: reference.trim() || null,
        shipping_address: shippingAddress.trim() || null,
        notes: notes.trim() || null,
        items,
      });
      router.push(`/${tenantSlug}/orders/order/?id=${order.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${tenantSlug}/orders/`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← Tillbaka till ordrar
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Ny order</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-sm">
            {submitError}
          </div>
        )}

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customer" className={labelClass}>
                Kund
              </label>
              <div className="flex gap-2">
                <select
                  id="customer"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">— Välj kund —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowInlineCustomer((v) => !v)}
                  className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm whitespace-nowrap hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Ny kund
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="reference" className={labelClass}>
                Order-ref
              </label>
              <input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="SO-2026-001"
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>

          {showInlineCustomer && (
            <div className="rounded-md border border-dashed border-neutral-300 dark:border-neutral-700 p-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-customer-name" className={labelClass}>
                    Namn *
                  </label>
                  <input
                    id="new-customer-name"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="new-customer-email" className={labelClass}>
                    E-post
                  </label>
                  <input
                    id="new-customer-email"
                    type="email"
                    value={newCustomerEmail}
                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateInlineCustomer}
                  disabled={creatingCustomer}
                  className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                >
                  {creatingCustomer ? "Skapar…" : "Skapa kund"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInlineCustomer(false)}
                  className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm"
                >
                  Avbryt
                </button>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="shipping_address" className={labelClass}>
              Leveransadress
            </label>
            <textarea
              id="shipping_address"
              rows={2}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Fylls i automatiskt från kunden om tillgänglig"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="notes" className={labelClass}>
              Anteckningar
            </label>
            <textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Orderrader</h2>
            <button
              type="button"
              onClick={addRow}
              className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              + Lägg till rad
            </button>
          </div>

          <div className="space-y-3">
            {rows.map((row) => (
              <OrderRowEditor
                key={row.key}
                row={row}
                products={products}
                onChange={(patch) => updateRow(row.key, patch)}
                onPickProduct={(p) => pickProduct(row.key, p)}
                onRemove={() => removeRow(row.key)}
                canRemove={rows.length > 1}
              />
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <span className="text-sm text-neutral-500">Totalt</span>
            <span className="text-lg font-semibold">{formatPrice(total)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {busy ? "Sparar…" : "Spara som utkast"}
          </button>
          <Link
            href={`/${tenantSlug}/orders/`}
            className="rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm"
          >
            Avbryt
          </Link>
        </div>
      </form>
    </div>
  );
}

function OrderRowEditor({
  row,
  products,
  onChange,
  onPickProduct,
  onRemove,
  canRemove,
}: {
  row: Row;
  products: Product[];
  onChange: (patch: Partial<Row>) => void;
  onPickProduct: (p: Product) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const q = row.search.trim().toLowerCase();
    if (!q) return products.slice(0, 8);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [products, row.search]);

  const lineTotal = row.quantity * row.unit_price;

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-2 md:items-start rounded-md md:rounded-none border md:border-0 border-neutral-200 dark:border-neutral-800 p-3 md:p-0">
      <div className="md:col-span-6 relative">
        <label className="md:hidden text-xs text-neutral-500 mb-1 block">
          Produkt
        </label>
        <input
          type="text"
          value={row.search}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => {
            onChange({ search: e.target.value, product_id: "" });
            setOpen(true);
          }}
          placeholder="Sök produkt på SKU eller namn"
          className={inputClass}
        />
        {open && matches.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg text-sm">
            {matches.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPickProduct(p);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <span className="font-mono text-neutral-500 mr-2">
                    {p.sku}
                  </span>
                  {p.name}
                  <span className="text-neutral-400 ml-2 text-xs">
                    · {p.quantity} i lager · {formatPrice(p.unit_price)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 md:contents">
        <div className="md:col-span-2">
          <label className="md:hidden text-xs text-neutral-500 mb-1 block">
            Antal
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={row.quantity}
            onChange={(e) =>
              onChange({
                quantity: Math.max(1, Math.floor(Number(e.target.value) || 0)),
              })
            }
            aria-label="Antal"
            className={inputClass}
          />
        </div>
        <div className="md:col-span-2">
          <label className="md:hidden text-xs text-neutral-500 mb-1 block">
            À-pris
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={row.unit_price}
            onChange={(e) =>
              onChange({ unit_price: Math.max(0, Number(e.target.value) || 0) })
            }
            aria-label="À-pris"
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 md:col-span-2 md:contents">
        <div className="md:col-span-1 md:flex md:items-center md:justify-end md:pt-2 text-sm">
          <span className="md:hidden text-xs text-neutral-500 mr-2">
            Radsumma:
          </span>
          {formatPrice(lineTotal)}
        </div>
        <div className="md:col-span-1 md:flex md:items-center md:justify-end md:pt-1">
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            aria-label="Ta bort rad"
            className="rounded-md border border-neutral-300 dark:border-neutral-700 min-w-11 min-h-11 md:min-w-0 md:min-h-0 px-3 md:px-2 py-1 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
