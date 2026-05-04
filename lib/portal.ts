"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

// Loosely-typed view — portal columns/tables aren't in database.types.ts yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient() as unknown as SupabaseClient<any, "public", any>;

export type PortalCustomer = {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  billing_address: string | null;
  shipping_address: string | null;
};

export type PortalTenant = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  portal_welcome_text: string | null;
  b2b_portal_enabled: boolean;
};

export type PortalCatalogItem = {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  unit_price: number;
  customer_price: number | null;
  quantity: number;
  reorder_point: number;
};

export type PortalOrderRow = {
  id: string;
  reference: string | null;
  status: string;
  created_at: string;
  shipped_at: string | null;
  sales_order_items: { quantity: number; unit_price: number }[];
};

export type PortalRole = "admin" | "orderer";

export type PortalMembership = {
  customer_id: string;
  role: PortalRole;
  customer: PortalCustomer;
  tenant: PortalTenant;
};

export async function listMyMemberships(
  tenantSlug: string,
): Promise<PortalMembership[]> {
  const { data: tenant, error: tErr } = await supabase
    .from("tenants")
    .select(
      "id, slug, name, logo_url, primary_color, portal_welcome_text, b2b_portal_enabled",
    )
    .eq("slug", tenantSlug)
    .maybeSingle();
  if (tErr) throw new Error(tErr.message);
  if (!tenant) return [];

  const { data: rows, error } = await supabase
    .from("customer_users")
    .select(
      "customer_id, role, customers(id, tenant_id, name, email, billing_address, shipping_address)",
    );
  if (error) throw new Error(error.message);

  type Row = {
    customer_id: string;
    role: PortalRole;
    customers: PortalCustomer | null;
  };
  return ((rows ?? []) as unknown as Row[])
    .filter((r) => r.customers && r.customers.tenant_id === tenant.id)
    .map((r) => ({
      customer_id: r.customer_id,
      role: r.role,
      customer: r.customers as PortalCustomer,
      tenant: tenant as PortalTenant,
    }));
}

export async function listPortalCatalog(
  customerId: string,
): Promise<PortalCatalogItem[]> {
  const now = new Date().toISOString();
  const [{ data: products, error: pErr }, { data: prices, error: priceErr }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, sku, name, category, unit_price, quantity, reorder_point")
        .order("name", { ascending: true }),
      supabase
        .from("customer_price_lists")
        .select("product_id, unit_price, valid_from, valid_until")
        .eq("customer_id", customerId)
        .or(`valid_from.is.null,valid_from.lte.${now}`)
        .or(`valid_until.is.null,valid_until.gte.${now}`),
    ]);
  if (pErr) throw new Error(pErr.message);
  if (priceErr) throw new Error(priceErr.message);

  type PriceRow = {
    product_id: string;
    unit_price: number;
  };
  const priceMap = new Map<string, number>();
  for (const row of (prices ?? []) as PriceRow[]) {
    const cur = priceMap.get(row.product_id);
    const next = Number(row.unit_price);
    if (cur == null || next < cur) priceMap.set(row.product_id, next);
  }

  type ProductRow = {
    id: string;
    sku: string;
    name: string;
    category: string | null;
    unit_price: number;
    quantity: number;
    reorder_point: number;
  };
  return ((products ?? []) as ProductRow[]).map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    unit_price: Number(p.unit_price),
    customer_price: priceMap.get(p.id) ?? null,
    quantity: p.quantity,
    reorder_point: p.reorder_point,
  }));
}

export type PortalOrderDraft = {
  customer_id: string;
  tenant_id: string;
  reference: string | null;
  shipping_address: string | null;
  notes: string | null;
  items: { product_id: string; quantity: number; unit_price: number }[];
};

export async function placePortalOrder(
  draft: PortalOrderDraft,
): Promise<string> {
  const { data: order, error } = await supabase
    .from("sales_orders")
    .insert({
      tenant_id: draft.tenant_id,
      customer_id: draft.customer_id,
      reference: draft.reference,
      shipping_address: draft.shipping_address,
      notes: draft.notes,
      status: "draft",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const orderId = (order as { id: string }).id;

  if (draft.items.length > 0) {
    const rows = draft.items.map((it) => ({
      sales_order_id: orderId,
      product_id: it.product_id,
      quantity: it.quantity,
      unit_price: it.unit_price,
    }));
    const { error: itemsErr } = await supabase
      .from("sales_order_items")
      .insert(rows);
    if (itemsErr) {
      await supabase.from("sales_orders").delete().eq("id", orderId);
      throw new Error(itemsErr.message);
    }
  }
  return orderId;
}

export async function listPortalOrders(
  customerId: string,
): Promise<PortalOrderRow[]> {
  const { data, error } = await supabase
    .from("sales_orders")
    .select(
      "id, reference, status, created_at, shipped_at, sales_order_items(quantity, unit_price)",
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PortalOrderRow[];
}

export async function acceptPendingCustomerInvitations(): Promise<number> {
  const { data, error } = await supabase.rpc(
    "accept_pending_customer_invitations",
  );
  if (error) {
    console.warn("[portal] accept_pending_customer_invitations:", error.message);
    return 0;
  }
  return Number(data ?? 0);
}
