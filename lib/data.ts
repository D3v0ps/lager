"use client";

import { createClient } from "@/lib/supabase/client";
import type {
  MovementType,
  Product,
  StockMovement,
} from "@/lib/database.types";

const supabase = createClient();

export type MovementWithProduct = StockMovement & {
  products: { name: string; sku: string } | null;
};

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export type ProductInput = {
  tenant_id: string;
  sku: string;
  name: string;
  category: string | null;
  unit_price: number;
  quantity?: number;
  reorder_point: number;
  notes: string | null;
};

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      tenant_id: input.tenant_id,
      sku: input.sku,
      name: input.name,
      category: input.category,
      unit_price: input.unit_price,
      quantity: Math.max(0, Math.floor(input.quantity ?? 0)),
      reorder_point: Math.max(0, Math.floor(input.reorder_point)),
      notes: input.notes,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateProduct(
  id: string,
  input: Omit<ProductInput, "quantity" | "tenant_id">,
): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .update({
      sku: input.sku,
      name: input.name,
      category: input.category,
      unit_price: input.unit_price,
      reorder_point: Math.max(0, Math.floor(input.reorder_point)),
      notes: input.notes,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export type MovementInput = {
  productId: string;
  type: MovementType;
  quantity: number;
  note: string | null;
};

export async function recordMovement(input: MovementInput): Promise<void> {
  const { error } = await supabase.from("stock_movements").insert({
    product_id: input.productId,
    type: input.type,
    quantity: input.quantity,
    note: input.note,
  });
  if (error) throw new Error(error.message);
}

export async function listProductMovements(
  productId: string,
  limit = 50,
): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listAllMovements(
  limit = 100,
): Promise<MovementWithProduct[]> {
  const { data, error } = await supabase
    .from("stock_movements")
    .select(
      "id, product_id, type, quantity, note, created_at, products(name, sku)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as MovementWithProduct[];
}
