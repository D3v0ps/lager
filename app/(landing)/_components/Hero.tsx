import Link from "next/link";
import HeroVisual from "./HeroVisual";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-grid">
      {/* Ambient brand-gradient halo behind the hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 h-[40rem] opacity-25 blur-3xl"
      >
        <div
          className="mx-auto h-full w-3/4 max-w-5xl rounded-full"
          style={{ background: "var(--brand-gradient)" }}
        />
      </div>
      {/* Soft fade-out at the bottom edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-20 sm:pt-28 pb-20 sm:pb-28">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur px-3 py-1 text-xs text-foreground-muted">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--brand-gradient)" }}
              />
              Plattform för svenska företag — synkad med Fortnox
            </div>

            <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]">
              En plattform.
              <br />
              <span className="brand-text">Tre moduler.</span>
            </h1>

            <p className="mt-6 text-lg text-foreground-muted max-w-xl leading-relaxed">
              Saldo är operativa navet för e-handel, B2B-grossister och
              byggföretag. Lager, kundportal och projektstyrning — välj
              modulerna du behöver, betala bara för dem.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#plattformen"
                className="group inline-flex items-center gap-2 rounded-md bg-foreground text-background px-5 py-3 text-sm font-medium hover:bg-foreground/90 transition-all"
              >
                Utforska modulerna
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
              </Link>
              <a
                href="#priser"
                className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/[0.02] backdrop-blur px-5 py-3 text-sm font-medium hover:bg-white/[0.06] transition-colors"
              >
                Se priser
              </a>
            </div>

            {/* Trust microline */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-foreground-muted">
              <span className="inline-flex items-center gap-1.5">
                <CheckMini /> Fortnox-koppling ingår
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckMini /> Inga per-användarkostnader
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckMini /> 14 dagar gratis
              </span>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckMini() {
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
