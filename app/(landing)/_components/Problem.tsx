import { ScrollReveal } from "./ScrollReveal";

const problems = [
  {
    metric: "6 tim/vecka",
    title: "Lagersaldot stämmer aldrig",
    body: "Webshoppen visar en siffra, lagret en annan, Fortnox en tredje. Någon säljer det sista exemplaret — två gånger.",
  },
  {
    metric: "1 av 4",
    title: "Inköp lever utanför systemet",
    body: "Beställningar i Excel, mejl och en kalkyl ingen vågar röra. Var fjärde inleverans hamnar fel — och ingen vet riktigt vad som är på väg in.",
  },
  {
    metric: "8 klick",
    title: "Affärssystemet är från 2005",
    body: "Att justera ett antal ska ta två klick. I gamla affärssystem tar det åtta. Det är därför ingen uppdaterar saldot förrän det redan är fel.",
  },
  {
    metric: "190–500 kr/mån",
    title: "Tredjepartsbroar drar pengar",
    body: "Webshop, lager, frakt och bokföring blir fyra öar med dyra konnektor-prenumerationer emellan. Det är där dubbelarbetet — och avgifterna — uppstår.",
  },
];

export default function Problem() {
  return (
    <section className="border-t border-white/5 bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-32">
        <ScrollReveal>
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400 font-medium">
              Problemet
            </p>
            <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
              Den dagliga driften
              <br />
              <span className="text-foreground-muted">läcker tid överallt.</span>
            </h2>
            <p className="mt-5 text-lg text-foreground-muted leading-relaxed max-w-xl">
              Bokföringen är löst — Fortnox sköter den. Men runt den ligger
              lager, ordrar, inköp och frakt utspridda i system som inte pratar
              med varandra. Det är där timmarna försvinner.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-16 grid sm:grid-cols-2 gap-px bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          {problems.map((p, i) => (
            <ScrollReveal key={p.title} delay={i * 80}>
              <div className="bg-background h-full p-6 sm:p-8">
                <p
                  className="text-3xl font-semibold tracking-tight tabular-nums"
                  style={{
                    background: "var(--brand-gradient)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {p.metric}
                </p>
                <h3 className="mt-3 text-lg font-medium">{p.title}</h3>
                <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
                  {p.body}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <p className="mt-6 text-xs text-foreground-muted">
          Siffror är typiska för en e-handel med 100–500 ordrar/mån. Egen
          erfarenhet av onboardingsamtal — be oss räkna på er specifikt.
        </p>
      </div>
    </section>
  );
}
