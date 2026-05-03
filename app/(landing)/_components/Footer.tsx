import Link from "next/link";
import { SaldoMark } from "@/app/_brand/Logo";

export default function Footer() {
  return (
    <footer
      id="kontakt"
      className="scroll-mt-20 border-t border-white/5 bg-background"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        {/* Big closing CTA */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-background-elevated/50 p-8 sm:p-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-20 h-80 w-80 rounded-full opacity-20 blur-3xl"
            style={{ background: "var(--brand-gradient)" }}
          />
          <div className="relative grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
                Redo att få
                <br />
                <span className="brand-text">ordning på driften?</span>
              </h2>
              <p className="mt-5 text-foreground-muted max-w-md leading-relaxed">
                Boka 30 minuter med oss. Vi går igenom ert flöde, visar Saldo
                live mot er befintliga Fortnox-data, och om det inte passar
                säger vi det rakt upp.
              </p>
            </div>
            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
              <Link
                href="/demo/"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground text-background px-5 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                Boka demo
              </Link>
              <a
                href="mailto:hej@saldo.se"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/15 px-5 py-3 text-sm font-medium hover:bg-white/[0.05] transition-colors"
              >
                hej@saldo.se
              </a>
            </div>
          </div>
        </div>

        {/* Footer columns */}
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <Link href="/" className="flex items-center gap-2.5 font-semibold">
              <SaldoMark className="h-7 w-7" />
              <span>Saldo</span>
            </Link>
            <p className="mt-4 text-sm text-foreground-muted max-w-sm leading-relaxed">
              Det operativa navet för svenska e-handlare och lagerintensiva
              småföretag. Byggt i Stockholm, byggt på Supabase.
            </p>
            <div className="mt-6 flex items-center gap-4 text-xs text-foreground-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                99,9 % uptime
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                EU-region
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                GDPR
              </span>
            </div>
          </div>

          <div className="lg:col-span-2">
            <p className="text-sm font-medium">Produkt</p>
            <ul className="mt-4 space-y-2.5 text-sm text-foreground-muted">
              <li>
                <a
                  href="#funktioner"
                  className="hover:text-foreground transition-colors"
                >
                  Funktioner
                </a>
              </li>
              <li>
                <a
                  href="#kunder"
                  className="hover:text-foreground transition-colors"
                >
                  Kunder
                </a>
              </li>
              <li>
                <a
                  href="#priser"
                  className="hover:text-foreground transition-colors"
                >
                  Priser
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="hover:text-foreground transition-colors"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className="text-sm font-medium">Företag</p>
            <ul className="mt-4 space-y-2.5 text-sm text-foreground-muted">
              <li>
                <Link
                  href="/demo/login/"
                  className="hover:text-foreground transition-colors"
                >
                  Logga in
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hej@saldo.se"
                  className="hover:text-foreground transition-colors"
                >
                  Kontakt
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/d3v0ps/lager"
                  target="_blank"
                  rel="noopener"
                  className="hover:text-foreground transition-colors"
                >
                  Status
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <p className="text-sm font-medium">Kontakt</p>
            <ul className="mt-4 space-y-2.5 text-sm text-foreground-muted">
              <li>
                <a
                  href="mailto:hej@saldo.se"
                  className="hover:text-foreground transition-colors break-all"
                >
                  hej@saldo.se
                </a>
              </li>
              <li>
                <a
                  href="tel:+4680000000"
                  className="hover:text-foreground transition-colors"
                >
                  08-000 00 00
                </a>
              </li>
              <li className="text-foreground-muted/70">Vardagar 09–17</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-3 justify-between text-xs text-foreground-muted">
          <p>© {new Date().getFullYear()} Saldo. Gjort i Stockholm.</p>
          <p>
            Bilder från Unsplash. Alla priser exkl. moms. Sägs upp månadsvis.
          </p>
        </div>
      </div>
    </footer>
  );
}
