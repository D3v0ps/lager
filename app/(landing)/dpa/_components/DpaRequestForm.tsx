"use client";

import { useState } from "react";

import { fieldHintClass, inputClass, labelClass } from "@/lib/form-classes";

/**
 * Pure client-side DPA-request form. We don't have a marketing-CRM endpoint
 * yet, so the submit handler opens the user's mail client with a pre-filled
 * mail to dpa@saldo.se. Replace with a fetch() to /api/dpa-requests when the
 * marketing pipeline lands.
 */
export function DpaRequestForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [orgNumber, setOrgNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Ange en giltig e-postadress.");
      return;
    }
    if (!name.trim() || !company.trim()) {
      setError("Namn och företag är obligatoriskt.");
      return;
    }

    const subject = `DPA-begäran från ${company.trim()}`;
    const bodyLines = [
      `Hej Saldo,`,
      ``,
      `Vi vill ta del av ert standard-DPA för signering.`,
      ``,
      `Namn: ${name.trim()}`,
      `Företag: ${company.trim()}`,
      orgNumber.trim() ? `Organisationsnummer: ${orgNumber.trim()}` : null,
      `E-post: ${trimmedEmail}`,
      notes.trim() ? `` : null,
      notes.trim() ? `Övrigt: ${notes.trim()}` : null,
      ``,
      `Tack på förhand!`,
    ]
      .filter((line): line is string => line !== null)
      .join("\n");

    const mailto = `mailto:dpa@saldo.se?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(bodyLines)}`;

    if (typeof window !== "undefined") {
      window.location.href = mailto;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="relative overflow-hidden rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.06] p-8 text-center"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-25 blur-3xl"
          style={{ background: "var(--brand-gradient)" }}
        />
        <div className="relative">
          <div className="mx-auto mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.704 5.29a.75.75 0 0 1 .006 1.06l-7.5 7.6a.75.75 0 0 1-1.07.001L3.29 8.99a.75.75 0 1 1 1.066-1.056l4.314 4.355 6.97-7.06a.75.75 0 0 1 1.064-.006Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Tack — vi hörs av snart.</h3>
          <p className="mt-2 text-sm text-foreground-muted max-w-md mx-auto leading-relaxed">
            Ditt e-postprogram öppnas med en färdig begäran till{" "}
            <span className="font-mono">dpa@saldo.se</span>. Skicka mejlet så
            har du en signerad PDF inom en arbetsdag. Hoppade mejlklienten över
            steget? Skriv direkt till{" "}
            <a
              href="mailto:dpa@saldo.se"
              className="text-foreground hover:underline"
            >
              dpa@saldo.se
            </a>
            .
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-6 inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.02] px-4 py-2 text-sm font-medium hover:bg-white/[0.06] transition-colors"
          >
            Skicka en till begäran
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-background-elevated/40 p-6 sm:p-8 space-y-6"
      noValidate
    >
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-md border border-red-400/30 bg-red-500/10 text-red-200 p-3 text-sm"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dpa_name" className={labelClass}>
            Namn
          </label>
          <input
            id="dpa_name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Anna Lindqvist"
            autoComplete="name"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="dpa_email" className={labelClass}>
            E-post
          </label>
          <input
            id="dpa_email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="anna@dittforetag.se"
            autoComplete="email"
            required
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dpa_company" className={labelClass}>
            Företag
          </label>
          <input
            id="dpa_company"
            name="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Ditt Företag AB"
            autoComplete="organization"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="dpa_org" className={labelClass}>
            Organisationsnummer{" "}
            <span className="text-foreground-muted/70 normal-case tracking-normal">
              (frivilligt)
            </span>
          </label>
          <input
            id="dpa_org"
            name="org_number"
            type="text"
            value={orgNumber}
            onChange={(e) => setOrgNumber(e.target.value)}
            placeholder="556677-8899"
            autoComplete="off"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="dpa_notes" className={labelClass}>
          Övrigt{" "}
          <span className="text-foreground-muted/70 normal-case tracking-normal">
            (frivilligt)
          </span>
        </label>
        <textarea
          id="dpa_notes"
          name="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Behöver ni en anpassad klausul, en annan signeringsplattform, eller har specifika frågor?"
          className={inputClass}
        />
        <p className={fieldHintClass}>
          Vi använder uppgifterna enbart för att skicka DPA-utkastet — ingen
          marknadsförings­utskick, inga cookies som följer dig mellan sajter.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <p className="text-xs text-foreground-muted">
          Eller mejla oss direkt:{" "}
          <a
            href="mailto:dpa@saldo.se"
            className="font-medium text-foreground hover:underline"
          >
            dpa@saldo.se
          </a>
        </p>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-foreground text-background px-5 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          Skicka begäran
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
