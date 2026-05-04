"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  listMyMemberships,
  listPortalCatalog,
  placePortalOrder,
  type PortalCatalogItem,
  type PortalMembership,
} from "@/lib/portal";
import { formatPrice } from "@/lib/format";
import {
  Card,
  CardHeader,
  ErrorPage,
  PageHeader,
  SkeletonRows,
  StatusPill,
} from "@/app/_components/ui";
import { inputClass } from "@/lib/form-classes";

import PortalShell from "./_components/portal-shell";

type CartLine = { product_id: string; quantity: number; unit_price: number; name: string; sku: string };

export default function PortalCatalogPage() {
  const { tenant } = useParams<{ tenant: string }>();
  return (
    <PortalShell tenant={tenant}>
      <CatalogContent tenantSlug={tenant} />
    </PortalShell>
  );
}

function CatalogContent({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter();
  const [catalog, setCatalog] = useState<PortalCatalogItem[] | null>(null);
  const [membership, setMembership] = useState<PortalMembership | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const memberships = await listMyMemberships(tenantSlug);
      const m = memberships[0];
      if (!m) {
        setMembership(null);
        setCatalog([]);
        return;
      }
      setMembership(m);
      setShippingAddress((current) =>
        current || (m.customer.shipping_address ?? ""),
      );
      const items = await listPortalCatalog(m.customer_id);
      setCatalog(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [tenantSlug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const visible = useMemo(() => {
    if (!catalog) return [] as PortalCatalogItem[];
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.category?.toLowerCase().includes(q) ?? false),
    );
  }, [catalog, search]);

  const cartLines = Object.values(cart);
  const cartTotal = cartLines.reduce(
    (acc, l) => acc + l.quantity * l.unit_price,
    0,
  );
  const cartCount = cartLines.reduce((acc, l) => acc + l.quantity, 0);

  function setQty(p: PortalCatalogItem, qty: number) {
    setCart((prev) => {
      const next = { ...prev };
      const safe = Math.max(0, Math.floor(qty));
      if (safe === 0) {
        delete next[p.id];
      } else {
        next[p.id] = {
          product_id: p.id,
          quantity: safe,
          unit_price: p.customer_price ?? p.unit_price,
          name: p.name,
          sku: p.sku,
        };
      }
      return next;
    });
  }

  async function placeOrder() {
    if (!membership) return;
    setOrderError(null);
    setSubmittingOrder(true);
    try {
      const id = await placePortalOrder({
        customer_id: membership.customer_id,
        tenant_id: membership.tenant.id,
        reference: null,
        shipping_address: shippingAddress || null,
        notes: notes || null,
        items: cartLines.map((l) => ({
          product_id: l.product_id,
          quantity: l.quantity,
          unit_price: l.unit_price,
        })),
      });
      router.push(`/${tenantSlug}/portal/orders/?placed=${id}`);
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmittingOrder(false);
    }
  }

  if (error) {
    return (
      <ErrorPage
        title="Kunde inte ladda katalogen"
        message={error}
        retry={reload}
      />
    );
  }

  if (catalog === null || !membership) {
    return (
      <div className="space-y-6">
        <PageHeader title="Beställ direkt" />
        <SkeletonRows rows={6} className="h-12" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Katalog"
        title={`Beställ från ${membership.tenant.name}`}
        subtitle={
          membership.tenant.portal_welcome_text ??
          `Hej ${membership.customer.name} — välj artiklar och lägg till i varukorgen.`
        }
        actions={
          <button
            type="button"
            onClick={() => setShowCheckout((v) => !v)}
            disabled={cartCount === 0}
            className="inline-flex items-center gap-2 rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50"
          >
            <CartIcon />
            Varukorg ({cartCount})
            <span className="hidden sm:inline tabular-nums">
              {formatPrice(cartTotal)}
            </span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-4 min-w-0">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök på SKU, namn eller kategori"
            aria-label="Sök produkt"
            className={inputClass}
          />
          {visible.length === 0 ? (
            <Card>
              <p className="px-5 py-8 text-sm text-foreground-muted text-center">
                Inga produkter matchar sökningen.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {visible.map((p) => {
                const qty = cart[p.id]?.quantity ?? 0;
                const price = p.customer_price ?? p.unit_price;
                const hasCustomerPrice = p.customer_price != null;
                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-white/10 bg-background-elevated/40 hover:border-white/20 transition-colors p-4 flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
                        <code className="font-mono">{p.sku}</code>
                        {p.category ? <span>· {p.category}</span> : null}
                      </div>
                      <p className="mt-1 font-medium truncate">{p.name}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <p className="text-base font-semibold tabular-nums">
                          {formatPrice(price)}
                        </p>
                        {hasCustomerPrice && p.customer_price! < p.unit_price && (
                          <p className="text-xs text-foreground-muted line-through tabular-nums">
                            {formatPrice(p.unit_price)}
                          </p>
                        )}
                        {hasCustomerPrice && (
                          <StatusPill tone="info" size="sm">Avtalat pris</StatusPill>
                        )}
                        {p.quantity === 0 ? (
                          <StatusPill tone="error" size="sm">Slut</StatusPill>
                        ) : p.quantity <= p.reorder_point ? (
                          <StatusPill tone="low" size="sm">Lågt saldo</StatusPill>
                        ) : (
                          <span className="text-[11px] text-foreground-muted">
                            {p.quantity} i lager
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setQty(p, qty - 1)}
                        disabled={qty === 0}
                        aria-label="Minska"
                        className="h-9 w-9 rounded-md border border-white/15 hover:bg-white/[0.05] disabled:opacity-30 text-lg leading-none"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={qty}
                        onChange={(e) =>
                          setQty(p, Number(e.target.value) || 0)
                        }
                        aria-label={`Antal ${p.name}`}
                        className="h-9 w-14 text-center bg-background-elevated/60 border border-white/10 rounded-md text-sm tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => setQty(p, qty + 1)}
                        aria-label="Öka"
                        className="h-9 w-9 rounded-md border border-white/15 hover:bg-white/[0.05] text-lg leading-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart sidebar — sticky on desktop, slide-up modal on mobile */}
        <aside
          className={`${
            showCheckout ? "fixed inset-0 z-50 bg-background/95 backdrop-blur lg:static lg:inset-auto lg:bg-transparent lg:backdrop-blur-none p-4 lg:p-0 overflow-y-auto" : "hidden lg:block"
          }`}
        >
          <div className="lg:sticky lg:top-20 max-w-lg mx-auto lg:mx-0">
            <Card variant="elevated">
              <CardHeader
                title="Varukorg"
                subtitle={`${cartCount} ${cartCount === 1 ? "rad" : "rader"}`}
                actions={
                  <button
                    type="button"
                    onClick={() => setShowCheckout(false)}
                    className="text-foreground-muted hover:text-foreground text-sm lg:hidden"
                  >
                    Stäng
                  </button>
                }
              />
              {cartLines.length === 0 ? (
                <p className="px-5 py-8 text-sm text-foreground-muted text-center">
                  Tom — lägg till artiklar från katalogen.
                </p>
              ) : (
                <>
                  <ul className="divide-y divide-white/5">
                    {cartLines.map((l) => (
                      <li
                        key={l.product_id}
                        className="px-5 py-3 flex items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{l.name}</p>
                          <p className="text-[11px] text-foreground-muted font-mono">
                            {l.sku} · {l.quantity} × {formatPrice(l.unit_price)}
                          </p>
                        </div>
                        <p className="text-sm font-medium tabular-nums">
                          {formatPrice(l.quantity * l.unit_price)}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setCart((prev) => {
                              const next = { ...prev };
                              delete next[l.product_id];
                              return next;
                            })
                          }
                          aria-label={`Ta bort ${l.name}`}
                          className="text-foreground-muted hover:text-rose-400 text-sm"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-white/5 px-5 py-4 space-y-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm">Totalt (exkl. moms)</span>
                      <span className="text-lg font-semibold tabular-nums">
                        {formatPrice(cartTotal)}
                      </span>
                    </div>
                    <div>
                      <label
                        htmlFor="shipping"
                        className="block text-xs font-medium uppercase tracking-[0.12em] text-foreground-muted mb-1.5"
                      >
                        Leveransadress
                      </label>
                      <textarea
                        id="shipping"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        rows={3}
                        placeholder="Gata, postnr ort"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="notes"
                        className="block text-xs font-medium uppercase tracking-[0.12em] text-foreground-muted mb-1.5"
                      >
                        Meddelande till leverantören
                      </label>
                      <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="(valfritt)"
                        className={inputClass}
                      />
                    </div>
                    {orderError && (
                      <div className="rounded-md border border-red-400/30 bg-red-500/10 text-red-200 p-3 text-sm">
                        {orderError}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={placeOrder}
                      disabled={submittingOrder}
                      className="w-full rounded-md bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50"
                    >
                      {submittingOrder ? "Skickar…" : "Skicka order"}
                    </button>
                    <p className="text-[11px] text-center text-foreground-muted">
                      Order skapas som utkast. {membership.tenant.name}{" "}
                      bekräftar och skickar.
                    </p>
                  </div>
                </>
              )}
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M3 3h2l2.5 12.5a2 2 0 0 0 2 1.5h8.5a2 2 0 0 0 2-1.5L22 7H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </svg>
  );
}
