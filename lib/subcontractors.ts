"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient() as unknown as SupabaseClient<any, "public", any>;

export type Subcontractor = {
  id: string;
  tenant_id: string;
  company_name: string;
  org_number: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  has_fskatt: boolean;
  fskatt_verified_at: string | null;
  insurance_valid_until: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectSubcontractorLink = {
  project_id: string;
  subcontractor_id: string;
  agreed_amount_cents: number | null;
  notes: string | null;
  created_at: string;
};

export async function listSubcontractors(): Promise<Subcontractor[]> {
  const { data, error } = await supabase
    .from("subcontractors")
    .select("*")
    .order("company_name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Subcontractor[];
}

export async function createSubcontractor(
  input: Omit<Subcontractor, "id" | "created_at" | "updated_at">,
): Promise<Subcontractor> {
  const { data, error } = await supabase
    .from("subcontractors")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Subcontractor;
}

export async function updateSubcontractor(
  id: string,
  patch: Partial<Subcontractor>,
): Promise<void> {
  const { error } = await supabase
    .from("subcontractors")
    .update(patch)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listProjectSubcontractors(
  projectId: string,
): Promise<
  Array<ProjectSubcontractorLink & { subcontractors: Subcontractor }>
> {
  const { data, error } = await supabase
    .from("project_subcontractors")
    .select("*, subcontractors(*)")
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<
    ProjectSubcontractorLink & { subcontractors: Subcontractor }
  >;
}

export async function linkSubcontractorToProject(
  projectId: string,
  subcontractorId: string,
  agreedAmountCents: number | null,
  notes: string | null,
): Promise<void> {
  const { error } = await supabase.from("project_subcontractors").insert({
    project_id: projectId,
    subcontractor_id: subcontractorId,
    agreed_amount_cents: agreedAmountCents,
    notes,
  });
  if (error) throw new Error(error.message);
}

export async function unlinkSubcontractorFromProject(
  projectId: string,
  subcontractorId: string,
): Promise<void> {
  const { error } = await supabase
    .from("project_subcontractors")
    .delete()
    .eq("project_id", projectId)
    .eq("subcontractor_id", subcontractorId);
  if (error) throw new Error(error.message);
}
