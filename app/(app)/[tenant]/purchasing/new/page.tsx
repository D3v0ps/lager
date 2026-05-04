"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { listProducts } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import {
  createPurchaseOrder,
  listSuppliers,
  suggestReorderItems,
  type Supplier,
} from "@/lib/suppliers";
import { useTenant } from "@/lib/tenant-context";
import type { Product } from "@/lib/database.types";

import PoLineItems, {
  lineFromSuggestion,
  type Line,
} from "../_components/po-line-items";

const inputClass =
  "w-full rounded-md border border-white/15 bg-background-elevated/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500";
const labelClass = "block text-sm font-medium mb-1";

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const { tenant: tenantSlug } = useParams<{ tenant: string }>();
  const tenant = useTenant();

  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [supplierId, setSupplierId] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listSuppliers(), listProducts()])
      .then(([s, p]) => {
        setSuppliers(s);
        setProducts(p);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  async function handleSuggest() {
    setError(null);
    setInfo(null);
    setSuggestBusy(true);
    try {
      const suggestions = await suggestReorderItems();
      if (suggestions.length === 0) {
        setInfo(
          "Inga produkter ligger på eller under sin beställningspunkt just nu.",
        );
        return;
      }
      // Skip products already in the lines.
      const existing = new Set(lines.map((l) => l.product_id));
      const fresh = suggestions.filter((s) => !existing.has(s.product_id));
      const newLines = fresh.map((s) =>
        lineFromSuggestion({
          product_id: s.product_id,
          name: s.name,
          sku: s.sku,
          quantity: s.suggested_quantity,
          unit_cost: s.unit_cost,
        }),
      );
      setLines([...lines, ...newLines]);
      const skipped = suggestions.length - fresh.length;
      const msg =
        `Lade till ${fresh.length} förslag` +
        (skipped > 0 ? ` (${skipped} fanns redan i ordern)` : "") +
        ".";
      setInfo(msg);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSuggestBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (!tenant) throw new Error("Saknar tenant-kontext");
      if (lines.length === 0)
        throw new Error("Lägg till minst en rad innan du sparar.");
      const order = await createPurchaseOrder({
        tenant_id: tenant.id,
        supplier_id: supplierId || null,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
        items: lines.map((l) => ({
          product_id: l.product_id,
          quantity: l.quantity,
          unit_cost: l.unit_cost,
        })),
      });
      router.push(`/${tenantSlug}/purchasing/order/?id=${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4">
        <h2 className="font-semibold mb-1">Kunde inte ladda data</h2>
        <p className="text-sm">{loadError}</p>
      </div>
    );
  }

  if (suppliers === null || products === null) {
    return <p className="text-sm text-neutral-500">Laddar…</p>;
  }

  const total = lines.reduce(
    (acc, l) => acc + l.quantity * Number(l.unit_cost || 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${tenantSlug}/purchasing/`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← Tillbaka
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Ny inköpsorder</h1>
      </div>

      {suppliers.length === 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-sm">
          Du har inga leverantörer än.{" "}
          <Link
            href={`/${tenantSlug}/suppliers/`}
            className="underline font-medium"
          >
            Skapa en leverantör
          </Link>{" "}
          först (frivilligt — du kan spara ordern utan).
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="supplier" className={labelClass}>
              Leverantör
            </label>
            <select
              id="supplier"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className={inputClass}
            >
              <option value="">— Ingen vald —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="reference" className={labelClass}>
              PO-referens
            </label>
            <input
              id="reference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="t.ex. PO-2026-001"
              className={`${inputClass} font-mono`}
            />
          </div>
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

        <section>
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">Rader</h2>
            <button
              type="button"
              onClick={handleSuggest}
              disabled={suggestBusy}
              className="rounded-md border border-white/15 px-3 py-2 text-sm hover:bg-white/[0.05] disabled:opacity-50"
              title="Lägger till alla produkter där lagret är på eller under beställningspunkten"
            >
              {suggestBusy
                ? "Hämtar…"
                : "Generera förslag baserat på beställningspunkt"}
            </button>
          </div>
          {info && (
            <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-2 text-sm mb-2">
              {info}
            </div>
          )}
          <PoLineItems
            products={products}
            lines={lines}
            setLines={setLines}
          />
        </section>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4">
          <div className="text-sm text-foreground-muted">
            Totalt:{" "}
            <span className="font-semibold text-foreground">
              {formatPrice(total)}
            </span>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/${tenantSlug}/purchasing/`}
              className="rounded-md border border-white/15 px-4 py-2 text-sm hover:bg-white/[0.05]"
            >
              Avbryt
            </Link>
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {busy ? "Sparar…" : "Spara som utkast"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
