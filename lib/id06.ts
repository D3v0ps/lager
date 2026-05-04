"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import type { Employee } from "@/lib/projects";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient() as unknown as SupabaseClient<any, "public", any>;

export type Id06CardData = {
  id06_card_number: string | null;
  id06_valid_until: string | null;
  id06_verified_at: string | null;
  personnummer_last_four: string | null;
};

export type EmployeeWithId06 = Employee & Id06CardData;

export async function listEmployeesWithId06(): Promise<EmployeeWithId06[]> {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("full_name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as EmployeeWithId06[];
}

export async function setEmployeeId06(
  employeeId: string,
  patch: Partial<Id06CardData>,
): Promise<void> {
  const { error } = await supabase
    .from("employees")
    .update(patch)
    .eq("id", employeeId);
  if (error) throw new Error(error.message);
}

/**
 * Verify an ID06 card against the ID06 verification API. The real API
 * requires a contract with ID06 AB; until configured the function returns
 * a best-effort local check (format validation only).
 */
export async function verifyId06Card(
  cardNumber: string,
): Promise<{ valid: boolean; reason?: string }> {
  const trimmed = cardNumber.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z0-9]{8,16}$/.test(trimmed)) {
    return { valid: false, reason: "Ogiltigt format på ID06-kortnummer." };
  }
  // TODO: wire up Edge Function /functions/v1/verify-id06 that hits the
  // real ID06 verification API once the customer's contract is in place.
  return { valid: true };
}
