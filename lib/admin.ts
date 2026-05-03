"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tenant, TenantUser, TenantUserRole } from "@/lib/database.types";

const supabase = createClient();

export type AuthUser = {
  id: string;
  email: string;
  created_at: string;
};

export type TenantWithCount = Tenant & { member_count: number };

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return false;
  // Try a query that only succeeds for admins (the admin_list_users RPC).
  const { error } = await supabase.rpc("admin_list_users").limit(0);
  return !error;
}

export async function listAllTenants(): Promise<TenantWithCount[]> {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  const tenants = data ?? [];
  // Fetch member counts in parallel.
  const counts = await Promise.all(
    tenants.map((t) =>
      supabase
        .rpc("tenant_member_count", { target_tenant: t.id })
        .then(({ data }) => Number(data ?? 0)),
    ),
  );
  return tenants.map((t, i) => ({ ...t, member_count: counts[i] }));
}

export async function createTenant(slug: string, name: string): Promise<Tenant> {
  const { data, error } = await supabase
    .from("tenants")
    .insert({ slug, name })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateTenantName(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from("tenants")
    .update({ name })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTenant(id: string): Promise<void> {
  const { error } = await supabase.from("tenants").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listTenantMembers(tenantId: string): Promise<
  (TenantUser & { email: string | null })[]
> {
  const [{ data: members, error }, users] = await Promise.all([
    supabase.from("tenant_users").select("*").eq("tenant_id", tenantId),
    listAuthUsers(),
  ]);
  if (error) throw new Error(error.message);
  const byId = new Map(users.map((u) => [u.id, u.email]));
  return (members ?? []).map((m) => ({ ...m, email: byId.get(m.user_id) ?? null }));
}

export async function listAuthUsers(): Promise<AuthUser[]> {
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) throw new Error(error.message);
  return (data ?? []) as AuthUser[];
}

export async function addTenantMember(
  tenantId: string,
  userId: string,
  role: TenantUserRole,
): Promise<void> {
  const { error } = await supabase
    .from("tenant_users")
    .insert({ tenant_id: tenantId, user_id: userId, role });
  if (error) throw new Error(error.message);
}

export async function removeTenantMember(
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

export async function setTenantMemberRole(
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
