"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { createSubcontractor } from "@/lib/subcontractors";
import { useTenantState } from "@/lib/tenant-context";
import {
  Card,
  ErrorBanner,
  PageHeader,
  buttonClasses,
} from "@/app/_components/ui";
import { fieldHintClass, inputClass, labelClass } from "@/lib/form-classes";

/** Format an org-nr as user types: insert hyphen after the 6th digit. */
function formatOrgNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 6) return digits;
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

export default function NewSubcontractorPage() {
  const router = useRouter();
  const { tenant } = useParams<{ tenant: string }>();
  const tenantState = useTenantState();
  const tenantData = tenantState.tenant;

  const [companyName, setCompanyName] = useState("");
  const [orgNumber, setOrgNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hasFskatt, setHasFskatt] = useState(true);
  const [insuranceValidUntil, setInsuranceValidUntil] = useState("");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenantData) return;
    setError(null);
    setBusy(true);
    try {
      await createSubcontractor({
        tenant_id: tenantData.id,
        company_name: companyName.trim(),
        org_number: orgNumber.trim() || null,
        contact_name: contactName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        has_fskatt: hasFskatt,
        fskatt_verified_at: null,
        insurance_valid_until: insuranceValidUntil || null,
        notes: notes.trim() || null,
        active: true,
      });
      router.push(`/${tenant}/subcontractors`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        eyebrow="Saldo Bygg"
        title="Ny underentreprenör"
        subtitle="Lägg till en UE — F-skatt, försäkring och kontaktinfo behövs för byggprojekt."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <ErrorBanner>{error}</ErrorBanner>}

        <Card>
          <div className="px-5 sm:px-6 py-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-4">
              <div>
                <label htmlFor="company_name" className={labelClass}>
                  Företag
                </label>
                <input
                  id="company_name"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Bygg & Snickeri AB"
                  className={inputClass}
                  autoComplete="organization"
                />
              </div>
              <div>
                <label htmlFor="org_number" className={labelClass}>
                  Org-nr
                </label>
                <input
                  id="org_number"
                  value={orgNumber}
                  onChange={(e) =>
                    setOrgNumber(formatOrgNumber(e.target.value))
                  }
                  placeholder="555555-5555"
                  className={`${inputClass} font-mono tabular-nums`}
                  inputMode="numeric"
                  maxLength={11}
                />
                <p className={fieldHintClass}>Rekommenderas — kontrollera F-skatt på Skatteverket.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact_name" className={labelClass}>
                  Kontaktperson
                </label>
                <input
                  id="contact_name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Anna Andersson"
                  className={inputClass}
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Telefon
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="070-123 45 67"
                  className={inputClass}
                  autoComplete="tel"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                E-post
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kontakt@foretag.se"
                className={inputClass}
                autoComplete="email"
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="px-5 sm:px-6 py-5 space-y-5">
            <h3 className="text-base font-semibold">Compliance</h3>

            <label
              htmlFor="has_fskatt"
              className="flex items-start gap-3 rounded-md border border-white/10 bg-background-elevated/60 p-4 cursor-pointer hover:border-white/20 transition-colors"
            >
              <input
                id="has_fskatt"
                type="checkbox"
                checked={hasFskatt}
                onChange={(e) => setHasFskatt(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/30 bg-background-elevated text-amber-500 focus:ring-amber-500/40"
              />
              <span className="flex-1">
                <span className="block text-sm font-medium">
                  F-skattsedel finns
                </span>
                <span className={fieldHintClass + " mt-0.5"}>
                  UE måste ha F-skatt — annars riskerar du arbetsgivaransvar.
                </span>
              </span>
            </label>

            <div>
              <label htmlFor="insurance_valid_until" className={labelClass}>
                Försäkring giltig till
              </label>
              <input
                id="insurance_valid_until"
                type="date"
                value={insuranceValidUntil}
                onChange={(e) => setInsuranceValidUntil(e.target.value)}
                className={inputClass}
              />
              <p className={fieldHintClass}>
                Ansvarsförsäkring — varnar när den närmar sig utgång.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="px-5 sm:px-6 py-5">
            <label htmlFor="notes" className={labelClass}>
              Anteckningar
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Specialitet, samarbeten, prisbild…"
              className={inputClass}
            />
          </div>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className={buttonClasses("secondary", "md")}
          >
            Avbryt
          </button>
          <button
            type="submit"
            disabled={busy || !companyName.trim() || !tenantData}
            className={buttonClasses("primary", "md")}
          >
            {busy ? "Sparar…" : "Spara UE"}
          </button>
        </div>
      </form>
    </div>
  );
}
