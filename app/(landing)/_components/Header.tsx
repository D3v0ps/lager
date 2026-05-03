import Link from "next/link";
import Logo from "./Logo";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-neutral-950/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-lg tracking-tight"
        >
          <Logo className="h-7 w-7" />
          <span>Saldo</span>
        </Link>
        <nav className="hidden md:flex gap-8 text-sm text-neutral-700 dark:text-neutral-300">
          <a
            href="#funktioner"
            className="hover:text-neutral-950 dark:hover:text-white transition-colors"
          >
            Funktioner
          </a>
          <a
            href="#priser"
            className="hover:text-neutral-950 dark:hover:text-white transition-colors"
          >
            Priser
          </a>
          <a
            href="#kontakt"
            className="hover:text-neutral-950 dark:hover:text-white transition-colors"
          >
            Kontakt
          </a>
        </nav>
        <Link
          href="/app/"
          className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
        >
          Kom igång
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>
    </header>
  );
}
