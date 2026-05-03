"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { getProduct } from "@/lib/data";
import { ProductForm } from "../../products/_components/product-form";
import type { Product } from "@/lib/database.types";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Laddar…</p>}>
      <EditProduct />
    </Suspense>
  );
}

function EditProduct() {
  const params = useSearchParams();
  const id = params.get("id");
  const { tenant } = useParams<{ tenant: string }>();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getProduct(id)
      .then(setProduct)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (!id) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4">
        Saknar produkt-id.
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4">
        {error}
      </div>
    );
  }
  if (product === undefined) {
    return <p className="text-sm text-neutral-500">Laddar…</p>;
  }
  if (product === null) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-semibold mb-2">Produkten hittades inte</h1>
        <Link
          href={`/${tenant}/`}
          className="inline-block rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 mt-4"
        >
          Tillbaka
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/${tenant}/product/?id=${product.id}`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← Tillbaka
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Redigera {product.name}</h1>
      </div>
      <ProductForm product={product} submitLabel="Spara ändringar" />
    </div>
  );
}
