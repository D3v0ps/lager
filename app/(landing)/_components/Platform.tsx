import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";

/**
 * Platform-sektion — positionerar Saldo som plattform med tre moduler
 * snarare än "lagermjukvara". Slut på säljs-likt bull, in med strikt
 * matrisformat så besökaren ser hur det hänger ihop på 5 sekunder.
 */

const modules = [
  {
    id: "operations",
    name: "Operations",
    tagline: "Lager · order · inköp · frakt",
    blurb:
      "Det dagliga navet — synkat med Fortnox. Streckkods­scanning, beställnings­förslag och rapporter som faktiskt används.",
    cta: { href: "#funktioner", label: "Se Operations" },
    color: "amber",
    badge: "Bas",
  },
  {
    id: "portal",
    name: "Portal",
    tagline: "Kundvänd B2B-portal",
    blurb:
      "Låt grossister, återförsäljare och B2B-kunder logga in och beställa direkt — med avtalspriser och egen orderhistorik. Inga mejlpingisar.",
    cta: { href: "/bygg/", label: "Snart utförligare info" },
    color: "rose",
    badge: "Tillval",
  },
  {
    id: "bygg",
    name: "Bygg",
    tagline: "Projekt · tid · anbud · ÄTA",
    blurb:
      "Komplett projektstyrning för bygg och installation — med ROT/RUT-avdrag, fotodokumentation och digital anbud-acceptans. Konkurrent till Bygglet, hälften så dyrt.",
    cta: { href: "/bygg/", label: "Se Saldo Bygg →" },
    color: "violet",
    badge: "Vertikal",
  },
] as const;

export default function Platform() {
  return (
    <section className="relative border-t border-white/5 bg-background-elevated/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-32">
        <ScrollReveal>
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400 font-medium">
              Plattformen
            </p>
            <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
              Tre moduler.
              <br />
              <span className="text-foreground-muted">Ett system att lära sig.</span>
            </h2>
            <p className="mt-5 text-lg text-foreground-muted leading-relaxed max-w-xl">
              Operations är basen. Portal låter dina kunder beställa själva.
              Bygg gör Saldo till ett komplett projektstyrnings­system. Allt
              med samma login, samma databas, samma Fortnox-koppling.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-16 grid md:grid-cols-3 gap-4">
          {modules.map((m, i) => (
            <ScrollReveal key={m.id} delay={i * 80}>
              <article className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-background-elevated/40 hover:border-white/20 transition-colors p-6 sm:p-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl opacity-15"
                  style={{
                    background:
                      m.color === "amber"
                        ? "radial-gradient(circle, #F59E0B, transparent 60%)"
                        : m.color === "rose"
                          ? "radial-gradient(circle, #F43F5E, transparent 60%)"
                          : "radial-gradient(circle, #8B5CF6, transparent 60%)",
                  }}
                />
                <div className="relative h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-[11px] uppercase tracking-[0.2em] font-medium ${
                        m.color === "amber"
                          ? "text-amber-400"
                          : m.color === "rose"
                            ? "text-rose-400"
                            : "text-violet-400"
                      }`}
                    >
                      Saldo {m.name}
                    </p>
                    <span className="text-[10px] uppercase tracking-[0.18em] rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-foreground-muted">
                      {m.badge}
                    </span>
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                    {m.tagline}
                  </h3>
                  <p className="mt-3 text-sm text-foreground-muted leading-relaxed flex-1">
                    {m.blurb}
                  </p>
                  <Link
                    href={m.cta.href}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium hover:text-amber-400 transition-colors"
                  >
                    {m.cta.label}
                  </Link>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <p className="mt-10 text-sm text-foreground-muted text-center">
          Behöver bara Operations? Kör bara den. Lägg till Portal eller
          Bygg när du behöver. Inga rip-and-replace migrationer.
        </p>
      </div>
    </section>
  );
}
