import Link from "next/link";
import type { Metadata } from "next";

import { ScrollReveal } from "../_components/ScrollReveal";
import { SaldoMark } from "@/app/_brand/Logo";
import { DpaRequestForm } from "./_components/DpaRequestForm";

export const metadata: Metadata = {
  title: "Personuppgiftsbiträdesavtal (DPA) — Saldo",
  description:
    "Standard-DPA enligt EU-kommissionens modellklausuler. Begär ett signerat avtal — vi svarar inom en arbetsdag.",
};

const dpaIncludes = [
  {
    title: "Behandlingsändamål",
    body: "Vad Saldo får göra med era data: leverera lager- och orderfunktioner, skicka avtalad e-post och SMS, underhålla backup och säkerhet. Inget annat — ingen profilering, inget vidareförsäljning, inga ML-modeller tränade på er data.",
  },
  {
    title: "Datakategorier",
    body: "Kunduppgifter (namn, e-post, leveransadress), anställdas tidrapporter och clock-in, leverantörsregister, produktdata, ordrar, fakturaunderlag. Inga känsliga personuppgifter (hälsa, religion) lagras avsiktligt.",
  },
  {
    title: "Underbiträden",
    body: "Supabase (databas och autentisering, Frankfurt), GatewayAPI (transaktionell SMS, Danmark), Resend (e-post, Frankfurt), Cloudflare (CDN och DDoS, EU-region). Listan uppdateras med 30 dagars varsel innan en ny part läggs till.",
  },
  {
    title: "Säkerhetsåtgärder",
    body: "RLS på alla tabeller, AES-256 kryptering i vila, TLS 1.3 i transit, daglig krypterad backup, audit-logg, 2FA för admin-konton, principen om minsta behörighet, kvartalsvis penetrationstest av extern part.",
  },
  {
    title: "Tidsfrister vid avtals slut",
    body: "Vid uppsägning får ni 30 dagar att exportera all data via självservice. Därefter raderas data definitivt inom 60 dagar — anonymiserad finansdata kan behållas för bokföringsskyldighet enligt svensk lag (7 år).",
  },
];

const subprocessors = [
  {
    name: "Supabase",
    role: "Databas, auth, fil-lagring",
    region: "EU-Frankfurt (eu-central-1)",
  },
  {
    name: "GatewayAPI",
    role: "Transaktionell SMS",
    region: "EU-Danmark",
  },
  {
    name: "Resend",
    role: "Transaktionell e-post",
    region: "EU-Frankfurt",
  },
  {
    name: "Cloudflare",
    role: "CDN, WAF, DDoS-skydd",
    region: "EU-region (Frankfurt edge)",
  },
];

export default function DpaPage() {
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
                GDPR · Artikel 28 · Modellklausuler
              </div>
              <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]">
                Personuppgifts­biträdes­avtal
                <br />
                <span className="brand-text">(DPA).</span>
              </h1>
              <p className="mt-6 text-lg text-foreground-muted max-w-2xl leading-relaxed">
                Saldo är personuppgifts­biträde åt er — det är ni som styr
                vilka uppgifter som lagras och varför. Vårt standard-DPA följer
                EU-kommissionens modellklausuler och kompletterar avtalet med
                tydliga skyldigheter, säkerhetsåtgärder och underbiträden.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#begar"
                  className="inline-flex items-center gap-2 rounded-md bg-foreground text-background px-5 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors"
                >
                  Begär signerat DPA
                </a>
                <Link
                  href="/security"
                  className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/[0.02] backdrop-blur px-5 py-3 text-sm font-medium hover:bg-white/[0.06] transition-colors"
                >
                  Säkerhetsöversikt
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-foreground-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Dot color="emerald" /> Modellklausuler 2021/914
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Dot color="violet" /> EU-region (Frankfurt)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Dot color="amber" /> Svar inom en arbetsdag
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* What's in our standard DPA */}
      <section className="border-t border-white/5 bg-background-elevated/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-28">
          <ScrollReveal>
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-rose-400 font-medium">
                Innehåll
              </p>
              <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
                Vad ingår i vårt
                <br />
                <span className="text-foreground-muted">standard-DPA.</span>
              </h2>
              <p className="mt-5 text-lg text-foreground-muted leading-relaxed max-w-xl">
                Fem tydliga sektioner — det som inköps­avdelningen och
                juridik­funktionen behöver för att grön­ljusa Saldo.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-4">
            {dpaIncludes.map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 60}>
                <article className="h-full rounded-2xl border border-white/10 bg-background-elevated/40 p-6 sm:p-7 hover:border-white/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <SectionNumber index={i + 1} />
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold tracking-tight">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>

          {/* Subprocessor table */}
          <ScrollReveal>
            <div className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-background-elevated/40">
              <header className="px-5 sm:px-6 py-4 border-b border-white/5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-muted font-medium">
                  Underbiträden
                </p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight">
                  Tredje­parter som behandlar er data
                </h3>
              </header>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-[11px] uppercase tracking-[0.15em] text-foreground-muted font-medium">
                      <th className="px-5 sm:px-6 py-3">Tjänst</th>
                      <th className="px-5 sm:px-6 py-3">Roll</th>
                      <th className="px-5 sm:px-6 py-3">Region</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subprocessors.map((sp, i) => (
                      <tr
                        key={sp.name}
                        className={
                          i < subprocessors.length - 1
                            ? "border-b border-white/5"
                            : ""
                        }
                      >
                        <td className="px-5 sm:px-6 py-3.5 text-sm font-medium">
                          {sp.name}
                        </td>
                        <td className="px-5 sm:px-6 py-3.5 text-sm text-foreground-muted">
                          {sp.role}
                        </td>
                        <td className="px-5 sm:px-6 py-3.5 text-sm text-foreground-muted">
                          {sp.region}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mt-4 text-xs text-foreground-muted max-w-3xl">
              Vid byte eller tillägg av underbiträde meddelar vi alla aktiva
              kunder med 30 dagars varsel. Ni har rätt att invända — och vid
              invändning som vi inte kan tillgodose har ni rätt att säga upp
              avtalet utan kostnad.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Request signed DPA */}
      <section
        id="begar"
        className="scroll-mt-20 border-t border-white/5"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-24 sm:py-28">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs uppercase tracking-[0.2em] text-violet-400 font-medium">
                Begär signerat DPA
              </p>
              <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
                Få DPA:t signerat
                <br />
                <span className="brand-text">på en arbetsdag.</span>
              </h2>
              <p className="mt-5 text-lg text-foreground-muted leading-relaxed">
                Fyll i nedan så skickar vi vårt standard-DPA i PDF — färdigt
                att signera elektroniskt eller på papper. Behöver ni en
                anpassad version svarar vi inom 24 timmar.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="mt-12">
              <DpaRequestForm />
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
              href="/security"
              className="hover:text-foreground transition-colors"
            >
              Säkerhet
            </Link>
            <a
              href="mailto:dpa@saldo.se"
              className="hover:text-foreground transition-colors"
            >
              dpa@saldo.se
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

function SectionNumber({ index }: { index: number }) {
  return (
    <span
      className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 text-xs font-mono tabular-nums text-foreground"
      style={{
        background:
          "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(244,63,94,0.15), rgba(139,92,246,0.15))",
      }}
      aria-hidden="true"
    >
      {String(index).padStart(2, "0")}
    </span>
  );
}

function Dot({ color }: { color: "emerald" | "violet" | "amber" }) {
  const cls =
    color === "emerald"
      ? "bg-emerald-400"
      : color === "violet"
        ? "bg-violet-400"
        : "bg-amber-400";
  return <span className={`h-1.5 w-1.5 rounded-full ${cls}`} aria-hidden="true" />;
}
