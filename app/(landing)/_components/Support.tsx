export default function Support() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <div className="relative rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-amber-200 to-rose-200 dark:from-amber-500/20 dark:to-rose-500/20 blur-3xl opacity-60"
          />
          <div className="relative grid lg:grid-cols-2 gap-10 p-8 sm:p-12 lg:p-16 items-center">
            <div>
              <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                Vårt löfte
              </p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white">
                Vi lämnar dig inte tills du känner dig bekväm i skorna
              </h2>
              <p className="mt-5 text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Vi supportar dig genom hela processen. Personlig onboarding där
                vi sätter upp ditt sortiment tillsammans, svenskspråkig support
                via mejl och telefon — och en faktisk människa som svarar.
              </p>

              <dl className="mt-8 grid sm:grid-cols-3 gap-6">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-neutral-500">
                    Onboarding
                  </dt>
                  <dd className="mt-1 font-medium text-neutral-950 dark:text-white">
                    Personlig genomgång
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-neutral-500">
                    Support
                  </dt>
                  <dd className="mt-1 font-medium text-neutral-950 dark:text-white">
                    Svenska, vardagar
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-neutral-500">
                    Migrering
                  </dt>
                  <dd className="mt-1 font-medium text-neutral-950 dark:text-white">
                    Vi hjälper med Excel-import
                  </dd>
                </div>
              </dl>
            </div>

            <div className="relative">
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-300 to-rose-300 dark:from-amber-400 dark:to-rose-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-neutral-500">
                      Support · för 2 minuter sedan
                    </p>
                    <div className="mt-1 rounded-2xl rounded-tl-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-4 py-3 text-sm text-neutral-800 dark:text-neutral-200">
                      Hej! Jag såg att du precis registrerade dig — vill du att
                      vi bokar 20 minuter och går igenom din Excel
                      tillsammans?
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 flex-row-reverse">
                  <div className="h-9 w-9 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0" />
                  <div className="flex-1 text-right">
                    <p className="text-xs text-neutral-500">Du · nyss</p>
                    <div className="mt-1 inline-block rounded-2xl rounded-tr-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-3 text-sm text-left">
                      Ja gärna! Imorgon förmiddag?
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
