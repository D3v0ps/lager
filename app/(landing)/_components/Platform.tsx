import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";

/**
 * Platform-sektion — primär funnel till modul-sidor.
 * Tre stora modul-kort med tydliga CTAs ut till /operations, /portal, /bygg.
 *
 * Varje kort visar:
 *   • Modul-namn + accent
 *   • En 3-ords-tagline för "vad är det här"
 *   • För vem (mål-segment)
 *   • 3 punkter med toppfunktioner
 *   • Pris-indikator
 *   • Stor CTA-knapp till modulens egen sida
 */

type ModuleColor = "amber" | "rose" | "violet";

const modules: Array<{
  id: string;
  name: string;
  tagline: string;
  audience: string;
  href: string;
  color: ModuleColor;
  price: string;
  badge: string;
  bullets: string[];
}> = [
  {
    id: "operations",
    name: "Operations",
    tagline: "Lager, order, inköp.",
    audience: "För e-handlare och småföretag med varulager",
    href: "/operations/",
    color: "amber",
    price: "Från 500 kr/mån",
    badge: "Bas",
    bullets: [
      "Streckkods­scanning + auto-beställning",
      "Fortnox-koppling ingår",
      "Sub-100 ms UI, mobil-first",
    ],
  },
  {
    id: "portal",
    name: "Portal",
    tagline: "B2B-kunder loggar in och beställer själva.",
    audience: "För grossister och leverantörer med B2B-kunder",
    href: "/portal/",
    color: "rose",
    price: "+400 kr/mån",
    badge: "Tillägg",
    bullets: [
      "Avtalspriser + volymrabatter per kund",
      "Återkommande beställningar",
      "Self-onboarding (kund-ansökan)",
    ],
  },
  {
    id: "bygg",
    name: "Bygg",
    tagline: "Projektstyrning för bygg & installation.",
    audience: "För hantverkare, installatörer, byggentreprenörer",
    href: "/bygg/",
    color: "violet",
    price: "1 200 kr/mån, obegränsade användare",
    badge: "Vertikal",
    bullets: [
      "ID06, UE-register, KMA-mallar",
      "Anbud med ROT/RUT + digital signering",
      "GPS-clock-in + Lönefil-export",
    ],
  },
];

const accentClasses: Record<
  ModuleColor,
  { text: string; halo: string; arrow: string }
> = {
  amber: {
    text: "text-amber-400",
    halo: "radial-gradient(circle, #F59E0B, transparent 60%)",
    arrow: "group-hover:text-amber-400",
  },
  rose: {
    text: "text-rose-400",
    halo: "radial-gradient(circle, #F43F5E, transparent 60%)",
    arrow: "group-hover:text-rose-400",
  },
  violet: {
    text: "text-violet-400",
    halo: "radial-gradient(circle, #8B5CF6, transparent 60%)",
    arrow: "group-hover:text-violet-400",
  },
};

export default function Platform() {
  return (
    <section
      id="plattformen"
      className="scroll-mt-20 relative border-t border-white/5 bg-background-elevated/30"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-32">
        <ScrollReveal>
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400 font-medium">
              Plattformen
            </p>
            <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
              Välj din modul.
              <br />
              <span className="text-foreground-muted">Ingen tar betalt för det du inte använder.</span>
            </h2>
            <p className="mt-5 text-lg text-foreground-muted leading-relaxed max-w-xl">
              Tre kompletta produkter på samma databas, samma login, samma
              Fortnox-koppling. Klicka in dig på den som passar — eller
              kombinera flera.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-16 grid md:grid-cols-3 gap-5">
          {modules.map((m, i) => {
            const accent = accentClasses[m.color];
            return (
              <ScrollReveal key={m.id} delay={i * 80}>
                <Link
                  href={m.href}
                  className="group relative block h-full overflow-hidden rounded-2xl border border-white/10 bg-background-elevated/40 hover:border-white/25 transition-all hover:-translate-y-0.5"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"
                    style={{ background: accent.halo }}
                  />
                  <div className="relative p-7 sm:p-8 flex flex-col h-full">
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-[11px] uppercase tracking-[0.2em] font-semibold ${accent.text}`}
                      >
                        Saldo {m.name}
                      </p>
                      <span className="text-[10px] uppercase tracking-[0.18em] rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-foreground-muted">
                        {m.badge}
                      </span>
                    </div>
                    <h3 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight leading-tight">
                      {m.tagline}
                    </h3>
                    <p className="mt-2 text-sm text-foreground-muted">
                      {m.audience}
                    </p>

                    <ul className="mt-6 space-y-2.5 flex-1">
                      {m.bullets.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-2 text-sm text-foreground/85"
                        >
                          <svg
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className={`h-4 w-4 mt-0.5 ${accent.text} shrink-0`}
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.704 5.296a1 1 0 0 1 0 1.408l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 1 1 1.414-1.414L8.5 12.086l6.793-6.79a1 1 0 0 1 1.411 0Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs text-foreground-muted tabular-nums">
                        {m.price}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-sm font-medium ${accent.arrow} transition-colors`}
                      >
                        Läs mer
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>

        <p className="mt-12 text-center text-sm text-foreground-muted">
          Behöver bara en? Kör bara den. Behöver alla tre? Lägg till
          dem när du är redo. Inga rip-and-replace-migrationer.
        </p>
      </div>
    </section>
  );
}
