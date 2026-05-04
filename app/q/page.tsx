"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import {
  acceptPublicQuote,
  getPublicQuoteByToken,
  type PublicQuote,
} from "@/lib/quotes";
import { formatCents, deductionLabel } from "@/lib/rot-rut";
import { formatDate } from "@/lib/format";
import { SaldoMark } from "@/app/_brand/Logo";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-sm text-foreground-muted">Laddar anbud…</p>
        </div>
      }
    >
      <PublicQuoteContent />
    </Suspense>
  );
}

function PublicQuoteContent() {
  const params = useSearchParams();
  const token = params.get("token");

  const [quote, setQuote] = useState<PublicQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [signerEmail, setSignerEmail] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Saknar anbuds-token i URL.");
      setLoading(false);
      return;
    }
    getPublicQuoteByToken(token)
      .then((q) => {
        if (!q) setError("Anbudet kunde inte hittas.");
        else setQuote(q);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setAcceptError(null);
    setAccepting(true);
    try {
      await acceptPublicQuote(token, signerEmail.trim());
      setAccepted(true);
    } catch (e) {
      setAcceptError(e instanceof Error ? e.message : String(e));
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-foreground-muted">Laddar anbud…</p>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="max-w-md text-center space-y-4">
          <SaldoMark className="h-10 w-10 mx-auto" />
          <h1 className="text-2xl font-semibold">
            {error ?? "Anbudet finns inte"}
          </h1>
          <p className="text-sm text-foreground-muted">
            Kontrollera länken eller kontakta avsändaren.
          </p>
        </div>
      </div>
    );
  }

  const isFinal =
    quote.status === "accepted" ||
    quote.status === "declined" ||
    quote.status === "expired" ||
    accepted;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full opacity-15 blur-3xl"
          style={{ background: "var(--brand-gradient)" }}
        />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2.5">
            {quote.tenant_logo_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={quote.tenant_logo_url}
                alt={quote.tenant_name}
                className="h-8 max-w-[10rem] object-contain"
              />
            ) : (
              <SaldoMark className="h-8 w-8" />
            )}
            <span className="font-semibold tracking-tight">
              {quote.tenant_name}
            </span>
          </div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-muted">
            Anbud {quote.reference ?? ""}
          </p>
        </header>

        <div className="rounded-2xl border border-white/10 bg-background-elevated/60 backdrop-blur-md shadow-2xl shadow-black/40 overflow-hidden">
          <div className="px-6 sm:px-10 py-8">
            <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-muted">
              {deductionLabel(quote.deduction_type)}
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
              {quote.title}
            </h1>
            {quote.customer_name && (
              <p className="mt-3 text-foreground-muted text-sm">
                Till: {quote.customer_name}
              </p>
            )}
            {quote.description && (
              <p className="mt-5 text-sm whitespace-pre-wrap leading-relaxed text-foreground/85">
                {quote.description}
              </p>
            )}
          </div>

          <div className="border-t border-white/5 divide-y divide-white/5">
            {quote.items.map((it, i) => (
              <div
                key={i}
                className="px-6 sm:px-10 py-4 flex items-baseline justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm">{it.description}</p>
                  <p className="text-[11px] text-foreground-muted">
                    {it.quantity} {it.unit ?? ""} ×{" "}
                    {formatCents(it.unit_price_cents)}
                    {it.deductible && quote.deduction_type
                      ? ` · ${quote.deduction_type.toUpperCase()}-grund`
                      : ""}
                  </p>
                </div>
                <p className="text-sm font-medium tabular-nums shrink-0">
                  {formatCents(it.quantity * it.unit_price_cents)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 px-6 sm:px-10 py-6 space-y-2 text-sm">
            <Row label="Subtotal" value={formatCents(quote.subtotal_cents)} />
            <Row label="Moms" value={formatCents(quote.vat_cents)} />
            <Row
              label="Totalt inkl moms"
              value={formatCents(quote.total_cents)}
              bold
            />
            {quote.deduction_type && (
              <Row
                label={`${quote.deduction_type.toUpperCase()}-avdrag (50 % på arbete)`}
                value={`− ${formatCents(quote.deduction_cents)}`}
                tone="emerald"
              />
            )}
            <div className="pt-3 border-t border-white/5">
              <div className="flex items-baseline justify-between">
                <span className="text-base font-medium">
                  {quote.deduction_type ? "Du betalar" : "Att betala"}
                </span>
                <span
                  className="text-3xl font-semibold tabular-nums tracking-tight"
                  style={{
                    background: "var(--brand-gradient)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {formatCents(quote.customer_pays_cents)}
                </span>
              </div>
              {quote.valid_until && (
                <p className="mt-2 text-[11px] text-foreground-muted">
                  Giltigt till {quote.valid_until}
                </p>
              )}
            </div>
          </div>

          {/* Accept block */}
          <div
            className="border-t border-white/5 px-6 sm:px-10 py-8 bg-background-elevated/30"
            id="accept"
          >
            {isFinal || quote.accepted_at ? (
              <div
                className="rounded-md border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 p-4"
                role="status"
              >
                <p className="font-medium text-sm">
                  {accepted || quote.accepted_at
                    ? "Tack — anbudet är godkänt!"
                    : quote.status === "declined"
                      ? "Anbudet har avböjts."
                      : "Anbudet är inte längre aktivt."}
                </p>
                {quote.accepted_at && quote.accepted_by_email && (
                  <p className="text-xs mt-1 text-emerald-200/80">
                    Godkänt {formatDate(quote.accepted_at)} av{" "}
                    {quote.accepted_by_email}.
                  </p>
                )}
                <p className="text-xs mt-2 text-emerald-200/70">
                  {quote.tenant_name} kommer att höra av sig om nästa steg.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAccept} className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold">Godkänn anbudet</h2>
                  <p className="text-xs text-foreground-muted mt-1">
                    Skriv in din e-post och klicka "Godkänn" — bindande
                    accept som loggas digitalt.
                  </p>
                </div>
                {acceptError && (
                  <div className="rounded-md border border-red-400/30 bg-red-500/10 text-red-200 p-3 text-sm">
                    {acceptError}
                  </div>
                )}
                <input
                  type="email"
                  required
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="din@epost.se"
                  className="block w-full rounded-md border border-white/10 bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                <button
                  type="submit"
                  disabled={accepting || !signerEmail.trim()}
                  className="w-full rounded-md bg-foreground text-background px-4 py-3 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50"
                >
                  {accepting ? "Godkänner…" : "Godkänn anbudet"}
                </button>
                <p className="text-[11px] text-center text-foreground-muted">
                  Genom att klicka godkänner du anbudet enligt villkoren.
                </p>
              </form>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-foreground-muted">
          Anbudet skickas digitalt via Saldo. Frågor? Kontakta{" "}
          <span className="text-foreground">{quote.tenant_name}</span>.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "emerald";
}) {
  return (
    <div
      className={`flex items-baseline justify-between ${
        tone === "emerald" ? "text-emerald-400" : ""
      }`}
    >
      <span className={bold ? "font-medium" : "text-foreground-muted"}>
        {label}
      </span>
      <span
        className={`tabular-nums ${bold ? "font-semibold" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
