import { ScrollReveal } from "./ScrollReveal";

/**
 * "Varför Saldo" — feature comparison vs Visma eGo, Cin7 (Inflow), and Excel.
 *
 * The honest truth-table is more persuasive than another grid of numbered
 * cards. We deliberately don't compare on price (Cin7 plans are tiered
 * differently); we compare on what hurts in daily operations.
 */

type Cell = "yes" | "no" | "extra" | string;

type Row = {
  feature: string;
  saldo: Cell;
  visma: Cell;
  cin7: Cell;
  excel: Cell;
};

const rows: Row[] = [
  { feature: "Fortnox-koppling", saldo: "yes", visma: "no", cin7: "extra", excel: "no" },
  { feature: "Per-användarkostnad", saldo: "no", visma: "yes", cin7: "yes", excel: "no" },
  { feature: "Mobil streckkods­scanner", saldo: "yes", visma: "extra", cin7: "yes", excel: "no" },
  { feature: "Beställnings­förslag (reorder)", saldo: "yes", visma: "no", cin7: "yes", excel: "no" },
  { feature: "Konnektor-avgifter", saldo: "0 kr", visma: "190–500 kr/mån", cin7: "Varierar", excel: "—" },
  { feature: "Implementations­tid", saldo: "1–3 dagar", visma: "4–8 veckor", cin7: "2–6 veckor", excel: "—" },
  { feature: "Svensk support", saldo: "yes", visma: "yes", cin7: "no", excel: "—" },
  { feature: "Modern UX (sub-100 ms)", saldo: "yes", visma: "no", cin7: "yes", excel: "—" },
];

export default function Why() {
  return (
    <section className="border-t border-white/5 bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-32">
        <ScrollReveal>
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-rose-400 font-medium">
              Varför Saldo
            </p>
            <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
              Vi gör en sak.
              <br />
              <span className="text-foreground-muted">Och vi gör den bättre.</span>
            </h2>
            <p className="mt-5 text-lg text-foreground-muted leading-relaxed max-w-xl">
              Saldo försöker inte ersätta hela ditt affärssystem. Vi är navet
              för dagliga driften — och kopplar oss till det du redan har.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-background-elevated/30">
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
                      Saldo
                    </th>
                    <th className="text-left px-5 sm:px-6 py-4 text-foreground-muted font-medium">
                      Visma eGo
                    </th>
                    <th className="text-left px-5 sm:px-6 py-4 text-foreground-muted font-medium">
                      Cin7 / inFlow
                    </th>
                    <th className="text-left px-5 sm:px-6 py-4 text-foreground-muted font-medium">
                      Excel-ark
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={
                        i < rows.length - 1 ? "border-b border-white/5" : ""
                      }
                    >
                      <td className="px-5 sm:px-6 py-4 text-sm font-medium">
                        {row.feature}
                      </td>
                      <td className="px-5 sm:px-6 py-4">
                        <Mark cell={row.saldo} highlight />
                      </td>
                      <td className="px-5 sm:px-6 py-4">
                        <Mark cell={row.visma} />
                      </td>
                      <td className="px-5 sm:px-6 py-4">
                        <Mark cell={row.cin7} />
                      </td>
                      <td className="px-5 sm:px-6 py-4">
                        <Mark cell={row.excel} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ScrollReveal>

        <p className="mt-4 text-xs text-foreground-muted max-w-3xl">
          Jämförelse baserad på publik prislista och produkt­dokumentation
          per maj 2026. Konkurrenter ändrar produktpaket löpande — be oss
          uppdatera om du har en ny offert i hand.
        </p>
      </div>
    </section>
  );
}

function Mark({ cell, highlight = false }: { cell: Cell; highlight?: boolean }) {
  if (cell === "yes") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${highlight ? "text-emerald-400" : "text-emerald-500/70"}`}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M16.704 5.29a.75.75 0 0 1 .006 1.06l-7.5 7.6a.75.75 0 0 1-1.07.001L3.29 8.99a.75.75 0 1 1 1.066-1.056l4.314 4.355 6.97-7.06a.75.75 0 0 1 1.064-.006Z"
            clipRule="evenodd"
          />
        </svg>
        <span className={highlight ? "font-medium text-foreground" : "text-sm"}>
          Ingår
        </span>
      </span>
    );
  }
  if (cell === "no") {
    return (
      <span className="inline-flex items-center gap-1.5 text-foreground-muted/60">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path
            fillRule="evenodd"
            d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm">—</span>
      </span>
    );
  }
  if (cell === "extra") {
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-400/80 text-sm">
        Tillägg
      </span>
    );
  }
  return <span className="text-sm text-foreground/80">{cell}</span>;
}
