import { FinalCta } from "@/components/final-cta";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { PhotoShowcase } from "@/components/photo-showcase";
import { ProblemSection } from "@/components/problem-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TrustSection } from "@/components/trust-section";
import { WhoFor } from "@/components/who-for";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <ProblemSection />
        <HowItWorks />
        <PhotoShowcase />
        <WhoFor />
        <TrustSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
