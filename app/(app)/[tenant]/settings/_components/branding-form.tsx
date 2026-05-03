"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { getMyRoleInTenant } from "@/lib/team";
import { isManager } from "@/lib/roles";
import { useTenantRefresh } from "@/lib/tenant-context";
import { ErrorBanner, LoadingText } from "@/app/_components/ui";
import { inputClass, labelClass } from "@/lib/form-classes";
import type { Tenant, TenantUserRole } from "@/lib/database.types";

const supabase = createClient();

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_COLOR = "#171717";

function normalizeHex(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

type Props = {
  tenant: Tenant;
};

export function BrandingForm({ tenant }: Props) {
  const refreshTenant = useTenantRefresh();
  const [logoUrl, setLogoUrl] = useState(tenant.logo_url ?? "");
  const [primaryColor, setPrimaryColor] = useState(
    tenant.primary_color ?? "",
  );
  const [logoError, setLogoError] = useState(false);
  const [myRole, setMyRole] = useState<TenantUserRole | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getMyRoleInTenant(tenant.id).then((result) => {
      if (!active) return;
      if (result.status === "ok") {
        setMyRole(result.role);
      } else {
        setError(`Kunde inte hämta din roll: ${result.error}`);
        setMyRole(null);
      }
      setRoleLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [tenant.id]);

  // Reset the broken-image flag whenever the URL changes.
  useEffect(() => {
    setLogoError(false);
  }, [logoUrl]);

  const canEdit = isManager(myRole);
  const colorForPicker =
    primaryColor && HEX_RE.test(primaryColor) ? primaryColor : DEFAULT_COLOR;
  const showLogoPreview = logoUrl.trim().length > 0 && !logoError;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmedLogo = logoUrl.trim();
    const trimmedColor = primaryColor.trim();

    if (trimmedColor && !HEX_RE.test(trimmedColor)) {
      setError("Färgen måste vara en hex-kod, t.ex. #1a73e8");
      return;
    }

    setBusy(true);
    try {
      const { error: updateError } = await supabase
        .from("tenants")
        .update({
          logo_url: trimmedLogo || null,
          primary_color: trimmedColor || null,
        })
        .eq("id", tenant.id);
      if (updateError) throw new Error(updateError.message);
      // Re-fetch into TenantContext so the sidebar logo / brand color
      // pick up the change without a manual reload.
      await refreshTenant();
      setInfo("Sparat. Ändringarna syns nu i sidofältet.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (!roleLoaded) {
    return <LoadingText />;
  }

  if (!canEdit) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Branding</h2>
        <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-sm text-neutral-600 dark:text-neutral-400">
          Kontakta din admin för att ändra branding.
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-neutral-500">Logotyp</dt>
          <dd>
            {tenant.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="h-12 max-w-full object-contain"
              />
            ) : (
              <span className="text-neutral-500">Ingen logotyp</span>
            )}
          </dd>
          <dt className="text-neutral-500">Primärfärg</dt>
          <dd className="flex items-center gap-2">
            {tenant.primary_color ? (
              <>
                <span
                  aria-hidden
                  className="inline-block h-5 w-5 rounded border border-neutral-300 dark:border-neutral-700"
                  style={{ backgroundColor: tenant.primary_color }}
                />
                <span className="font-mono">{tenant.primary_color}</span>
              </>
            ) : (
              <span className="text-neutral-500">Ingen färg</span>
            )}
          </dd>
        </dl>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Branding</h2>

      {error && <ErrorBanner>{error}</ErrorBanner>}
      {info && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-md border border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800 p-3 text-sm"
        >
          {info}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
          <div>
            <label htmlFor="logo_url" className={labelClass}>
              Logotyp-URL
            </label>
            <input
              id="logo_url"
              name="logo_url"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.svg"
              className={inputClass}
            />
            <p className="text-xs text-neutral-500 mt-1">
              Länk till en bild — t.ex. en SVG eller PNG du har på din
              webbplats. Lämna tomt för att använda Saldo-namnet.
            </p>
          </div>
          <div className="flex items-center justify-center min-w-[8rem] h-20 rounded-md border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-3">
            {showLogoPreview ? (
              <img
                src={logoUrl}
                alt={tenant.name}
                className="max-h-12 max-w-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-sm text-neutral-500">
                {logoError ? "Bilden gick inte att läsa in" : "Ingen logotyp"}
              </span>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="primary_color_hex" className={labelClass}>
            Primärfärg
          </label>
          <div className="flex items-center gap-2">
            <input
              id="primary_color_picker"
              name="primary_color_picker"
              type="color"
              value={colorForPicker}
              onChange={(e) => setPrimaryColor(e.target.value)}
              aria-label="Välj primärfärg"
              className="h-10 w-12 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 cursor-pointer"
            />
            <input
              id="primary_color_hex"
              name="primary_color_hex"
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(normalizeHex(e.target.value))}
              placeholder="#1a73e8"
              maxLength={7}
              className={`${inputClass} font-mono max-w-[10rem]`}
            />
            {primaryColor && (
              <button
                type="button"
                onClick={() => setPrimaryColor("")}
                className="text-sm text-neutral-500 hover:underline"
              >
                Återställ
              </button>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Används för knappar och länkar i din portal.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {busy ? "Sparar…" : "Spara"}
          </button>
        </div>
      </form>
    </section>
  );
}
