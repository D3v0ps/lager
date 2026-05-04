"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ScrollReveal } from "./ScrollReveal";

/**
 * Pricing — module-based platform pricing.
 *
 * Saldo prices three modules independently:
 *   • Operations (bas) — tiered by order volume (Starter / Pro / Enterprise)
 *   • Portal (tillägg) — flat add-on for customer self-onboarding etc.
 *   • Bygg (vertikal) — flat fee, unlimited users, complete project module
 *
 * The slider drives only Operations tier selection. Portal and Bygg are
 * priced independently and shown as add-on cards above the calculator.
 */

const operationsTiers = [
  {
    id: "starter",
    name: "Starter",
    price: 500,
    upTo: 500,
    users: 5,
    description: "För det mindre teamet som vill ha allt på plats från dag ett.",
    features: [
      "Upp till 500 ordrar/mån",
      "5 användare inkluderade",
      "Lager, order, inköp, rapporter",
      "Fortnox-koppling ingår",
      "E-post­support på svenska",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 1200,
    upTo: 5000,
    users: 15,
    description: "För den växande e-handlaren som börjar känna av volymen.",
    features: [
      "Upp till 5 000 ordrar/mån",
      "15 användare inkluderade",
      "Alla Operations-moduler",
      "Fortnox-koppling ingår",
      "Webhooks + API",
      "2FA + audit-log",
      "Prioriterad svensk support",
    ],
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 2500,
    upTo: Infinity,
    users: Infinity,
    description: "För etablerade verksamheter med större volymer och egna krav.",
    features: [
      "Obegränsade ordrar",
      "Obegränsade användare",
      "White-label-möjligheter",
      "Dedikerad kundansvarig",
      "SLA på svarstid och drift",
      "On-site onboarding",
    ],
  },
] as const;

const addons = [
  {
    id: "portal",
    name: "Saldo Portal",
    badge: "Tillägg",
    price: "+400",
    color: "rose" as const,
    blurb:
      "Kundvänd B2B-portal — låt kunderna logga in och beställa själva, med avtalspriser och egen orderhistorik.",
    features: [
      "Customer self-onboarding",
      "Volymrabatter per kund/avtal",
      "Återkommande beställningar",
      "Avtalspriser & egen artikel­katalog",
    ],
  },
  {
    id: "bygg",
    name: "Saldo Bygg",
    badge: "Vertikal",
    price: "1 200",
    color: "violet" as const,
    blurb:
      "Komplett projektstyrning för bygg och installation — flat månads­avgift, obegränsade användare. Hälften så dyrt som Bygglet.",
    features: [
      "ID06 + UE-register inbyggt",
      "KMA, egenkontroll, skyddsrond",
      "Projektmallar + Gantt-schema",
      "Obegränsade användare",
    ],
  },
];

// Comparison baseline for "what you'd otherwise pay" — Visma eGo Mini ~329kr
// + a typical Fortnox connector (Synca/Tickster/etc.) ~390kr/mån.
const ALT_BASELINE = 329 + 390;

export default function Pricing() {
  const [orders, setOrders] = useState(750);

  const tier = useMemo(
    () =>
      operationsTiers.find((t) => orders <= t.upTo) ??
      operationsTiers[operationsTiers.length - 1],
    [orders],
  );
  const savings = Math.max(0, ALT_BASELINE - tier.price);

  return (
    <section
      id="priser"
      className="scroll-mt-20 border-t border-white/5 bg-background"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-32">
        <ScrollReveal>
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-violet-400 font-medium">
              Priser
            </p>
            <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
              Modul för modul.
              <br />
              <span className="text-foreground-muted">
                Inga konnektor-avgifter.
              </span>
            </h2>
            <p className="mt-5 text-lg text-foreground-muted leading-relaxed max-w-xl">
              Du betalar för verksamhetens storlek — inte per användare. Lägg
              till Portal eller Bygg när du behöver. Säg upp månadsvis.
            </p>
          </div>
        </ScrollReveal>

        {/* Combine modules — small intro cards */}
        <ScrollReveal>
          <div className="mt-16">
            <div className="flex items-baseline justify-between flex-wrap gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-400 font-medium">
                Kombinera moduler
              </p>
              <p className="text-xs text-foreground-muted">
                Operations är basen — Portal och Bygg är tillägg
              </p>
            </div>
            <div className="mt-5 grid md:grid-cols-3 gap-4">
              {/* Operations summary card */}
              <div className="rounded-2xl border border-white/10 bg-background-elevated/40 p-6">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-amber-400 font-medium">
                    Saldo Operations
                  </p>
                  <span className="text-[10px] uppercase tracking-[0.18em] rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-foreground-muted">
                    Bas
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold tabular-nums tracking-tight">
                    från 500
                  </span>
                  <span className="text-sm text-foreground-muted">kr/mån</span>
                </div>
                <p className="mt-3 text-sm text-foreground-muted leading-relaxed">
                  Lager, order, inköp och rapporter. Tre nivåer baserade på
                  ordervolym — välj med kalkylatorn nedan.
                </p>
              </div>

              {/* Portal add-on card */}
              <div className="rounded-2xl border border-white/10 bg-background-elevated/40 p-6">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-rose-400 font-medium">
                    Saldo Portal
                  </p>
                  <span className="text-[10px] uppercase tracking-[0.18em] rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-foreground-muted">
                    Tillägg
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold tabular-nums tracking-tight">
                    +400
                  </span>
                  <span className="text-sm text-foreground-muted">kr/mån</span>
                </div>
                <p className="mt-3 text-sm text-foreground-muted leading-relaxed">
                  Kunder loggar in och beställer själva. Customer self-
                  onboarding, volymrabatter, återkommande beställningar.
                </p>
              </div>

              {/* Bygg vertical card */}
              <div className="rounded-2xl border border-white/10 bg-background-elevated/40 p-6">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-violet-400 font-medium">
                    Saldo Bygg
                  </p>
                  <span className="text-[10px] uppercase tracking-[0.18em] rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-foreground-muted">
                    Vertikal
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold tabular-nums tracking-tight">
                    1 200
                  </span>
                  <span className="text-sm text-foreground-muted">
                    kr/mån, alla användare
                  </span>
                </div>
                <p className="mt-3 text-sm text-foreground-muted leading-relaxed">
                  Komplett bygg-vertikal. ID06, UE-register, KMA, Gantt och
                  ROT/RUT — flat avgift.{" "}
                  <Link
                    href="/bygg/"
                    className="text-foreground hover:underline underline-offset-4"
                  >
                    Se /bygg →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Operations calculator */}
        <ScrollReveal>
          <div className="mt-16 rounded-2xl border border-white/10 bg-background-elevated/40 p-6 sm:p-10">
            <div className="mb-6 flex items-baseline justify-between flex-wrap gap-2">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-400 font-medium">
                Operations-kalkylator
              </p>
              <p className="text-xs text-foreground-muted">
                Driver bara Operations-nivån
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <label
                  htmlFor="orders-slider"
                  className="text-xs uppercase tracking-[0.2em] text-foreground-muted"
                >
                  Ordrar per månad
                </label>
                <p className="mt-2 text-5xl sm:text-6xl font-semibold tabular-nums tracking-tight">
                  {orders >= 5000 ? "5 000+" : orders.toLocaleString("sv-SE")}
                </p>
                <input
                  id="orders-slider"
                  type="range"
                  min={50}
                  max={5000}
                  step={50}
                  value={orders}
                  onChange={(e) => setOrders(Number(e.target.value))}
                  aria-label="Ordrar per månad"
                  className="mt-6 w-full accent-amber-500"
                />
                <div className="flex justify-between text-[11px] text-foreground-muted mt-2 tabular-nums">
                  <span>50</span>
                  <span>1 000</span>
                  <span>2 500</span>
                  <span>5 000+</span>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-background p-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
                    Rekommenderad Operations-plan
                  </p>
                  <span
                    className="text-xs font-medium"
                    style={{
                      background: "var(--brand-gradient)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {tier.name}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-5xl font-semibold tabular-nums tracking-tight">
                    {tier.price.toLocaleString("sv-SE")}
                  </span>
                  <span className="text-foreground-muted">kr/mån</span>
                </div>
                {savings > 0 && (
                  <p className="mt-3 text-sm text-emerald-400">
                    Du sparar ~{savings.toLocaleString("sv-SE")} kr/mån vs
                    Visma + extern Fortnox-konnektor.
                  </p>
                )}
                <Link
                  href="/demo/"
                  className="mt-6 inline-flex w-full justify-center rounded-md bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors"
                >
                  Boka demo med {tier.name}
                </Link>
                <p className="mt-3 text-[11px] text-foreground-muted text-center">
                  14 dagar gratis · ingen kortuppgift
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Operations tier table */}
        <ScrollReveal>
          <div className="mt-16">
            <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted font-medium">
              Saldo Operations — alla nivåer
            </p>
            <div className="mt-5 grid lg:grid-cols-3 gap-4">
              {operationsTiers.map((plan) => {
                const isHighlight = "highlight" in plan && plan.highlight;
                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl border p-7 ${
                      isHighlight
                        ? "border-white/30 bg-background-elevated/60"
                        : "border-white/10 bg-background-elevated/30"
                    }`}
                  >
                    {isHighlight && (
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
                        {plan.price.toLocaleString("sv-SE")}
                      </span>
                      <span className="text-sm text-foreground-muted">
                        kr/mån
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-foreground-muted leading-relaxed min-h-12">
                      {plan.description}
                    </p>

                    <Link
                      href="/demo/"
                      className={`mt-6 inline-flex w-full justify-center rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                        isHighlight
                          ? "bg-foreground text-background hover:bg-foreground/90"
                          : "border border-white/15 hover:bg-white/[0.05]"
                      }`}
                    >
                      {plan.name === "Enterprise" ? "Kontakta oss" : "Kom igång"}
                    </Link>

                    <ul className="mt-7 space-y-3 text-sm">
                      {plan.features.map((feat) => (
                        <li
                          key={feat}
                          className="flex items-start gap-2.5 text-foreground/85"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-4 w-4 mt-0.5 text-emerald-400 shrink-0"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.704 5.29a.75.75 0 0 1 .006 1.06l-7.5 7.6a.75.75 0 0 1-1.07.001L3.29 8.99a.75.75 0 1 1 1.066-1.056l4.314 4.355 6.97-7.06a.75.75 0 0 1 1.064-.006Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* Add-on detail strip */}
        <ScrollReveal>
          <div className="mt-12 grid md:grid-cols-2 gap-4">
            {addons.map((a) => (
              <div
                key={a.id}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-background-elevated/30 p-7"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl opacity-15"
                  style={{
                    background:
                      a.color === "rose"
                        ? "radial-gradient(circle, #F43F5E, transparent 60%)"
                        : "radial-gradient(circle, #8B5CF6, transparent 60%)",
                  }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-[11px] uppercase tracking-[0.2em] font-medium ${
                        a.color === "rose" ? "text-rose-400" : "text-violet-400"
                      }`}
                    >
                      {a.name}
                    </p>
                    <span className="text-[10px] uppercase tracking-[0.18em] rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-foreground-muted">
                      {a.badge}
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-4xl font-semibold tabular-nums tracking-tight">
                      {a.price}
                    </span>
                    <span className="text-sm text-foreground-muted">
                      kr/mån
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-foreground-muted leading-relaxed">
                    {a.blurb}
                  </p>
                  <ul className="mt-5 space-y-2.5 text-sm">
                    {a.features.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-start gap-2.5 text-foreground/85"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-4 w-4 mt-0.5 text-emerald-400 shrink-0"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 5.29a.75.75 0 0 1 .006 1.06l-7.5 7.6a.75.75 0 0 1-1.07.001L3.29 8.99a.75.75 0 1 1 1.066-1.056l4.314 4.355 6.97-7.06a.75.75 0 0 1 1.064-.006Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <p className="mt-12 text-center text-base font-medium">
          Inga per-användarkostnader. Inga konnektor-avgifter. Inga
          överraskningar.
        </p>
        <p className="mt-2 text-sm text-foreground-muted text-center">
          Alla planer: 14 dagar gratis, inga konnektor-avgifter, månadsvis
          uppsägning. Priser exkl. moms.
        </p>
      </div>
    </section>
  );
}
