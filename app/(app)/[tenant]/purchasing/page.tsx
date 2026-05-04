"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  listPurchaseOrders,
  purchaseOrderTotal,
  type PurchaseOrderRow,
  type PurchaseOrderStatus,
} from "@/lib/suppliers";
import { formatDate, formatPrice } from "@/lib/format";

import StatusBadge from "./_components/status-badge";

type StatusFilter = PurchaseOrderStatus | "all";

const inputClass =
  "rounded-md border border-white/15 bg-background-elevated/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500";

export default function PurchasingPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const [orders, setOrders] = useState<PurchaseOrderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    listPurchaseOrders()
      .then(setOrders)
      .catch((e: Error) => setError(e.message));
  }, []);

  const visible = useMemo(() => {
    if (!orders) return [] as PurchaseOrderRow[];
    if (statusFilter === "all") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4">
        <h2 className="font-semibold mb-1">Kunde inte hämta inköpsorder</h2>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (orders === null) {
    return <p className="text-sm text-neutral-500">Laddar inköpsorder…</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-semibold mb-2">Inga inköpsorder än</h1>
        <p className="text-foreground-muted mb-6">
          Skapa din första inköpsorder för att beställa från en leverantör.
        </p>
        <Link
          href={`/${tenant}/purchasing/new/`}
          className="inline-block rounded-md bg-foreground text-background px-4 py-2"
        >
          + Ny inköpsorder
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Inköp</h1>
          <p className="text-sm text-foreground-muted">
            Översikt över dina inköpsorder.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label="Filtrera på status"
            className={inputClass}
          >
            <option value="all">Alla statusar</option>
            <option value="draft">Utkast</option>
            <option value="sent">Skickade</option>
            <option value="received">Mottagna</option>
            <option value="cancelled">Avbrutna</option>
          </select>
          <Link
            href={`/${tenant}/purchasing/new/`}
            className="rounded-md bg-foreground text-background px-3 py-2 text-sm font-medium"
          >
            + Ny inköpsorder
          </Link>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-12 rounded-lg border border-white/10 bg-background-elevated/40">
          <p className="text-foreground-muted">
            Inga inköpsorder matchar filtret.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-background-elevated/40">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.04] text-left">
              <tr>
                <th className="px-4 py-2 font-medium">PO-ref</th>
                <th className="px-4 py-2 font-medium">Leverantör</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">Antal rader</th>
                <th className="px-4 py-2 font-medium text-right">
                  Totalt värde
                </th>
                <th className="px-4 py-2 font-medium">Skapad</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => {
                const total = purchaseOrderTotal(
                  o.purchase_order_items ?? [],
                );
                return (
                  <tr
                    key={o.id}
                    className="border-t border-white/10 hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-2 font-mono">
                      <Link
                        href={`/${tenant}/purchasing/order/?id=${o.id}`}
                        className="text-amber-400 hover:underline"
                      >
                        {o.reference ?? o.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      {o.suppliers?.name ?? (
                        <span className="text-neutral-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      {o.purchase_order_items?.length ?? 0}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatPrice(total)}
                    </td>
                    <td className="px-4 py-2 text-neutral-500">
                      {formatDate(o.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
