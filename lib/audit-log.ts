"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient() as unknown as SupabaseClient<any, "public", any>;

export type AuditEvent = {
  id: number;
  tenant_id: string | null;
  actor_user_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
};

export type AuditEventWithActor = AuditEvent & {
  actor_email?: string | null;
};

export async function listAuditLog(opts?: {
  tenantId?: string;
  eventType?: string;
  limit?: number;
}): Promise<AuditEvent[]> {
  let q = supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 200);
  if (opts?.tenantId) q = q.eq("tenant_id", opts.tenantId);
  if (opts?.eventType) q = q.eq("event_type", opts.eventType);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as AuditEvent[];
}

/**
 * Convenience wrapper used throughout the app to log app-level events.
 * Calls the server-side log_audit RPC so the actor / payload can't be
 * forged from a client.
 */
export async function logAudit(
  tenantId: string,
  eventType: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabase.rpc("log_audit", {
    target_tenant: tenantId,
    event_type: eventType,
    payload,
  });
  if (error) {
    console.warn("[audit] log_audit failed:", error.message);
  }
}

export function eventTypeLabel(type: string): string {
  // Tries to format "products.update" → "Produkter · Uppdaterad"
  const map: Record<string, string> = {
    "products.create": "Produkt skapad",
    "products.update": "Produkt uppdaterad",
    "products.delete": "Produkt borttagen",
    "orders.create": "Order skapad",
    "orders.status_change": "Orderstatus ändrad",
    "quotes.create": "Anbud skapat",
    "quotes.send": "Anbud skickat",
    "quotes.accept": "Anbud accepterat",
    "team.invite": "Teaminbjudan skickad",
    "team.remove": "Teammedlem borttagen",
    "portal.application_received": "Kund-ansökan inkommen",
    "portal.application_approved": "Kund-ansökan godkänd",
    "portal.order_placed": "Portalorder lagd",
    "settings.branding_change": "Branding uppdaterad",
    "auth.sign_in": "Inloggning",
    "auth.sign_out": "Utloggning",
    "api_key.create": "API-nyckel skapad",
    "api_key.revoke": "API-nyckel återkallad",
    "webhook.create": "Webhook skapad",
    "webhook.failed_delivery": "Webhook-leverans misslyckades",
  };
  return map[type] ?? type;
}
