"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  addTenantMember,
  deleteTenant,
  listAuthUsers,
  listTenantMembers,
  removeTenantMember,
  setTenantMemberRole,
  updateTenantName,
  type AuthUser,
} from "@/lib/admin";
import { getTenantBySlug } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import type { Tenant, TenantUser, TenantUserRole } from "@/lib/database.types";

const ROLES: TenantUserRole[] = ["admin", "owner", "member"];

export default function Page() {
  return (
    <Suspense
      fallback={<p className="text-sm text-neutral-500">Laddar…</p>}
    >
      <TenantAdmin />
    </Suspense>
  );
}

function TenantAdmin() {
  const router = useRouter();
  const params = useSearchParams();
  const slug = params.get("slug");

  const [tenant, setTenant] = useState<Tenant | null | undefined>(undefined);
  const [members, setMembers] = useState<
    (TenantUser & { email: string | null })[]
  >([]);
  const [allUsers, setAllUsers] = useState<AuthUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<TenantUserRole>("member");
  const [adding, setAdding] = useState(false);
  const [showRiskZone, setShowRiskZone] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(async () => {
    if (!slug) return;
    setError(null);
    try {
      const t = await getTenantBySlug(slug);
      setTenant(t);
      if (t) {
        setName(t.name);
        const [m, u] = await Promise.all([
          listTenantMembers(t.id),
          listAuthUsers(),
        ]);
        setMembers(m);
        setAllUsers(u);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [slug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!slug) {
    return <p className="text-sm text-red-500">Saknar slug.</p>;
  }
  if (tenant === undefined) {
    return <p className="text-sm text-neutral-500">Laddar…</p>;
  }
  if (tenant === null) {
    return (
      <div>
        <Link
          href="/admin/"
          className="text-sm text-neutral-500 hover:underline"
        >
          ← Tillbaka
        </Link>
        <p className="mt-4">Kund hittades inte.</p>
      </div>
    );
  }

  async function handleSaveName(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenant) return;
    setSavingName(true);
    try {
      await updateTenantName(tenant.id, name.trim());
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingName(false);
    }
  }

  async function handleDelete() {
    if (!tenant) return;
    if (
      !confirm(
        `Ta bort ${tenant.name}? Detta raderar ALLA produkter och rörelser för kunden permanent.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await deleteTenant(tenant.id);
      router.push("/admin/");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setDeleting(false);
    }
  }

  async function handleAddMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenant || !newUserId) return;
    setAdding(true);
    try {
      await addTenantMember(tenant.id, newUserId, newRole);
      setNewUserId("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!tenant) return;
    if (!confirm("Ta bort medlem?")) return;
    try {
      await removeTenantMember(tenant.id, userId);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleChangeRole(userId: string, role: TenantUserRole) {
    if (!tenant) return;
    try {
      await setTenantMemberRole(tenant.id, userId, role);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const memberIds = new Set(members.map((m) => m.user_id));
  const candidateUsers = allUsers.filter((u) => !memberIds.has(u.id));

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <Link
          href="/admin/"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
              clipRule="evenodd"
            />
          </svg>
          Tillbaka till kunder
        </Link>
        <div className="flex items-start justify-between mt-3 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <TenantAvatar name={tenant.name} />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight truncate">
                {tenant.name}
              </h1>
              <p className="text-sm text-neutral-500 font-mono mt-0.5 truncate">
                /{tenant.slug}/ · skapad {formatDate(tenant.created_at)}
              </p>
            </div>
          </div>
          <Link
            href={`/${tenant.slug}/`}
            className="inline-flex items-center gap-1.5 self-center rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap"
          >
            Öppna portal
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
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

      {/* Settings */}
      <Section
        title="Inställningar"
        description="Grundläggande information om kunden."
      >
        <form
          onSubmit={handleSaveName}
          className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4 max-w-xl"
        >
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
              required
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/15 dark:focus:ring-white/20 focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={savingName || name.trim() === tenant.name}
            className="inline-flex items-center gap-2 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {savingName && (
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
            {savingName ? "Sparar…" : "Spara"}
          </button>
        </form>
      </Section>

      {/* Members */}
      <Section
        title="Medlemmar"
        description={
          members.length === 0
            ? "Lägg till medlemmar som ska ha tillgång till portalen."
            : `${members.length} ${members.length === 1 ? "medlem" : "medlemmar"} har tillgång till portalen.`
        }
      >
        <form
          onSubmit={handleAddMember}
          className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 mb-4 grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-4 items-end"
        >
          <div>
            <label
              htmlFor="user-search"
              className="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300"
            >
              Användare
            </label>
            <UserCombobox
              users={candidateUsers}
              value={newUserId}
              onChange={setNewUserId}
              inputId="user-search"
            />
            <p className="text-xs text-neutral-500 mt-1.5">
              Skapa nya konton i Supabase Dashboard → Authentication → Users.
            </p>
          </div>
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300"
            >
              Roll
            </label>
            <select
              id="role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as TenantUserRole)}
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/15 dark:focus:ring-white/20 focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={adding || !newUserId}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {adding && (
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
            {adding ? "Lägger till…" : "Lägg till"}
          </button>
        </form>

        {members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-white/40 dark:bg-neutral-900/40 px-4 py-8 text-center text-sm text-neutral-500">
            Inga medlemmar ännu.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800/40 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">E-post</th>
                  <th className="px-4 py-2.5 font-medium">Roll</th>
                  <th className="px-4 py-2.5 font-medium hidden sm:table-cell">
                    Tillagd
                  </th>
                  <th className="px-4 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr
                    key={m.user_id}
                    className="border-t border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      {m.email ? (
                        <span className="text-neutral-900 dark:text-neutral-100">
                          {m.email}
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-neutral-500">
                          {m.user_id}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={m.role}
                        onChange={(e) =>
                          handleChangeRole(
                            m.user_id,
                            e.target.value as TenantUserRole,
                          )
                        }
                        className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/15 dark:focus:ring-white/20 transition-colors"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">
                      {formatDate(m.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.user_id)}
                        className="text-red-600 dark:text-red-400 hover:underline"
                      >
                        Ta bort
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Risk zone */}
      <Section
        title="Riskzon"
        description="Permanenta åtgärder. Visas dolt för att undvika misstag."
        accent="danger"
      >
        <button
          type="button"
          onClick={() => setShowRiskZone((v) => !v)}
          aria-expanded={showRiskZone}
          className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 transition-transform duration-200 ${
              showRiskZone ? "rotate-90" : ""
            }`}
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
              clipRule="evenodd"
            />
          </svg>
          {showRiskZone ? "Dölj avancerat" : "Visa avancerat"}
        </button>

        <div
          className={`grid transition-all duration-300 ease-out mt-4 ${
            showRiskZone
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/30 p-5 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                  Ta bort hela kunden
                </h3>
                <p className="text-sm text-red-700/90 dark:text-red-200/80 mt-1">
                  Raderar permanent ALLA produkter, rörelser, ordrar och
                  medlemskap för{" "}
                  <span className="font-medium">{tenant.name}</span>. Detta går
                  inte att ångra.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-md border border-red-300 dark:border-red-800 bg-white dark:bg-red-950/40 text-red-700 dark:text-red-300 px-3 py-2 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors"
              >
                {deleting && (
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
                {deleting ? "Tar bort…" : "Ta bort hela kunden"}
              </button>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  accent,
  children,
}: {
  title: string;
  description?: string;
  accent?: "danger";
  children: React.ReactNode;
}) {
  const isDanger = accent === "danger";
  return (
    <section
      className={`pt-6 border-t ${
        isDanger
          ? "border-red-200 dark:border-red-900/60"
          : "border-neutral-200 dark:border-neutral-800"
      }`}
    >
      <div className="mb-4">
        <h2
          className={`text-lg font-semibold tracking-tight ${
            isDanger ? "text-red-700 dark:text-red-300" : ""
          }`}
        >
          {title}
        </h2>
        {description && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function TenantAvatar({ name }: { name: string }) {
  const initial = (name?.trim().charAt(0) || "?").toUpperCase();
  const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const palettes = [
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
    "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
    "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  ];
  const palette = palettes[sum % palettes.length];
  return (
    <div
      aria-hidden="true"
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-semibold ${palette}`}
    >
      {initial}
    </div>
  );
}

/**
 * Search-as-you-type combobox for picking a user. Plain HTML, no library.
 */
function UserCombobox({
  users,
  value,
  onChange,
  inputId,
}: {
  users: AuthUser[];
  value: string;
  onChange: (id: string) => void;
  inputId: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync the visible text to the selected user's email when value changes externally
  // (e.g. cleared after successful submit).
  useEffect(() => {
    if (!value) {
      setQuery("");
      return;
    }
    const u = users.find((u) => u.id === value);
    if (u) setQuery(u.email);
  }, [value, users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users.slice(0, 8);
    return users
      .filter((u) => u.email.toLowerCase().includes(q))
      .slice(0, 8);
  }, [users, query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function pick(id: string, email: string) {
    onChange(id);
    setQuery(email);
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      if (open && filtered[highlight]) {
        e.preventDefault();
        pick(filtered[highlight].id, filtered[highlight].email);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const noUsers = users.length === 0;

  return (
    <div ref={containerRef} className="relative">
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
          id={inputId}
          type="text"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
            // If the user types something different, clear the selection
            if (value) onChange("");
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={noUsers ? "Inga användare tillgängliga" : "Sök på e-post…"}
          disabled={noUsers}
          className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 pl-9 pr-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/15 dark:focus:ring-white/20 focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors disabled:opacity-60"
        />
      </div>
      {open && !noUsers && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-auto rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg shadow-neutral-900/10 dark:shadow-black/40"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2.5 text-sm text-neutral-500">
              Ingen träff.
            </div>
          ) : (
            filtered.map((u, i) => (
              <button
                key={u.id}
                type="button"
                role="option"
                aria-selected={value === u.id}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(u.id, u.email)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  i === highlight
                    ? "bg-neutral-100 dark:bg-neutral-800"
                    : "hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                }`}
              >
                <span className="truncate">{u.email}</span>
                {value === u.id && (
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4 shrink-0 text-emerald-500"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.296a1 1 0 0 1 0 1.408l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 1 1 1.414-1.414L8.5 12.086l6.793-6.79a1 1 0 0 1 1.411 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
