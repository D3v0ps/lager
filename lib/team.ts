"use client";

import { createClient } from "@/lib/supabase/client";
import type { TenantUserRole } from "@/lib/database.types";
import type { InvitableRole } from "@/lib/roles";

const supabase = createClient();

// Build the magic-link redirect URL. Prefer the explicit env var so SSR
// renders a stable absolute URL; fall back to the browser's origin to keep
// local dev with `next dev` working.
function siteOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // Server-render with no configured origin — let Supabase use its
  // dashboard-configured Site URL.
  return "";
}

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/;

function assertSafeSlug(slug: string): void {
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error("Ogiltigt tenant-slug.");
  }
}

export type TeamMember = {
  user_id: string;
  email: string;
  role: TenantUserRole;
  created_at: string;
};

export type PendingInvitation = {
  id: string;
  tenant_id: string;
  email: string;
  role: InvitableRole;
  created_at: string;
  accepted_at: string | null;
};

export async function listTeam(tenantId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase.rpc("list_tenant_team", {
    target_tenant: tenantId,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as TeamMember[];
}

export async function listPendingInvitations(
  tenantId: string,
): Promise<PendingInvitation[]> {
  const { data, error } = await supabase
    .from("tenant_invitations")
    .select("*")
    .eq("tenant_id", tenantId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PendingInvitation[];
}

export async function inviteMember(
  tenantSlug: string,
  email: string,
  role: InvitableRole,
): Promise<void> {
  assertSafeSlug(tenantSlug);
  // Step 1: store the pending invitation server-side.
  const { error: rpcError } = await supabase.rpc("invite_member", {
    target_slug: tenantSlug,
    invitee_email: email,
    invitee_role: role,
  });
  if (rpcError) throw new Error(rpcError.message);

  // Step 2: send a magic link so the invitee can sign in. Supabase will
  // create the auth user on first click. emailRedirectTo lands them back
  // at the tenant login page — tenant-shell will then auto-accept.
  const origin = siteOrigin();
  const redirectTo = origin ? `${origin}/${tenantSlug}/login/` : undefined;
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: redirectTo,
    },
  });
  if (otpError) throw new Error(otpError.message);
}

export async function revokeInvitation(
  tenantId: string,
  invitationId: string,
): Promise<void> {
  // Defence-in-depth: scope the delete by tenant_id even though RLS already
  // restricts cross-tenant deletes via current_owner_admin_tenant_ids().
  const { error } = await supabase
    .from("tenant_invitations")
    .delete()
    .eq("id", invitationId)
    .eq("tenant_id", tenantId);
  if (error) throw new Error(error.message);
}

export async function setMemberRole(
  tenantId: string,
  userId: string,
  role: TenantUserRole,
): Promise<void> {
  const { error } = await supabase
    .from("tenant_users")
    .update({ role })
    .eq("tenant_id", tenantId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function removeMember(
  tenantId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("tenant_users")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

/**
 * Best-effort — a brand-new user with no pending invites returns 0 rows
 * and that's expected. We log on real failure so a permissions regression
 * doesn't fail silently, but don't throw because callers (tenant-shell,
 * login redirect) shouldn't block on it.
 */
export async function acceptPendingInvitations(): Promise<number> {
  const { data, error } = await supabase.rpc("accept_pending_invitations");
  if (error) {
    console.warn("[acceptPendingInvitations] RPC failed:", error.message);
    return 0;
  }
  return Number(data ?? 0);
}

export type RoleLookupResult =
  | { status: "ok"; role: TenantUserRole | null }
  | { status: "error"; error: string };

/**
 * Returns the role the current user has in the given tenant. Distinguishes
 * "not a member" (status: ok, role: null) from "couldn't fetch" (status:
 * error) so callers can surface the difference in UI.
 */
export async function getMyRoleInTenant(
  tenantId: string,
): Promise<RoleLookupResult> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return { status: "ok", role: null };
  const { data, error } = await supabase
    .from("tenant_users")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return { status: "error", error: error.message };
  return { status: "ok", role: (data?.role as TenantUserRole | undefined) ?? null };
}
