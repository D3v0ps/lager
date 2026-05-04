"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient() as unknown as SupabaseClient<any, "public", any>;

export type ApiKey = {
  id: string;
  tenant_id: string;
  name: string;
  token_last4: string;
  scopes: string[];
  created_by: string | null;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
};

export const AVAILABLE_SCOPES = [
  { id: "read:all", label: "Läs allt" },
  { id: "read:products", label: "Läs produkter" },
  { id: "read:orders", label: "Läs ordrar" },
  { id: "write:products", label: "Skriv produkter" },
  { id: "write:orders", label: "Skriv ordrar" },
  { id: "write:quotes", label: "Skriv anbud" },
  { id: "write:projects", label: "Skriv projekt" },
] as const;

export async function listApiKeys(): Promise<ApiKey[]> {
  const { data, error } = await supabase
    .from("api_keys")
    .select(
      "id, tenant_id, name, token_last4, scopes, created_by, created_at, last_used_at, revoked_at, expires_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ApiKey[];
}

export type CreatedKey = { id: string; token: string };

export async function createApiKey(input: {
  tenantId: string;
  name: string;
  scopes: string[];
  ttlDays: number | null;
}): Promise<CreatedKey> {
  const { data, error } = await supabase.rpc("create_api_key", {
    target_tenant: input.tenantId,
    key_name: input.name,
    key_scopes: input.scopes,
    ttl_days: input.ttlDays,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return row as CreatedKey;
}

export async function revokeApiKey(id: string): Promise<void> {
  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteApiKey(id: string): Promise<void> {
  const { error } = await supabase.from("api_keys").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
