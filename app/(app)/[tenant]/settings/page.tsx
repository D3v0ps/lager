"use client";

import Link from "next/link";

import { useTenantState } from "@/lib/tenant-context";

import { BrandingForm } from "./_components/branding-form";

export default function SettingsPage() {
  const { status, tenant, error } = useTenantState();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Inställningar</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Anpassa hur din portal ser ut för dig och ditt team.
        </p>
      </div>

      {status === "loading" && (
        <p className="text-sm text-neutral-500">Laddar…</p>
      )}

      {status === "missing" && (
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 text-sm space-y-2">
          <p className="font-medium">Hittar inte kund-portalen.</p>
          <p>
            Antingen finns inte tenanten med slug i URL:en, eller så har ditt
            konto inte tillgång till den. Kontrollera att du loggat in på
            rätt portal eller be en admin lägga till dig.
          </p>
          <p>
            <Link href="/" className="underline">
              ← Till sajten
            </Link>
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4 text-sm space-y-2">
          <p className="font-medium">Kunde inte hämta tenant-info</p>
          <p className="font-mono text-xs">{error}</p>
        </div>
      )}

      {status === "ready" && <BrandingForm tenant={tenant} />}
    </div>
  );
}
