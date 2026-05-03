"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createTenant, listAllTenants, type TenantWithCount } from "@/lib/admin";
import { formatDate } from "@/lib/format";

export default function AdminHomePage() {
  const [tenants, setTenants] = useState<TenantWithCount[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");

  async function load() {
    setError(null);
    try {
      const data = await listAllTenants();
      setTenants(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await createTenant(slug.trim(), name.trim());
      setSlug("");
      setName("");
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Kunder</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Skapa och hantera kund-portaler.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-3 py-1.5 text-sm"
        >
          {showForm ? "Avbryt" : "+ Ny kund"}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="slug" className="block text-sm font-medium mb-1">
                Slug (URL)
              </label>
              <input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                pattern="^[a-z0-9][a-z0-9-]{0,62}$"
                placeholder="hotchilly"
                required
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm font-mono"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Endast a–z, 0–9 och bindestreck. URL blir /<i>{slug || "slug"}</i>/
              </p>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Företagsnamn
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Hot Chilly AB"
                required
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {creating ? "Skapar…" : "Skapa kund"}
          </button>
        </form>
      )}

      {tenants === null ? (
        <p className="text-sm text-neutral-500">Laddar…</p>
      ) : tenants.length === 0 ? (
        <p className="text-sm text-neutral-500">Inga kunder än.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Slug</th>
                <th className="px-4 py-2 font-medium">Namn</th>
                <th className="px-4 py-2 font-medium text-right">Medlemmar</th>
                <th className="px-4 py-2 font-medium">Skapad</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-neutral-200 dark:border-neutral-800"
                >
                  <td className="px-4 py-2 font-mono">{t.slug}</td>
                  <td className="px-4 py-2">{t.name}</td>
                  <td className="px-4 py-2 text-right">{t.member_count}</td>
                  <td className="px-4 py-2 text-neutral-500">
                    {formatDate(t.created_at)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/tenant/?slug=${t.slug}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Hantera
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs text-neutral-500">
        <p>
          <strong>Notera:</strong> Användarkonton skapas i Supabase Dashboard →
          Authentication → Users. Här lägger du till befintliga konton som
          medlemmar i kunder.
        </p>
      </div>
    </div>
  );
}
