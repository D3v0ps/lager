"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient() as unknown as SupabaseClient<any, "public", any>;

export type ProjectTemplatePhase = {
  name: string;
  ord: number;
  days_offset_from_start: number;
};

export type ProjectTemplate = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  phases: ProjectTemplatePhase[];
  default_inspection_template_ids: string[] | null;
  active: boolean;
  created_at: string;
};

export async function listProjectTemplates(): Promise<ProjectTemplate[]> {
  const { data, error } = await supabase
    .from("project_templates")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectTemplate[];
}

export async function createProjectTemplate(input: {
  tenant_id: string;
  name: string;
  description: string | null;
  phases: ProjectTemplatePhase[];
  default_inspection_template_ids?: string[];
}): Promise<ProjectTemplate> {
  const { data, error } = await supabase
    .from("project_templates")
    .insert({
      tenant_id: input.tenant_id,
      name: input.name,
      description: input.description,
      phases: input.phases,
      default_inspection_template_ids:
        input.default_inspection_template_ids ?? [],
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ProjectTemplate;
}

/**
 * Clone an existing project (phases + team) into a new project. Used by
 * the "Mall-projekt"-feature so foremen can copy a "Badrumsrenovering"
 * structure for the next customer.
 */
export async function cloneProject(opts: {
  source_id: string;
  tenant_id: string;
  new_name: string;
  customer_id?: string | null;
  start_date?: string | null;
}): Promise<string> {
  const { data: src, error: srcErr } = await supabase
    .from("projects")
    .select("*")
    .eq("id", opts.source_id)
    .maybeSingle();
  if (srcErr) throw new Error(srcErr.message);
  if (!src) throw new Error("källprojekt hittades ej");

  type ProjectRow = {
    description: string | null;
    address: string | null;
    deduction_type: string | null;
    budget_cents: number | null;
    notes: string | null;
  };
  const source = src as ProjectRow;

  const { data: created, error: insErr } = await supabase
    .from("projects")
    .insert({
      tenant_id: opts.tenant_id,
      customer_id: opts.customer_id ?? null,
      name: opts.new_name,
      description: source.description,
      address: source.address,
      status: "planned",
      deduction_type: source.deduction_type,
      start_date: opts.start_date ?? null,
      end_date: null,
      budget_cents: source.budget_cents,
      notes: source.notes,
    })
    .select("id")
    .single();
  if (insErr) throw new Error(insErr.message);
  const newId = (created as { id: string }).id;

  // Copy phases
  const { data: srcPhases } = await supabase
    .from("project_phases")
    .select("name, ord")
    .eq("project_id", opts.source_id)
    .order("ord", { ascending: true });
  if (srcPhases && srcPhases.length > 0) {
    type Phase = { name: string; ord: number };
    const rows = (srcPhases as Phase[]).map((p) => ({
      project_id: newId,
      name: p.name,
      ord: p.ord,
      done: false,
    }));
    await supabase.from("project_phases").insert(rows);
  }

  // Copy team
  const { data: srcTeam } = await supabase
    .from("project_team")
    .select("employee_id, role")
    .eq("project_id", opts.source_id);
  if (srcTeam && srcTeam.length > 0) {
    type Member = { employee_id: string; role: string | null };
    const rows = (srcTeam as Member[]).map((m) => ({
      project_id: newId,
      employee_id: m.employee_id,
      role: m.role,
    }));
    await supabase.from("project_team").insert(rows);
  }

  return newId;
}
