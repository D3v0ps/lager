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
import { useTenantState } from "@/lib/tenant-context";
import { formatDate } from "@/lib/format";
import {
  INVITABLE_ROLES,
  TENANT_USER_ROLE,
  isManager,
  roleLabel,
  type InvitableRole,
} from "@/lib/roles";
import type { TenantUserRole } from "@/lib/database.types";
import {
  ErrorBanner,
  LoadingText,
  SkeletonRows,
} from "@/app/_components/ui";
import { inputClass, labelClass } from "@/lib/form-classes";

export default function TeamPage() {
  const { tenant: slug } = useParams<{ tenant: string }>();
  const tenantState = useTenantState();
  const tenant = tenantState.tenant;

  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [myRole, setMyRole] = useState<TenantUserRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InvitableRole>("member");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!tenant) return;
    setError(null);
    try {
      const [m, inv, roleResult] = await Promise.all([
        listTeam(tenant.id),
        listPendingInvitations(tenant.id),
        getMyRoleInTenant(tenant.id),
      ]);
      setMembers(m);
      setInvitations(inv);
      if (roleResult.status === "ok") {
        setMyRole(roleResult.role);
      } else {
        // Surface role-fetch failure: a flaky network shouldn't silently
        // hide the manage-team UI from an actual owner.
        setError(`Kunde inte hämta din roll: ${roleResult.error}`);
        setMyRole(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [tenant]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (tenantState.status === "loading") {
    return <LoadingText />;
  }
  if (tenantState.status !== "ready" || !tenant) {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 text-sm">
        Hittar inte kund-portalen. Kontrollera att du loggat in på rätt
        portal eller be en admin lägga till dig.
      </div>
    );
  }

  const canManage = isManager(myRole);

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
    if (!tenant) return;
    if (!confirm(`Återkalla inbjudan till ${email}?`)) return;
    try {
      await revokeInvitation(tenant.id, invId);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const isAlone = members !== null && members.length <= 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Team</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Hantera vem som har tillgång till {tenant.name}.
        </p>
      </div>

      {error && <ErrorBanner id="team-form-error">{error}</ErrorBanner>}
      {info && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-md border border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800 p-3 text-sm"
        >
          {info}
        </div>
      )}

      {canManage && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Bjud in ny medlem</h2>
          <form
            onSubmit={handleInvite}
            className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end"
            aria-describedby={error ? "team-form-error" : undefined}
          >
            <div>
              <label htmlFor="email" className={labelClass}>
                E-post
              </label>
              <input
                id="email"
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="kollega@dittforetag.se"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="role" className={labelClass}>
                Roll
              </label>
              <select
                id="role"
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as InvitableRole)
                }
                className={inputClass}
              >
                {INVITABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
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
          <SkeletonRows rows={3} className="h-10" />
        ) : isAlone ? (
          <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-900/30 p-6 text-center">
            <p className="text-sm font-medium">
              Du är ensam i {tenant.name}.
            </p>
            <p className="text-sm text-neutral-500 mt-1">
              {canManage
                ? "Bjud in en kollega ovan så blir det fler här."
                : "Be en owner eller admin att bjuda in fler."}
            </p>
          </div>
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
                      {canManage && m.role !== TENANT_USER_ROLE.ADMIN ? (
                        <select
                          aria-label={`Roll för ${m.email}`}
                          value={m.role}
                          onChange={(e) =>
                            handleRoleChange(
                              m.user_id,
                              e.target.value as TenantUserRole,
                            )
                          }
                          className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-sm"
                        >
                          {INVITABLE_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {roleLabel(r)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm">{roleLabel(m.role)}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-neutral-500">
                      {formatDate(m.created_at)}
                    </td>
                    {canManage && (
                      <td className="px-4 py-2 text-right">
                        {m.role !== TENANT_USER_ROLE.ADMIN && (
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
                    <td className="px-4 py-2">{roleLabel(inv.role)}</td>
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
