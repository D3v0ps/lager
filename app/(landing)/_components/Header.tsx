import Link from "next/link";
import { SaldoMark } from "@/app/_brand/Logo";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-white/5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-semibold tracking-tight"
        >
          <SaldoMark className="h-7 w-7 transition-transform duration-300 group-hover:rotate-3" />
          <span className="text-base">Saldo</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-foreground-muted">
          <a
            href="#funktioner"
            className="hover:text-foreground transition-colors"
          >
            Funktioner
          </a>
          <a
            href="#kunder"
            className="hover:text-foreground transition-colors"
          >
            Kunder
          </a>
          <a
            href="#priser"
            className="hover:text-foreground transition-colors"
          >
            Priser
          </a>
          <a href="#faq" className="hover:text-foreground transition-colors">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/demo/login/"
            className="hidden sm:inline-flex text-sm text-foreground-muted hover:text-foreground transition-colors px-3 py-1.5"
          >
            Logga in
          </Link>
          <Link
            href="#priser"
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground text-background px-3.5 py-1.5 text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            Boka demo
          </Link>
        </div>
      </div>
      {/* Brand gradient hairline under the sticky header — premium signature */}
      <div
        aria-hidden="true"
        className="h-px"
        style={{ background: "var(--brand-gradient)", opacity: 0.45 }}
      />
    </header>
  );
}
