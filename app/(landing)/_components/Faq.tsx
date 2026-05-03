import { ScrollReveal } from "./ScrollReveal";

const faqs = [
  {
    q: "Vi använder redan Visma / Fortnox — måste vi byta?",
    a: "Nej. Saldo ersätter inte din bokföring. Fortnox kör på som vanligt — Saldo synkar artiklar, kunder och fakturor i bakgrunden. Är ni på Visma kan ni fortsätta med det och köra Saldo parallellt; Visma-koppling kommer Q4.",
  },
  {
    q: "Hur lång är implementationen?",
    a: "1–3 dagar för en typisk e-handel med 100–500 artiklar. Vi sätter upp Fortnox-kopplingen, importerar artiklar och kunder från CSV, och kör en personlig genomgång med er lager­ansvarige. Ingen extern konsult behövs.",
  },
  {
    q: "Var lagras min data?",
    a: "Hos Supabase i EU (Frankfurt-region). Daglig krypterad backup. Rad-nivå-säkerhet (RLS) för all multi-tenant-isolation. GDPR-konformt; vi tecknar DPA på begäran.",
  },
  {
    q: "Vad händer om jag säger upp?",
    a: "Du kan när som helst exportera all din data som CSV — produkter, ordrar, kunder, lagerrörelser. Inga lock-in-format, inga utträdesavgifter. Vi raderar din data 30 dagar efter uppsägning på begäran (eller direkt om du så vill).",
  },
  {
    q: "Klarar ni multi-warehouse / flera lager?",
    a: "Ja. Tenanten har en huvudlokation idag; multi-lokation per tenant rullar ut Q3 2026. Är det blockerande för er — säg till så prioriterar vi.",
  },
  {
    q: "Erbjuder ni mobilapp?",
    a: "Ja — som Progressive Web App. Streckkods­scannern och alla flöden fungerar i webbläsaren på telefon (iOS Safari, Chrome). Native-appar i App Store / Play kommer 2027 om efterfrågan finns.",
  },
];

export default function Faq() {
  return (
    <section
      id="faq"
      className="scroll-mt-20 border-t border-white/5 bg-background-elevated/30"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-24 sm:py-32">
        <ScrollReveal>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted font-medium">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
              Vanliga frågor.
            </h2>
          </div>
        </ScrollReveal>

        <div className="mt-12 divide-y divide-white/5 rounded-2xl border border-white/10 bg-background overflow-hidden">
          {faqs.map((item, i) => (
            <ScrollReveal key={item.q} delay={i * 50}>
              <details className="group">
                <summary className="flex items-center justify-between gap-6 px-6 sm:px-8 py-5 cursor-pointer list-none hover:bg-white/[0.02] transition-colors">
                  <span className="font-medium text-base">{item.q}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4 text-foreground-muted shrink-0 transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  >
                    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                  </svg>
                </summary>
                <div className="px-6 sm:px-8 pb-6 -mt-1 text-sm text-foreground-muted leading-relaxed max-w-3xl">
                  {item.a}
                </div>
              </details>
            </ScrollReveal>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-foreground-muted">
          Annat på hjärtat?{" "}
          <a
            href="mailto:hej@saldo.se"
            className="text-foreground hover:underline underline-offset-4"
          >
            hej@saldo.se
          </a>{" "}
          — vi svarar samma dag.
        </p>
      </div>
    </section>
  );
}
