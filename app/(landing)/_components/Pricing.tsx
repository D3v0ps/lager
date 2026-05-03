"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ScrollReveal } from "./ScrollReveal";

/**
 * Pricing — volume-aware calculator on top, full tier comparison below.
 *
 * The slider drives a live calculation: given a monthly order volume,
 * we recommend a plan and show the price + what you'd save vs the typical
 * Visma-eGo + Fortnox-connector setup. All numbers are illustrative and
 * match the tier table below.
 */

const tiers = [
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
      "Alla moduler — lager, order, inköp, rapporter",
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
      "Alla moduler",
      "Fortnox-koppling ingår",
      "Prioriterad svensk support",
      "Onboarding-call med en människa",
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
      "Dedikerad kundansvarig",
      "SLA på svarstid och drift",
      "On-site onboarding",
    ],
  },
] as const;

// Comparison baseline for "what you'd otherwise pay" — Visma eGo Mini ~329kr
// + a typical Fortnox connector (Synca/Tickster/etc.) ~390kr/mån.
const ALT_BASELINE = 329 + 390;

export default function Pricing() {
  const [orders, setOrders] = useState(750);

  const tier = useMemo(
    () => tiers.find((t) => orders <= t.upTo) ?? tiers[tiers.length - 1],
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
              Flata priser.
              <br />
              <span className="text-foreground-muted">
                Inga konnektor-avgifter.
              </span>
            </h2>
            <p className="mt-5 text-lg text-foreground-muted leading-relaxed max-w-xl">
              Du betalar för verksamhetens storlek — inte per användare. Säg
              upp när du vill, ingen bindningstid.
            </p>
          </div>
        </ScrollReveal>

        {/* Calculator */}
        <ScrollReveal>
          <div className="mt-12 rounded-2xl border border-white/10 bg-background-elevated/40 p-6 sm:p-10">
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
                    Rekommenderad plan
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

        {/* Tier table — kept as fallback / detailed view */}
        <ScrollReveal>
          <div className="mt-16 grid lg:grid-cols-3 gap-4">
            {tiers.map((plan) => {
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
        </ScrollReveal>

        <p className="mt-10 text-center text-base font-medium">
          Inga per-användarkostnader. Inga konnektor-avgifter. Inga
          överraskningar.
        </p>
        <p className="mt-2 text-sm text-foreground-muted text-center">
          Alla priser anges exklusive moms. Sägs upp månadsvis.
        </p>
      </div>
    </section>
  );
}
