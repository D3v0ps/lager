"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { formatDate, formatPrice } from "@/lib/format";
import {
  deletePurchaseOrder,
  getPurchaseOrder,
  markCancelled,
  markReceived,
  markSent,
  purchaseOrderTotal,
  type PurchaseOrderDetail,
} from "@/lib/suppliers";

import StatusBadge from "../_components/status-badge";

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

  const [order, setOrder] = useState<PurchaseOrderDetail | null | undefined>(
    undefined,
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const o = await getPurchaseOrder(id);
      setOrder(o);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!id) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4">
        Saknar order-id.
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4">
        <h2 className="font-semibold mb-1">Kunde inte hämta inköpsorder</h2>
        <p className="text-sm">{error}</p>
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
          href={`/${tenant}/purchasing/`}
          className="inline-block rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 mt-4"
        >
          Tillbaka till listan
        </Link>
      </div>
    );
  }

  const items = order.purchase_order_items ?? [];
  const total = purchaseOrderTotal(items);

  async function runAction(fn: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await fn();
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
        `Ta bort inköpsordern ${order.reference ?? order.id.slice(0, 8)}? Mottagna lagerrörelser tas inte bort.`,
      )
    )
      return;
    setBusy(true);
    try {
      await deletePurchaseOrder(order.id);
      router.push(`/${tenant}/purchasing/`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${tenant}/purchasing/`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← Tillbaka
        </Link>
        <div className="flex items-start justify-between gap-4 mt-2 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold font-mono">
              {order.reference ?? order.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Skapad {formatDate(order.created_at)}
              {order.received_at
                ? ` · Mottagen ${formatDate(order.received_at)}`
                : ""}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat
          label="Leverantör"
          value={order.suppliers?.name ?? "—"}
        />
        <Stat label="Antal rader" value={String(items.length)} />
        <Stat label="Totalt värde" value={formatPrice(total)} />
      </div>

      {order.notes && (
        <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-sm whitespace-pre-wrap">
          {order.notes}
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Rader</h2>
        {items.length === 0 ? (
          <p className="text-sm text-neutral-500">Inga rader.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">SKU</th>
                  <th className="px-4 py-2 font-medium">Produkt</th>
                  <th className="px-4 py-2 font-medium text-right">Antal</th>
                  <th className="px-4 py-2 font-medium text-right">Á-pris</th>
                  <th className="px-4 py-2 font-medium text-right">Summa</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const sub = it.quantity * Number(it.unit_cost);
                  return (
                    <tr
                      key={it.id}
                      className="border-t border-neutral-200 dark:border-neutral-800"
                    >
                      <td className="px-4 py-2 font-mono">
                        {it.products?.sku ?? "—"}
                      </td>
                      <td className="px-4 py-2">
                        {it.products ? (
                          <Link
                            href={`/${tenant}/product/?id=${it.products.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {it.products.name}
                          </Link>
                        ) : (
                          <span className="text-neutral-500 italic">
                            (borttagen)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">{it.quantity}</td>
                      <td className="px-4 py-2 text-right">
                        {formatPrice(Number(it.unit_cost))}
                      </td>
                      <td className="px-4 py-2 text-right font-medium">
                        {formatPrice(sub)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
                  <td colSpan={4} className="px-4 py-2 text-right font-medium">
                    Totalt
                  </td>
                  <td className="px-4 py-2 text-right font-semibold">
                    {formatPrice(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-sm">
          {error}
        </div>
      )}

      <section className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 dark:border-neutral-800 pt-6">
        <div className="flex flex-wrap gap-2">
          {order.status === "draft" && (
            <button
              type="button"
              disabled={busy || items.length === 0}
              onClick={() => runAction(() => markSent(order.id))}
              className="rounded-md bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm font-medium disabled:opacity-50"
            >
              Skicka
            </button>
          )}
          {(order.status === "draft" || order.status === "sent") && (
            <button
              type="button"
              disabled={busy || items.length === 0}
              onClick={() => {
                if (
                  !confirm(
                    "Markera ordern som mottagen? Lagersaldot uppdateras automatiskt och kan inte ångras.",
                  )
                )
                  return;
                void runAction(() => markReceived(order.id));
              }}
              className="rounded-md bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm font-medium disabled:opacity-50"
            >
              Markera mottagen
            </button>
          )}
          {(order.status === "draft" || order.status === "sent") && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (!confirm("Avbryt inköpsorder?")) return;
                void runAction(() => markCancelled(order.id));
              }}
              className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
            >
              Avbryt order
            </button>
          )}
        </div>
        {order.status !== "received" && (
          <button
            type="button"
            disabled={busy}
            onClick={handleDelete}
            className="rounded-md border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50"
          >
            Ta bort
          </button>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <div className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="text-lg font-medium mt-1">{value}</div>
    </div>
  );
}
