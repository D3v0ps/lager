/**
 * Hero visual — replaces the old fake-browser screenshot.
 *
 * Renders a high-fidelity mock of the actual product dashboard (KPI cards,
 * a data-dense table, a chart). No browser chrome, no rounded "site preview"
 * frame: this is meant to read as an integrated product surface.
 *
 * The shape mirrors what /[tenant]/dashboard renders so customers seeing
 * this and then opening the app feel continuity, not a bait-and-switch.
 */
export default function HeroVisual() {
  const products = [
    { sku: "SKR-001", name: "Skruv 4x40 mm trä, 100-pack", qty: 38, status: "ok" as const, value: "3 382 kr" },
    { sku: "SKR-002", name: "Skruv 5x80 mm trä, 50-pack", qty: 12, status: "low" as const, value: "1 548 kr" },
    { sku: "VRK-002", name: "Skruvdragare 18V borstlös", qty: 3, status: "low" as const, value: "5 970 kr" },
    { sku: "ELT-003", name: "LED-lampa E27 9W varmvit", qty: 95, status: "ok" as const, value: "4 702 kr" },
    { sku: "FRG-001", name: "Väggfärg vit matt 10 L", qty: 15, status: "ok" as const, value: "8 985 kr" },
    { sku: "SKY-002", name: "Arbetshandskar nitril stl 10", qty: 40, status: "low" as const, value: "1 580 kr" },
  ];

  return (
    <div className="relative">
      {/* Ambient glow behind the dashboard */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-12 rounded-[3rem] opacity-50 blur-3xl animate-ambient"
        style={{ background: "var(--brand-gradient)" }}
      />

      <div className="relative rounded-2xl border border-white/10 bg-background-elevated/90 backdrop-blur shadow-2xl shadow-black/40 overflow-hidden">
        {/* Topbar — internal app chrome, not a fake browser */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-amber-500 via-rose-500 to-violet-500" />
            <span className="text-sm font-medium">Saldo</span>
            <span className="text-xs text-foreground-muted">/</span>
            <span className="text-xs text-foreground-muted">Bygghandel AB</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-foreground-muted">
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Synkad med Fortnox
            </span>
            <span>4 maj 2026</span>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-3 border-b border-white/5">
          <Kpi label="Lagervärde" value="184 320 kr" delta="+4,2 %" positive />
          <Kpi label="Ordrar 7 d" value="42" delta="+18" positive divider />
          <Kpi label="Lågt saldo" value="6" delta="+2" positive={false} divider />
        </div>

        {/* Table */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wider text-foreground-muted">
              Topp produkter
            </p>
            <div className="text-[11px] text-foreground-muted">
              Sökresultat · 6 av 23
            </div>
          </div>
          <div className="space-y-1">
            {products.map((p) => (
              <div
                key={p.sku}
                className="flex items-center justify-between rounded-lg px-2.5 py-2 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <code className="text-[10.5px] font-mono text-foreground-muted shrink-0 w-16">
                    {p.sku}
                  </code>
                  <span className="text-[13px] truncate">{p.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-foreground-muted tabular-nums hidden sm:inline">
                    {p.value}
                  </span>
                  {p.status === "low" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-400 px-2 py-0.5 text-[10px] font-medium">
                      <span className="h-1 w-1 rounded-full bg-amber-400" />
                      lågt
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-medium">
                      <span className="h-1 w-1 rounded-full bg-emerald-400" />
                      ok
                    </span>
                  )}
                  <span className="text-[13px] tabular-nums font-medium w-10 text-right">
                    {p.qty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity / chart strip at the bottom */}
        <div className="grid grid-cols-2 border-t border-white/5">
          <div className="border-r border-white/5 px-5 py-3.5">
            <p className="text-[10px] uppercase tracking-wider text-foreground-muted mb-2">
              Lagerrörelser, 14 dagar
            </p>
            <Sparkline />
          </div>
          <div className="px-5 py-3.5">
            <p className="text-[10px] uppercase tracking-wider text-foreground-muted mb-2">
              Senaste händelse
            </p>
            <p className="text-[12px] leading-tight">
              <span className="font-medium">SKR-001</span>
              <span className="text-foreground-muted"> · uttag −12 · 13:24</span>
            </p>
            <p className="text-[12px] mt-1.5 leading-tight">
              <span className="font-medium">PO-2026-014</span>
              <span className="text-foreground-muted"> · mottagen · 11:08</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  delta,
  positive,
  divider,
}: {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  divider?: boolean;
}) {
  return (
    <div className={`px-5 py-4 ${divider ? "border-l border-white/5" : ""}`}>
      <p className="text-[11px] uppercase tracking-wider text-foreground-muted">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p
        className={`mt-0.5 text-[11px] tabular-nums ${
          positive ? "text-emerald-400" : "text-amber-400"
        }`}
      >
        {delta}
      </p>
    </div>
  );
}

function Sparkline() {
  // 14-point fake-but-plausible movement series.
  const points = [
    18, 22, 15, 28, 24, 31, 26, 34, 30, 38, 33, 41, 37, 44,
  ];
  const max = Math.max(...points);
  const w = 220;
  const h = 38;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step},${h - (p / max) * h}`)
    .join(" ");
  const area = `${path} L ${w},${h} L 0,${h} Z`;
  return (
    <svg
      width="100%"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="block"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={path} fill="none" stroke="#F59E0B" strokeWidth="1.5" />
    </svg>
  );
}
