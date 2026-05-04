"use client";

// Tenant-side admin helpers for the B2B portal (customer-side helpers
// live in lib/portal.ts).

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import type { PortalRole } from "@/lib/portal";

// Loosely-typed view — new tables/RPCs aren't in lib/database.types.ts yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient() as unknown as SupabaseClient<any, "public", any>;

export type CustomerContact = {
  user_id: string;
  email: string;
  role: PortalRole;
  created_at: string;
};

export type PendingCustomerInvitation = {
  id: string;
  customer_id: string;
  email: string;
  role: PortalRole;
  created_at: string;
};

export type CustomerPriceListEntry = {
  id: string;
  tenant_id: string;
  customer_id: string;
  product_id: string;
  unit_price: number;
  valid_from: string | null;
  valid_until: string | null;
};

export async function setPortalEnabled(
  tenantId: string,
  enabled: boolean,
  welcomeText: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("tenants")
    .update({
      b2b_portal_enabled: enabled,
      portal_welcome_text: welcomeText,
    })
    .eq("id", tenantId);
  if (error) throw new Error(error.message);
}

export async function listCustomerContacts(
  customerId: string,
): Promise<CustomerContact[]> {
  const { data, error } = await supabase.rpc("list_customer_contacts", {
    target_customer: customerId,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as CustomerContact[];
}

export async function listPendingCustomerInvitations(
  customerId: string,
): Promise<PendingCustomerInvitation[]> {
  const { data, error } = await supabase
    .from("customer_invitations")
    .select("id, customer_id, email, role, created_at")
    .eq("customer_id", customerId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PendingCustomerInvitation[];
}

export async function inviteCustomerContact(
  customerId: string,
  email: string,
  role: PortalRole,
): Promise<void> {
  const { error } = await supabase.rpc("invite_customer_contact", {
    target_customer: customerId,
    invitee_email: email,
    invitee_role: role,
  });
  if (error) throw new Error(error.message);
}

export async function sendCustomerMagicLink(
  email: string,
  redirectTo: string,
): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
  });
  if (error) throw new Error(error.message);
}

export async function revokeCustomerInvitation(id: string): Promise<void> {
  const { error } = await supabase
    .from("customer_invitations")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function removeCustomerContact(
  customerId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("customer_users")
    .delete()
    .eq("customer_id", customerId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function setContactRole(
  customerId: string,
  userId: string,
  role: PortalRole,
): Promise<void> {
  const { error } = await supabase
    .from("customer_users")
    .update({ role })
    .eq("customer_id", customerId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function listCustomerPrices(
  customerId: string,
): Promise<CustomerPriceListEntry[]> {
  const { data, error } = await supabase
    .from("customer_price_lists")
    .select("*")
    .eq("customer_id", customerId)
    .order("valid_from", { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CustomerPriceListEntry[];
}

export async function setCustomerPrice(
  tenantId: string,
  customerId: string,
  productId: string,
  unitPrice: number,
): Promise<void> {
  // Wipe any prior unbounded price for this (customer, product) and insert
  // the new one. Historical bounded prices stay untouched.
  await supabase
    .from("customer_price_lists")
    .delete()
    .eq("customer_id", customerId)
    .eq("product_id", productId)
    .is("valid_from", null);

  const { error } = await supabase
    .from("customer_price_lists")
    .insert({
      tenant_id: tenantId,
      customer_id: customerId,
      product_id: productId,
      unit_price: unitPrice,
      valid_from: null,
      valid_until: null,
    });
  if (error) throw new Error(error.message);
}
