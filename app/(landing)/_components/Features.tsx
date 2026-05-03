const features = [
  {
    title: "Lager",
    body: "Variants, multi-lokation, snabbjustering på två klick och scanning från mobilen. Saldot stämmer — överallt, hela tiden.",
    status: null,
    icon: (
      <path d="M3 4.75A.75.75 0 0 1 3.75 4h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 4.75ZM3 10a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 10Zm0 5.25a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" />
    ),
  },
  {
    title: "Order",
    body: "Webshop-ordrar in, plocka, packa, skicka — utan dubbelregistrering. Manuella ordrar och returer i samma flöde.",
    status: null,
    icon: (
      <path
        fillRule="evenodd"
        d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z"
        clipRule="evenodd"
      />
    ),
  },
  {
    title: "Inköp",
    body: "Leverantörsregister, beställningsförslag baserat på era egna nivåer och mottagningsregistrering. Slut med Excel-listan i mejlen.",
    status: null,
    icon: (
      <path d="M10 2a.75.75 0 0 1 .75.75v.5a6.5 6.5 0 0 1 5.93 5.93h.5a.75.75 0 0 1 0 1.5h-.5a6.5 6.5 0 0 1-5.93 5.93v.5a.75.75 0 0 1-1.5 0v-.5a6.5 6.5 0 0 1-5.93-5.93h-.5a.75.75 0 0 1 0-1.5h.5A6.5 6.5 0 0 1 9.25 3.25v-.5A.75.75 0 0 1 10 2Zm0 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
    ),
  },
  {
    title: "Frakt",
    body: "Etiketter direkt från ordern via Fraktjakt-integrationen. Inga extra inloggningar, ingen klipp-och-klistra av spårningsnummer.",
    status: "Snart",
    icon: (
      <path
        fillRule="evenodd"
        d="M5.25 2A2.25 2.25 0 0 0 3 4.25v11.5A2.25 2.25 0 0 0 5.25 18h9.5A2.25 2.25 0 0 0 17 15.75V4.25A2.25 2.25 0 0 0 14.75 2h-9.5ZM10 16a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    ),
  },
  {
    title: "Rapporter",
    body: "Vad säljer, vad ligger dött, marginal per artikel, lagervärde över tid. Beslut byggda på data — inte magkänsla.",
    status: null,
    icon: (
      <path d="M3 13.75A.75.75 0 0 1 3.75 13h2.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1-.75-.75v-3.5Zm5-5A.75.75 0 0 1 8.75 8h2.5a.75.75 0 0 1 .75.75v8.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1-.75-.75v-8.5Zm5-5a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1-.75-.75V3.75Z" />
    ),
  },
  {
    title: "Fortnox-sync",
    body: "Artiklar, kunder, fakturor och lagervärde synkas bidirektionellt. Bokför som vanligt — Saldo håller siffrorna i takt.",
    status: "Snart",
    icon: (
      <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-7 9a7 7 0 1 1 14 0H3Z" />
    ),
  },
];

export default function Features() {
  return (
    <section id="funktioner" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Moduler
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            Sex moduler. Ett operativt nav.
          </h2>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            Allt som behövs för den dagliga driften — och inget mer. Lager,
            order, inköp, frakt, rapporter och Fortnox-sync i samma system,
            utan tredjepartsbroar.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-200 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white dark:bg-neutral-950 p-6 sm:p-8"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="h-9 w-9 rounded-lg bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4.5 w-4.5"
                    aria-hidden="true"
                  >
                    {f.icon}
                  </svg>
                </div>
                {f.status && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {f.status}
                  </span>
                )}
              </div>
              <h3 className="mt-4 font-medium text-neutral-950 dark:text-white">
                {f.title}
              </h3>
              <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-neutral-500 dark:text-neutral-400">
          Lager, order, inköp och rapporter byggs nu. Frakt och Fortnox-sync
          rullar ut under nästa kvartal.
        </p>
      </div>
    </section>
  );
}
