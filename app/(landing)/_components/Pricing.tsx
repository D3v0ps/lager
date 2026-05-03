import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "0 kr",
    period: "/månad",
    description: "För dig som vill prova och har ett mindre sortiment.",
    features: [
      "Upp till 50 produkter",
      "1 användare",
      "Rörelsehistorik",
      "Mejlsupport",
    ],
    cta: { label: "Kom igång gratis", href: "/app/" },
    highlight: false,
  },
  {
    name: "Pro",
    price: "199 kr",
    period: "/månad",
    description: "För växande e-handlare och småföretag som behöver full koll.",
    features: [
      "Obegränsat antal produkter",
      "Upp till 5 användare",
      "Beställningspunkter & varningar",
      "Rapporter och CSV-export",
      "Personlig onboarding",
      "Prioriterad svensk support",
    ],
    cta: { label: "Kom igång", href: "/app/" },
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "499 kr",
    period: "/månad",
    description: "För större team med specifika behov och integrationer.",
    features: [
      "Allt i Pro",
      "Obegränsat antal användare",
      "Anpassade roller & behörigheter",
      "Integrationer (efter överenskommelse)",
      "Dedikerad kontaktperson",
    ],
    cta: { label: "Kontakta oss", href: "#kontakt" },
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section
      id="priser"
      className="scroll-mt-20 border-t border-neutral-200 dark:border-neutral-800"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Priser
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            Tydliga priser. Inga överraskningar.
          </h2>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            Börja gratis. Uppgradera när du växer. Säg upp när du vill — inga
            uppsägningstider, inga bindningstider.
          </p>
        </div>

        <div className="mt-12 grid lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlight
                  ? "relative rounded-2xl border-2 border-neutral-900 dark:border-white bg-white dark:bg-neutral-900 p-8 shadow-xl shadow-neutral-900/5 dark:shadow-black/30"
                  : "relative rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8"
              }
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-8 inline-flex items-center rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-3 py-1 text-xs font-medium">
                  Mest populär
                </span>
              )}
              <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">
                {plan.name}
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white">
                  {plan.price}
                </span>
                <span className="text-neutral-500">{plan.period}</span>
              </div>
              <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 min-h-10">
                {plan.description}
              </p>

              <Link
                href={plan.cta.href}
                className={
                  plan.highlight
                    ? "mt-6 inline-flex w-full justify-center rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2.5 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                    : "mt-6 inline-flex w-full justify-center rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-4 py-2.5 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                }
              >
                {plan.cta.label}
              </Link>

              <ul className="mt-8 space-y-3 text-sm">
                {plan.features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2.5 text-neutral-700 dark:text-neutral-300"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a.75.75 0 0 1 .006 1.06l-7.5 7.6a.75.75 0 0 1-1.07.001L3.29 8.99a.75.75 0 1 1 1.066-1.056l4.314 4.355 6.97-7.06a.75.75 0 0 1 1.064-.006Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-neutral-500 dark:text-neutral-400 text-center">
          Alla priser anges exklusive moms.
        </p>
      </div>
    </section>
  );
}
