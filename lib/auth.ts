"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tenant } from "@/lib/database.types";

const supabase = createClient();

// Generic Swedish copy used so login errors don't leak whether the
// account exists (Supabase distinguishes "Invalid login credentials" from
// "Email not confirmed" otherwise — easy email enumeration).
export const GENERIC_SIGN_IN_ERROR = "Fel e-post eller lösenord.";

export type SignInResult =
  | { status: "ok" }
  | { status: "mfa_required"; factorId: string };

/**
 * Signs in with email + password and reports back whether an MFA
 * challenge is required to fully upgrade the session.
 *
 * The session itself is created on success regardless — Supabase needs
 * AAL1 first to even list the user's factors. Callers that get
 * `mfa_required` MUST gate their navigation behind a successful
 * `verifyTotp(factorId, code)`.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<SignInResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.warn("[signIn] failed:", error.message);
    throw new Error(GENERIC_SIGN_IN_ERROR);
  }

  // Check Authenticator Assurance Level. If the user has any verified
  // factor, Supabase will say nextLevel === "aal2" and currentLevel ===
  // "aal1" — meaning the session is signed in but NOT yet challenged.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel === "aal1") {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verified = factors?.totp?.find((f) => f.status === "verified");
    if (verified) {
      return { status: "mfa_required", factorId: verified.id };
    }
  }
  return { status: "ok" };
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
