"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { Scanner } from "./_components/scanner";

export default function ScanPage() {
  const { tenant } = useParams<{ tenant: string }>();
  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/${tenant}/`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← Tillbaka
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Scanna</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Rikta kameran mot streckkoden för snabb justering.
        </p>
      </div>
      <Scanner tenant={tenant} />
    </div>
  );
}
