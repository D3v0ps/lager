import Link from "next/link";
import type { Metadata } from "next";

import { ScrollReveal } from "../_components/ScrollReveal";
import { SaldoMark } from "@/app/_brand/Logo";

export const metadata: Metadata = {
  title: "Saldo Portal — B2B-portal för grossister & leverantörer",
  description:
    "Saldo Portal låter dina B2B-kunder logga in och beställa direkt — med avtalspriser, volymrabatter och återkommande beställningar. Inga mejlpingisar, inga konnektor-avgifter.",
};

const features = [
  {
    title: "Self-onboarding för nya kunder",
    description:
      "Låt nya grossister ansöka via en publik länk — företagsnamn, org-nr, kontaktperson. Du godkänner med en knapp, vi skickar magisk länk automatiskt.",
  },
  {
    title: "Avtalspriser per kund",
    description:
      "Sätt unika priser för Premium-kunder, kontraktskunder eller volymrabatter. Kund ser sitt egna pris i katalogen, kassan räknar automatiskt.",
  },
  {
    title: "Volymrabatter som räknas live",
    description:
      "Trösklar som '5 % från 10 000 kr' eller '10 % från 50 000 kr' — gäller per kund eller globalt. Kund ser besparing direkt i kassan.",
  },
  {
    title: "Återkommande beställningar",
    description:
      "Kund schemalägger 'leverans varje måndag' eller 'månadsvis den 1:a' — orderna skapas automatiskt som utkast i ditt vanliga orderflöde.",
  },
  {
    title: "Egen orderhistorik per kund",
    description:
      "Kontaktpersoner ser bara sina egna ordrar med status, leveransdatum och fakturor. Inget cross-tenant läckage — RLS från databasen och uppåt.",
  },
  {
    title: "Skickas direkt till ditt orderflöde",
    description:
      "Portalorder landar som 'utkast' i din vanliga order-vy. Du bekräftar, plockar och skickar — ingen ny rutin att lära sig.",
  },
];

const compareRows = [
  {
    feature: "Pris",
    saldo: "+400 kr/mån (på Operations-bas)",
    standalone: "Ofta 1 500–3 000 kr/mån",
  },
  {
    feature: "Self-onboarding (kund-ansökan)",
    saldo: "Ja — publik länk + en-klicks-godkännande",
    standalone: "Manuell setup per kund",
  },
  {
    feature: "Avtalspriser per kund",
    saldo: "Ja — obegränsade tier:s",
    standalone: "Vanligen begränsat eller dyrt tillägg",
  },
  {
    feature: "Återkommande beställningar",
    saldo: "Ja — kunden hanterar själv",
    standalone: "Manuell hantering",
  },
  {
    feature: "Webhooks vid order",
    saldo: "Ja — pluga in Slack, Klaviyo, eget system",
    standalone: "Ofta tillägg",
  },
  {
    feature: "Sömlös integration med lager + Fortnox",
    saldo: "Ja — del av plattformen",
    standalone: "Krävs extra konnektor",
  },
  {
    feature: "Whitelabel + custom domain",
    saldo: "Inkluderas i Enterprise-plan",
    standalone: "Vanligen tilläggs­avgift",
  },
];

const flow = [
  {
    step: "01",
    title: "Kund ansöker",
    body: "Du delar en länk: yourcompany.saldo.se/portal/apply/. Kunden fyller i företag och kontakt.",
  },
  {
    step: "02",
    title: "Du godkänner",
    body: "Ansökan landar i din portal-settings. Klick på 'Godkänn' skapar kunden + skickar magisk länk.",
  },
  {
    step: "03",
    title: "Kund beställer",
    body: "Kunden loggar in, ser din katalog med sina avtalspriser och lägger order — som hamnar i ditt vanliga orderflöde.",
  },
];

export default function PortalPage() {
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
                Saldo Portal — B2B-portal för leverantörer
              </div>
              <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]">
                Sluta ta order
                <br />
                <span className="brand-text">via mejl.</span>
              </h1>
              <p className="mt-6 text-lg text-foreground-muted max-w-2xl leading-relaxed">
                Låt dina B2B-kunder logga in och beställa direkt — med
                avtalspriser, volymrabatter och egen orderhistorik. Du sköter
                fortfarande plock och pack i ditt vanliga flöde.{" "}
                <span className="text-foreground font-semibold">
                  Slut på copy-paste från mejl till ordersystem.
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
                  <Check /> 14 dagar gratis
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check /> Inga konnektor-avgifter
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check /> Säg upp månadsvis
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ────────────── Flow ────────────── */}
      <section className="border-y border-white/5 bg-background-elevated/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
          <ScrollReveal>
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-rose-400 font-medium">
                Hur det funkar
              </p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1]">
                Tre steg från första kontakt till första order.
              </h2>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid md:grid-cols-3 gap-4">
            {flow.map((s, i) => (
              <ScrollReveal key={s.step} delay={i * 80}>
                <article className="h-full rounded-2xl border border-white/10 bg-background-elevated/40 p-6 sm:p-7 relative overflow-hidden">
                  <div
                    aria-hidden="true"
                    className="absolute top-3 right-4 text-5xl font-semibold tabular-nums opacity-10"
                    style={{
                      background: "var(--brand-gradient)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {s.step}
                  </div>
                  <p
                    className="text-[11px] uppercase tracking-[0.2em] font-medium"
                    style={{
                      background: "var(--brand-gradient)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    Steg {s.step}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm text-foreground-muted leading-relaxed">
                    {s.body}
                  </p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────── Features ────────────── */}
      <section id="funktioner" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-28">
          <ScrollReveal>
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-rose-400 font-medium">
                Funktioner
              </p>
              <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
                Allt en B2B-leverantör behöver.
              </h2>
              <p className="mt-5 text-lg text-foreground-muted leading-relaxed max-w-xl">
                Avtalspriser, återkommande beställningar, magisk-länk-login —
                allt designat för svenska grossister och leverantörer.
              </p>
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

      {/* ────────────── Comparison ────────────── */}
      <section className="border-y border-white/5 bg-background-elevated/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
          <ScrollReveal>
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-rose-400 font-medium">
                Saldo Portal vs standalone
              </p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1]">
                Inkluderat. Inte ett tillägg.
              </h2>
              <p className="mt-4 text-foreground-muted">
                Standalone B2B-portaler tar 1 500–3 000 kr/mån + per-användare,
                + Fortnox-konnektor. Saldo Portal är ett +400 kr-tillägg på
                Operations-grunden — samma databas, samma login.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-background-elevated/40">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
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
                        Saldo Portal
                      </th>
                      <th className="text-left px-5 sm:px-6 py-4 text-foreground-muted font-medium">
                        Standalone B2B-portal
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
                          {row.standalone}
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

      {/* ────────────── Pricing ────────────── */}
      <section id="priser" className="scroll-mt-20 border-t border-white/5">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-24 sm:py-28">
          <ScrollReveal>
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-rose-400 font-medium">
                Pris
              </p>
              <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
                +400 kr/mån.
                <br />
                <span className="text-foreground-muted">Som tillägg på Operations.</span>
              </h2>
              <p className="mt-5 text-lg text-foreground-muted max-w-xl mx-auto">
                Du behöver Saldo Operations i botten (från 500 kr/mån). Lägg
                till Portal när du är redo att låta dina kunder beställa
                själva. 14 dagar gratis prov.
              </p>
              <div className="mt-10 grid sm:grid-cols-3 gap-4 text-left">
                <Bullet>Obegränsat antal kund-kontakter</Bullet>
                <Bullet>Avtalspriser + volymrabatter</Bullet>
                <Bullet>Återkommande beställningar</Bullet>
                <Bullet>Self-onboarding (kund-ansökan)</Bullet>
                <Bullet>Webhooks vid order</Bullet>
                <Bullet>Inga konnektor-avgifter</Bullet>
              </div>
              <a
                href="mailto:hej@saldo.se?subject=Saldo%20Portal%20demo"
                className="mt-10 inline-flex items-center gap-2 rounded-md bg-foreground text-background px-6 py-3 text-base font-medium hover:bg-foreground/90"
              >
                Boka demo
              </a>
              <p className="mt-3 text-xs text-foreground-muted">
                eller mejla{" "}
                <a
                  href="mailto:hej@saldo.se"
                  className="text-foreground hover:underline"
                >
                  hej@saldo.se
                </a>
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ────────────── Footer ────────────── */}
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
      className="h-3.5 w-3.5 text-emerald-400"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.29a.75.75 0 0 1 .006 1.06l-7.5 7.6a.75.75 0 0 1-1.07.001L3.29 8.99a.75.75 0 1 1 1.066-1.056l4.314 4.355 6.97-7.06a.75.75 0 0 1 1.064-.006Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm">
      <svg
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
      <span>{children}</span>
    </p>
  );
}
