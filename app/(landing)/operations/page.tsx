import Link from "next/link";
import type { Metadata } from "next";

import { ScrollReveal } from "../_components/ScrollReveal";
import { SaldoMark } from "@/app/_brand/Logo";

export const metadata: Metadata = {
  title: "Saldo Operations — lager, order, inköp för svenska e-handlare",
  description:
    "Operations är basen i Saldo: lager, order, inköp, frakt och rapporter — synkat med Fortnox. Streckkods­scanning, beställnings­förslag och en UI som faktiskt är snabb.",
};

const features = [
  {
    title: "Lager med streckkods­scanning",
    description:
      "Scanna direkt från mobilens kamera — ingen app att installera. Multi-lokation, varianter, lågsaldo-bevakning. Saldot stämmer på alla skärmar.",
  },
  {
    title: "Order-flöde utan dubbelregistrering",
    description:
      "Webshop-ordrar in, plocka, packa, skicka — utan att skriva något två gånger. Manuella ordrar, returer och B2B-fakturor i samma flöde.",
  },
  {
    title: "Inköp med beställnings­förslag",
    description:
      "Saldo räknar ut vad du behöver fylla på baserat på era egna reorder-punkter. Skicka inköpsorder till leverantör med ett klick, ta emot leveranser från mobilen.",
  },
  {
    title: "Frakt direkt från ordern",
    description:
      "Etiketter och spårningsnummer via Fraktjakt-integration — ingen separat inloggning, inget klipp-och-klistra (rullar Q3 2026).",
  },
  {
    title: "Rapporter som faktiskt används",
    description:
      "Lagervärde över tid, marginal per artikel, dödlager, top-säljare. Beslut byggda på data — inte magkänsla.",
  },
  {
    title: "Fortnox-koppling ingår",
    description:
      "Artiklar, kunder, fakturor och lagervärde synkas bidirektionellt. Bokför som vanligt — Saldo håller siffrorna i takt.",
  },
];

const compareRows = [
  {
    feature: "Pris (3-användarnivå)",
    saldo: "500 kr/mån",
    visma: "ca 779 kr/mån + per användare",
    fortnox: "Endast bokföring — separat lager-app krävs",
  },
  {
    feature: "Per-användarpris",
    saldo: "Inget — flat per tier",
    visma: "ca 80–120 kr/användare/mån",
    fortnox: "—",
  },
  {
    feature: "Mobil streckkods­scanner",
    saldo: "Ja — i webbläsaren, ingen app",
    visma: "Tilläggsmodul",
    fortnox: "Nej",
  },
  {
    feature: "Beställnings­förslag",
    saldo: "Auto — baserat på reorder-punkter",
    visma: "Manuell prognos",
    fortnox: "Nej",
  },
  {
    feature: "Konnektor-avgifter",
    saldo: "0 kr — inkluderat",
    visma: "190–500 kr/mån",
    fortnox: "—",
  },
  {
    feature: "Implementations­tid",
    saldo: "1–3 dagar",
    visma: "4–8 veckor",
    fortnox: "—",
  },
  {
    feature: "Modern UX (sub-100 ms)",
    saldo: "Ja",
    visma: "Nej",
    fortnox: "Delvis",
  },
];

const tiers = [
  {
    name: "Starter",
    price: "500 kr",
    period: "/mån",
    audience: "Mindre team som börjar bygga rutinerna",
    features: [
      "Upp till 500 ordrar/mån",
      "5 användare inkluderade",
      "Lager, order, inköp, rapporter",
      "Fortnox-koppling ingår",
      "E-postsupport på svenska",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "1 200 kr",
    period: "/mån",
    audience: "Den växande e-handlaren som börjar känna av volymen",
    features: [
      "Upp till 5 000 ordrar/mån",
      "15 användare inkluderade",
      "Alla Operations-moduler",
      "Webhooks + publikt API",
      "2FA + audit-log",
      "Prioriterad svensk support",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "2 500 kr",
    period: "/mån",
    audience: "Etablerad verksamhet med större volymer och egna krav",
    features: [
      "Obegränsade ordrar",
      "Obegränsade användare",
      "White-label + custom domain",
      "Dedikerad kundansvarig",
      "SLA på svarstid och drift",
      "On-site onboarding",
    ],
    highlight: false,
  },
];

export default function OperationsPage() {
  return (
    <>
      {/* ────────────── Hero ────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-40 h-[40rem] opacity-20 blur-3xl"
        >
          <div
            className="mx-auto h-full w-3/4 max-w-5xl rounded-full"
            style={{ background: "var(--brand-gradient)" }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-20">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground transition-colors mb-8"
          >
            ← Saldo
          </Link>
          <ScrollReveal>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur px-3 py-1 text-xs text-foreground-muted">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--brand-gradient)" }}
                />
                Saldo Operations — bas-modulen
              </div>
              <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]">
                Lager. Order. Inköp.
                <br />
                <span className="brand-text">Synkat med Fortnox.</span>
              </h1>
              <p className="mt-6 text-lg text-foreground-muted max-w-2xl leading-relaxed">
                Operations är det dagliga navet — synkat med Fortnox i
                bakgrunden. Streckkods­scanning, automatiska
                beställnings­förslag, mobil-first UI som verkligen är snabb.{" "}
                <span className="text-foreground font-semibold">
                  Inga konnektor-avgifter, inga per-användartillägg.
                </span>
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#priser"
                  className="inline-flex items-center gap-2 rounded-md bg-foreground text-background px-5 py-3 text-sm font-medium hover:bg-foreground/90"
                >
                  Boka demo
                </a>
                <a
                  href="#funktioner"
                  className="inline-flex items-center gap-2 rounded-md border border-white/15 px-5 py-3 text-sm font-medium hover:bg-white/[0.05]"
                >
                  Se funktionerna
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-foreground-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Check /> Fortnox-koppling ingår
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check /> 14 dagar gratis
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check /> Säg upp månadsvis
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ────────────── Comparison ────────────── */}
      <section className="border-y border-white/5 bg-background-elevated/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
          <ScrollReveal>
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-400 font-medium">
                Saldo vs alternativen
              </p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1]">
                Bättre än Visma. Snabbare att rulla ut.
              </h2>
              <p className="mt-4 text-foreground-muted">
                Visma eGo är robust men byggd 2010 — och tar betalt per
                användare. Fortnox sköter bokföringen utmärkt men har inget
                lager-flöde. Saldo Operations sitter mitt-emellan: modern
                UX, flat pris, allt som behövs för dagliga driften.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-background-elevated/40">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="text-left px-5 sm:px-6 py-4 text-xs uppercase tracking-[0.15em] text-foreground-muted font-medium">
                        Funktion
                      </th>
                      <th
                        className="text-left px-5 sm:px-6 py-4 font-semibold"
                        style={{
                          background: "var(--brand-gradient)",
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          color: "transparent",
                        }}
                      >
                        Saldo Operations
                      </th>
                      <th className="text-left px-5 sm:px-6 py-4 text-foreground-muted font-medium">
                        Visma eGo
                      </th>
                      <th className="text-left px-5 sm:px-6 py-4 text-foreground-muted font-medium">
                        Endast Fortnox
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareRows.map((row, i) => (
                      <tr
                        key={row.feature}
                        className={
                          i < compareRows.length - 1
                            ? "border-b border-white/5"
                            : ""
                        }
                      >
                        <td className="px-5 sm:px-6 py-4 text-sm font-medium">
                          {row.feature}
                        </td>
                        <td className="px-5 sm:px-6 py-4 text-sm text-foreground">
                          {row.saldo}
                        </td>
                        <td className="px-5 sm:px-6 py-4 text-sm text-foreground-muted">
                          {row.visma}
                        </td>
                        <td className="px-5 sm:px-6 py-4 text-sm text-foreground-muted">
                          {row.fortnox}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ────────────── Features ────────────── */}
      <section id="funktioner" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-28">
          <ScrollReveal>
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-400 font-medium">
                Funktioner
              </p>
              <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
                Allt som behövs.
                <br />
                <span className="text-foreground-muted">Inget mer.</span>
              </h2>
            </div>
          </ScrollReveal>
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 60}>
                <article className="h-full rounded-2xl border border-white/10 bg-background-elevated/40 p-6 sm:p-7">
                  <div
                    className="h-9 w-9 rounded-md mb-4"
                    style={{
                      background: "var(--brand-gradient)",
                      opacity: 0.85,
                    }}
                  />
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
                    {f.description}
                  </p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────── Pricing tiers ────────────── */}
      <section id="priser" className="scroll-mt-20 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-28">
          <ScrollReveal>
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-400 font-medium">
                Priser
              </p>
              <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
                Tre nivåer.
                <br />
                <span className="text-foreground-muted">Inga tilläggs­avgifter.</span>
              </h2>
              <p className="mt-5 text-lg text-foreground-muted leading-relaxed max-w-xl">
                Du betalar för verksamhetens storlek — inte per användare.
                14 dagar gratis prov, säg upp månadsvis.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid lg:grid-cols-3 gap-4">
            {tiers.map((plan) => (
              <ScrollReveal key={plan.name}>
                <div
                  className={`relative h-full rounded-2xl border p-7 ${
                    plan.highlight
                      ? "border-white/30 bg-background-elevated/60"
                      : "border-white/10 bg-background-elevated/30"
                  }`}
                >
                  {plan.highlight && (
                    <span
                      className="absolute -top-3 left-7 inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-background"
                      style={{ background: "var(--brand-gradient)" }}
                    >
                      Mest populär
                    </span>
                  )}
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-4xl font-semibold tracking-tight tabular-nums">
                      {plan.price}
                    </span>
                    <span className="text-sm text-foreground-muted">
                      {plan.period}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-foreground-muted leading-relaxed min-h-12">
                    {plan.audience}
                  </p>
                  <a
                    href="mailto:hej@saldo.se?subject=Saldo%20Operations%20demo"
                    className={`mt-6 inline-flex w-full justify-center rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                      plan.highlight
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "border border-white/15 hover:bg-white/[0.05]"
                    }`}
                  >
                    {plan.name === "Enterprise" ? "Kontakta oss" : "Boka demo"}
                  </a>

                  <ul className="mt-7 space-y-3 text-sm">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2.5 text-foreground/85"
                      >
                        <Check />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-foreground-muted">
            Behöver du B2B-portal eller projektstyrning?{" "}
            <Link
              href="/portal/"
              className="text-foreground hover:underline underline-offset-4"
            >
              Saldo Portal
            </Link>{" "}
            och{" "}
            <Link
              href="/bygg/"
              className="text-foreground hover:underline underline-offset-4"
            >
              Saldo Bygg
            </Link>{" "}
            är tillägg på samma plattform.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <SaldoMark className="h-7 w-7" />
            <span>Saldo</span>
          </Link>
          <p className="text-xs text-foreground-muted">
            <a href="mailto:hej@saldo.se" className="hover:text-foreground">
              hej@saldo.se
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}

function Check() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4 mt-0.5 text-emerald-400 shrink-0"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.296a1 1 0 0 1 0 1.408l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 1 1 1.414-1.414L8.5 12.086l6.793-6.79a1 1 0 0 1 1.411 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
