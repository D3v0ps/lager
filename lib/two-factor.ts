"use client";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

/**
 * 2FA via Supabase Auth's built-in TOTP MFA. Requires that the project
 * has MFA enabled in the Auth dashboard.
 *
 * Flow:
 *   enrollTotp() → returns { factorId, qr_code, secret, uri }
 *   user scans QR + enters 6-digit code
 *   verifyTotp(factorId, code) confirms enrollment
 *   future logins are challenged via Supabase automatically.
 */

export type TotpEnrollment = {
  factorId: string;
  qrCode: string; // SVG data URI
  secret: string;
  uri: string;
};

export async function enrollTotp(
  friendlyName = "Saldo TOTP",
): Promise<TotpEnrollment> {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName,
  });
  if (error) throw new Error(error.message);
  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  };
}

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

export async function unenrollTotp(factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw new Error(error.message);
}
