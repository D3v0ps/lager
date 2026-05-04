"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient() as unknown as SupabaseClient<any, "public", any>;

export type TimeCategory =
  | "arbete"
  | "rast"
  | "restid"
  | "övertid"
  | "sjuk"
  | "semester";

export const TIME_CATEGORY_VALUES: readonly TimeCategory[] = [
  "arbete",
  "rast",
  "restid",
  "övertid",
  "sjuk",
  "semester",
] as const;

export function timeCategoryLabel(c: TimeCategory): string {
  switch (c) {
    case "arbete": return "Arbete";
    case "rast": return "Rast";
    case "restid": return "Restid";
    case "övertid": return "Övertid";
    case "sjuk": return "Sjuk";
    case "semester": return "Semester";
  }
}

export type TimeEntry = {
  id: string;
  tenant_id: string;
  project_id: string | null;
  employee_id: string;
  entry_date: string;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  category: TimeCategory;
  note: string | null;
  geo_lat_e7: number | null;
  geo_lng_e7: number | null;
  approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
};

export type TimeEntryWithRelations = TimeEntry & {
  employees: { id: string; full_name: string } | null;
  projects: { id: string; name: string; reference: string | null } | null;
};

export async function listTimeEntries(opts?: {
  projectId?: string;
  employeeId?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<TimeEntryWithRelations[]> {
  let q = supabase
    .from("time_entries")
    .select(
      "*, employees(id, full_name), projects(id, name, reference)",
    )
    .order("entry_date", { ascending: false })
    .order("started_at", { ascending: false });
  if (opts?.projectId) q = q.eq("project_id", opts.projectId);
  if (opts?.employeeId) q = q.eq("employee_id", opts.employeeId);
  if (opts?.fromDate) q = q.gte("entry_date", opts.fromDate);
  if (opts?.toDate) q = q.lte("entry_date", opts.toDate);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as TimeEntryWithRelations[];
}

export type CreateTimeEntryInput = {
  tenant_id: string;
  project_id: string | null;
  employee_id: string;
  entry_date: string;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  category: TimeCategory;
  note: string | null;
  geo_lat_e7?: number | null;
  geo_lng_e7?: number | null;
};

export async function createTimeEntry(
  input: CreateTimeEntryInput,
): Promise<TimeEntry> {
  const { data, error } = await supabase
    .from("time_entries")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as TimeEntry;
}

export async function clockIn(opts: {
  tenant_id: string;
  employee_id: string;
  project_id: string | null;
  geo?: { lat: number; lng: number } | null;
}): Promise<TimeEntry> {
  return createTimeEntry({
    tenant_id: opts.tenant_id,
    employee_id: opts.employee_id,
    project_id: opts.project_id,
    entry_date: new Intl.DateTimeFormat("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Europe/Stockholm",
    }).format(new Date()),
    started_at: new Date().toISOString(),
    ended_at: null,
    duration_minutes: null,
    category: "arbete",
    note: null,
    geo_lat_e7: opts.geo ? Math.round(opts.geo.lat * 1e7) : null,
    geo_lng_e7: opts.geo ? Math.round(opts.geo.lng * 1e7) : null,
  });
}

export async function clockOut(entryId: string): Promise<TimeEntry> {
  const { data, error } = await supabase
    .from("time_entries")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", entryId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as TimeEntry;
}

/**
 * Find an open clock-in (no ended_at) for the given employee, if any.
 */
export async function findOpenClockIn(
  employeeId: string,
): Promise<TimeEntry | null> {
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("employee_id", employeeId)
    .is("ended_at", null)
    .not("started_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as TimeEntry | null) ?? null;
}

export async function approveTimeEntry(id: string): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id ?? null;
  const { error } = await supabase
    .from("time_entries")
    .update({
      approved: true,
      approved_at: new Date().toISOString(),
      approved_by: userId,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTimeEntry(id: string): Promise<void> {
  const { error } = await supabase.from("time_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function formatMinutesAsHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}
