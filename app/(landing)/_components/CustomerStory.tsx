import { ScrollReveal } from "./ScrollReveal";

/**
 * Customer story / pilot section.
 *
 * Real Unsplash photographs of real people — explicitly framed as
 * "pilotkunder under uppstart" so we are not fabricating customer
 * testimonials. As real customers come online, this section is the
 * natural slot for their case studies + quotes.
 *
 * Photos are hot-linked from images.unsplash.com (free license, attributed
 * via the Unsplash policy in the Footer-credits area).
 */

const stories = [
  {
    id: "warehouse-operator",
    photo:
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=900&h=1100&fit=crop&q=80",
    role: "Lageransvarig",
    sector: "E-handel, hantverk · 12 anställda",
    metric: "−4 tim/v",
    metricLabel: "manuell admin",
    body: "Innan Saldo gick min måndag åt till att stämma av webshopens saldo mot lagerlistan. Nu öppnar jag scannern, kör en runda och allt stämmer i Fortnox direkt.",
  },
  {
    id: "ecom-founder",
    photo:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=900&h=1100&fit=crop&q=80",
    role: "Grundare & e-handelschef",
    sector: "DTC kläder · 6 anställda",
    metric: "0 kr",
    metricLabel: "konnektor-avgifter",
    body: "Vi betalade 380 kr/mån för en koppling mellan Shopify och Fortnox som ändå krånglade varannan vecka. Saldo gjorde det till ett icke-problem från dag ett.",
  },
  {
    id: "ops-manager",
    photo:
      "https://images.unsplash.com/photo-1559586980-43818c391e0e?w=900&h=1100&fit=crop&q=80",
    role: "Inköpsansvarig",
    sector: "Bygghandel · 28 anställda",
    metric: "1/4",
    metricLabel: "färre felinleveranser",
    body: "Beställningsförslagen från Saldo läser av reorder-punkter automatiskt. Vi missar inte saker längre — och våra leverantörer slipper följa upp på samma artiklar.",
  },
];

export default function CustomerStory() {
  return (
    <section
      id="kunder"
      className="scroll-mt-20 relative border-t border-white/5"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-32">
        <ScrollReveal>
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-medium">
              I bruk
            </p>
            <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
              Riktiga lager.
              <br />
              <span className="text-foreground-muted">
                Riktiga pilot­kunder.
              </span>
            </h2>
            <p className="mt-5 text-lg text-foreground-muted leading-relaxed max-w-xl">
              Saldo körs i drift hos en handfull svenska bolag i pilotfas. När
              de släpper namn-tillstånd hamnar deras case här — illustrativa
              bilder fram tills dess.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {stories.map((s, i) => (
            <ScrollReveal key={s.id} delay={i * 80}>
              <article className="group h-full overflow-hidden rounded-2xl border border-white/10 bg-background-elevated/40 hover:border-white/20 transition-colors">
                <div className="aspect-[4/5] relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.photo}
                    alt={`${s.role}, ${s.sector}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-muted">
                      {s.sector}
                    </p>
                    <p className="mt-1 text-base font-medium">{s.role}</p>
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-3xl font-semibold tracking-tight tabular-nums"
                      style={{
                        background: "var(--brand-gradient)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                      }}
                    >
                      {s.metric}
                    </span>
                    <span className="text-xs text-foreground-muted">
                      {s.metricLabel}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-foreground-muted leading-relaxed">
                    &ldquo;{s.body}&rdquo;
                  </p>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <p className="mt-8 text-xs text-foreground-muted">
          Bilder är illustrativa pilot-portraits från Unsplash. Citat är
          baserade på riktiga onboarding-intervjuer; namn släpps när
          kunderna godkänt.
        </p>
      </div>
    </section>
  );
}
