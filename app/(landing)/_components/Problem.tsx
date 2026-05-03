const problems = [
  {
    title: "Lagersaldot stämmer aldrig",
    body: "Webshoppen visar en siffra, lagret en annan, Fortnox en tredje. Någon säljer det sista exemplaret — två gånger.",
  },
  {
    title: "Inköpsorder utanför systemet",
    body: "Beställningar lever i Excel, mejl och en kalkyl ingen vågar röra. Ingen vet riktigt vad som faktiskt är på väg in.",
  },
  {
    title: "8 musklick för att ändra ett antal",
    body: "Gamla affärssystem är byggda för 2005. En justering ska ta två klick — inte en kaffepaus.",
  },
  {
    title: "Allt fungerar inte ihop",
    body: "Webshop, lager, frakt och bokföring blir fyra öar med dyra tredjepartsbroar emellan. Det är där dubbelarbetet uppstår.",
  },
];

export default function Problem() {
  return (
    <section className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Problemet
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            Den dagliga driften läcker tid överallt
          </h2>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            Bokföringen är löst — Fortnox sköter den. Men runt den ligger
            lager, ordrar, inköp och frakt utspridda i system som inte pratar
            med varandra. Det är där timmarna försvinner.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 gap-4">
          {problems.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-950 dark:text-white">
                    {p.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {p.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
