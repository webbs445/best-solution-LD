import type { Metadata } from "next";
import { FAQS } from "@/content/site";
import { Header } from "@/components/header/Header";
import { Hero, HeroCardAfterCalculator } from "@/components/hero/Hero";
import { CalculatorProvider } from "@/components/calculator/CalculatorProvider";
import { CalculatorSection } from "@/components/calculator/CalculatorSection";
import { MobileEstimateBar } from "@/components/ui/MobileEstimateBar";
import { Partners } from "@/components/sections/Partners";
import { Consultation } from "@/components/sections/Consultation";
import { WhyUs } from "@/components/sections/WhyUs";
import { Jurisdictions } from "@/components/sections/Jurisdictions";
import { Process } from "@/components/sections/Process";
import { Reviews } from "@/components/sections/Reviews";
import { Faq } from "@/components/sections/Faq";
import { Closing, Footer } from "@/components/sections/Closing";
import { RevealObserver } from "@/components/ui/RevealObserver";
import { SectionDeepLink } from "@/components/ui/SectionDeepLink";

export const metadata: Metadata = {
  // The sitelink paths (/mainland, /reviews, ...) serve this same page; they all point back to its root.
  // Absolute, because metadataBase is the main www site.
  alternates: { canonical: "https://business.best-solution.ae/" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function Home() {
  return (
    <CalculatorProvider>
      <a className="skip-link" href="#calculator">
        Skip to the cost calculator
      </a>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }}
      />
      <Header />
      <main id="top">
        <Hero />
        <CalculatorSection />
        <HeroCardAfterCalculator />
        <Partners />
        <Consultation />
        <WhyUs />
        <Jurisdictions />
        <Process />
        <Reviews />
        <Faq />
        <Closing />
      </main>
      <Footer />
      <MobileEstimateBar targetId="calculator" location="LP Mobile Bar — Get My Estimate" />
      <RevealObserver />
      <SectionDeepLink />
    </CalculatorProvider>
  );
}
