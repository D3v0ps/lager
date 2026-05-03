import Link from "next/link";
import HeroVisual from "./HeroVisual";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu blur-3xl"
      >
        <div
          className="relative left-[calc(50%-20rem)] aspect-[1155/678] w-[60rem] -translate-x-1/2 rotate-[20deg] bg-gradient-to-tr from-amber-200 to-blue-300 opacity-30 dark:from-amber-500 dark:to-blue-600 dark:opacity-20"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Byggt i Sverige för svenska företag
            </div>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-neutral-950 dark:text-white">
              Slut på Excel-kaoset.{" "}
              <span className="text-neutral-500 dark:text-neutral-400">
                Full koll på lagret.
              </span>
            </h1>
            <p className="mt-6 text-lg text-neutral-600 dark:text-neutral-400 max-w-xl">
              Saldo är den enkla lagerhanteringen för svenska e-handlare och
              småföretag. Inga installationer. Inga onödiga moduler. Bara
              ordning — direkt i webbläsaren.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/demo/"
                className="inline-flex items-center gap-2 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-5 py-3 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                Kom igång gratis
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
                href="#funktioner"
                className="inline-flex items-center gap-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-5 py-3 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Se demo
              </a>
            </div>
            <p className="mt-5 text-xs text-neutral-500 dark:text-neutral-500">
              Inget kreditkort. Personlig svensk support från dag ett.
            </p>
          </div>

          <div className="relative">
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
