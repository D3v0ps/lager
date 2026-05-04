"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient() as unknown as SupabaseClient<any, "public", any>;

export type VolumeDiscount = {
  id: string;
  tenant_id: string;
  product_id: string | null;
  category: string | null;
  customer_id: string | null;
  min_quantity: number;
  discount_pct: number | null;
  unit_price_cents: number | null;
  active: boolean;
  created_at: string;
};

export type CreateVolumeDiscountInput = {
  tenant_id: string;
  product_id?: string | null;
  category?: string | null;
  customer_id?: string | null;
  min_quantity: number;
  discount_pct?: number | null;
  unit_price_cents?: number | null;
};

export async function listVolumeDiscounts(opts?: {
  productId?: string;
  customerId?: string;
}): Promise<VolumeDiscount[]> {
  let q = supabase
    .from("volume_discounts")
    .select("*")
    .order("min_quantity", { ascending: true });
  if (opts?.productId) q = q.eq("product_id", opts.productId);
  if (opts?.customerId) q = q.eq("customer_id", opts.customerId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as VolumeDiscount[];
}

export async function createVolumeDiscount(
  input: CreateVolumeDiscountInput,
): Promise<VolumeDiscount> {
  const { data, error } = await supabase
    .from("volume_discounts")
    .insert({
      tenant_id: input.tenant_id,
      product_id: input.product_id ?? null,
      category: input.category ?? null,
      customer_id: input.customer_id ?? null,
      min_quantity: input.min_quantity,
      discount_pct: input.discount_pct ?? null,
      unit_price_cents: input.unit_price_cents ?? null,
      active: true,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as VolumeDiscount;
}

export async function deleteVolumeDiscount(id: string): Promise<void> {
  const { error } = await supabase.from("volume_discounts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Apply discount tiers to a base price + quantity. Returns the unit-price
 * the customer should see for that quantity. Pure function — call from
 * portal catalog rendering.
 */
export function applyVolumeDiscount(
  basePriceCents: number,
  quantity: number,
  tiers: VolumeDiscount[],
): number {
  // Pick the highest-min_quantity tier that quantity meets.
  const matching = tiers
    .filter((t) => t.active && t.min_quantity <= quantity)
    .sort((a, b) => b.min_quantity - a.min_quantity);
  const tier = matching[0];
  if (!tier) return basePriceCents;
  if (tier.unit_price_cents != null) return tier.unit_price_cents;
  if (tier.discount_pct != null) {
    return Math.round(basePriceCents * (1 - tier.discount_pct / 100));
  }
  return basePriceCents;
}
