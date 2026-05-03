"use client";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// ---------------------------------------------------------------------------
// Types — defined locally so we don't have to touch lib/database.types.ts
// ---------------------------------------------------------------------------

export type PurchaseOrderStatus = "draft" | "sent" | "received" | "cancelled";

export type Supplier = {
  id: string;
  tenant_id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SupplierInput = {
  tenant_id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export type PurchaseOrder = {
  id: string;
  tenant_id: string;
  supplier_id: string | null;
  status: PurchaseOrderStatus;
  reference: string | null;
  notes: string | null;
  created_at: string;
  received_at: string | null;
};

export type PurchaseOrderItem = {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
};

// Joined shape for listing.
export type PurchaseOrderRow = PurchaseOrder & {
  suppliers: { id: string; name: string } | null;
  purchase_order_items: { quantity: number; unit_cost: number }[];
};

// Joined shape for detail view (items include product name + sku).
export type PurchaseOrderItemWithProduct = PurchaseOrderItem & {
  products: {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    reorder_point: number;
  } | null;
};

export type PurchaseOrderDetail = PurchaseOrder & {
  suppliers: { id: string; name: string } | null;
  purchase_order_items: PurchaseOrderItemWithProduct[];
};

export type NewPurchaseOrderInput = {
  tenant_id: string;
  supplier_id: string | null;
  reference: string | null;
  notes: string | null;
  items: {
    product_id: string;
    quantity: number;
    unit_cost: number;
  }[];
};

// ---------------------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------------------

export async function listSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Supplier[];
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as Supplier | null;
}

export async function createSupplier(input: SupplierInput): Promise<Supplier> {
  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      tenant_id: input.tenant_id,
      name: input.name,
      contact_name: input.contact_name,
      email: input.email,
      phone: input.phone,
      notes: input.notes,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Supplier;
}

export async function updateSupplier(
  id: string,
  input: Omit<SupplierInput, "tenant_id">,
): Promise<Supplier> {
  const { data, error } = await supabase
    .from("suppliers")
    .update({
      name: input.name,
      contact_name: input.contact_name,
      email: input.email,
      phone: input.phone,
      notes: input.notes,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Supplier;
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// Returns count of "active" (draft + sent) POs per supplier id.
// Useful for the suppliers list view.
export async function countActivePosBySupplier(): Promise<
  Record<string, number>
> {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("supplier_id, status")
    .in("status", ["draft", "sent"]);
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { supplier_id: string | null }[]) {
    if (!row.supplier_id) continue;
    counts[row.supplier_id] = (counts[row.supplier_id] ?? 0) + 1;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Purchase orders
// ---------------------------------------------------------------------------

export async function listPurchaseOrders(): Promise<PurchaseOrderRow[]> {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select(
      "id, tenant_id, supplier_id, status, reference, notes, created_at, received_at, suppliers(id, name), purchase_order_items(quantity, unit_cost)",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PurchaseOrderRow[];
}

export async function getPurchaseOrder(
  id: string,
): Promise<PurchaseOrderDetail | null> {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select(
      "id, tenant_id, supplier_id, status, reference, notes, created_at, received_at, suppliers(id, name), purchase_order_items(id, purchase_order_id, product_id, quantity, unit_cost, products(id, name, sku, quantity, reorder_point))",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as unknown as PurchaseOrderDetail | null;
}

export async function createPurchaseOrder(
  input: NewPurchaseOrderInput,
): Promise<PurchaseOrder> {
  const { data: po, error: poErr } = await supabase
    .from("purchase_orders")
    .insert({
      tenant_id: input.tenant_id,
      supplier_id: input.supplier_id,
      reference: input.reference,
      notes: input.notes,
      status: "draft",
    })
    .select()
    .single();
  if (poErr) throw new Error(poErr.message);

  const order = po as PurchaseOrder;

  if (input.items.length > 0) {
    const rows = input.items.map((it) => ({
      purchase_order_id: order.id,
      product_id: it.product_id,
      quantity: Math.max(1, Math.floor(it.quantity)),
      unit_cost: Math.max(0, it.unit_cost),
    }));
    const { error: itemsErr } = await supabase
      .from("purchase_order_items")
      .insert(rows);
    if (itemsErr) {
      // Best-effort cleanup so we don't leave an empty PO behind.
      await supabase.from("purchase_orders").delete().eq("id", order.id);
      throw new Error(itemsErr.message);
    }
  }

  return order;
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  const { error } = await supabase
    .from("purchase_orders")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setPurchaseOrderStatus(
  id: string,
  status: PurchaseOrderStatus,
): Promise<void> {
  const { error } = await supabase
    .from("purchase_orders")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// Convenience wrappers — read intent at the call site.
export async function markSent(id: string): Promise<void> {
  return setPurchaseOrderStatus(id, "sent");
}

export async function markReceived(id: string): Promise<void> {
  // The DB trigger inserts the stock_movements rows.
  return setPurchaseOrderStatus(id, "received");
}

export async function markCancelled(id: string): Promise<void> {
  return setPurchaseOrderStatus(id, "cancelled");
}

// ---------------------------------------------------------------------------
// Auto-suggest line items based on reorder points.
// Returns suggested order quantities for products at or below their reorder
// point. Target stock = max(2 * reorder_point, reorder_point + 1) so we
// always order at least one even if reorder_point is 0.
// ---------------------------------------------------------------------------

export type SuggestedItem = {
  product_id: string;
  sku: string;
  name: string;
  current_quantity: number;
  reorder_point: number;
  suggested_quantity: number;
  unit_cost: number;
};

export async function suggestReorderItems(): Promise<SuggestedItem[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, sku, name, quantity, reorder_point, unit_price")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as {
    id: string;
    sku: string;
    name: string;
    quantity: number;
    reorder_point: number;
    unit_price: number;
  }[];
  const out: SuggestedItem[] = [];
  for (const p of rows) {
    if (p.quantity > p.reorder_point) continue;
    const target = Math.max(p.reorder_point * 2, p.reorder_point + 1, 1);
    const suggested = Math.max(1, target - p.quantity);
    out.push({
      product_id: p.id,
      sku: p.sku,
      name: p.name,
      current_quantity: p.quantity,
      reorder_point: p.reorder_point,
      suggested_quantity: suggested,
      // Default cost from unit_price as a starting point — user can edit.
      unit_cost: p.unit_price,
    });
  }
  return out;
}

// Helpers used by the UI.
export function purchaseOrderTotal(items: { quantity: number; unit_cost: number }[]): number {
  return items.reduce((acc, it) => acc + it.quantity * Number(it.unit_cost), 0);
}

export function statusLabel(status: PurchaseOrderStatus): string {
  switch (status) {
    case "draft":
      return "Utkast";
    case "sent":
      return "Skickad";
    case "received":
      return "Mottagen";
    case "cancelled":
      return "Avbruten";
  }
}
