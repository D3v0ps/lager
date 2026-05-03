import { ScrollReveal } from "./ScrollReveal";

/**
 * Features rebuilt as a bento grid.
 *
 * Lager + Order are the core modules — they get larger tiles with mock UI.
 * Inköp + Rapporter are mid-tier. Frakt + Fortnox are present but smaller
 * (Frakt is on the roadmap; Fortnox is signature but already mentioned in
 * the hero so it doesn't need a hero-tile here).
 *
 * No "Snart"-tags inside the grid — the roadmap timeline below is the
 * honest place for that.
 */

export default function Features() {
  return (
    <section id="funktioner" className="scroll-mt-20 border-t border-white/5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-32">
        <ScrollReveal>
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-violet-400 font-medium">
              Produkten
            </p>
            <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
              Allt som behövs
              <br />
              för dagliga driften.
            </h2>
            <p className="mt-5 text-lg text-foreground-muted leading-relaxed max-w-xl">
              Sex moduler, ett system. Byggt för att kännas snabbt — så att
              lageransvarige öppnar Saldo gärna, inte motvilligt.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 auto-rows-[minmax(220px,auto)] gap-4">
          {/* Lager — large feature tile, top-left, with mock product row UI */}
          <ScrollReveal className="md:col-span-2 lg:col-span-2 lg:row-span-2">
            <FeatureTile
              tone="amber"
              title="Lager"
              description="Snabbjustering på två klick. Streckkodsscanning från mobilen. Varianter, multi-lokation, lågsaldo-bevakning. Saldot stämmer — överallt, hela tiden."
              size="large"
            >
              <MockStockRows />
            </FeatureTile>
          </ScrollReveal>

          {/* Order — large feature tile, with mock status flow UI */}
          <ScrollReveal className="md:col-span-1 lg:col-span-2 lg:row-span-2" delay={80}>
            <FeatureTile
              tone="rose"
              title="Order"
              description="Webshop-ordrar in, plocka, packa, skicka — utan dubbelregistrering. Manuella ordrar, returer och B2B-fakturor i samma flöde."
              size="large"
            >
              <MockOrderFlow />
            </FeatureTile>
          </ScrollReveal>

          {/* Inköp — medium tile */}
          <ScrollReveal className="md:col-span-1 lg:col-span-2" delay={160}>
            <FeatureTile
              tone="violet"
              title="Inköp"
              description="Leverantörsregister, beställningsförslag baserat på era egna nivåer, mottagningsregistrering. Slut med Excel-listan i mejlen."
            />
          </ScrollReveal>

          {/* Rapporter — medium tile */}
          <ScrollReveal className="md:col-span-1 lg:col-span-2" delay={240}>
            <FeatureTile
              tone="emerald"
              title="Rapporter"
              description="Vad säljer, vad ligger dött, marginal per artikel, lagervärde över tid. Beslut byggda på data — inte magkänsla."
            />
          </ScrollReveal>

          {/* Mobil scanner — small tile */}
          <ScrollReveal className="md:col-span-1 lg:col-span-2" delay={320}>
            <FeatureTile
              tone="amber"
              title="Mobilscanner"
              description="BarcodeDetector i webbläsaren — ingen app att installera. Plocka, justera och skanna in från telefonen direkt på lagret."
              compact
            />
          </ScrollReveal>

          {/* Fortnox — small tile */}
          <ScrollReveal className="md:col-span-1 lg:col-span-2" delay={400}>
            <FeatureTile
              tone="rose"
              title="Fortnox-koppling"
              description="Artiklar, kunder, fakturor och lagervärde synkas bidirektionellt. Bokför som vanligt — Saldo håller siffrorna i takt."
              compact
            />
          </ScrollReveal>
        </div>

        {/* Roadmap timeline — honest about what's not yet shipped */}
        <ScrollReveal>
          <div className="mt-16 rounded-2xl border border-white/10 bg-background-elevated/50 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
                  Roadmap
                </p>
                <h3 className="mt-2 text-xl font-semibold">
                  Vad som rullar ut nästa
                </h3>
              </div>
              <p className="text-sm text-foreground-muted max-w-md">
                Vi releasar i veckan, inte i kvartalet. Ärlig timeline — inga
                "Snart" som blir 2027.
              </p>
            </div>
            <div className="mt-6 grid sm:grid-cols-3 gap-4">
              <RoadmapStep when="Q3 2026" label="Frakt-etiketter via Fraktjakt" />
              <RoadmapStep when="Q4 2026" label="Fortnox-sync v2 (BOM + kit)" />
              <RoadmapStep when="2027" label="Marketplace (Tradera, Fyndiq, CDON)" />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------- Tile chrome ----------

type Tone = "amber" | "rose" | "violet" | "emerald";

const toneAccent: Record<Tone, string> = {
  amber: "from-amber-500/20 via-transparent to-transparent",
  rose: "from-rose-500/20 via-transparent to-transparent",
  violet: "from-violet-500/20 via-transparent to-transparent",
  emerald: "from-emerald-500/20 via-transparent to-transparent",
};
const toneText: Record<Tone, string> = {
  amber: "text-amber-400",
  rose: "text-rose-400",
  violet: "text-violet-400",
  emerald: "text-emerald-400",
};

function FeatureTile({
  title,
  description,
  tone,
  children,
  size = "default",
  compact = false,
}: {
  title: string;
  description: string;
  tone: Tone;
  children?: React.ReactNode;
  size?: "default" | "large";
  compact?: boolean;
}) {
  return (
    <div
      className={`group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-background-elevated/40 hover:border-white/20 transition-colors ${
        compact ? "p-5" : "p-6 sm:p-8"
      }`}
    >
      {/* Tinted radial accent in the corner */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl bg-gradient-radial ${toneAccent[tone]}`}
        style={{
          background: `radial-gradient(circle at center, var(--${tone}) 0%, transparent 60%)`,
          opacity: 0.18,
        }}
      />
      <div className="relative h-full flex flex-col">
        <p
          className={`text-[11px] uppercase tracking-[0.2em] font-medium ${toneText[tone]}`}
        >
          {title}
        </p>
        <p
          className={`mt-2 ${size === "large" ? "text-2xl sm:text-3xl" : "text-xl"} font-semibold tracking-tight`}
        >
          {title}
        </p>
        <p
          className={`mt-3 text-foreground-muted leading-relaxed ${
            compact ? "text-sm" : "text-sm sm:text-base"
          }`}
        >
          {description}
        </p>
        {children && <div className="mt-6 flex-1">{children}</div>}
      </div>
    </div>
  );
}

// ---------- Inline mock UIs that live inside the bento tiles ----------

function MockStockRows() {
  const rows = [
    { sku: "SKR-002", qty: 12, max: 30, low: true },
    { sku: "VRK-002", qty: 3, max: 10, low: true },
    { sku: "ELT-003", qty: 95, max: 120, low: false },
    { sku: "FRG-001", qty: 15, max: 24, low: false },
  ];
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div
          key={r.sku}
          className="flex items-center justify-between rounded-md border border-white/5 bg-background/60 px-3 py-2.5"
        >
          <div className="flex items-center gap-3 min-w-0">
            <code className="text-[11px] font-mono text-foreground-muted shrink-0">
              {r.sku}
            </code>
            <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden min-w-[80px]">
              <div
                className={`h-full ${r.low ? "bg-amber-400" : "bg-emerald-400"}`}
                style={{ width: `${Math.min(100, (r.qty / r.max) * 100)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {r.low && (
              <span className="inline-flex items-center rounded-full bg-amber-500/10 text-amber-400 px-1.5 py-0.5 text-[10px] font-medium">
                lågt
              </span>
            )}
            <span className="text-sm tabular-nums w-8 text-right font-medium">
              {r.qty}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MockOrderFlow() {
  const steps = [
    { label: "Webshop", state: "done" },
    { label: "Plock", state: "done" },
    { label: "Pack", state: "active" },
    { label: "Skickas", state: "pending" },
  ];
  return (
    <div className="rounded-md border border-white/5 bg-background/60 p-4">
      <div className="flex items-center justify-between text-[11px] text-foreground-muted mb-3">
        <span className="font-mono">SO-2026-127</span>
        <span>Anna Lindqvist · 4 maj</span>
      </div>
      <div className="flex items-center gap-1.5">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-1.5 flex-1">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                s.state === "done"
                  ? "bg-emerald-400"
                  : s.state === "active"
                    ? "bg-amber-400 animate-pulse"
                    : "bg-white/10"
              }`}
            />
            <span
              className={`text-[10.5px] truncate ${
                s.state === "pending" ? "text-foreground-muted" : ""
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span className="flex-1 h-px bg-white/5" />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-1.5 text-[12px]">
        <div className="flex justify-between">
          <span>Skruv 4x40 mm × 100</span>
          <span className="tabular-nums text-foreground-muted">8 900 kr</span>
        </div>
        <div className="flex justify-between">
          <span>Hammare 500 g × 2</span>
          <span className="tabular-nums text-foreground-muted">498 kr</span>
        </div>
        <div className="flex justify-between pt-1.5 mt-1.5 border-t border-white/5">
          <span className="font-medium">Totalt</span>
          <span className="tabular-nums font-semibold">9 398 kr</span>
        </div>
      </div>
    </div>
  );
}

function RoadmapStep({ when, label }: { when: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-background p-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-muted">
        {when}
      </p>
      <p className="mt-1 text-sm font-medium">{label}</p>
    </div>
  );
}
