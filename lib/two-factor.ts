"use client";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

/**
 * 2FA via Supabase Auth's built-in TOTP MFA. Requires that the project
 * has MFA enabled in the Auth dashboard.
 *
 * Flow:
 *   enrollTotp({ issuer, friendlyName }) → returns { factorId, qrCode, secret, uri }
 *   user scans QR + enters 6-digit code
 *   verifyTotp(factorId, code) confirms enrollment
 *   on subsequent logins, signIn() returns { status: 'mfa_required', factorId }
 *   and the login UI calls verifyTotp(factorId, code) to upgrade to AAL2.
 */

export type TotpEnrollment = {
  factorId: string;
  qrCode: string; // SVG data URI
  secret: string;
  uri: string;
};

export async function enrollTotp(opts?: {
  /** Visible in the authenticator app — group label. */
  issuer?: string;
  /** Internal label, visible to tenant admins. */
  friendlyName?: string;
}): Promise<TotpEnrollment> {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    // Issuer shows up as the bold heading in Google Authenticator etc.
    // Default "Saldo" so all of a user's Saldo-accounts group together.
    issuer: opts?.issuer ?? "Saldo",
    friendlyName: opts?.friendlyName ?? "Saldo",
  });
  if (error) throw new Error(error.message);
  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  };
}

/**
 * Issue a challenge for an existing factor and verify the supplied code.
 * Used both at enrollment-time (to confirm the factor) and at sign-in
 * (to upgrade the session from AAL1 to AAL2).
 */
export async function verifyTotp(
  factorId: string,
  code: string,
): Promise<void> {
  const { data, error } = await supabase.auth.mfa.challenge({ factorId });
  if (error) throw new Error(error.message);
  const challengeId = data.id;

  const verify = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });
  if (verify.error) throw new Error(verify.error.message);
}

export async function listTotpFactors(): Promise<
  Array<{ id: string; status: string; friendlyName: string | null }>
> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw new Error(error.message);
  return data.totp.map((f) => ({
    id: f.id,
    status: f.status,
    friendlyName: f.friendly_name ?? null,
  }));
}

/**
 * Returns the verified TOTP factor id, if any. Used by the login flow to
 * decide whether to show the MFA challenge step after a successful
 * password sign-in.
 */
export async function getVerifiedTotpFactorId(): Promise<string | null> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return null;
  const verified = data.totp.find((f) => f.status === "verified");
  return verified?.id ?? null;
}

/**
 * Whether the current session needs an MFA challenge to reach AAL2.
 * Returns true only when the user has at least one verified factor AND
 * the current session is below AAL2.
 */
export async function needsMfaChallenge(): Promise<boolean> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) return false;
  return data.nextLevel === "aal2" && data.currentLevel === "aal1";
}

export async function unenrollTotp(factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw new Error(error.message);
}
