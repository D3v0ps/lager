// Supabase Edge Function: send-sms
//
// Server-side SMS gateway. Picks GatewayAPI by default (0,041–0,046 €/SMS
// to Sweden, ~10–15 % cheaper than 46elks) and falls back to 46elks if
// only the elks credentials are configured. Caller picks via { provider }
// in the request body or omits it to use the server default.
//
// Required env (set in Supabase dashboard → Functions → send-sms → Secrets):
//   GATEWAYAPI_TOKEN      — Bearer token from gatewayapi.com
//   GATEWAYAPI_SENDER     — alphanumeric sender, max 11 chars (e.g. "Saldo")
//   ELKS_API_USERNAME     — 46elks username (basic auth)
//   ELKS_API_PASSWORD     — 46elks password
//   ELKS_FROM             — 46elks sender (alpha 11 or numeric)
//
// Auth: requires a logged-in Supabase user. The function loads the caller's
// user_id from the JWT and verifies they belong to at least one tenant
// before sending — prevents anonymous abuse of the platform credentials.
//
// Deploy: `supabase functions deploy send-sms --no-verify-jwt=false`

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type SmsProvider = "gatewayapi" | "46elks";

type RequestBody = {
  to?: string;
  message?: string;
  from?: string;
  provider?: SmsProvider;
};

type Result = {
  ok: boolean;
  provider: SmsProvider;
  message_id: string | null;
  cost_micro_sek?: number;
  error?: string;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...CORS_HEADERS,
      ...(init?.headers ?? {}),
    },
  });
}

function normalizeMsisdn(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, "");
  if (/^\+46\d{8,9}$/.test(digits)) return digits;
  if (/^46\d{8,9}$/.test(digits)) return `+${digits}`;
  if (/^0\d{8,9}$/.test(digits)) return `+46${digits.slice(1)}`;
  return null;
}

function pickProvider(requested?: SmsProvider): SmsProvider | null {
  const hasGw = !!Deno.env.get("GATEWAYAPI_TOKEN");
  const hasElks =
    !!Deno.env.get("ELKS_API_USERNAME") &&
    !!Deno.env.get("ELKS_API_PASSWORD");
  if (requested === "gatewayapi" && hasGw) return "gatewayapi";
  if (requested === "46elks" && hasElks) return "46elks";
  if (requested) return null;
  if (hasGw) return "gatewayapi";
  if (hasElks) return "46elks";
  return null;
}

async function sendViaGatewayApi(
  to: string,
  message: string,
  from: string,
): Promise<Result> {
  const token = Deno.env.get("GATEWAYAPI_TOKEN")!;
  // GatewayAPI expects msisdn as string of digits without "+"
  const msisdn = to.replace(/^\+/, "");
  const res = await fetch("https://gatewayapi.com/rest/mtsms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      sender: from,
      message,
      recipients: [{ msisdn: Number(msisdn) }],
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    return {
      ok: false,
      provider: "gatewayapi",
      message_id: null,
      error: `GatewayAPI ${res.status}: ${text}`,
    };
  }
  let payload: any = null;
  try { payload = JSON.parse(text); } catch { /* ignore */ }
  const messageId = payload?.ids?.[0]?.toString() ?? null;
  return { ok: true, provider: "gatewayapi", message_id: messageId };
}

async function sendVia46elks(
  to: string,
  message: string,
  from: string,
): Promise<Result> {
  const username = Deno.env.get("ELKS_API_USERNAME")!;
  const password = Deno.env.get("ELKS_API_PASSWORD")!;
  const auth = btoa(`${username}:${password}`);
  const body = new URLSearchParams({ from, to, message });
  const res = await fetch("https://api.46elks.com/a1/sms", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const text = await res.text();
  if (!res.ok) {
    return {
      ok: false,
      provider: "46elks",
      message_id: null,
      error: `46elks ${res.status}: ${text}`,
    };
  }
  let payload: any = null;
  try { payload = JSON.parse(text); } catch { /* ignore */ }
  return {
    ok: true,
    provider: "46elks",
    message_id: payload?.id ?? null,
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ ok: false, error: "method not allowed" }, { status: 405 });
  }

  // Verify the caller is an authenticated user belonging to a tenant.
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  // Confirm tenant membership (user_id ∈ tenant_users).
  const { count, error: countErr } = await supabase
    .from("tenant_users")
    .select("user_id", { count: "exact", head: true })
    .eq("user_id", userData.user.id);
  if (countErr || (count ?? 0) === 0) {
    return json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as RequestBody;
  if (!body.to || !body.message) {
    return json({ ok: false, error: "missing to/message" }, { status: 400 });
  }
  const to = normalizeMsisdn(body.to);
  if (!to) {
    return json({ ok: false, error: "invalid msisdn" }, { status: 400 });
  }
  const provider = pickProvider(body.provider);
  if (!provider) {
    return json(
      { ok: false, error: "no SMS provider configured on server" },
      { status: 503 },
    );
  }
  const from =
    body.from ??
    (provider === "gatewayapi"
      ? Deno.env.get("GATEWAYAPI_SENDER") ?? "Saldo"
      : Deno.env.get("ELKS_FROM") ?? "Saldo");

  const result =
    provider === "gatewayapi"
      ? await sendViaGatewayApi(to, body.message, from)
      : await sendVia46elks(to, body.message, from);

  return json(result, { status: result.ok ? 200 : 502 });
});
