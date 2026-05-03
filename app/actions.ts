"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { MovementType } from "@/lib/database.types";

function asNumber(value: FormDataEntryValue | null, fallback = 0): number {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNullableString(value: FormDataEntryValue | null): string | null {
  const s = asString(value);
  return s === "" ? null : s;
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient();
  const sku = asString(formData.get("sku"));
  const name = asString(formData.get("name"));
  if (!sku || !name) {
    throw new Error("SKU och namn krävs");
  }
  const { error } = await supabase.from("products").insert({
    sku,
    name,
    category: asNullableString(formData.get("category")),
    unit_price: asNumber(formData.get("unit_price")),
    quantity: Math.max(0, Math.floor(asNumber(formData.get("quantity")))),
    reorder_point: Math.max(
      0,
      Math.floor(asNumber(formData.get("reorder_point"))),
    ),
    notes: asNullableString(formData.get("notes")),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect("/");
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      sku: asString(formData.get("sku")),
      name: asString(formData.get("name")),
      category: asNullableString(formData.get("category")),
      unit_price: asNumber(formData.get("unit_price")),
      reorder_point: Math.max(
        0,
        Math.floor(asNumber(formData.get("reorder_point"))),
      ),
      notes: asNullableString(formData.get("notes")),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath(`/products/${id}`);
  redirect(`/products/${id}`);
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect("/");
}

export async function recordMovement(productId: string, formData: FormData) {
  const supabase = await createClient();
  const type = asString(formData.get("type")) as MovementType;
  if (!["in", "out", "adjust"].includes(type)) {
    throw new Error("Ogiltig rörelsetyp");
  }
  const quantity = Math.floor(asNumber(formData.get("quantity")));
  if (type !== "adjust" && quantity <= 0) {
    throw new Error("Antal måste vara större än 0");
  }
  const { error } = await supabase.from("stock_movements").insert({
    product_id: productId,
    type,
    quantity,
    note: asNullableString(formData.get("note")),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/movements");
  redirect(`/products/${productId}`);
}
