"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { createTenant, listAllTenants, type TenantWithCount } from "@/lib/admin";
import { formatDate } from "@/lib/format";

export default function AdminHomePage() {
  const [tenants, setTenants] = useState<TenantWithCount[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");

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

  const stats = useMemo(() => {
    const list = tenants ?? [];
    return {
      tenants: list.length,
      members: list.reduce((sum, t) => sum + (t.member_count ?? 0), 0),
    };
  }, [tenants]);

  const filtered = useMemo(() => {
    if (!tenants) return null;
    const q = query.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q),
    );
  }, [tenants, query]);

  return (
    <div className="space-y-8">
      {/* Heading + create button */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Kunder</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Skapa och hantera kund-portaler.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          aria-expanded={showForm}
          className="inline-flex items-center gap-1.5 self-start rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-3.5 py-2 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
        >
          {showForm ? (
            <>
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.22 5.22a.75.75 0 0 1 1.06 0L10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
              Avbryt
            </>
          ) : (
            <>
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              Ny kund
            </>
          )}
        </button>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard
          label="Kunder"
          value={tenants === null ? "—" : String(stats.tenants)}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                d="M3 21V8l9-5 9 5v13"
                className="stroke-current"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M9 21v-7h6v7"
                className="stroke-current"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
        <StatCard
          label="Medlemmar totalt"
          value={tenants === null ? "—" : String(stats.members)}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <circle
                cx="9"
                cy="9"
                r="3.5"
                className="stroke-current"
                strokeWidth="1.6"
              />
              <path
                d="M3 19a6 6 0 0 1 12 0"
                className="stroke-current"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M16 5a3 3 0 1 1 0 6"
                className="stroke-current"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M17 19a6 6 0 0 0-3-5.2"
                className="stroke-current"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          }
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-800 dark:text-red-200"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5 shrink-0 text-red-500 dark:text-red-400"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Slide-in create form */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          showForm
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <form
            onSubmit={handleCreate}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4"
          >
            <div>
              <h2 className="text-base font-semibold">Skapa ny kund</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Kunden får en egen portal under <span className="font-mono">/slug/</span>.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300"
                >
                  Slug (URL)
                </label>
                <input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  pattern="^[a-z0-9][a-z0-9-]{0,62}$"
                  placeholder="dittforetag"
                  required
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900/15 dark:focus:ring-white/20 focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
                />
                <p className="text-xs text-neutral-500 mt-1.5">
                  Endast a–z, 0–9 och bindestreck. URL blir{" "}
                  <span className="font-mono">/{slug || "slug"}/</span>
                </p>
              </div>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300"
                >
                  Företagsnamn
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ditt företag AB"
                  required
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/15 dark:focus:ring-white/20 focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-60 transition-colors"
              >
                {creating && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4 motion-safe:animate-spin"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeOpacity="0.25"
                      strokeWidth="3"
                    />
                    <path
                      d="M21 12a9 9 0 0 0-9-9"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {creating ? "Skapar…" : "Skapa kund"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                Avbryt
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Search bar (only shown when there are tenants) */}
      {tenants && tenants.length > 0 && (
        <div className="relative">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 3.473 9.776l3.376 3.375a.75.75 0 1 0 1.06-1.06l-3.375-3.376A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök kund…"
            className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 pl-9 pr-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/15 dark:focus:ring-white/20 focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
            aria-label="Sök kund"
          />
        </div>
      )}

      {/* List */}
      {tenants === null ? (
        <p className="text-sm text-neutral-500">Laddar…</p>
      ) : tenants.length === 0 ? (
        <EmptyState onCreate={() => setShowForm(true)} />
      ) : filtered && filtered.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Ingen kund matchade <span className="font-medium">{query}</span>.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/40 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Kund</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">
                  Slug
                </th>
                <th className="px-4 py-2.5 font-medium text-right">
                  Medlemmar
                </th>
                <th className="px-4 py-2.5 font-medium hidden sm:table-cell">
                  Skapad
                </th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {(filtered ?? []).map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={t.name} />
                      <div className="min-w-0">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {t.name}
                        </div>
                        <div className="md:hidden text-xs text-neutral-500 font-mono truncate">
                          /{t.slug}/
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 font-mono hidden md:table-cell">
                    /{t.slug}/
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {t.member_count}
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">
                    {formatDate(t.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-3">
                      <Link
                        href={`/${t.slug}/`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Öppna portal →
                      </Link>
                      <Link
                        href={`/admin/tenant/?slug=${t.slug}`}
                        className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                      >
                        Hantera
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 p-3.5 text-xs text-neutral-600 dark:text-neutral-400">
        <p>
          <strong className="text-neutral-700 dark:text-neutral-300">
            Notera:
          </strong>{" "}
          Användarkonton skapas i Supabase Dashboard → Authentication → Users.
          Här lägger du till befintliga konton som medlemmar i kunder.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
        {icon}
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">
          {label}
        </div>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

const AVATAR_PALETTES = [
  "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
];

function Avatar({ name }: { name: string }) {
  const initial = (name?.trim().charAt(0) || "?").toUpperCase();
  // Stable color from char codes
  const sum = name
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const palette = AVATAR_PALETTES[sum % AVATAR_PALETTES.length];
  return (
    <div
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${palette}`}
    >
      {initial}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-white/40 dark:bg-neutral-900/40 p-10 text-center">
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mx-auto h-24 w-24"
        aria-hidden="true"
      >
        <rect
          x="20"
          y="35"
          width="80"
          height="60"
          rx="8"
          className="fill-neutral-100 dark:fill-neutral-800 stroke-neutral-300 dark:stroke-neutral-700"
          strokeWidth="2"
        />
        <path
          d="M20 50h80"
          className="stroke-neutral-300 dark:stroke-neutral-700"
          strokeWidth="2"
        />
        <circle
          cx="30"
          cy="42.5"
          r="2"
          className="fill-neutral-300 dark:fill-neutral-600"
        />
        <circle
          cx="38"
          cy="42.5"
          r="2"
          className="fill-neutral-300 dark:fill-neutral-600"
        />
        <path
          d="M50 70h20m-10-10v20"
          className="stroke-neutral-400 dark:stroke-neutral-500"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <h2 className="mt-5 text-base font-semibold">Inga kunder än</h2>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
        Skapa din första kund-portal för att komma igång. Du kan bjuda in
        medlemmar i nästa steg.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
        </svg>
        Skapa första kunden
      </button>
    </div>
  );
}
