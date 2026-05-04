"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient() as unknown as SupabaseClient<any, "public", any>;

export type CustomerApplicationStatus = "pending" | "approved" | "rejected";

export type CustomerApplication = {
  id: string;
  tenant_id: string;
  status: CustomerApplicationStatus;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  company_name: string;
  org_number: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  message: string | null;
  requested_categories: string[] | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  customer_id: string | null;
  created_at: string;
};

export type SubmitApplicationInput = {
  tenant_slug: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone?: string | null;
  company_name: string;
  org_number?: string | null;
  billing_address?: string | null;
  shipping_address?: string | null;
  message?: string | null;
  requested_categories?: string[];
};

/**
 * Submit a new customer application — anon-callable. Returns the new
 * application id on success.
 */
export async function submitCustomerApplication(
  input: SubmitApplicationInput,
): Promise<string> {
  const { data, error } = await supabase.rpc("submit_customer_application", {
    target_slug: input.tenant_slug,
    applicant_name: input.applicant_name,
    applicant_email: input.applicant_email,
    applicant_phone: input.applicant_phone ?? null,
    company_name: input.company_name,
    org_number: input.org_number ?? null,
    billing_address: input.billing_address ?? null,
    shipping_address: input.shipping_address ?? null,
    message: input.message ?? null,
    requested_categories: input.requested_categories ?? [],
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function listApplications(
  status?: CustomerApplicationStatus,
): Promise<CustomerApplication[]> {
  let q = supabase
    .from("customer_applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as CustomerApplication[];
}

export async function approveApplication(
  id: string,
  sendInvite = true,
): Promise<string> {
  const { data, error } = await supabase.rpc("approve_customer_application", {
    app_id: id,
    send_invite: sendInvite,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function rejectApplication(
  id: string,
  reason: string,
): Promise<void> {
  const { error } = await supabase.rpc("reject_customer_application", {
    app_id: id,
    reason,
  });
  if (error) throw new Error(error.message);
}

/**
 * Best-effort lookup of company name from Bolagsverket-equivalent data.
 * Real implementation calls a serverside Edge Function with API access;
 * for now this is a client-side stub that returns null so callers can
 * gracefully fall back to manual entry.
 */
export async function lookupCompanyByOrgNumber(
  orgNumber: string,
): Promise<{ name: string; address?: string } | null> {
  const cleaned = orgNumber.replace(/[\s-]/g, "");
  if (!/^\d{10}(\d{2})?$/.test(cleaned)) return null;
  // TODO: wire up Edge Function /functions/v1/lookup-company that hits
  // Bolagsverket open data or Roaring/Bisnode API.
  return null;
}
