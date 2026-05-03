"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tenant } from "@/lib/database.types";

const supabase = createClient();

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Tenants the current authenticated user belongs to. Empty array if not
 * signed in or not a member anywhere. RLS on `tenants` already restricts
 * the rows to those the user can see.
 */
export async function listMyTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .order("name", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const { data } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data ?? null;
}

export function onAuthChange(callback: (signedIn: boolean) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(!!session);
  });
  return () => data.subscription.unsubscribe();
}
