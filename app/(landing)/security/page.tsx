import Link from "next/link";
import type { Metadata } from "next";

import { ScrollReveal } from "../_components/ScrollReveal";
import { SaldoMark } from "@/app/_brand/Logo";

export const metadata: Metadata = {
  title: "Säkerhet & GDPR — Saldo",
  description:
    "Multi-tenant isolation via Postgres RLS, krypterad backup dagligen, EU-region (Frankfurt). Saldo är byggt för enterprise från första migrationen.",
};

const trustBadges = [
  {
    label: "Data i EU",
    detail: "Frankfurt — aldrig utanför EES",
    accent: "amber" as const,
  },
  {
    label: "Krypterad i vila och transit",
    detail: "AES-256 i Postgres, TLS 1.3 över nätet",
    accent: "rose" as const,
  },
  {
    label: "Daglig krypterad backup",
    detail: "30 dagars rolling backup, point-in-time-recovery",
    accent: "violet" as const,
  },
];

const protections = [
  {
    title: "Multi-tenant isolation via Postgres RLS",
    body: "Varje tabell skyddas av Row-Level Security-policys. En kunds rader är osynliga för en annan — på databasnivå, inte i applikationskoden. Vi har 100+ RLS-policys som granskas vid varje migration.",
  },
  {
    title: "Plattform-admin separerad från tenant-data",
    body: "Migration 0011 introducerade en strikt separation: plattform-administratörer kan inte läsa tenant-data utan ett uttryckligt impersonate-event som loggas i audit-loggen. Inga \"god mode\"-konton.",
  },
  {
    title: "2-faktor (TOTP) tillgängligt för alla användare",
    body: "TOTP-baserad 2FA via valfri authenticator-app — ingen SMS-baserad fallback (notoriskt sårbar för SIM-swap). Backup-koder genereras vid aktivering.",
  },
  {
    title: "Audit-logg för känsliga händelser",
    body: "Inloggningar, rolländringar, datadelning, API-nyckel-skapande, betalningsändringar — allt loggas oföränderligt med användare, IP och tidsstämpel. Loggen är skrivskyddad även för plattform-admin.",
  },
  {
    title: "Webhooks signerade med HMAC-SHA256",
    body: "Varje utgående webhook signeras med en delad hemlighet och tidsstämpel. Mottagaren verifierar signaturen och avvisar replays äldre än 5 minuter — så ni vet säkert att händelsen kom från Saldo.",
  },
  {
    title: "API-nycklar lagrade som SHA256-hash",
    body: "När en API-nyckel genereras visas den en gång och lagras sedan som SHA256-hash. Ett databasläckage avslöjar aldrig nycklarna i klartext — rotation tar mindre än en minut.",
  },
];

const compliance = [
  {
    eyebrow: "GDPR",
    title: "Dataägarskap, portabilitet och radering",
    body: "Ni är personuppgiftsansvarig — vi är personuppgiftsbiträde. Export av all kunddata i strukturerat format (JSON + CSV) sker från självservice-panelen. Radering är slutgiltig efter 30 dagars karens; anonymisering av historiska transaktioner finns för bokföringskrav.",
  },
  {
    eyebrow: "DPA",
    title: "Personuppgiftsbiträdesavtal",
    body: "Standard-DPA enligt EU-kommissionens modellklausuler signeras vid begäran. Underbiträden (Supabase i Frankfurt, GatewayAPI för SMS) listas öppet och uppdateras med 30 dagars varsel.",
    cta: { href: "/dpa", label: "Läs mer om DPA" },
  },
  {
    eyebrow: "SOC 2",
    title: "Type II — rapport Q3 2026",
    body: "Saldo befinner sig i en pågående SOC 2 Type II-revision via en oberoende auditor. Stage 1-rapporten är klar; Type II-rapporten landar Q3 2026. Vi delar gärna senaste status under en NDA.",
  },
];

const incidentSteps = [
  {
    when: "Inom 24 timmar",
    label: "Incident-rapport till alla berörda kunder",
    body: "Vid en bekräftad säkerhetsincident skickar vi ett första meddelande inom 24 timmar — även om utredningen pågår. Inga tystade veckor.",
  },
  {
    when: "Live",
    label: "Statussida för drift och incidenter",
    body: "status.saldo.se uppdateras kontinuerligt vid störningar. Prenumerera på e-post eller RSS för automatiska aviseringar.",
  },
  {
    when: "Direkt",
    label: "security@saldo.se — ansvarig disclosure",
    body: "Hittat en sårbarhet? Mejla oss krypterat (PGP-nyckel finns på adressen). Vi svarar inom 24 timmar och har ett bug bounty-program i pipeline.",
  },
];

export default function SecurityPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-40 h-[40rem] opacity-25 blur-3xl"
        >
          <div
            className="mx-auto h-full w-3/4 max-w-5xl rounded-full"
            style={{ background: "var(--brand-gradient)" }}
          />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background"
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-20">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground transition-colors mb-8"
          >
            <span aria-hidden="true">←</span> Saldo
          </Link>

          <ScrollReveal>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur px-3 py-1 text-xs text-foreground-muted">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--brand-gradient)" }}
                />
                Säkerhet, GDPR och drift
              </div>
              <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]">
                Säkerhet &amp; GDPR.
                <br />
                <span className="brand-text">
                  Byggt för enterprise från första migrationen.
                </span>
              </h1>
              <p className="mt-6 text-lg text-foreground-muted max-w-2xl leading-relaxed">
                Saldo körs på Supabase i Frankfurt — er data lämnar aldrig EES.
                Vi har RLS på varenda tabell, signerade webhooks, audit-logg
                som inte ens vi kan ändra, och en SOC 2-rapport på väg. Här är
                detaljerna — utan vaga marknadsfraser.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="mailto:security@saldo.se"
                  className="inline-flex items-center gap-2 rounded-md bg-foreground text-background px-5 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors"
                >
                  Kontakta security-teamet
                </a>
                <Link
                  href="/dpa"
                  className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/[0.02] backdrop-blur px-5 py-3 text-sm font-medium hover:bg-white/[0.06] transition-colors"
                >
                  Begär signerat DPA
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* Trust badges */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {trustBadges.map((badge, i) => (
              <ScrollReveal key={badge.label} delay={i * 80}>
                <article className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-background-elevated/40 p-6 sm:p-7">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full opacity-25 blur-3xl"
                    style={{ background: "var(--brand-gradient)" }}
                  />
                  <div className="relative">
                    <div
                      className="h-9 w-9 rounded-md mb-4"
                      style={{
                        background: "var(--brand-gradient)",
                        opacity: 0.85,
                      }}
                    />
                    <h3 className="text-lg font-semibold tracking-tight">
                      {badge.label}
                    </h3>
                    <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
                      {badge.detail}
                    </p>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How we protect your data */}
      <section className="border-t border-white/5 bg-background-elevated/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-28">
          <ScrollReveal>
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-rose-400 font-medium">
                Tekniska kontroller
              </p>
              <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
                Hur vi skyddar
                <br />
                <span className="text-foreground-muted">er data.</span>
              </h2>
              <p className="mt-5 text-lg text-foreground-muted leading-relaxed max-w-xl">
                Konkreta kontroller, inga vaga löften. Allt nedan finns att
                granska i koden — varje migration är offentlig för plattform-
                admin och delas på begäran med revisorer.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-4">
            {protections.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 60}>
                <article className="h-full rounded-2xl border border-white/10 bg-background-elevated/40 p-6 sm:p-7 hover:border-white/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <CheckBadge />
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold tracking-tight">
                        {p.title}
                      </h3>
                      <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
                        {p.body}
                      </p>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-28">
          <ScrollReveal>
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-violet-400 font-medium">
                Compliance
              </p>
              <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
                GDPR, DPA och SOC 2.
              </h2>
              <p className="mt-5 text-lg text-foreground-muted leading-relaxed max-w-xl">
                Allt det formella som inköp och juridik behöver — utan att vi
                skickar er till en sales-engineer för svar på enkla frågor.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            {compliance.map((c, i) => (
              <ScrollReveal key={c.title} delay={i * 80}>
                <article className="h-full rounded-2xl border border-white/10 bg-background-elevated/40 p-6 sm:p-7">
                  <p className="text-[11px] uppercase tracking-[0.2em] font-medium text-amber-400">
                    {c.eyebrow}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight">
                    {c.title}
                  </h3>
                  <p className="mt-3 text-sm text-foreground-muted leading-relaxed">
                    {c.body}
                  </p>
                  {c.cta ? (
                    <Link
                      href={c.cta.href}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-foreground/80"
                    >
                      {c.cta.label}{" "}
                      <span aria-hidden="true" className="text-base">
                        →
                      </span>
                    </Link>
                  ) : null}
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Incident response */}
      <section className="border-t border-white/5 bg-background-elevated/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-28">
          <ScrollReveal>
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-400 font-medium">
                Incident response
              </p>
              <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
                När det otänkbara händer.
              </h2>
              <p className="mt-5 text-lg text-foreground-muted leading-relaxed max-w-xl">
                Inget bolag är osårbart. Det som skiljer är hur snabbt och
                ärligt man hanterar en incident. Vi har rutinen klar — och
                tränar den varje kvartal.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            {incidentSteps.map((step, i) => (
              <ScrollReveal key={step.label} delay={i * 80}>
                <article className="h-full rounded-2xl border border-white/10 bg-background p-6 sm:p-7">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-muted font-medium">
                    {step.when}
                  </p>
                  <h3 className="mt-2 text-base font-semibold tracking-tight">
                    {step.label}
                  </h3>
                  <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
                    {step.body}
                  </p>
                </article>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal>
            <div className="mt-12 rounded-2xl border border-white/10 bg-background-elevated/50 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted font-medium">
                  Säkerhetskontakt
                </p>
                <p className="mt-2 text-lg font-semibold">
                  security@saldo.se
                </p>
                <p className="mt-1 text-sm text-foreground-muted">
                  Svar inom 24 timmar. PGP-nyckel finns på adressen.
                </p>
              </div>
              <a
                href="mailto:security@saldo.se"
                className="inline-flex items-center gap-2 rounded-md bg-foreground text-background px-5 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                Skriv till security
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <SaldoMark className="h-7 w-7" />
            <span>Saldo</span>
          </Link>
          <div className="flex items-center gap-6 text-xs text-foreground-muted">
            <Link
              href="/"
              className="hover:text-foreground transition-colors"
            >
              Tillbaka till saldo.se
            </Link>
            <Link
              href="/dpa"
              className="hover:text-foreground transition-colors"
            >
              DPA
            </Link>
            <a
              href="mailto:security@saldo.se"
              className="hover:text-foreground transition-colors"
            >
              security@saldo.se
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

function CheckBadge() {
  return (
    <span
      className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10"
      style={{
        background:
          "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(244,63,94,0.15), rgba(139,92,246,0.15))",
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-3.5 w-3.5 text-emerald-400"
      >
        <path
          fillRule="evenodd"
          d="M16.704 5.29a.75.75 0 0 1 .006 1.06l-7.5 7.6a.75.75 0 0 1-1.07.001L3.29 8.99a.75.75 0 1 1 1.066-1.056l4.314 4.355 6.97-7.06a.75.75 0 0 1 1.064-.006Z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}
