"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

// We define the new tables locally (per file boundary rules) and cast the
// supabase client to a loosely-typed view so PostgREST chains type-check
// against the customer / sales_order shapes below instead of complaining
// that the tables aren't present in lib/database.types.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient() as unknown as SupabaseClient<any, "public", any>;

// ---------------------------------------------------------------------------
// Types — defined locally to avoid touching lib/database.types.ts.
// ---------------------------------------------------------------------------

export type Customer = {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  org_number: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerInput = {
  tenant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  org_number: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  notes: string | null;
};

export type OrderStatus =
  | "draft"
  | "confirmed"
  | "picking"
  | "shipped"
  | "cancelled";

export const ORDER_STATUS_VALUES: readonly OrderStatus[] = [
  "draft",
  "confirmed",
  "picking",
  "shipped",
  "cancelled",
] as const;

export type SalesOrder = {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  reference: string | null;
  status: OrderStatus;
  shipping_address: string | null;
  notes: string | null;
  created_at: string;
  shipped_at: string | null;
};

export type SalesOrderItem = {
  id: string;
  sales_order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
};

export type SalesOrderItemDraft = {
  product_id: string;
  quantity: number;
  unit_price: number;
};

export type SalesOrderItemWithProduct = SalesOrderItem & {
  products: {
    name: string;
    sku: string;
    quantity: number;
  } | null;
};

export type SalesOrderListRow = SalesOrder & {
  customers: { name: string } | null;
  sales_order_items: { quantity: number; unit_price: number }[];
};

export type SalesOrderWithRelations = SalesOrder & {
  customers: Customer | null;
  sales_order_items: SalesOrderItemWithProduct[];
};

export type CustomerWithOrderCount = Customer & {
  order_count: number;
};

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

export function statusLabel(status: OrderStatus): string {
  switch (status) {
    case "draft":
      return "Utkast";
    case "confirmed":
      return "Bekräftad";
    case "picking":
      return "Plockas";
    case "shipped":
      return "Skickad";
    case "cancelled":
      return "Avbruten";
  }
}

export function statusBadgeClasses(status: OrderStatus): string {
  switch (status) {
    case "draft":
      return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
    case "confirmed":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300";
    case "picking":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300";
    case "shipped":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
    case "cancelled":
      return "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300";
  }
}

export function orderTotal(
  items: { quantity: number; unit_price: number }[],
): number {
  return items.reduce((acc, it) => acc + it.quantity * it.unit_price, 0);
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export async function listCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Customer[];
}

export async function listCustomersWithOrderCount(): Promise<
  CustomerWithOrderCount[]
> {
  // Two queries — simpler than nested PostgREST joins and stays within a
  // tenant via RLS automatically.
  const [customers, orders] = await Promise.all([
    listCustomers(),
    supabase.from("sales_orders").select("customer_id"),
  ]);
  if (orders.error) throw new Error(orders.error.message);
  const counts = new Map<string, number>();
  for (const row of orders.data ?? []) {
    if (!row.customer_id) continue;
    counts.set(row.customer_id, (counts.get(row.customer_id) ?? 0) + 1);
  }
  return customers.map((c) => ({
    ...c,
    order_count: counts.get(c.id) ?? 0,
  }));
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Customer | null) ?? null;
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .insert({
      tenant_id: input.tenant_id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      org_number: input.org_number,
      billing_address: input.billing_address,
      shipping_address: input.shipping_address,
      notes: input.notes,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Customer;
}

export async function updateCustomer(
  id: string,
  input: Omit<CustomerInput, "tenant_id">,
): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .update({
      name: input.name,
      email: input.email,
      phone: input.phone,
      org_number: input.org_number,
      billing_address: input.billing_address,
      shipping_address: input.shipping_address,
      notes: input.notes,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Customer;
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Sales orders
// ---------------------------------------------------------------------------

export async function listOrders(): Promise<SalesOrderListRow[]> {
  const { data, error } = await supabase
    .from("sales_orders")
    .select(
      "id, tenant_id, customer_id, reference, status, shipping_address, notes, created_at, shipped_at, customers(name), sales_order_items(quantity, unit_price)",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SalesOrderListRow[];
}

export async function listOrdersForCustomer(
  customerId: string,
): Promise<SalesOrderListRow[]> {
  const { data, error } = await supabase
    .from("sales_orders")
    .select(
      "id, tenant_id, customer_id, reference, status, shipping_address, notes, created_at, shipped_at, customers(name), sales_order_items(quantity, unit_price)",
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SalesOrderListRow[];
}

export async function getOrder(
  id: string,
): Promise<SalesOrderWithRelations | null> {
  const { data, error } = await supabase
    .from("sales_orders")
    .select(
      "id, tenant_id, customer_id, reference, status, shipping_address, notes, created_at, shipped_at, customers(*), sales_order_items(id, sales_order_id, product_id, quantity, unit_price, products(name, sku, quantity))",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as SalesOrderWithRelations | null) ?? null;
}

export type CreateOrderInput = {
  tenant_id: string;
  customer_id: string | null;
  reference: string | null;
  shipping_address: string | null;
  notes: string | null;
  items: SalesOrderItemDraft[];
};

export async function createOrder(
  input: CreateOrderInput,
): Promise<SalesOrder> {
  const { data: order, error } = await supabase
    .from("sales_orders")
    .insert({
      tenant_id: input.tenant_id,
      customer_id: input.customer_id,
      reference: input.reference,
      shipping_address: input.shipping_address,
      notes: input.notes,
      status: "draft",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  if (input.items.length > 0) {
    const rows = input.items.map((it) => ({
      sales_order_id: (order as SalesOrder).id,
      product_id: it.product_id,
      quantity: it.quantity,
      unit_price: it.unit_price,
    }));
    const { error: itemsErr } = await supabase
      .from("sales_order_items")
      .insert(rows);
    if (itemsErr) {
      // best-effort cleanup so we don't leave an empty order around
      await supabase
        .from("sales_orders")
        .delete()
        .eq("id", (order as SalesOrder).id);
      throw new Error(itemsErr.message);
    }
  }

  return order as SalesOrder;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<SalesOrder> {
  const { data, error } = await supabase
    .from("sales_orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as SalesOrder;
}

export async function addOrderItem(
  orderId: string,
  item: SalesOrderItemDraft,
): Promise<SalesOrderItem> {
  const { data, error } = await supabase
    .from("sales_order_items")
    .insert({
      sales_order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as SalesOrderItem;
}

export async function removeOrderItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from("sales_order_items")
    .delete()
    .eq("id", itemId);
  if (error) throw new Error(error.message);
}

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase.from("sales_orders").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Reference suggestion: SO-YYYY-NNN where NNN = (count this year) + 1.
// Best-effort, runs against the current tenant via RLS.
// ---------------------------------------------------------------------------

export async function suggestOrderReference(): Promise<string> {
  const year = new Date().getFullYear();
  const startIso = new Date(`${year}-01-01T00:00:00.000Z`).toISOString();
  const { count, error } = await supabase
    .from("sales_orders")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startIso);
  const next = (error || count == null ? 0 : count) + 1;
  return `SO-${year}-${String(next).padStart(3, "0")}`;
}
