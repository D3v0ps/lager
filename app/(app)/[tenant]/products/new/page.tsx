"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ProductForm } from "../_components/product-form";

export default function NewProductPage() {
  const { tenant } = useParams<{ tenant: string }>();
  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/${tenant}/`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← Tillbaka
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Ny produkt</h1>
      </div>
      <ProductForm submitLabel="Skapa produkt" />
    </div>
  );
}
