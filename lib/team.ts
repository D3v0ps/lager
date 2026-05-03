"use client";

import { createClient } from "@/lib/supabase/client";
import type { TenantUserRole } from "@/lib/database.types";

const supabase = createClient();

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
  role: "owner" | "member";
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
  role: "owner" | "member",
): Promise<void> {
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
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/${tenantSlug}/login/`
      : undefined;
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: redirectTo,
    },
  });
  if (otpError) throw new Error(otpError.message);
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase
    .from("tenant_invitations")
    .delete()
    .eq("id", invitationId);
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

export async function acceptPendingInvitations(): Promise<number> {
  const { data, error } = await supabase.rpc("accept_pending_invitations");
  if (error) {
    // Non-fatal — user might just have no pending invitations.
    console.warn("accept_pending_invitations failed:", error.message);
    return 0;
  }
  return Number(data ?? 0);
}

/**
 * Returns the role the current user has in the given tenant, or null if
 * they're not a member.
 */
export async function getMyRoleInTenant(
  tenantId: string,
): Promise<TenantUserRole | null> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("tenant_users")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return null;
  return (data?.role as TenantUserRole) ?? null;
}
