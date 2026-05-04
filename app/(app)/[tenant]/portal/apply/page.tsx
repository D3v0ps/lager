"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { submitCustomerApplication } from "@/lib/customer-applications";
import { SaldoMark } from "@/app/_brand/Logo";
import { Card, CardHeader, ErrorBanner } from "@/app/_components/ui";
import { fieldHintClass, inputClass, labelClass } from "@/lib/form-classes";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PortalApplyPage() {
  const params = useParams<{ tenant: string }>();
  const tenant = params.tenant;

  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [orgNumber, setOrgNumber] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [sameShipping, setSameShipping] = useState(true);
  const [shippingAddress, setShippingAddress] = useState("");
  const [message, setMessage] = useState("");
  const [requestedCategoriesText, setRequestedCategoriesText] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const supplierLabel = useMemo(
    () => (tenant ? tenant.charAt(0).toUpperCase() + tenant.slice(1) : ""),
    [tenant],
  );

  function parseCategories(text: string): string[] {
    return text
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = applicantEmail.trim();
    const trimmedCompany = companyName.trim();

    if (!trimmedCompany) {
      setError("Ange företagsnamn.");
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError("Ange en giltig e-postadress.");
      return;
    }

    setBusy(true);
    try {
      const effectiveShipping = sameShipping
        ? billingAddress
        : shippingAddress;
      await submitCustomerApplication({
        tenant_slug: tenant,
        applicant_name: applicantName.trim(),
        applicant_email: trimmedEmail,
        applicant_phone: applicantPhone.trim() || null,
        company_name: trimmedCompany,
        org_number: orgNumber.trim() || null,
        billing_address: billingAddress.trim() || null,
        shipping_address: effectiveShipping.trim() || null,
        message: message.trim() || null,
        requested_categories: parseCategories(requestedCategoriesText),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full opacity-20 blur-3xl animate-ambient"
          style={{ background: "var(--brand-gradient)" }}
        />
        <div
          className="absolute -bottom-40 -right-40 h-[24rem] w-[24rem] rounded-full opacity-15 blur-3xl"
          style={{ background: "var(--brand-gradient)" }}
        />
      </div>

      <div className="relative flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-2xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 group mb-8"
            aria-label="Saldo startsida"
          >
            <SaldoMark className="h-8 w-8 transition-transform duration-300 group-hover:rotate-3" />
            <span className="font-semibold text-xl tracking-tight">Saldo</span>
          </Link>

          {submitted ? (
            <Card className="p-6 sm:p-8 space-y-3" variant="elevated">
              <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-muted">
                Ansökan mottagen
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                Tack {applicantName ? applicantName.split(" ")[0] : ""}!
              </h1>
              <p
                role="status"
                aria-live="polite"
                className="text-sm text-foreground-muted"
              >
                Tack! Vi hör av oss inom 1–2 arbetsdagar.
              </p>
              <p className="text-sm text-foreground-muted">
                Vi har tagit emot din ansökan om att bli kund hos{" "}
                <span className="text-foreground font-medium">
                  {supplierLabel}
                </span>
                . När vi godkänt ansökan får du en inloggningslänk på{" "}
                <span className="text-foreground font-medium">
                  {applicantEmail}
                </span>
                .
              </p>
              <div className="pt-2">
                <Link
                  href={`/${tenant}/portal/login/`}
                  className="inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/[0.05]"
                >
                  Till portalens inloggning
                </Link>
              </div>
            </Card>
          ) : (
            <Card variant="elevated">
              <CardHeader
                title={
                  <>
                    <span className="block text-[11px] uppercase tracking-[0.2em] text-foreground-muted font-medium mb-1">
                      Kundansökan
                    </span>
                    <span className="text-xl font-semibold tracking-tight">
                      Bli kund hos {supplierLabel}
                    </span>
                  </>
                }
                subtitle="Fyll i formuläret så återkommer vi inom 1–2 arbetsdagar med en inloggningslänk."
              />
              <form
                onSubmit={handleSubmit}
                className="px-5 sm:px-6 py-6 space-y-6"
                aria-describedby={error ? "apply-error" : undefined}
                noValidate
              >
                {error && <ErrorBanner id="apply-error">{error}</ErrorBanner>}

                <fieldset className="space-y-4">
                  <legend className="text-xs uppercase tracking-[0.15em] text-foreground-muted font-medium">
                    Om dig
                  </legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="applicant_name" className={labelClass}>
                        Ditt namn
                      </label>
                      <input
                        id="applicant_name"
                        type="text"
                        autoComplete="name"
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        placeholder="Anna Andersson"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="applicant_email" className={labelClass}>
                        E-post
                      </label>
                      <input
                        id="applicant_email"
                        type="email"
                        autoComplete="email"
                        required
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        placeholder="anna@dittforetag.se"
                        className={inputClass}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="applicant_phone" className={labelClass}>
                        Telefon (valfritt)
                      </label>
                      <input
                        id="applicant_phone"
                        type="tel"
                        autoComplete="tel"
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        placeholder="070-123 45 67"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </fieldset>

                <fieldset className="space-y-4">
                  <legend className="text-xs uppercase tracking-[0.15em] text-foreground-muted font-medium">
                    Företag
                  </legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="company_name" className={labelClass}>
                        Företagsnamn
                      </label>
                      <input
                        id="company_name"
                        type="text"
                        autoComplete="organization"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Andersson & Söner AB"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="org_number" className={labelClass}>
                        Org-nummer
                      </label>
                      <input
                        id="org_number"
                        type="text"
                        inputMode="numeric"
                        value={orgNumber}
                        onChange={(e) => setOrgNumber(e.target.value)}
                        placeholder="555555-5555"
                        className={inputClass}
                      />
                      <p className={fieldHintClass}>
                        Tio siffror med eller utan bindestreck.
                      </p>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="space-y-4">
                  <legend className="text-xs uppercase tracking-[0.15em] text-foreground-muted font-medium">
                    Adresser
                  </legend>
                  <div>
                    <label htmlFor="billing_address" className={labelClass}>
                      Faktureringsadress
                    </label>
                    <textarea
                      id="billing_address"
                      rows={3}
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      placeholder={`Storgatan 1\n123 45 Storstad`}
                      className={inputClass}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-foreground-muted select-none">
                    <input
                      type="checkbox"
                      checked={sameShipping}
                      onChange={(e) => setSameShipping(e.target.checked)}
                      className="h-4 w-4 rounded border-white/15 bg-background-elevated/60 text-amber-500 focus:ring-amber-500/40"
                    />
                    Samma som faktureringsadress
                  </label>
                  {!sameShipping && (
                    <div>
                      <label
                        htmlFor="shipping_address"
                        className={labelClass}
                      >
                        Leveransadress
                      </label>
                      <textarea
                        id="shipping_address"
                        rows={3}
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder={`Lagervägen 9\n123 45 Storstad`}
                        className={inputClass}
                      />
                    </div>
                  )}
                </fieldset>

                <fieldset className="space-y-4">
                  <legend className="text-xs uppercase tracking-[0.15em] text-foreground-muted font-medium">
                    Behov
                  </legend>
                  <div>
                    <label
                      htmlFor="requested_categories"
                      className={labelClass}
                    >
                      Sortiment ni är intresserade av
                    </label>
                    <input
                      id="requested_categories"
                      type="text"
                      value={requestedCategoriesText}
                      onChange={(e) =>
                        setRequestedCategoriesText(e.target.value)
                      }
                      placeholder="Verktyg, Förbrukning, Skruv"
                      className={inputClass}
                    />
                    <p className={fieldHintClass}>
                      Separera med kommatecken.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="message" className={labelClass}>
                      Meddelande
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Berätta lite om vad ni gör och varför ni vill bli kund hos oss"
                      className={inputClass}
                    />
                  </div>
                </fieldset>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                  <p className="text-[11px] text-foreground-muted">
                    Genom att skicka in godkänner du att{" "}
                    <span className="text-foreground">{supplierLabel}</span>{" "}
                    behandlar dina uppgifter för att hantera ansökan.
                  </p>
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-60"
                  >
                    {busy ? "Skickar…" : "Skicka ansökan"}
                  </button>
                </div>
              </form>
            </Card>
          )}

          <p className="mt-6 text-center text-xs text-foreground-muted">
            Redan kund?{" "}
            <Link
              href={`/${tenant}/portal/login/`}
              className="hover:text-foreground hover:underline underline-offset-2"
            >
              Logga in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
