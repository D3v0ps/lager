"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient() as unknown as SupabaseClient<any, "public", any>;

export type RecurringCadence = "daily" | "weekly" | "biweekly" | "monthly";

export const CADENCE_VALUES: readonly RecurringCadence[] = [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
] as const;

export function cadenceLabel(c: RecurringCadence): string {
  switch (c) {
    case "daily": return "Varje dag";
    case "weekly": return "Varje vecka";
    case "biweekly": return "Varannan vecka";
    case "monthly": return "Varje månad";
  }
}

export type RecurringOrder = {
  id: string;
  tenant_id: string;
  customer_id: string;
  name: string;
  cadence: RecurringCadence;
  weekday: number | null;
  day_of_month: number | null;
  next_run: string;
  active: boolean;
  shipping_address: string | null;
  notes: string | null;
  created_at: string;
};

export type RecurringOrderItem = {
  id: string;
  recurring_order_id: string;
  product_id: string;
  quantity: number;
  unit_price_cents: number | null;
  ord: number;
};

export type RecurringOrderWithItems = RecurringOrder & {
  recurring_order_items: RecurringOrderItem[];
};

export async function listRecurringOrders(
  customerId: string,
): Promise<RecurringOrderWithItems[]> {
  const { data, error } = await supabase
    .from("recurring_orders")
    .select("*, recurring_order_items(*)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RecurringOrderWithItems[];
}

export type CreateRecurringOrderInput = {
  tenant_id: string;
  customer_id: string;
  name: string;
  cadence: RecurringCadence;
  weekday: number | null;
  day_of_month: number | null;
  next_run: string;
  shipping_address: string | null;
  notes: string | null;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price_cents?: number | null;
  }>;
};

export async function createRecurringOrder(
  input: CreateRecurringOrderInput,
): Promise<RecurringOrder> {
  const { data: ro, error } = await supabase
    .from("recurring_orders")
    .insert({
      tenant_id: input.tenant_id,
      customer_id: input.customer_id,
      name: input.name,
      cadence: input.cadence,
      weekday: input.weekday,
      day_of_month: input.day_of_month,
      next_run: input.next_run,
      shipping_address: input.shipping_address,
      notes: input.notes,
      active: true,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  if (input.items.length > 0) {
    const rows = input.items.map((it, idx) => ({
      recurring_order_id: (ro as { id: string }).id,
      product_id: it.product_id,
      quantity: it.quantity,
      unit_price_cents: it.unit_price_cents ?? null,
      ord: idx,
    }));
    const { error: itemsErr } = await supabase
      .from("recurring_order_items")
      .insert(rows);
    if (itemsErr) {
      await supabase
        .from("recurring_orders")
        .delete()
        .eq("id", (ro as { id: string }).id);
      throw new Error(itemsErr.message);
    }
  }
  return ro as RecurringOrder;
}

export async function setRecurringOrderActive(
  id: string,
  active: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("recurring_orders")
    .update({ active })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteRecurringOrder(id: string): Promise<void> {
  const { error } = await supabase.from("recurring_orders").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
