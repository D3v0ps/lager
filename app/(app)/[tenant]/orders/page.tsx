"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { formatDate, formatPrice } from "@/lib/format";
import {
  ORDER_STATUS_VALUES,
  listOrders,
  orderTotal,
  statusLabel,
  type OrderStatus,
  type SalesOrderListRow,
} from "@/lib/orders";

import { StatusBadge } from "./_components/status-badge";

const inputClass =
  "rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500";

type StatusFilter = OrderStatus | "all";

export default function OrdersPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const [orders, setOrders] = useState<SalesOrderListRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    listOrders()
      .then(setOrders)
      .catch((e: Error) => setError(e.message));
  }, []);

  const visible = useMemo(() => {
    if (!orders) return [] as SalesOrderListRow[];
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (q) {
        const inRef = (o.reference ?? "").toLowerCase().includes(q);
        const inCust = (o.customers?.name ?? "").toLowerCase().includes(q);
        if (!inRef && !inCust) return false;
      }
      return true;
    });
  }, [orders, statusFilter, search]);

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4">
        <h2 className="font-semibold mb-1">Kunde inte hämta ordrar</h2>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (orders === null) {
    return <p className="text-sm text-neutral-500">Laddar…</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-semibold mb-2">Inga ordrar än</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Skapa din första kundorder för att komma igång.
        </p>
        <Link
          href={`/${tenant}/orders/new/`}
          className="inline-block rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2"
        >
          + Ny order
        </Link>
      </div>
    );
  }

  const countLabel =
    statusFilter !== "all" || search.trim() !== ""
      ? `${visible.length} av ${orders.length} ordrar`
      : `${orders.length} st`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ordrar</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">{countLabel}</span>
          <Link
            href={`/${tenant}/orders/new/`}
            className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-3 py-1.5 text-sm font-medium"
          >
            + Ny order
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök ref eller kund"
          aria-label="Sök ordrar"
          className={`${inputClass} sm:flex-1`}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          aria-label="Filtrera på status"
          className={inputClass}
        >
          <option value="all">Alla statusar</option>
          {ORDER_STATUS_VALUES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <p className="text-neutral-600 dark:text-neutral-400">
            Inga ordrar matchar dina filter.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Order-ref</th>
                <th className="px-4 py-2 font-medium">Kund</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">Rader</th>
                <th className="px-4 py-2 font-medium text-right">Totalt</th>
                <th className="px-4 py-2 font-medium">Skapad</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => (
                <tr
                  key={o.id}
                  className="border-t border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                >
                  <td className="px-4 py-2 font-mono">
                    <Link
                      href={`/${tenant}/orders/order/?id=${o.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {o.reference ?? o.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    {o.customers?.name ?? (
                      <span className="text-neutral-400">— Saknar kund —</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-2 text-right">
                    {o.sales_order_items.length}
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatPrice(orderTotal(o.sales_order_items))}
                  </td>
                  <td className="px-4 py-2 text-neutral-500">
                    {formatDate(o.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
