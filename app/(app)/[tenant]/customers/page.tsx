"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  listCustomersWithOrderCount,
  type CustomerWithOrderCount,
} from "@/lib/orders";
import { formatDate } from "@/lib/format";

import { CustomerForm } from "./_components/customer-form";

const inputClass =
  "rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500";

export default function CustomersPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const [customers, setCustomers] = useState<CustomerWithOrderCount[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);

  function reload() {
    listCustomersWithOrderCount()
      .then(setCustomers)
      .catch((e: Error) => setError(e.message));
  }

  useEffect(() => {
    reload();
  }, []);

  const visible = useMemo(() => {
    if (!customers) return [] as CustomerWithOrderCount[];
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        (c.org_number?.toLowerCase().includes(q) ?? false),
    );
  }, [customers, search]);

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4">
        <h2 className="font-semibold mb-1">Kunde inte hämta kunder</h2>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (customers === null) {
    return <p className="text-sm text-neutral-500">Laddar…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kunder</h1>
        <button
          type="button"
          onClick={() => setShowNewForm((v) => !v)}
          className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-3 py-1.5 text-sm font-medium"
        >
          {showNewForm ? "Stäng" : "+ Ny kund"}
        </button>
      </div>

      {showNewForm && (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h2 className="font-semibold mb-3">Ny kund</h2>
          <CustomerForm
            submitLabel="Skapa kund"
            onCreated={() => {
              setShowNewForm(false);
              reload();
            }}
          />
        </div>
      )}

      {customers.length === 0 ? (
        <div className="text-center py-16 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <h2 className="text-xl font-semibold mb-2">Inga kunder än</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Lägg till din första kund för att komma igång.
          </p>
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium"
          >
            + Ny kund
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sök namn, e-post eller org-nr"
              aria-label="Sök kunder"
              className={`${inputClass} flex-1`}
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Namn</th>
                  <th className="px-4 py-2 font-medium">E-post</th>
                  <th className="px-4 py-2 font-medium">Telefon</th>
                  <th className="px-4 py-2 font-medium">Org-nr</th>
                  <th className="px-4 py-2 font-medium text-right">Ordrar</th>
                  <th className="px-4 py-2 font-medium">Skapad</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                  >
                    <td className="px-4 py-2">
                      <Link
                        href={`/${tenant}/customers/edit/?id=${c.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-neutral-500">
                      {c.email ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-neutral-500">
                      {c.phone ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-neutral-500 font-mono">
                      {c.org_number ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {c.order_count}
                    </td>
                    <td className="px-4 py-2 text-neutral-500">
                      {formatDate(c.created_at)}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-neutral-500"
                    >
                      Inga kunder matchar sökningen.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
