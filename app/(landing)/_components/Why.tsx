const points = [
  {
    title: "Modern UX byggd 2026 — inte 2005",
    body: "Justera ett antal på två klick. Snabbsökning som faktiskt är snabb. Mobilvänligt på riktigt — för du står i lagret, inte vid skrivbordet.",
  },
  {
    title: "Fortnox-koppling INGÅR",
    body: "Artiklar, kunder, fakturor och lagervärde synkas bidirektionellt. Andra leverantörer tar 200–500 kr/mån för samma sak — vi tar noll.",
  },
  {
    title: "Personlig svensk support",
    body: "Vi lämnar inte förrän er lageransvarig är hemma i systemet. Riktiga människor som svarar på svenska, samma dag.",
  },
];

export default function Why() {
  return (
    <section className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Varför Saldo
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white">
              Vi gör en sak — och vi gör den bättre
            </h2>
            <p className="mt-4 text-neutral-600 dark:text-neutral-400">
              Saldo försöker inte vara hela ditt affärssystem. Vi är navet för
              den dagliga driften — lager, order, inköp, frakt — och vi
              kopplar oss till det du redan har. Klart.
            </p>

            <div className="mt-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Vad du slipper
              </p>
              <ul className="mt-3 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                {[
                  "Separat konnektor mellan webshop och Fortnox (190–500 kr/mån)",
                  "Per-användarpåslag varje gång du anställer någon",
                  "Konsultarvoden och flerveckors implementation",
                  "Excel-ark som lever utanför systemet",
                  "Moduler för bokföring och lön — det löser Fortnox",
                ].map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4 mt-0.5 text-neutral-400 shrink-0"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM6.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 12l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 13.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 12l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 10.94 6.28 7.22Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-7 grid gap-4">
            {points.map((p, i) => (
              <div
                key={p.title}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-semibold tabular-nums shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg text-neutral-950 dark:text-white">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {p.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
