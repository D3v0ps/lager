"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import {
  computeQuoteTotals,
  type DeductionType,
  type QuoteItem as QuoteItemInput,
} from "@/lib/rot-rut";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient() as unknown as SupabaseClient<any, "public", any>;

export type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "declined"
  | "expired";

export const QUOTE_STATUS_VALUES: readonly QuoteStatus[] = [
  "draft",
  "sent",
  "accepted",
  "declined",
  "expired",
] as const;

export function quoteStatusLabel(status: QuoteStatus): string {
  switch (status) {
    case "draft": return "Utkast";
    case "sent": return "Skickat";
    case "accepted": return "Accepterat";
    case "declined": return "Avböjt";
    case "expired": return "Utgånget";
  }
}

export function quoteStatusTone(
  status: QuoteStatus,
): "muted" | "info" | "ok" | "warning" | "error" {
  switch (status) {
    case "draft": return "muted";
    case "sent": return "info";
    case "accepted": return "ok";
    case "declined": return "error";
    case "expired": return "warning";
  }
}

export type QuoteItem = {
  id: string;
  quote_id: string;
  kind: "work" | "material" | "fixed";
  description: string;
  quantity: number;
  unit: string | null;
  unit_price_cents: number;
  vat_rate: number;
  deductible: boolean;
  ord: number;
};

export type Quote = {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  project_id: string | null;
  reference: string | null;
  title: string;
  description: string | null;
  status: QuoteStatus;
  deduction_type: DeductionType;
  subtotal_cents: number;
  vat_cents: number;
  total_cents: number;
  deduction_cents: number;
  customer_pays_cents: number;
  accept_token: string;
  valid_until: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  accepted_by_email: string | null;
  declined_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type QuoteListRow = Quote & {
  customers: { id: string; name: string } | null;
};

export type QuoteWithItems = Quote & {
  customers: { id: string; name: string } | null;
  quote_items: QuoteItem[];
};

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function listQuotes(): Promise<QuoteListRow[]> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*, customers(id, name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as QuoteListRow[];
}

export async function getQuote(id: string): Promise<QuoteWithItems | null> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*, customers(id, name), quote_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  // sort items by ord on the client
  type Q = QuoteWithItems;
  const q = data as Q;
  q.quote_items = [...(q.quote_items ?? [])].sort((a, b) => a.ord - b.ord);
  return q;
}

export type CreateQuoteInput = {
  tenant_id: string;
  customer_id: string | null;
  project_id: string | null;
  reference: string | null;
  title: string;
  description: string | null;
  deduction_type: DeductionType;
  valid_until: string | null;
  notes: string | null;
  items: Array<Omit<QuoteItem, "id" | "quote_id" | "ord"> & { ord?: number }>;
};

export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
  const totals = computeQuoteTotals(
    input.items.map((i): QuoteItemInput => ({
      kind: i.kind,
      quantity: i.quantity,
      unit_price_cents: i.unit_price_cents,
      vat_rate: i.vat_rate,
      deductible: i.deductible,
    })),
    input.deduction_type,
  );

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      tenant_id: input.tenant_id,
      customer_id: input.customer_id,
      project_id: input.project_id,
      reference: input.reference,
      title: input.title,
      description: input.description,
      deduction_type: input.deduction_type,
      valid_until: input.valid_until,
      notes: input.notes,
      status: "draft",
      ...totals,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  const q = quote as Quote;

  if (input.items.length > 0) {
    const rows = input.items.map((it, idx) => ({
      quote_id: q.id,
      kind: it.kind,
      description: it.description,
      quantity: it.quantity,
      unit: it.unit,
      unit_price_cents: it.unit_price_cents,
      vat_rate: it.vat_rate,
      deductible: it.deductible,
      ord: it.ord ?? idx,
    }));
    const { error: itemsErr } = await supabase
      .from("quote_items")
      .insert(rows);
    if (itemsErr) {
      await supabase.from("quotes").delete().eq("id", q.id);
      throw new Error(itemsErr.message);
    }
  }

  return q;
}

export async function updateQuoteStatus(
  id: string,
  status: QuoteStatus,
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (status === "sent") patch.sent_at = new Date().toISOString();
  const { error } = await supabase
    .from("quotes")
    .update(patch)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteQuote(id: string): Promise<void> {
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function suggestQuoteReference(): Promise<string> {
  const year = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    timeZone: "Europe/Stockholm",
  }).format(new Date());
  const startIso = new Date(`${year}-01-01T00:00:00+01:00`).toISOString();
  const { count, error } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startIso);
  if (error) throw new Error(error.message);
  return `Q-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;
}

// ---------------------------------------------------------------------------
// Public quote-accept (anon-callable RPC)
// ---------------------------------------------------------------------------

export type PublicQuote = {
  id: string;
  reference: string | null;
  title: string;
  description: string | null;
  status: QuoteStatus;
  deduction_type: DeductionType;
  subtotal_cents: number;
  vat_cents: number;
  total_cents: number;
  deduction_cents: number;
  customer_pays_cents: number;
  valid_until: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  accepted_by_email: string | null;
  tenant_name: string;
  tenant_logo_url: string | null;
  customer_name: string | null;
  items: Array<{
    kind: "work" | "material" | "fixed";
    description: string;
    quantity: number;
    unit: string | null;
    unit_price_cents: number;
    vat_rate: number;
    deductible: boolean;
  }>;
};

export async function getPublicQuoteByToken(
  token: string,
): Promise<PublicQuote | null> {
  const { data, error } = await supabase.rpc("get_quote_by_token", { token });
  if (error) throw new Error(error.message);
  if (!data || (Array.isArray(data) && data.length === 0)) return null;
  const row = (Array.isArray(data) ? data[0] : data) as PublicQuote;
  return row;
}

export async function acceptPublicQuote(
  token: string,
  signerEmail: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("accept_quote", {
    token,
    signer_email: signerEmail,
  });
  if (error) throw new Error(error.message);
  return data as string;
}
