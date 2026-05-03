export default function HeroVisual() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-amber-200/40 via-white/0 to-blue-300/40 dark:from-amber-500/10 dark:to-blue-500/10 blur-2xl" />
      <div className="relative rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl shadow-neutral-900/5 dark:shadow-black/40 overflow-hidden">
        <div className="flex items-center gap-1.5 border-b border-neutral-200 dark:border-neutral-800 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <div className="ml-3 h-5 flex-1 rounded bg-neutral-100 dark:bg-neutral-800" />
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-neutral-500">
                Produkter
              </p>
              <p className="text-xl font-semibold text-neutral-900 dark:text-white">
                128 i lager
              </p>
            </div>
            <div className="rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-3 py-1.5 text-xs font-medium">
              + Ny produkt
            </div>
          </div>

          <div className="space-y-2">
            {[
              { name: "Skruv M6 x 30 mm", sku: "SKR-630", qty: 412, low: false },
              { name: "Trälim 250 ml", sku: "TLM-250", qty: 8, low: true },
              { name: "Penslar set 5-pack", sku: "PNS-005", qty: 47, low: false },
              { name: "Sandpapper P120", sku: "SND-120", qty: 3, low: true },
              { name: "Vattenpass 60 cm", sku: "VTP-060", qty: 24, low: false },
            ].map((p) => (
              <div
                key={p.sku}
                className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 px-3 py-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M10 2 3 6v8l7 4 7-4V6l-7-4ZM5 7.2 10 10l5-2.8M10 10v8" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {p.name}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">{p.sku}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.low && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-[10px] font-medium">
                      Lågt
                    </span>
                  )}
                  <span className="text-sm tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
                    {p.qty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
