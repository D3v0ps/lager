"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { formatDate, formatPrice } from "@/lib/format";
import {
  deleteOrder,
  getOrder,
  orderTotal,
  updateOrderStatus,
  type OrderStatus,
  type SalesOrderWithRelations,
} from "@/lib/orders";

import { StatusBadge } from "../_components/status-badge";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Laddar…</p>}>
      <OrderDetail />
    </Suspense>
  );
}

function OrderDetail() {
  const params = useSearchParams();
  const id = params.get("id");
  const router = useRouter();
  const { tenant } = useParams<{ tenant: string }>();

  const [order, setOrder] = useState<SalesOrderWithRelations | null | undefined>(
    undefined,
  );
  const [error, setError] = useState<string | null>(null);
  const [pickedItems, setPickedItems] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const o = await getOrder(id);
      setOrder(o);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const total = useMemo(
    () => (order ? orderTotal(order.sales_order_items) : 0),
    [order],
  );

  if (!id) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4">
        Saknar order-id.
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
  if (order === undefined) {
    return <p className="text-sm text-neutral-500">Laddar…</p>;
  }
  if (order === null) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-semibold mb-2">Ordern hittades inte</h1>
        <Link
          href={`/${tenant}/orders/`}
          className="inline-block rounded-md bg-foreground text-background px-4 py-2 mt-4"
        >
          Tillbaka till ordrar
        </Link>
      </div>
    );
  }

  async function transition(status: OrderStatus, confirmText?: string) {
    if (!order) return;
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true);
    setError(null);
    try {
      await updateOrderStatus(order.id, status);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!order) return;
    if (
      !confirm(
        `Ta bort ordern ${order.reference ?? order.id.slice(0, 8)}? Detta går inte att ångra.`,
      )
    )
      return;
    setBusy(true);
    try {
      await deleteOrder(order.id);
      router.push(`/${tenant}/orders/`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  function togglePicked(itemId: string) {
    setPickedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  const status = order.status;
  const isPicking = status === "picking";
  const allPicked =
    isPicking &&
    order.sales_order_items.length > 0 &&
    order.sales_order_items.every((it) => pickedItems.has(it.id));

  const ref = order.reference ?? order.id.slice(0, 8);
  const customerName = order.customers?.name ?? "Okänd kund";
  const shipAddress =
    order.shipping_address?.trim() ||
    order.customers?.shipping_address?.trim() ||
    null;

  return (
    <div className="space-y-8">
      {/* Print-only styles: hide chrome, larger text. */}
      <style>{`
        @media print {
          header,
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .print-block {
            border: none !important;
            background: white !important;
          }
        }
      `}</style>

      <div className="no-print">
        <Link
          href={`/${tenant}/orders/`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← Tillbaka till ordrar
        </Link>
      </div>

      {/* Plocklista / packsedel-vy */}
      <div className="print-block rounded-lg border border-white/10 bg-background-elevated/40 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="text-sm text-neutral-500 uppercase tracking-wide">
              {isPicking ? "Plocklista" : "Order"}
            </div>
            <h1 className="text-3xl font-semibold mt-1 font-mono">{ref}</h1>
            <div className="mt-2 text-sm text-neutral-500">
              Skapad: {formatDate(order.created_at)}
              {order.shipped_at
                ? ` · Skickad: ${formatDate(order.shipped_at)}`
                : ""}
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <StatusBadge status={status} />
            <div className="text-right">
              <div className="text-xs text-neutral-500 uppercase tracking-wide">
                Kund
              </div>
              <div className="font-medium text-lg">{customerName}</div>
              {order.customers?.org_number && (
                <div className="text-xs text-neutral-500 font-mono">
                  Org-nr: {order.customers.org_number}
                </div>
              )}
            </div>
          </div>
        </div>

        {shipAddress && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-neutral-500 uppercase tracking-wide">
                Leveransadress
              </div>
              <div className="text-sm whitespace-pre-wrap mt-1">
                {shipAddress}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-white/15 text-left">
              <tr>
                {isPicking && (
                  <th className="py-2 pr-2 font-medium w-10">Plockad</th>
                )}
                <th className="py-2 pr-2 font-medium">SKU</th>
                <th className="py-2 pr-2 font-medium">Produkt</th>
                <th className="py-2 pr-2 font-medium text-right">Antal</th>
                <th className="py-2 pr-2 font-medium text-right">À-pris</th>
                <th className="py-2 pr-2 font-medium text-right">Summa</th>
              </tr>
            </thead>
            <tbody>
              {order.sales_order_items.map((it) => {
                const checked = pickedItems.has(it.id);
                return (
                  <tr
                    key={it.id}
                    className="border-b border-white/10"
                  >
                    {isPicking && (
                      <td className="py-3 pr-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePicked(it.id)}
                          aria-label={`Markera ${it.products?.name ?? "rad"} som plockad`}
                          className="h-5 w-5"
                        />
                      </td>
                    )}
                    <td className="py-3 pr-2 font-mono text-neutral-500">
                      {it.products?.sku ?? "—"}
                    </td>
                    <td
                      className={`py-3 pr-2 ${checked ? "line-through text-neutral-400" : ""}`}
                    >
                      {it.products?.name ?? "Okänd produkt"}
                    </td>
                    <td className="py-3 pr-2 text-right text-lg font-semibold">
                      {it.quantity}
                    </td>
                    <td className="py-3 pr-2 text-right">
                      {formatPrice(it.unit_price)}
                    </td>
                    <td className="py-3 pr-2 text-right font-medium">
                      {formatPrice(it.quantity * it.unit_price)}
                    </td>
                  </tr>
                );
              })}
              {order.sales_order_items.length === 0 && (
                <tr>
                  <td
                    colSpan={isPicking ? 6 : 5}
                    className="py-6 text-center text-neutral-500"
                  >
                    Inga rader på ordern.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-white/15">
                <td
                  colSpan={isPicking ? 5 : 4}
                  className="py-3 pr-2 text-right text-sm uppercase tracking-wide text-neutral-500"
                >
                  Totalt
                </td>
                <td className="py-3 pr-2 text-right text-lg font-semibold">
                  {formatPrice(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {order.notes && (
          <div className="mt-6 rounded-md border border-white/10 p-3 text-sm whitespace-pre-wrap">
            <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
              Anteckningar
            </div>
            {order.notes}
          </div>
        )}
      </div>

      {/* Status actions */}
      <section className="no-print rounded-lg border border-white/10 bg-background-elevated/40 p-5">
        <h2 className="text-lg font-semibold mb-3">Status</h2>
        <div className="flex flex-wrap gap-2">
          {status === "draft" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => transition("confirmed")}
              className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Bekräfta order
            </button>
          )}
          {status === "confirmed" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => transition("picking")}
              className="rounded-md bg-amber-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Börja plocka
            </button>
          )}
          {status === "picking" && (
            <button
              type="button"
              disabled={busy || !allPicked}
              onClick={() =>
                transition(
                  "shipped",
                  "Markera som skickad? Detta drar av lagersaldot för varje rad.",
                )
              }
              title={
                !allPicked
                  ? "Markera alla rader som plockade först"
                  : "Markera som skickad"
              }
              className="rounded-md bg-emerald-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Markera skickad
            </button>
          )}
          {status !== "shipped" && status !== "cancelled" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => transition("cancelled", "Avbryt ordern?")}
              className="rounded-md border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Avbryt order
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md border border-white/15 px-4 py-2 text-sm hover:bg-white/[0.05] ml-auto"
          >
            Skriv ut
          </button>
        </div>
        {status === "picking" && !allPicked && (
          <p className="text-xs text-neutral-500 mt-3">
            Bocka av alla rader i plocklistan ovan för att markera ordern som
            skickad.
          </p>
        )}
        {status === "shipped" && (
          <p className="text-sm text-neutral-500 mt-3">
            Lagersaldot uppdaterades automatiskt när ordern skickades.
          </p>
        )}
      </section>

      {status !== "shipped" && (
        <section className="no-print flex items-center justify-end border-t border-white/10 pt-6">
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="rounded-md border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50"
          >
            Ta bort order
          </button>
        </section>
      )}
    </div>
  );
}
