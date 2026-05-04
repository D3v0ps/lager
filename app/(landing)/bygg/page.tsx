import Link from "next/link";
import type { Metadata } from "next";

import { ScrollReveal } from "../_components/ScrollReveal";
import { SaldoMark } from "@/app/_brand/Logo";

export const metadata: Metadata = {
  title: "Saldo Bygg — projektstyrning för bygg och installation",
  description:
    "Saldo Bygg är en modern projektledningsapp för bygg- och installationsföretag. Tid, anbud, ÄTA, foton och material i ett system — utan per-användarkostnader.",
};

const compareRows = [
  {
    feature: "Pris",
    saldo: "1 200 kr/mån, obegränsade användare",
    bygglet: "1 745 kr + ~1 445 kr per extra användare",
    bygglog: "från 399 kr för 3 användare",
    winner: true,
  },
  {
    feature: "ROT/RUT-avdrag",
    saldo: "Auto-split arbete vs material, signering via magic-länk",
    bygglet: "Manuellt på anbudet",
    bygglog: "Auto-split (RUT)",
    winner: true,
  },
  {
    feature: "ID06-stöd",
    saldo: "Ja — kort-koppling, närvarologg, byggarbetsplats-ID inbyggt",
    bygglet: "Tillägg / klagomål från användare",
    bygglog: "Nej",
    winner: true,
  },
  {
    feature: "UE-register med F-skatt-validering",
    saldo: "Ja — automatisk slagning mot Skatteverket, varning vid utgång",
    bygglet: "Manuellt register",
    bygglog: "Nej",
    winner: true,
  },
  {
    feature: "KMA / egenkontroll / skyddsrond-mallar",
    saldo: "Ja — färdiga mallar för AFS, BAS-P/U, signering på platsen",
    bygglet: "Tillägg / klagomål från användare",
    bygglog: "Nej",
    winner: true,
  },
  {
    feature: "Före/efter-foton",
    saldo: "Ja — parade fotopar med EXIF, exporteras direkt till slutbesiktning",
    bygglet: "Nej",
    bygglog: "Nej",
    winner: true,
  },
  {
    feature: "GPS-clock-in",
    saldo: "Ja — geofence per byggarbetsplats, automatisk ut-stämpling",
    bygglet: "Tillägg",
    bygglog: "Begränsat",
    winner: true,
  },
  {
    feature: "Projektmallar (kopiera projekt)",
    saldo: "Ja — kopiera ett helt projekt med kostnadsposter och tidsplan",
    bygglet: "Nej",
    bygglog: "Nej",
    winner: true,
  },
  {
    feature: "Schema/Gantt-vy",
    saldo: "Ja — drag-and-drop Gantt med beroenden och resursplanering",
    bygglet: "Tillägg",
    bygglog: "Nej",
    winner: true,
  },
  {
    feature: "Lönefil-export",
    saldo: "Ja — Visma Lön, Hogia, Crona och PAXml direkt från tidrapport",
    bygglet: "Tillägg",
    bygglog: "Nej",
    winner: true,
  },
  {
    feature: "Word/Excel-bilagor",
    saldo: "Native PDF/Word/Excel/bild + EXIF-foto med GPS",
    bygglet: "Begränsat (klagomål från användare)",
    bygglog: "Begränsat",
    winner: true,
  },
  {
    feature: "Anbudsmodul",
    saldo: "Live-builder, ROT/RUT räknas i realtid, kund signerar online",
    bygglet: "Buggig (klagomål från användare)",
    bygglog: "Standard",
    winner: true,
  },
  {
    feature: "Kontraktstid",
    saldo: "Månadsvis, säg upp när du vill, 14 dagar gratis",
    bygglet: "Årskontrakt, ingen prov-tid",
    bygglog: "Månadsvis",
    winner: true,
  },
  {
    feature: "Mobil",
    saldo: "PWA — clock-in, GPS, foto direkt i webbläsaren",
    bygglet: "App, men reportedly klen",
    bygglog: "App",
    winner: true,
  },
  {
    feature: "Lager + B2B-portal i samma system",
    saldo: "Ja — del av plattformen",
    bygglet: "Nej",
    bygglog: "Nej",
    winner: true,
  },
];

const features = [
  {
    title: "ID06 + UE-register inbyggt",
    description:
      "ID06-kort kopplas till medarbetare, närvarologgen rullar automatiskt. UE-registret slår F-skatt mot Skatteverket och varnar i god tid innan certifikat går ut.",
  },
  {
    title: "KMA-mallar, egenkontroll och skyddsrond",
    description:
      "Färdiga mallar för BAS-P/U, AFS-kontroller och veckorond. Fyll i på telefonen, signera digitalt och bifoga till slutbesiktningen.",
  },
  {
    title: "Före/efter-fotopar med GPS",
    description:
      "Parade fotopar med EXIF — bilden vet vart den togs, när och av vem. Exporteras direkt till slutdokumentation eller försäkringsanmälan.",
  },
  {
    title: "Projektmallar + Gantt-schema",
    description:
      "Kopiera ett helt projekt — kostnadsposter, tidsplan, mallar — på två klick. Drag-and-drop-Gantt med beroenden, milstolpar och resursplanering.",
  },
  {
    title: "Anbudsbyggare med ROT/RUT",
    description:
      "Lägg in arbete och material — ROT/RUT räknas i realtid och kunden ser slutpriset. Skicka som magisk länk och få digital signatur.",
  },
  {
    title: "Tidrapport som folk faktiskt använder",
    description:
      "GPS-clock-in från mobilen med geofence per byggarbetsplats. Lönefil-export till Visma Lön, Hogia, Crona och PAXml — utan Excel-mellansteg.",
  },
];

export default function ByggPage() {
  return (
    <>
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
                Saldo Bygg — vertikal för bygg & installation
              </div>
              <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]">
                Projektstyrning som
                <br />
                <span className="brand-text">faktiskt funkar.</span>
              </h1>
              <p className="mt-6 text-lg text-foreground-muted max-w-2xl leading-relaxed">
                Tid. Anbud. ÄTA. ROT/RUT-avdrag. Foton med GPS.
                Materialavstämning. Allt i ett system, byggt för svenska
                bygg- och installations­företag — för cirka{" "}
                <span className="text-foreground font-semibold">
                  hälften
                </span>{" "}
                av vad Bygglet kostar.
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
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Why-not-Bygglet table */}
      <section className="border-y border-white/5 bg-background-elevated/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
          <ScrollReveal>
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-rose-400 font-medium">
                Bygglet vs Saldo
              </p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1]">
                Vad användare faktiskt klagar på.
              </h2>
              <p className="mt-4 text-foreground-muted">
                Bygglet ligger på 2,3 / 5 på Reco. Återkommande klagomål: per-
                användarpris, buggig anbudsmodul, dåligt stöd för Word/Excel,
                låst i årskontrakt. Saldo Bygg löser dem en för en.
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
                        Saldo Bygg
                      </th>
                      <th className="text-left px-5 sm:px-6 py-4 text-foreground-muted font-medium">
                        Bygglet
                      </th>
                      <th className="text-left px-5 sm:px-6 py-4 text-foreground-muted font-medium">
                        ByggLog
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
                          {row.bygglet}
                        </td>
                        <td className="px-5 sm:px-6 py-4 text-sm text-foreground-muted">
                          {row.bygglog}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
          <p className="mt-4 text-xs text-foreground-muted">
            Konkurrenter ändrar produktpaket löpande — be oss uppdatera om
            ni har en ny offert i hand.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="funktioner" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-28">
          <ScrollReveal>
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-violet-400 font-medium">
                Funktioner
              </p>
              <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
                Allt en byggentreprenör behöver
                <br />
                — inte mer.
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

      {/* Pricing */}
      <section id="priser" className="scroll-mt-20 border-t border-white/5">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-24 sm:py-28">
          <ScrollReveal>
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-400 font-medium">
                Pris
              </p>
              <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
                1 200 kr/mån.
                <br />
                <span className="text-foreground-muted">
                  Obegränsade användare.
                </span>
              </h2>
              <p className="mt-5 text-lg text-foreground-muted max-w-xl mx-auto">
                Inga per-användartillägg. Inga konsultarvoden. Säg upp månadsvis.
                14 dagar gratis prov.
              </p>
              <p className="mt-3 text-sm font-medium">
                <span
                  style={{
                    background: "var(--brand-gradient)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  + ID06, UE, KMA, mobil-PWA, Gantt — allt ingår
                </span>
              </p>
              <div className="mt-10 grid sm:grid-cols-3 gap-4 text-left">
                <Bullet>Alla bygg-funktioner</Bullet>
                <Bullet>Obegränsade projekt &amp; anbud</Bullet>
                <Bullet>Obegränsade användare</Bullet>
                <Bullet>Mobil PWA inkluderad</Bullet>
                <Bullet>Fortnox-koppling ingår</Bullet>
                <Bullet>Svensk support på samma dag</Bullet>
              </div>
              <a
                href="mailto:hej@saldo.se"
                className="mt-10 inline-flex items-center gap-2 rounded-md bg-foreground text-background px-6 py-3 text-base font-medium hover:bg-foreground/90"
              >
                Boka demo
              </a>
            </div>
          </ScrollReveal>
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
