const points = [
  {
    title: "Svenskt — på riktigt",
    body: "Byggt och drivet i Sverige. Allt på svenska — gränssnitt, support, fakturor. Ingen Google Translate-känsla.",
  },
  {
    title: "Ingen onödig komplexitet",
    body: "Vi har sagt nej till hundra funktioner för att de tio som spelar roll ska vara perfekta.",
  },
  {
    title: "Direkt i webbläsaren",
    body: "Inga installationer. Inga lokala databaser. Logga in och börja jobba — på vilken dator som helst.",
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
              Enkelt. Svenskt. Genomtänkt.
            </h2>
            <p className="mt-4 text-neutral-600 dark:text-neutral-400">
              Vi har sett för många småföretag drunkna i affärssystem som är
              gjorda för storbolag. Saldo är motsatsen — det minsta du behöver
              för att äntligen ha koll.
            </p>

            <div className="mt-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Vad du slipper
              </p>
              <ul className="mt-3 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                {[
                  "Konsultarvoden för att komma igång",
                  "Långa avtal och uppsägningstider",
                  "Moduler du aldrig kommer använda",
                  "Engelska felmeddelanden mitt i natten",
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
