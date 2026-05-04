"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient() as unknown as SupabaseClient<any, "public", any>;

export type Webhook = {
  id: string;
  tenant_id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  created_by: string | null;
  created_at: string;
  last_delivery_at: string | null;
  last_status: number | null;
  failure_streak: number;
};

export type WebhookDelivery = {
  id: number;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: "pending" | "delivered" | "failed" | "discarded";
  attempts: number;
  last_status_code: number | null;
  last_error: string | null;
  next_attempt_at: string;
  created_at: string;
  delivered_at: string | null;
};

export const SUPPORTED_EVENT_TYPES = [
  "products.create",
  "products.update",
  "products.delete",
  "orders.create",
  "orders.status_change",
  "orders.shipped",
  "quotes.create",
  "quotes.accept",
  "portal.application_received",
  "portal.order_placed",
  "projects.create",
  "projects.status_change",
  "time_entries.create",
] as const;

export async function listWebhooks(): Promise<Webhook[]> {
  const { data, error } = await supabase
    .from("webhooks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Webhook[];
}

export type CreateWebhookInput = {
  tenant_id: string;
  url: string;
  events: string[];
};

export async function createWebhook(input: CreateWebhookInput): Promise<Webhook> {
  const { data, error } = await supabase
    .from("webhooks")
    .insert({
      tenant_id: input.tenant_id,
      url: input.url,
      events: input.events,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Webhook;
}

export async function deleteWebhook(id: string): Promise<void> {
  const { error } = await supabase.from("webhooks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setWebhookActive(
  id: string,
  active: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("webhooks")
    .update({ active })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listWebhookDeliveries(
  webhookId: string,
  limit = 50,
): Promise<WebhookDelivery[]> {
  const { data, error } = await supabase
    .from("webhook_deliveries")
    .select("*")
    .eq("webhook_id", webhookId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as WebhookDelivery[];
}
