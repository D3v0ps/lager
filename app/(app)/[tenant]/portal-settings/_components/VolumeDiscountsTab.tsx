"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Card,
  CardHeader,
  DataTable,
  EmptyState,
  ErrorBanner,
  SkeletonRows,
  StatusPill,
  TBody,
  TableHead,
  Td,
  Th,
  Tr,
  buttonClasses,
} from "@/app/_components/ui";
import { listProducts } from "@/lib/data";
import { listCustomers, type Customer } from "@/lib/orders";
import {
  createVolumeDiscount,
  deleteVolumeDiscount,
  listVolumeDiscounts,
  type VolumeDiscount,
} from "@/lib/volume-discounts";
import { useTenantState } from "@/lib/tenant-context";
import { formatPrice } from "@/lib/format";
import { fieldHintClass, inputClass, labelClass } from "@/lib/form-classes";
import type { Product } from "@/lib/database.types";

type DiscountTarget = "product" | "category";
type CustomerScope = "all" | "specific";
type DiscountType = "percent" | "fixed";

export default function VolumeDiscountsTab() {
  const tenantState = useTenantState();
  const tenant = tenantState.tenant;

  const [discounts, setDiscounts] = useState<VolumeDiscount[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [target, setTarget] = useState<DiscountTarget>("product");
  const [productId, setProductId] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [scope, setScope] = useState<CustomerScope>("all");
  const [customerId, setCustomerId] = useState<string>("");
  const [minQuantity, setMinQuantity] = useState<number>(10);
  const [discountType, setDiscountType] = useState<DiscountType>("percent");
  const [discountPct, setDiscountPct] = useState<number>(5);
  const [unitPriceSek, setUnitPriceSek] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [d, p, c] = await Promise.all([
        listVolumeDiscounts(),
        listProducts(),
        listCustomers(),
      ]);
      setDiscounts(d);
      setProducts(p);
      setCustomers(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.category) set.add(p.category);
    }
    return Array.from(set).sort();
  }, [products]);

  const productNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) map.set(p.id, p.name);
    return map;
  }, [products]);

  const customerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of customers) map.set(c.id, c.name);
    return map;
  }, [customers]);

  function resetForm() {
    setTarget("product");
    setProductId("");
    setCategory("");
    setScope("all");
    setCustomerId("");
    setMinQuantity(10);
    setDiscountType("percent");
    setDiscountPct(5);
    setUnitPriceSek(0);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenant) return;
    setFormError(null);

    if (target === "product" && !productId) {
      setFormError("Välj en produkt.");
      return;
    }
    if (target === "category" && !category) {
      setFormError("Välj en kategori.");
      return;
    }
    if (scope === "specific" && !customerId) {
      setFormError("Välj en kund.");
      return;
    }
    if (!Number.isFinite(minQuantity) || minQuantity < 1) {
      setFormError("Minsta antal måste vara minst 1.");
      return;
    }
    if (discountType === "percent") {
      if (!Number.isFinite(discountPct) || discountPct <= 0 || discountPct >= 100) {
        setFormError("Rabatt i procent måste vara mellan 0 och 100.");
        return;
      }
    } else {
      if (!Number.isFinite(unitPriceSek) || unitPriceSek < 0) {
        setFormError("Fast pris får inte vara negativt.");
        return;
      }
    }

    setSubmitting(true);
    try {
      await createVolumeDiscount({
        tenant_id: tenant.id,
        product_id: target === "product" ? productId : null,
        category: target === "category" ? category : null,
        customer_id: scope === "specific" ? customerId : null,
        min_quantity: Math.floor(minQuantity),
        discount_pct: discountType === "percent" ? discountPct : null,
        unit_price_cents:
          discountType === "fixed" ? Math.round(unitPriceSek * 100) : null,
      });
      resetForm();
      setShowForm(false);
      await reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Ta bort denna rabatt?")) return;
    try {
      await deleteVolumeDiscount(id);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const loading = discounts === null;
  const hasDiscounts = (discounts?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <div className="px-6 py-5">
          <h3 className="text-base font-semibold tracking-tight">
            Volymrabatter — så funkar det
          </h3>
          <ul className="mt-3 space-y-1.5 text-sm text-foreground-muted list-disc pl-5">
            <li>
              Sätt nivåer per produkt eller hel kategori — t.ex. <span className="text-foreground">10+ st = 5% rabatt</span>.
            </li>
            <li>
              Välj om rabatten gäller <span className="text-foreground">alla portalkunder</span> eller bara en specifik kund.
            </li>
            <li>
              Procent räknas på listpriset. Fast pris (kr/st) ersätter listpriset rakt av.
            </li>
            <li>
              Den högsta tröskeln som kunden uppnår vinner — vi väljer alltid bästa tillgängliga rabatt.
            </li>
          </ul>
        </div>
      </Card>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <Card>
        <CardHeader
          title="Aktiva volymrabatter"
          subtitle={
            hasDiscounts
              ? `${discounts!.length} ${discounts!.length === 1 ? "rabatt" : "rabatter"} konfigurerade`
              : "Inga rabatter än"
          }
          actions={
            <button
              type="button"
              onClick={() => {
                setShowForm((v) => !v);
                if (showForm) resetForm();
              }}
              className={buttonClasses(showForm ? "secondary" : "primary", "sm")}
            >
              {showForm ? "Avbryt" : "Skapa rabatt"}
            </button>
          }
        />

        {loading ? (
          <div className="px-5 py-4">
            <SkeletonRows rows={4} />
          </div>
        ) : !hasDiscounts && !showForm ? (
          <div className="p-5">
            <EmptyState
              title="Inga volymrabatter än"
              description="Lägg till nivåer som premieras med rabatt vid större order. Dina portalkunder ser priset uppdateras automatiskt."
              action={
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className={buttonClasses("primary", "md")}
                >
                  Skapa första rabatten
                </button>
              }
            />
          </div>
        ) : (
          <DataTable>
            <TableHead>
              <Th>Produkt / Kategori</Th>
              <Th>Kund</Th>
              <Th align="right">Min antal</Th>
              <Th align="right">Rabatt</Th>
              <Th>Aktiv</Th>
              <Th />
            </TableHead>
            <TBody>
              {discounts!.map((d) => {
                const targetLabel = d.product_id
                  ? (productNameById.get(d.product_id) ?? "Okänd produkt")
                  : d.category
                    ? `Kategori: ${d.category}`
                    : "—";
                const customerLabel = d.customer_id
                  ? (customerNameById.get(d.customer_id) ?? "Okänd kund")
                  : "Alla portalkunder";
                const discountLabel =
                  d.discount_pct != null
                    ? `${d.discount_pct}%`
                    : d.unit_price_cents != null
                      ? `${formatPrice(d.unit_price_cents / 100)}/st`
                      : "—";
                return (
                  <Tr key={d.id}>
                    <Td>
                      <span className="font-medium">{targetLabel}</span>
                      {d.product_id ? (
                        <span className="ml-2 text-[10px] uppercase tracking-[0.15em] text-foreground-muted">
                          Produkt
                        </span>
                      ) : (
                        <span className="ml-2 text-[10px] uppercase tracking-[0.15em] text-foreground-muted">
                          Kategori
                        </span>
                      )}
                    </Td>
                    <Td>
                      {d.customer_id ? (
                        customerLabel
                      ) : (
                        <span className="text-foreground-muted">
                          {customerLabel}
                        </span>
                      )}
                    </Td>
                    <Td align="right" className="tabular-nums">
                      {d.min_quantity} st
                    </Td>
                    <Td align="right" className="tabular-nums">
                      {discountLabel}
                    </Td>
                    <Td>
                      <StatusPill tone={d.active ? "ok" : "muted"} size="sm">
                        {d.active ? "På" : "Av"}
                      </StatusPill>
                    </Td>
                    <Td align="right">
                      <button
                        type="button"
                        onClick={() => handleDelete(d.id)}
                        className="text-rose-400 hover:underline text-xs"
                      >
                        Ta bort
                      </button>
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </DataTable>
        )}

        {showForm && (
          <div className="border-t border-white/5 p-5 sm:p-6 space-y-5">
            <div>
              <h4 className="text-sm font-semibold tracking-tight">
                Ny volymrabatt
              </h4>
              <p className="mt-1 text-xs text-foreground-muted">
                Konfigurera en ny tröskel. Rabatter aktiveras direkt.
              </p>
            </div>

            {formError && <ErrorBanner>{formError}</ErrorBanner>}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Discount target */}
              <fieldset className="space-y-2">
                <legend className={labelClass}>Vad gäller rabatten?</legend>
                <div className="flex flex-wrap gap-2">
                  <RadioPill
                    name="target"
                    value="product"
                    checked={target === "product"}
                    onChange={() => setTarget("product")}
                    label="Specifik produkt"
                  />
                  <RadioPill
                    name="target"
                    value="category"
                    checked={target === "category"}
                    onChange={() => setTarget("category")}
                    label="Hela kategori"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {target === "product" ? (
                    <div>
                      <label htmlFor="vd-product" className={labelClass}>
                        Produkt
                      </label>
                      <select
                        id="vd-product"
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        className={inputClass}
                        required
                      >
                        <option value="">Välj produkt…</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="vd-category" className={labelClass}>
                        Kategori
                      </label>
                      <select
                        id="vd-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={inputClass}
                        required
                      >
                        <option value="">Välj kategori…</option>
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {categories.length === 0 ? (
                        <p className={fieldHintClass}>
                          Du har inga kategorier än. Sätt en kategori på en produkt först.
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              </fieldset>

              {/* Customer scope */}
              <fieldset className="space-y-2">
                <legend className={labelClass}>Vem gäller rabatten för?</legend>
                <div className="flex flex-wrap gap-2">
                  <RadioPill
                    name="scope"
                    value="all"
                    checked={scope === "all"}
                    onChange={() => setScope("all")}
                    label="Alla portalkunder"
                  />
                  <RadioPill
                    name="scope"
                    value="specific"
                    checked={scope === "specific"}
                    onChange={() => setScope("specific")}
                    label="En specifik kund"
                  />
                </div>
                {scope === "specific" && (
                  <div className="mt-2">
                    <label htmlFor="vd-customer" className={labelClass}>
                      Kund
                    </label>
                    <select
                      id="vd-customer"
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className={inputClass}
                      required
                    >
                      <option value="">Välj kund…</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </fieldset>

              {/* Quantity + type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="vd-min-qty" className={labelClass}>
                    Min antal (st)
                  </label>
                  <input
                    id="vd-min-qty"
                    type="number"
                    min={1}
                    step={1}
                    value={Number.isFinite(minQuantity) ? minQuantity : ""}
                    onChange={(e) =>
                      setMinQuantity(parseInt(e.target.value, 10))
                    }
                    className={inputClass}
                    required
                  />
                  <p className={fieldHintClass}>
                    Tröskel — rabatten triggar från detta antal.
                  </p>
                </div>
                <div>
                  <span className={labelClass}>Typ av rabatt</span>
                  <div className="flex flex-wrap gap-2">
                    <RadioPill
                      name="discount-type"
                      value="percent"
                      checked={discountType === "percent"}
                      onChange={() => setDiscountType("percent")}
                      label="Procent"
                    />
                    <RadioPill
                      name="discount-type"
                      value="fixed"
                      checked={discountType === "fixed"}
                      onChange={() => setDiscountType("fixed")}
                      label="Fast pris (kr/st)"
                    />
                  </div>
                </div>
              </div>

              {discountType === "percent" ? (
                <div className="sm:max-w-xs">
                  <label htmlFor="vd-pct" className={labelClass}>
                    Rabatt (%)
                  </label>
                  <input
                    id="vd-pct"
                    type="number"
                    min={0.1}
                    max={99.9}
                    step={0.1}
                    value={Number.isFinite(discountPct) ? discountPct : ""}
                    onChange={(e) => setDiscountPct(parseFloat(e.target.value))}
                    className={inputClass}
                    required
                  />
                </div>
              ) : (
                <div className="sm:max-w-xs">
                  <label htmlFor="vd-fixed" className={labelClass}>
                    Fast pris (kr/st)
                  </label>
                  <input
                    id="vd-fixed"
                    type="number"
                    min={0}
                    step={0.01}
                    value={Number.isFinite(unitPriceSek) ? unitPriceSek : ""}
                    onChange={(e) =>
                      setUnitPriceSek(parseFloat(e.target.value))
                    }
                    className={inputClass}
                    required
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting || !tenant}
                  className={buttonClasses("primary", "md")}
                >
                  {submitting ? "Sparar…" : "Spara rabatt"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className={buttonClasses("ghost", "md")}
                >
                  Avbryt
                </button>
              </div>
            </form>
          </div>
        )}
      </Card>
    </div>
  );
}

function RadioPill({
  name,
  value,
  checked,
  onChange,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm cursor-pointer transition-colors ${
        checked
          ? "border-amber-400/50 bg-amber-500/10 text-foreground"
          : "border-white/10 bg-white/[0.02] text-foreground-muted hover:bg-white/[0.04] hover:text-foreground"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${
          checked ? "bg-amber-400" : "bg-white/20"
        }`}
      />
      {label}
    </label>
  );
}
