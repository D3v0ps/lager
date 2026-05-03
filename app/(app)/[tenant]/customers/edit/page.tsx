"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { formatDate, formatPrice } from "@/lib/format";
import {
  deleteCustomer,
  getCustomer,
  listOrdersForCustomer,
  orderTotal,
  statusBadgeClasses,
  statusLabel,
  type Customer,
  type SalesOrderListRow,
} from "@/lib/orders";

import { CustomerForm } from "../_components/customer-form";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Laddar…</p>}>
      <EditCustomer />
    </Suspense>
  );
}

function EditCustomer() {
  const params = useSearchParams();
  const id = params.get("id");
  const router = useRouter();
  const { tenant } = useParams<{ tenant: string }>();

  const [customer, setCustomer] = useState<Customer | null | undefined>(
    undefined,
  );
  const [orders, setOrders] = useState<SalesOrderListRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [c, o] = await Promise.all([
        getCustomer(id),
        listOrdersForCustomer(id),
      ]);
      setCustomer(c);
      setOrders(o);
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
        Saknar kund-id.
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
  if (customer === undefined) {
    return <p className="text-sm text-neutral-500">Laddar…</p>;
  }
  if (customer === null) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-semibold mb-2">Kunden hittades inte</h1>
        <Link
          href={`/${tenant}/customers/`}
          className="inline-block rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 mt-4"
        >
          Tillbaka till kunder
        </Link>
      </div>
    );
  }

  async function handleDelete() {
    if (!customer) return;
    if (orders.length > 0) {
      // Surface inline instead of using window.alert (which is unstyled
      // and breaks the demo's polish).
      setError(
        `Kunden har ${orders.length} order(s) — ta bort eller koppla bort dessa först.`,
      );
      return;
    }
    if (!confirm(`Ta bort ${customer.name}?`)) return;
    try {
      await deleteCustomer(customer.id);
      router.push(`/${tenant}/customers/`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/${tenant}/customers/`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← Tillbaka till kunder
        </Link>
        <h1 className="text-2xl font-semibold mt-2">{customer.name}</h1>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Uppgifter</h2>
        <CustomerForm
          customer={customer}
          submitLabel="Spara ändringar"
          onUpdated={() => reload()}
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Ordrar</h2>
          <Link
            href={`/${tenant}/orders/new/?customer=${customer.id}`}
            className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            + Ny order för denna kund
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Inga ordrar registrerade för denna kund ännu.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Ref</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium text-right">Rader</th>
                  <th className="px-4 py-2 font-medium text-right">Totalt</th>
                  <th className="px-4 py-2 font-medium">Skapad</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
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
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClasses(o.status)}`}
                      >
                        {statusLabel(o.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {o.sales_order_items.length}
                    </td>
                    <td className="px-4 py-2 text-right">
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
      </section>

      <section className="flex items-center justify-end border-t border-neutral-200 dark:border-neutral-800 pt-6">
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-md border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-950/40"
        >
          Ta bort kund
        </button>
      </section>
    </div>
  );
}
