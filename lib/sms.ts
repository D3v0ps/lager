"use client";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

/**
 * SMS-utskick via Saldos egen `send-sms` Edge Function.
 *
 * Klient-koden får aldrig se providerns API-token — den ligger som
 * server-secret i Edge Function-miljön. Funktionen byter mellan
 * GatewayAPI (default, ~0,46 kr/SMS till Sverige) och 46elks (fallback)
 * baserat på vilken miljövariabel som är satt:
 *
 *   GATEWAYAPI_TOKEN  → använder GatewayAPI
 *   ELKS_API_USERNAME + ELKS_API_PASSWORD → använder 46elks
 *
 * Båda kan vara satta — då vinner GatewayAPI om inte providern explicit
 * skickas i anropet.
 *
 * Tenant-scope: Edge Function:n verifierar JWT och hämtar tenant_id ur
 * tenant_users så att vi kan logga / debit:a SMS per tenant.
 */

export type SmsProvider = "gatewayapi" | "46elks";

export type SendSmsArgs = {
  /** E.164-format eller svenska 07-nummer; Edge-funktionen normaliserar. */
  to: string;
  message: string;
  /** Avsändar-id. Max 11 alfa eller 14 num. Default: "Saldo". */
  from?: string;
  /** Tvinga viss provider för testning eller A/B. Default väljs serverside. */
  provider?: SmsProvider;
};

export type SendSmsResult = {
  ok: boolean;
  provider: SmsProvider;
  message_id: string | null;
  cost_micro_sek?: number;
  error?: string;
};

export async function sendSms(args: SendSmsArgs): Promise<SendSmsResult> {
  const { data, error } = await supabase.functions.invoke<SendSmsResult>(
    "send-sms",
    { body: args },
  );
  if (error) {
    return {
      ok: false,
      provider: args.provider ?? "gatewayapi",
      message_id: null,
      error: error.message,
    };
  }
  return (
    data ?? {
      ok: false,
      provider: args.provider ?? "gatewayapi",
      message_id: null,
      error: "no response",
    }
  );
}

/**
 * Normalize ett svenskt nummer till E.164 (+46…). Klient-side validering;
 * Edge-funktionen validerar igen som single source of truth.
 */
export function normalizeSwedishMsisdn(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, "");
  if (/^\+46\d{8,9}$/.test(digits)) return digits;
  if (/^46\d{8,9}$/.test(digits)) return `+${digits}`;
  if (/^0\d{8,9}$/.test(digits)) return `+46${digits.slice(1)}`;
  return null;
}
