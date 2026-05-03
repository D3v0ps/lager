import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer
      id="kontakt"
      className="scroll-mt-20 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="rounded-2xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 p-8 sm:p-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                Redo att få ordning?
              </h2>
              <p className="mt-3 text-neutral-300 dark:text-neutral-700 max-w-md">
                Skapa ett konto på under en minut. Vi hjälper dig gärna att
                komma igång — säg bara till.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href="/app/"
                className="inline-flex items-center gap-2 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white px-5 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Kom igång
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
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
                href="mailto:hej@saldo.se"
                className="inline-flex items-center gap-2 rounded-md border border-neutral-700 dark:border-neutral-300 px-5 py-3 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                Prata med oss
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Logo className="h-6 w-6" />
              <span>Saldo</span>
            </Link>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 max-w-sm">
              Enkel lagerhantering byggd i Sverige för svenska e-handlare och
              småföretag.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-neutral-950 dark:text-white">
              Produkt
            </p>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>
                <a href="#funktioner" className="hover:underline">
                  Funktioner
                </a>
              </li>
              <li>
                <a href="#priser" className="hover:underline">
                  Priser
                </a>
              </li>
              <li>
                <Link href="/app/" className="hover:underline">
                  Logga in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-neutral-950 dark:text-white">
              Kontakt
            </p>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>
                <a
                  href="mailto:hej@saldo.se"
                  className="hover:underline break-all"
                >
                  hej@saldo.se
                </a>
              </li>
              <li>
                <a href="tel:+4680000000" className="hover:underline">
                  08-000 00 00
                </a>
              </li>
              <li className="text-neutral-500">Vardagar 09–17</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row gap-3 justify-between text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} Saldo. Gjort i Sverige.</p>
          <p>Alla priser exklusive moms.</p>
        </div>
      </div>
    </footer>
  );
}
