import Hero from "./_components/Hero";
import Integrations from "./_components/Integrations";
import Platform from "./_components/Platform";
import CustomerStory from "./_components/CustomerStory";
import Pricing from "./_components/Pricing";
import Faq from "./_components/Faq";

/**
 * Main landing — focused hub that funnels to module-specific pages.
 *
 * What we keep here:
 *   • Hero — one-line pitch + dual CTA
 *   • Integrations strip — instant trust
 *   • Platform — 3 module cards, primary funnel to /bygg, /portal etc.
 *   • CustomerStory — 3 pilot cards (social proof)
 *   • Pricing — module overview with links to per-module pricing details
 *   • Faq — universal questions only
 *
 * What we removed (now lives on dedicated module pages):
 *   • Problem, Features (Operations-specific) — implicit in catalog detail
 *   • Why comparison table — moved into module pages where relevant
 *   • Support team panel — folded into footer / contact
 */

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Integrations />
      <Platform />
      <CustomerStory />
      <Pricing />
      <Faq />
    </>
  );
}
