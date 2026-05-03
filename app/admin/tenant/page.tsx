"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

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
    <Suspense fallback={<p className="text-sm text-neutral-500">Laddar…</p>}>
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
        <Link href="/admin/" className="text-sm text-neutral-500 hover:underline">
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
    try {
      await deleteTenant(tenant.id);
      router.push("/admin/");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
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
    <div className="space-y-8">
      <div>
        <Link href="/admin/" className="text-sm text-neutral-500 hover:underline">
          ← Tillbaka till kunder
        </Link>
        <div className="flex items-start justify-between mt-2 gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{tenant.name}</h1>
            <p className="text-sm text-neutral-500 font-mono mt-1">
              /{tenant.slug}/ · skapad {formatDate(tenant.created_at)}
            </p>
          </div>
          <Link
            href={`/${tenant.slug}/`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
          >
            Öppna portal →
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-sm">
          {error}
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Inställningar</h2>
        <form
          onSubmit={handleSaveName}
          className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-3 max-w-xl"
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Företagsnamn
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={savingName || name.trim() === tenant.name}
            className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {savingName ? "Sparar…" : "Spara"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Medlemmar</h2>

        <form
          onSubmit={handleAddMember}
          className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 mb-4 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end"
        >
          <div>
            <label htmlFor="user" className="block text-sm font-medium mb-1">
              Användare
            </label>
            <select
              id="user"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              required
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
            >
              <option value="">Välj användare…</option>
              {candidateUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 mt-1">
              Skapa nya konton i Supabase Dashboard → Authentication → Users.
            </p>
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1">
              Roll
            </label>
            <select
              id="role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as TenantUserRole)}
              className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
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
            className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {adding ? "Lägger till…" : "Lägg till"}
          </button>
        </form>

        {members.length === 0 ? (
          <p className="text-sm text-neutral-500">Inga medlemmar ännu.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">E-post</th>
                  <th className="px-4 py-2 font-medium">Roll</th>
                  <th className="px-4 py-2 font-medium">Tillagd</th>
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr
                    key={m.user_id}
                    className="border-t border-neutral-200 dark:border-neutral-800"
                  >
                    <td className="px-4 py-2">
                      {m.email ?? (
                        <span className="font-mono text-xs text-neutral-500">
                          {m.user_id}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={m.role}
                        onChange={(e) =>
                          handleChangeRole(
                            m.user_id,
                            e.target.value as TenantUserRole,
                          )
                        }
                        className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-sm"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-neutral-500">
                      {formatDate(m.created_at)}
                    </td>
                    <td className="px-4 py-2 text-right">
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
      </section>

      <section className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
        <h2 className="text-lg font-semibold mb-3 text-red-700 dark:text-red-400">
          Riskzon
        </h2>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-md border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-950/40"
        >
          Ta bort hela kunden
        </button>
      </section>
    </div>
  );
}
