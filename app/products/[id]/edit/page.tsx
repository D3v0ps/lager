import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { updateProduct } from "@/app/actions";
import { ProductForm } from "@/app/products/_components/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!product) notFound();

  const action = updateProduct.bind(null, product.id);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/products/${product.id}`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← Tillbaka
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Redigera {product.name}</h1>
      </div>
      <ProductForm
        action={action}
        product={product}
        submitLabel="Spara ändringar"
      />
    </div>
  );
}
