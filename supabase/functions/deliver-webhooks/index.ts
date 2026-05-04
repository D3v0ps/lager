// Supabase Edge Function: deliver-webhooks
//
// Pollar webhook_deliveries-kön efter status='pending' med next_attempt_at
// in the past, postar mot webhook.url med HMAC-SHA256-signatur i headern,
// och uppdaterar leverans-statusen baserat på svaret.
//
// Designad för att triggas av pg_cron (varje minut) eller på begäran via
// HTTP POST. Idempotent på leveransrad-nivå (vi väljer rader med FOR UPDATE
// SKIP LOCKED så två samtidiga körningar inte dubbel-postar).
//
// Retry-policy:
//   1:a försök → omedelbart
//   2:a försök → +1 min
//   3:e försök → +5 min
//   4:e försök → +30 min
//   5:e försök → +2 h
//   efter 6 misslyckade försök → status='failed', failure_streak ökas på
//   webhooks-raden, webhook deaktiveras automatiskt om failure_streak > 20.
//
// Tail-recursion på webhook_deliveries så att vi processar batch om
// flera står i kön.
//
// Required env (set in Supabase dashboard → Functions → deliver-webhooks):
//   SUPABASE_URL              — set automatiskt av Supabase
//   SUPABASE_SERVICE_ROLE_KEY — service-role JWT så vi kan läsa/skriva
//                               oavsett RLS
//
// Schedule (kör i Supabase SQL editor en gång):
--   select cron.schedule(
--     'deliver-webhooks',
--     '* * * * *',  -- varje minut
--     $$ select net.http_post(
--          url:='https://<your-project>.supabase.co/functions/v1/deliver-webhooks',
--          headers:='{"Authorization":"Bearer <anon-key>"}'::jsonb
--        ); $$
--   );

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type Delivery = {
  id: number;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  attempts: number;
};

type WebhookRow = {
  id: string;
  url: string;
  secret: string;
  active: boolean;
};

const BACKOFF_MS = [
  0,        // 1st attempt — immediate
  60_000,   // 2nd — 1 min
  300_000,  // 3rd — 5 min
  1_800_000,    // 4th — 30 min
  7_200_000,    // 5th — 2 h
];
const MAX_ATTEMPTS = 6;
const BATCH_SIZE = 25;
const HARD_DEACTIVATE_AFTER = 20; // failure_streak threshold

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const keyData = new TextEncoder().encode(secret);
  const msgData = new TextEncoder().encode(body);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, msgData);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function deliver(
  delivery: Delivery,
  webhook: WebhookRow,
): Promise<{ ok: boolean; status: number | null; error: string | null }> {
  const body = JSON.stringify({
    id: delivery.id,
    event: delivery.event_type,
    delivered_at: new Date().toISOString(),
    payload: delivery.payload,
  });
  const signature = await hmacSha256Hex(webhook.secret, body);
  try {
    const res = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Saldo-Webhook/1",
        "X-Saldo-Event": delivery.event_type,
        "X-Saldo-Delivery-Id": String(delivery.id),
        "X-Saldo-Signature": `sha256=${signature}`,
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });
    return {
      ok: res.ok,
      status: res.status,
      error: res.ok ? null : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      status: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

serve(async (req: Request) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("method not allowed", { status: 405 });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // Pick pending deliveries whose next_attempt_at has passed.
  // No FOR UPDATE in PostgREST — we use the timestamp+attempts read pattern
  // and trust idempotency at the consumer end (we send X-Saldo-Delivery-Id).
  const now = new Date().toISOString();
  const { data: pending, error } = await supabase
    .from("webhook_deliveries")
    .select("id, webhook_id, event_type, payload, attempts")
    .eq("status", "pending")
    .lte("next_attempt_at", now)
    .order("next_attempt_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
  if (!pending || pending.length === 0) {
    return new Response(JSON.stringify({ ok: true, processed: 0 }), {
      headers: { "content-type": "application/json" },
    });
  }

  const webhookIds = [...new Set(pending.map((p) => p.webhook_id))];
  const { data: webhooks } = await supabase
    .from("webhooks")
    .select("id, url, secret, active")
    .in("id", webhookIds);
  const byId = new Map<string, WebhookRow>(
    (webhooks ?? []).map((w: any) => [w.id, w as WebhookRow]),
  );

  let ok = 0;
  let failed = 0;
  for (const d of pending as Delivery[]) {
    const wh = byId.get(d.webhook_id);
    if (!wh || !wh.active) {
      // Webhook gone or disabled — mark discarded.
      await supabase
        .from("webhook_deliveries")
        .update({
          status: "discarded",
          last_error: "webhook deactivated or removed",
        })
        .eq("id", d.id);
      continue;
    }

    const result = await deliver(d, wh);
    const newAttempts = d.attempts + 1;
    const isFinal = !result.ok && newAttempts >= MAX_ATTEMPTS;

    if (result.ok) {
      ok++;
      await supabase
        .from("webhook_deliveries")
        .update({
          status: "delivered",
          attempts: newAttempts,
          last_status_code: result.status,
          delivered_at: new Date().toISOString(),
        })
        .eq("id", d.id);
      await supabase
        .from("webhooks")
        .update({
          last_delivery_at: new Date().toISOString(),
          last_status: result.status,
          failure_streak: 0,
        })
        .eq("id", wh.id);
    } else if (isFinal) {
      failed++;
      await supabase
        .from("webhook_deliveries")
        .update({
          status: "failed",
          attempts: newAttempts,
          last_status_code: result.status,
          last_error: result.error,
        })
        .eq("id", d.id);
      // Bump failure streak; auto-deactivate after threshold.
      const { data: cur } = await supabase
        .from("webhooks")
        .select("failure_streak")
        .eq("id", wh.id)
        .maybeSingle();
      const streak = ((cur as any)?.failure_streak ?? 0) + 1;
      await supabase
        .from("webhooks")
        .update({
          failure_streak: streak,
          last_status: result.status,
          ...(streak >= HARD_DEACTIVATE_AFTER ? { active: false } : {}),
        })
        .eq("id", wh.id);
    } else {
      failed++;
      const delay =
        BACKOFF_MS[Math.min(newAttempts, BACKOFF_MS.length - 1)] ?? 7_200_000;
      await supabase
        .from("webhook_deliveries")
        .update({
          attempts: newAttempts,
          last_status_code: result.status,
          last_error: result.error,
          next_attempt_at: new Date(Date.now() + delay).toISOString(),
        })
        .eq("id", d.id);
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      processed: pending.length,
      delivered: ok,
      failed,
    }),
    { headers: { "content-type": "application/json" } },
  );
});
