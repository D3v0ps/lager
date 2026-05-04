"use client";

// Per-customer negotiated price list editor — used inside the
// portal-settings screen for the chosen Customer. Lets the supplier override
// the list price for specific products on a per-customer basis.

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Card,
  CardHeader,
  DataTable,
  ErrorBanner,
  SkeletonRows,
  TBody,
  TableHead,
  Td,
  Th,
  Tr,
  buttonClasses,
} from "@/app/_components/ui";
import { listProducts } from "@/lib/data";
import {
  listCustomerPrices,
  setCustomerPrice,
  type CustomerPriceListEntry,
} from "@/lib/customer-portal";
import type { Customer } from "@/lib/orders";
import type { Product } from "@/lib/database.types";
import { useTenantState } from "@/lib/tenant-context";
import { formatPrice } from "@/lib/format";
import { fieldHintClass, inputClass, labelClass } from "@/lib/form-classes";

export default function CustomerPriceListSection({
  customer,
}: {
  customer: Customer;
}) {
  const tenantState = useTenantState();
  const tenant = tenantState.tenant;

  const [prices, setPrices] = useState<CustomerPriceListEntry[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [productId, setProductId] = useState<string>("");
  const [priceSek, setPriceSek] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [p, prods] = await Promise.all([
        listCustomerPrices(customer.id),
        listProducts(),
      ]);
      setPrices(p);
      setProducts(prods);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [customer.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  // Suggest products that don't already have an unbounded price for this
  // customer — but allow overriding via re-selection (setCustomerPrice
  // replaces the unbounded entry). Keep the full list available.
  const productsForSelect = useMemo(
    () =>
      products.slice().sort((a, b) => a.name.localeCompare(b.name, "sv-SE")),
    [products],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenant) return;
    setFormError(null);
    setInfo(null);

    if (!productId) {
      setFormError("Välj en produkt.");
      return;
    }
    const numericPrice = typeof priceSek === "number" ? priceSek : NaN;
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setFormError("Ange ett giltigt pris (kr).");
      return;
    }

    setSubmitting(true);
    try {
      await setCustomerPrice(tenant.id, customer.id, productId, numericPrice);
      const product = productById.get(productId);
      setInfo(
        product
          ? `Pris för ${product.name} satt till ${formatPrice(numericPrice)}.`
          : "Pris sparat.",
      );
      setProductId("");
      setPriceSek("");
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const loading = prices === null;
  const hasPrices = (prices?.length ?? 0) > 0;

  return (
    <Card>
      <CardHeader
        title="Avtalspriser"
        subtitle={
          hasPrices
            ? `${prices!.length} ${prices!.length === 1 ? "pris" : "priser"} satta för ${customer.name}`
            : `Inga avtalspriser för ${customer.name} än`
        }
      />

      {error && (
        <div className="px-5 pt-4">
          <ErrorBanner>{error}</ErrorBanner>
        </div>
      )}

      <div className="border-b border-white/5 p-5 sm:p-6 space-y-4">
        <div>
          <h4 className="text-sm font-semibold tracking-tight">
            Sätt nytt avtalspris
          </h4>
          <p className="mt-1 text-xs text-foreground-muted">
            Ersätter listpriset för denna kund. Befintligt avtalspris för samma
            produkt skrivs över.
          </p>
        </div>

        {formError && <ErrorBanner>{formError}</ErrorBanner>}
        {info && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-md border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 p-3 text-sm"
          >
            {info}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end"
        >
          <div>
            <label htmlFor={`cpl-product-${customer.id}`} className={labelClass}>
              Produkt
            </label>
            <select
              id={`cpl-product-${customer.id}`}
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className={inputClass}
              required
            >
              <option value="">Välj produkt…</option>
              {productsForSelect.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — {formatPrice(p.unit_price)}
                </option>
              ))}
            </select>
            <p className={fieldHintClass}>
              Listpriset visas i parentes — ange kundens avtalspris nedan.
            </p>
          </div>
          <div>
            <label htmlFor={`cpl-price-${customer.id}`} className={labelClass}>
              Avtalspris (kr)
            </label>
            <input
              id={`cpl-price-${customer.id}`}
              type="number"
              min={0}
              step={0.01}
              value={priceSek === "" ? "" : priceSek}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  setPriceSek("");
                  return;
                }
                const parsed = parseFloat(v);
                setPriceSek(Number.isFinite(parsed) ? parsed : "");
              }}
              className={inputClass}
              placeholder="0,00"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !tenant}
            className={buttonClasses("primary", "md")}
          >
            {submitting ? "Sparar…" : "Spara pris"}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="p-5">
          <SkeletonRows rows={4} />
        </div>
      ) : !hasPrices ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Inga avtalspriser satta
          </p>
          <p className="mt-1.5 text-xs text-foreground-muted max-w-md mx-auto">
            Använd formuläret ovan för att lägga till ett avtalat pris för en
            specifik produkt. {customer.name} ser då detta pris i portalen.
          </p>
        </div>
      ) : (
        <DataTable>
          <TableHead>
            <Th>Produkt</Th>
            <Th>SKU</Th>
            <Th align="right">Listpris</Th>
            <Th align="right">Avtalspris</Th>
            <Th align="right">Skillnad</Th>
          </TableHead>
          <TBody>
            {prices!.map((entry) => {
              const product = productById.get(entry.product_id);
              const list = product?.unit_price ?? null;
              const diff =
                list != null ? entry.unit_price - list : null;
              const diffPct =
                list && list > 0
                  ? ((entry.unit_price - list) / list) * 100
                  : null;
              const diffClass =
                diff == null
                  ? "text-foreground-muted"
                  : diff < 0
                    ? "text-emerald-400"
                    : diff > 0
                      ? "text-amber-400"
                      : "text-foreground-muted";
              return (
                <Tr key={entry.id}>
                  <Td>
                    <span className="font-medium">
                      {product?.name ?? "Okänd produkt"}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs text-foreground-muted">
                      {product?.sku ?? "—"}
                    </span>
                  </Td>
                  <Td align="right" className="tabular-nums text-foreground-muted">
                    {list != null ? formatPrice(list) : "—"}
                  </Td>
                  <Td align="right" className="tabular-nums font-medium">
                    {formatPrice(entry.unit_price)}
                  </Td>
                  <Td align="right" className={`tabular-nums text-xs ${diffClass}`}>
                    {diff == null
                      ? "—"
                      : diffPct != null
                        ? `${diff >= 0 ? "+" : ""}${diffPct.toFixed(1)}%`
                        : diff >= 0
                          ? `+${formatPrice(diff)}`
                          : formatPrice(diff)}
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </DataTable>
      )}
    </Card>
  );
}
