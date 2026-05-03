"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  getMyRoleInTenant,
  inviteMember,
  listPendingInvitations,
  listTeam,
  removeMember,
  revokeInvitation,
  setMemberRole,
  type PendingInvitation,
  type TeamMember,
} from "@/lib/team";
import { useTenant } from "@/lib/tenant-context";
import { formatDate } from "@/lib/format";
import type { TenantUserRole } from "@/lib/database.types";

const ASSIGNABLE_ROLES: ("owner" | "member")[] = ["owner", "member"];

export default function TeamPage() {
  const { tenant: slug } = useParams<{ tenant: string }>();
  const tenant = useTenant();

  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [myRole, setMyRole] = useState<TenantUserRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "member">("member");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!tenant) return;
    setError(null);
    try {
      const [m, inv, role] = await Promise.all([
        listTeam(tenant.id),
        listPendingInvitations(tenant.id),
        getMyRoleInTenant(tenant.id),
      ]);
      setMembers(m);
      setInvitations(inv);
      setMyRole(role);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [tenant]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!tenant) {
    return <p className="text-sm text-neutral-500">Laddar…</p>;
  }

  const canManage = myRole === "owner" || myRole === "admin";

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await inviteMember(slug, inviteEmail.trim(), inviteRole);
      setInfo(
        `Inbjudan skickad till ${inviteEmail}. De får ett mejl med en magisk länk för att logga in.`,
      );
      setInviteEmail("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleRoleChange(userId: string, role: TenantUserRole) {
    if (!tenant) return;
    setError(null);
    try {
      await setMemberRole(tenant.id, userId, role);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleRemove(userId: string, email: string) {
    if (!tenant) return;
    if (!confirm(`Ta bort ${email} från ${tenant.name}?`)) return;
    try {
      await removeMember(tenant.id, userId);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleRevoke(invId: string, email: string) {
    if (!confirm(`Återkalla inbjudan till ${email}?`)) return;
    try {
      await revokeInvitation(invId);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Team</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Hantera vem som har tillgång till {tenant.name}.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-sm">
          {error}
        </div>
      )}
      {info && (
        <div className="rounded-md border border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800 p-3 text-sm">
          {info}
        </div>
      )}

      {canManage && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Bjud in ny medlem</h2>
          <form
            onSubmit={handleInvite}
            className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1"
              >
                E-post
              </label>
              <input
                id="email"
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="lager@hotchilly.se"
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-1">
                Roll
              </label>
              <select
                id="role"
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as "owner" | "member")
                }
                className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
              >
                <option value="member">member</option>
                <option value="owner">owner</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {busy ? "Skickar…" : "Bjud in"}
            </button>
          </form>
          <p className="text-xs text-neutral-500 mt-2">
            Inbjudna får en magisk länk. När de klickar och loggar in kopplas
            de automatiskt till {tenant.name}.
          </p>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">
          Medlemmar{" "}
          <span className="text-sm font-normal text-neutral-500">
            ({members?.length ?? 0})
          </span>
        </h2>
        {members === null ? (
          <p className="text-sm text-neutral-500">Laddar…</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">E-post</th>
                  <th className="px-4 py-2 font-medium">Roll</th>
                  <th className="px-4 py-2 font-medium">Tillagd</th>
                  {canManage && <th className="px-4 py-2 font-medium" />}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr
                    key={m.user_id}
                    className="border-t border-neutral-200 dark:border-neutral-800"
                  >
                    <td className="px-4 py-2">{m.email}</td>
                    <td className="px-4 py-2">
                      {canManage && m.role !== "admin" ? (
                        <select
                          value={m.role}
                          onChange={(e) =>
                            handleRoleChange(
                              m.user_id,
                              e.target.value as TenantUserRole,
                            )
                          }
                          className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-sm"
                        >
                          {ASSIGNABLE_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm">{m.role}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-neutral-500">
                      {formatDate(m.created_at)}
                    </td>
                    {canManage && (
                      <td className="px-4 py-2 text-right">
                        {m.role !== "admin" && (
                          <button
                            type="button"
                            onClick={() => handleRemove(m.user_id, m.email)}
                            className="text-red-600 dark:text-red-400 hover:underline"
                          >
                            Ta bort
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {invitations.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Pågående inbjudningar{" "}
            <span className="text-sm font-normal text-neutral-500">
              ({invitations.length})
            </span>
          </h2>
          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">E-post</th>
                  <th className="px-4 py-2 font-medium">Roll</th>
                  <th className="px-4 py-2 font-medium">Skickad</th>
                  {canManage && <th className="px-4 py-2 font-medium" />}
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-t border-neutral-200 dark:border-neutral-800"
                  >
                    <td className="px-4 py-2">{inv.email}</td>
                    <td className="px-4 py-2">{inv.role}</td>
                    <td className="px-4 py-2 text-neutral-500">
                      {formatDate(inv.created_at)}
                    </td>
                    {canManage && (
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRevoke(inv.id, inv.email)}
                          className="text-red-600 dark:text-red-400 hover:underline"
                        >
                          Återkalla
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
