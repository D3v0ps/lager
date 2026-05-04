"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

// Loosely-typed view — Saldo Bygg tables aren't in lib/database.types.ts yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient() as unknown as SupabaseClient<any, "public", any>;

export type ProjectStatus =
  | "planned"
  | "in_progress"
  | "paused"
  | "done"
  | "invoiced"
  | "cancelled";

export const PROJECT_STATUS_VALUES: readonly ProjectStatus[] = [
  "planned",
  "in_progress",
  "paused",
  "done",
  "invoiced",
  "cancelled",
] as const;

export type DeductionType = "rot" | "rut" | null;

export type Project = {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  reference: string | null;
  name: string;
  description: string | null;
  address: string | null;
  status: ProjectStatus;
  deduction_type: DeductionType;
  start_date: string | null;
  end_date: string | null;
  budget_cents: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectListRow = Project & {
  customers: { id: string; name: string } | null;
};

export type ProjectSummary = {
  project_id: string;
  total_minutes: number;
  time_entry_count: number;
  material_total_cents: number;
  change_total_cents: number;
  doc_count: number;
  photo_count: number;
};

export type ProjectPhase = {
  id: string;
  project_id: string;
  name: string;
  ord: number;
  start_date: string | null;
  end_date: string | null;
  done: boolean;
  created_at: string;
};

export type ProjectMaterial = {
  id: string;
  project_id: string;
  product_id: string | null;
  custom_name: string | null;
  quantity: number;
  unit: string | null;
  unit_price_cents: number;
  used_at: string | null;
  notes: string | null;
  products?: { name: string; sku: string } | null;
};

export type ProjectDocument = {
  id: string;
  project_id: string;
  storage_key: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  category: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type ProjectPhoto = {
  id: string;
  project_id: string;
  storage_key: string;
  caption: string | null;
  taken_at: string | null;
  geo_lat_e7: number | null;
  geo_lng_e7: number | null;
  width: number | null;
  height: number | null;
  created_at: string;
};

export type ChangeOrder = {
  id: string;
  project_id: string;
  reference: string | null;
  title: string;
  description: string | null;
  status: "pending" | "approved" | "rejected" | "invoiced";
  hours_estimated: number | null;
  material_cents: number;
  hourly_rate_cents: number;
  total_cents: number;
  approved_by_email: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
};

export function projectStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case "planned": return "Planerad";
    case "in_progress": return "Pågår";
    case "paused": return "Pausad";
    case "done": return "Klar";
    case "invoiced": return "Fakturerad";
    case "cancelled": return "Avbruten";
  }
}

export function projectStatusTone(
  status: ProjectStatus,
): "muted" | "info" | "warning" | "ok" | "error" {
  switch (status) {
    case "planned": return "muted";
    case "in_progress": return "info";
    case "paused": return "warning";
    case "done": return "ok";
    case "invoiced": return "ok";
    case "cancelled": return "error";
  }
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function listProjects(): Promise<ProjectListRow[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*, customers(id, name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectListRow[];
}

export async function getProject(id: string): Promise<ProjectListRow | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*, customers(id, name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ProjectListRow | null) ?? null;
}

export async function getProjectSummary(
  projectId: string,
): Promise<ProjectSummary | null> {
  const { data, error } = await supabase
    .from("project_summary")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ProjectSummary | null) ?? null;
}

export type CreateProjectInput = {
  tenant_id: string;
  customer_id: string | null;
  reference: string | null;
  name: string;
  description: string | null;
  address: string | null;
  status: ProjectStatus;
  deduction_type: DeductionType;
  start_date: string | null;
  end_date: string | null;
  budget_cents: number | null;
  notes: string | null;
};

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Project;
}

export async function updateProject(
  id: string,
  patch: Partial<Omit<CreateProjectInput, "tenant_id">>,
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function suggestProjectReference(): Promise<string> {
  const year = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    timeZone: "Europe/Stockholm",
  }).format(new Date());
  const startIso = new Date(`${year}-01-01T00:00:00+01:00`).toISOString();
  const { count, error } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startIso);
  if (error) throw new Error(error.message);
  return `P-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;
}

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------

export async function listProjectPhases(
  projectId: string,
): Promise<ProjectPhase[]> {
  const { data, error } = await supabase
    .from("project_phases")
    .select("*")
    .eq("project_id", projectId)
    .order("ord", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectPhase[];
}

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

export async function listProjectMaterials(
  projectId: string,
): Promise<ProjectMaterial[]> {
  const { data, error } = await supabase
    .from("project_materials")
    .select("*, products(name, sku)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectMaterial[];
}

// ---------------------------------------------------------------------------
// Change orders (ÄTA)
// ---------------------------------------------------------------------------

export async function listChangeOrders(
  projectId: string,
): Promise<ChangeOrder[]> {
  const { data, error } = await supabase
    .from("change_orders")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ChangeOrder[];
}

export async function createChangeOrder(
  projectId: string,
  input: {
    title: string;
    description: string | null;
    hours_estimated: number | null;
    material_cents: number;
    hourly_rate_cents: number;
  },
): Promise<ChangeOrder> {
  const total =
    (input.hours_estimated ?? 0) * (input.hourly_rate_cents / 100) * 100 +
    input.material_cents;
  const { data, error } = await supabase
    .from("change_orders")
    .insert({
      project_id: projectId,
      title: input.title,
      description: input.description,
      hours_estimated: input.hours_estimated,
      material_cents: input.material_cents,
      hourly_rate_cents: input.hourly_rate_cents,
      total_cents: Math.round(total),
      status: "pending",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ChangeOrder;
}

export async function updateChangeOrderStatus(
  id: string,
  status: ChangeOrder["status"],
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (status === "approved") {
    patch.approved_at = new Date().toISOString();
  } else if (status === "rejected") {
    patch.rejected_at = new Date().toISOString();
  }
  const { error } = await supabase.from("change_orders").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Documents + Photos (metadata only — uploads via Supabase Storage)
// ---------------------------------------------------------------------------

export async function listProjectDocuments(
  projectId: string,
): Promise<ProjectDocument[]> {
  const { data, error } = await supabase
    .from("project_documents")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectDocument[];
}

export async function listProjectPhotos(
  projectId: string,
): Promise<ProjectPhoto[]> {
  const { data, error } = await supabase
    .from("project_photos")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectPhoto[];
}

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------

export type Employee = {
  id: string;
  tenant_id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  hourly_rate: number | null;
  trade: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export async function listEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("full_name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Employee[];
}

export async function createEmployee(
  input: Omit<Employee, "id" | "created_at" | "updated_at">,
): Promise<Employee> {
  const { data, error } = await supabase
    .from("employees")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Employee;
}
