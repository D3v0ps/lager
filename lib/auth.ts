"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tenant } from "@/lib/database.types";

const supabase = createClient();

// Generic Swedish copy used so login errors don't leak whether the
// account exists (Supabase distinguishes "Invalid login credentials" from
// "Email not confirmed" otherwise — easy email enumeration).
export const GENERIC_SIGN_IN_ERROR = "Fel e-post eller lösenord.";

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Log the original for ops; show user a generic message.
    console.warn("[signIn] failed:", error.message);
    throw new Error(GENERIC_SIGN_IN_ERROR);
  }
}

export async function signOut(): Promise<void> {
  // scope: 'global' so signing out on one device clears every active
  // session for this user instead of just the local browser tab.
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) throw new Error(error.message);
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export function onAuthChange(
  callback: (signedIn: boolean) => void,
): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(!!session);
  });
  return () => data.subscription.unsubscribe();
}
