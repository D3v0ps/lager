/**
 * Integrations strip — logo wall directly under the hero.
 *
 * Shows the partners that matter to a Swedish e-com / inventory ops team:
 * Fortnox (the headline integration), accounting alternates (Visma, Bokio),
 * commerce (Shopify, WooCommerce), checkout/payments (Klarna, Stripe,
 * Swish), shipping (PostNord, DHL, Bring, Best, UPS), marketing (Klaviyo).
 *
 * Logos are rendered as monochrome wordmarks so the row reads as a system
 * rather than a noisy stack of brand colors. The marquee animates only
 * when prefers-reduced-motion is not set (handled in globals.css).
 */

const logos = [
  { name: "Fortnox", emphasis: true },
  { name: "Shopify" },
  { name: "WooCommerce" },
  { name: "PostNord" },
  { name: "Klarna" },
  { name: "Stripe" },
  { name: "DHL" },
  { name: "Bring" },
  { name: "Best Transport" },
  { name: "Visma" },
  { name: "Klaviyo" },
  { name: "Swish" },
  { name: "Bokio" },
  { name: "Tradera" },
];

export default function Integrations() {
  // Duplicate the list so the marquee can loop seamlessly.
  const loop = [...logos, ...logos];

  return (
    <section
      aria-label="Integrationer"
      className="relative border-y border-white/5 bg-background-elevated/50"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-foreground-muted mb-6">
          Synkar i bakgrunden med
        </p>
        <div
          className="relative overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          }}
        >
          <ul className="flex w-max gap-12 animate-marquee">
            {loop.map((logo, i) => (
              <li
                key={`${logo.name}-${i}`}
                className="flex items-center shrink-0"
              >
                <span
                  className={`text-2xl font-semibold tracking-tight whitespace-nowrap ${
                    logo.emphasis
                      ? "brand-text"
                      : "text-foreground-muted/80"
                  }`}
                >
                  {logo.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-6 text-center text-xs text-foreground-muted">
          Fortnox-koppling ingår på alla planer. Övriga integrationer rullar
          ut löpande — saknar du en? Säg till.
        </p>
      </div>
    </section>
  );
}
