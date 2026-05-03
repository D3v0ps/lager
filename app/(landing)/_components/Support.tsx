import { ScrollReveal } from "./ScrollReveal";

/**
 * Support / "Vårt löfte" — replaces the old fake-chat bubble with a real
 * team photo collage. Photos are Unsplash portraits framed as the support
 * team — until real team photos exist these are honest placeholders, not
 * fake quoted-testimonials.
 */

const team = [
  {
    name: "Kund­ansvarig",
    role: "Onboarding & utbildning",
    photo:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=600&fit=crop&q=80",
  },
  {
    name: "Tekniskt stöd",
    role: "Fortnox-integrationer",
    photo:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=600&fit=crop&q=80",
  },
  {
    name: "Produktansvarig",
    role: "Roadmap & feedback",
    photo:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=600&fit=crop&q=80",
  },
];

export default function Support() {
  return (
    <section className="relative overflow-hidden border-t border-white/5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-32">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <ScrollReveal className="lg:col-span-6">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400 font-medium">
              Vårt löfte
            </p>
            <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
              Vi lämnar inte
              <br />
              <span className="text-foreground-muted">förrän det funkar.</span>
            </h2>
            <p className="mt-6 text-lg text-foreground-muted leading-relaxed max-w-xl">
              Vi sätter upp Fortnox-kopplingen, importerar artiklar och
              kunder, och kör en personlig genomgång med er lager­ansvarige.
              Sedan finns vi kvar — riktiga människor, svensk support, samma
              dag.
            </p>

            <dl className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-6">
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
                  Onboarding
                </dt>
                <dd className="mt-1.5 font-medium">Personlig genomgång</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
                  Support
                </dt>
                <dd className="mt-1.5 font-medium">Svenska, samma dag</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
                  Migrering
                </dt>
                <dd className="mt-1.5 font-medium">CSV + Fortnox-sync</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
                  SLA
                </dt>
                <dd className="mt-1.5 font-medium">99,9 % uptime</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
                  Backup
                </dt>
                <dd className="mt-1.5 font-medium">Daglig, EU-region</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
                  GDPR
                </dt>
                <dd className="mt-1.5 font-medium">Data i EU, krypterad</dd>
              </div>
            </dl>
          </ScrollReveal>

          <ScrollReveal className="lg:col-span-6" delay={150}>
            <div className="relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-8 opacity-30 blur-3xl"
                style={{ background: "var(--brand-gradient)" }}
              />
              <div className="relative grid grid-cols-3 gap-3">
                {team.map((member, i) => (
                  <div
                    key={member.name}
                    className={`relative overflow-hidden rounded-2xl border border-white/10 ${
                      i === 1 ? "translate-y-6" : ""
                    }`}
                  >
                    <div className="aspect-[3/4]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={member.photo}
                        alt={`${member.name}, ${member.role}`}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-[10px] uppercase tracking-[0.15em] text-foreground-muted">
                          {member.role}
                        </p>
                        <p className="mt-0.5 text-sm font-medium leading-tight">
                          {member.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs text-foreground-muted text-center">
                Bilder är illustrativa pilot-portraits. Svar inom samma
                arbetsdag, vardagar 09–17.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
