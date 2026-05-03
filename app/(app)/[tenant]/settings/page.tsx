"use client";

import { useTenant } from "@/lib/tenant-context";

import { BrandingForm } from "./_components/branding-form";

export default function SettingsPage() {
  const tenant = useTenant();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Inställningar</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Anpassa hur din portal ser ut för dig och ditt team.
        </p>
      </div>

      {tenant ? (
        <BrandingForm tenant={tenant} />
      ) : (
        <p className="text-sm text-neutral-500">Laddar…</p>
      )}
    </div>
  );
}
