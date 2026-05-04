"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient() as unknown as SupabaseClient<any, "public", any>;

export type InspectionKind = "kma" | "egenkontroll" | "skyddsrond" | "other";

export const INSPECTION_KINDS: readonly InspectionKind[] = [
  "kma",
  "egenkontroll",
  "skyddsrond",
  "other",
] as const;

export function inspectionKindLabel(kind: InspectionKind): string {
  switch (kind) {
    case "kma": return "KMA-kontroll";
    case "egenkontroll": return "Egenkontroll";
    case "skyddsrond": return "Skyddsrond";
    case "other": return "Annan kontroll";
  }
}

export type InspectionItemKind = "check" | "text" | "photo" | "measure";

export type InspectionItem = {
  id: string;
  label: string;
  kind: InspectionItemKind;
  required?: boolean;
  // Filled in when used inside a project_inspection
  value?: string | boolean | number | null;
  ok?: boolean | null;
  comment?: string | null;
};

export type InspectionTemplate = {
  id: string;
  tenant_id: string;
  kind: InspectionKind;
  name: string;
  description: string | null;
  items: InspectionItem[];
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectInspection = {
  id: string;
  project_id: string;
  template_id: string | null;
  kind: InspectionKind;
  title: string;
  items: InspectionItem[];
  status: "in_progress" | "completed" | "failed";
  completed_at: string | null;
  completed_by: string | null;
  signed_by_email: string | null;
  signed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function listInspectionTemplates(): Promise<InspectionTemplate[]> {
  const { data, error } = await supabase
    .from("inspection_templates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as InspectionTemplate[];
}

export async function createInspectionTemplate(input: {
  tenant_id: string;
  kind: InspectionKind;
  name: string;
  description: string | null;
  items: InspectionItem[];
}): Promise<InspectionTemplate> {
  const { data, error } = await supabase
    .from("inspection_templates")
    .insert({ ...input, active: true })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as InspectionTemplate;
}

// ---------------------------------------------------------------------------
// Project inspections
// ---------------------------------------------------------------------------

export async function listProjectInspections(
  projectId: string,
): Promise<ProjectInspection[]> {
  const { data, error } = await supabase
    .from("project_inspections")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectInspection[];
}

export async function startInspection(input: {
  project_id: string;
  template_id?: string | null;
  kind: InspectionKind;
  title: string;
  items: InspectionItem[];
}): Promise<ProjectInspection> {
  const { data, error } = await supabase
    .from("project_inspections")
    .insert({
      project_id: input.project_id,
      template_id: input.template_id ?? null,
      kind: input.kind,
      title: input.title,
      items: input.items,
      status: "in_progress",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ProjectInspection;
}

export async function updateInspectionItems(
  id: string,
  items: InspectionItem[],
): Promise<void> {
  const { error } = await supabase
    .from("project_inspections")
    .update({ items })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function completeInspection(
  id: string,
  signerEmail: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("project_inspections")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      signed_by_email: signerEmail,
      signed_at: signerEmail ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// Default seed templates we offer when a tenant has no templates yet.
export const DEFAULT_KMA_ITEMS: InspectionItem[] = [
  { id: "1", label: "Riskinventering genomförd och dokumenterad", kind: "check", required: true },
  { id: "2", label: "Skyddsutrustning på plats (PPE)", kind: "check", required: true },
  { id: "3", label: "Avfallshantering planerad enligt miljöplan", kind: "check", required: true },
  { id: "4", label: "Buller- och dammhantering enligt plan", kind: "check" },
  { id: "5", label: "Energi- och vatten­förbrukning loggas", kind: "check" },
  { id: "6", label: "Tillbud / olyckor rapporterade", kind: "check" },
  { id: "7", label: "Kommentarer", kind: "text" },
];

export const DEFAULT_EGENKONTROLL_ITEMS: InspectionItem[] = [
  { id: "1", label: "Underlag rent och plant inför nästa moment", kind: "check", required: true },
  { id: "2", label: "Material kontrollerat mot beställning", kind: "check", required: true },
  { id: "3", label: "Måttsättning verifierad", kind: "measure" },
  { id: "4", label: "Foto på utfört arbete", kind: "photo" },
  { id: "5", label: "Avvikelser / kommentar", kind: "text" },
];

export const DEFAULT_SKYDDSROND_ITEMS: InspectionItem[] = [
  { id: "1", label: "Fallskydd över 2 m säkrade", kind: "check", required: true },
  { id: "2", label: "Stege/ställning besiktigad", kind: "check", required: true },
  { id: "3", label: "Brandskydd: släckare + utrymning ok", kind: "check", required: true },
  { id: "4", label: "Heta arbeten — tillstånd + bevakning", kind: "check" },
  { id: "5", label: "Elsäkerhet: kabeldragning, ojordat", kind: "check" },
  { id: "6", label: "Första hjälpen-station fylld", kind: "check" },
  { id: "7", label: "Personlig skyddsutrustning bärs av alla", kind: "check", required: true },
  { id: "8", label: "Kommentarer / åtgärder", kind: "text" },
];
