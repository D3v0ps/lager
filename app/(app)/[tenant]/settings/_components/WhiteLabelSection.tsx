"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { getMyRoleInTenant } from "@/lib/team";
import { isManager } from "@/lib/roles";
import { useTenantRefresh } from "@/lib/tenant-context";
import { Card, CardHeader, ErrorBanner, LoadingText } from "@/app/_components/ui";
import { fieldHintClass, inputClass, labelClass } from "@/lib/form-classes";
import type { Tenant, TenantUserRole } from "@/lib/database.types";

// White-label columns (white_label, custom_domain, support_email,
// support_phone, default_currency, default_locale) live on the tenants
// table (migration 0016) but aren't yet generated into Database. Cast
// the client to `any` so we can read/write them without TS noise — the
// columns exist in Postgres regardless of the typegen lag.
type AnyTenantRow = {
  white_label?: boolean | null;
  custom_domain?: string | null;
  support_email?: string | null;
  support_phone?: string | null;
  default_currency?: string | null;
  default_locale?: string | null;
};

const CURRENCY_OPTIONS = ["SEK", "EUR", "USD", "NOK"] as const;
const LOCALE_OPTIONS = [
  { value: "sv-SE", label: "Svenska (sv-SE)" },
  { value: "en-US", label: "English (en-US)" },
] as const;

type Props = {
  tenant: Tenant;
};

export function WhiteLabelSection({ tenant }: Props) {
  const refreshTenant = useTenantRefresh();
  const extras = tenant as Tenant & AnyTenantRow;

  const [whiteLabel, setWhiteLabel] = useState<boolean>(
    Boolean(extras.white_label),
  );
  const [customDomain, setCustomDomain] = useState<string>(
    extras.custom_domain ?? "",
  );
  const [supportEmail, setSupportEmail] = useState<string>(
    extras.support_email ?? "",
  );
  const [supportPhone, setSupportPhone] = useState<string>(
    extras.support_phone ?? "",
  );
  const [defaultCurrency, setDefaultCurrency] = useState<string>(
    extras.default_currency ?? "SEK",
  );
  const [defaultLocale, setDefaultLocale] = useState<string>(
    extras.default_locale ?? "sv-SE",
  );

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

  const canEdit = isManager(myRole);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmedDomain = customDomain.trim().toLowerCase();
    const trimmedEmail = supportEmail.trim();
    const trimmedPhone = supportPhone.trim();

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Support-e-post ser inte giltig ut.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient() as unknown as SupabaseClient<
        any,
        "public",
        any
      >;
      const { error: updateError } = await supabase
        .from("tenants")
        .update({
          white_label: whiteLabel,
          custom_domain: trimmedDomain || null,
          support_email: trimmedEmail || null,
          support_phone: trimmedPhone || null,
          default_currency: defaultCurrency,
          default_locale: defaultLocale,
        })
        .eq("id", tenant.id);
      if (updateError) throw new Error(updateError.message);
      await refreshTenant();
      setInfo("Sparat. White-label-inställningarna är aktiva.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (!roleLoaded) {
    return (
      <Card>
        <CardHeader title="White-label" />
        <div className="px-5 sm:px-6 py-5">
          <LoadingText />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="White-label"
        subtitle="Sälj Saldo under ert eget varumärke. Ange domän, support­kontakter och valuta för era kunder."
      />

      <div className="px-5 sm:px-6 py-5 space-y-5">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {info && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-md border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 p-3 text-sm"
          >
            {info}
          </div>
        )}

        {!canEdit ? (
          <p className="text-sm text-foreground-muted">
            Kontakta din admin för att ändra white-label-inställningar.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Toggle: hide Saldo branding */}
            <label
              htmlFor="white_label_toggle"
              className="flex items-start gap-4 rounded-lg border border-white/10 bg-background/60 p-4 cursor-pointer"
            >
              <button
                id="white_label_toggle"
                type="button"
                role="switch"
                aria-checked={whiteLabel}
                onClick={() => setWhiteLabel((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
                  whiteLabel ? "bg-amber-500/80" : "bg-white/15"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    whiteLabel ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
              <div className="min-w-0">
                <p className="text-sm font-medium">Dölj Saldo-branding</p>
                <p className="mt-1 text-xs text-foreground-muted leading-relaxed">
                  När detta är aktivt ersätts Saldos logotyp och namn med er
                  egen — på kund-portalen, i e-post och i fakturor. Använd
                  tillsammans med en egen domän nedan.
                </p>
              </div>
            </label>

            {/* Custom domain */}
            <div>
              <label htmlFor="custom_domain" className={labelClass}>
                Egen domän (CNAME)
              </label>
              <input
                id="custom_domain"
                name="custom_domain"
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="portal.dittforetag.se"
                autoComplete="off"
                className={inputClass}
              />
              <p className={fieldHintClass}>
                Peka en CNAME till{" "}
                <span className="font-mono text-foreground/80">saldo.app</span>{" "}
                — vi tar hand om SSL.
              </p>
            </div>

            {/* Support email + phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="support_email" className={labelClass}>
                  Support-e-post
                </label>
                <input
                  id="support_email"
                  name="support_email"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@dittforetag.se"
                  autoComplete="off"
                  className={inputClass}
                />
                <p className={fieldHintClass}>
                  Visas för era slutkunder vid frågor och support­ärenden.
                </p>
              </div>

              <div>
                <label htmlFor="support_phone" className={labelClass}>
                  Support-telefon
                </label>
                <input
                  id="support_phone"
                  name="support_phone"
                  type="tel"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="08-000 00 00"
                  autoComplete="off"
                  className={inputClass}
                />
                <p className={fieldHintClass}>
                  Frivilligt — lämna tomt för att bara visa e-post.
                </p>
              </div>
            </div>

            {/* Currency + locale */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="default_currency" className={labelClass}>
                  Standardvaluta
                </label>
                <select
                  id="default_currency"
                  name="default_currency"
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className={inputClass}
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <p className={fieldHintClass}>
                  Används för nya ordrar och offerter när inget annat anges.
                </p>
              </div>

              <div>
                <label htmlFor="default_locale" className={labelClass}>
                  Standardspråk
                </label>
                <select
                  id="default_locale"
                  name="default_locale"
                  value={defaultLocale}
                  onChange={(e) => setDefaultLocale(e.target.value)}
                  className={inputClass}
                >
                  {LOCALE_OPTIONS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <p className={fieldHintClass}>
                  Styr formatering av datum, valuta och e-postmallar.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
              >
                {busy ? "Sparar…" : "Spara white-label"}
              </button>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
}
