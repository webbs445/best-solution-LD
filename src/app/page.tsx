import { FAQS } from "@/content/site";
import { Header } from "@/components/header/Header";
import { Hero } from "@/components/hero/Hero";
import { CalculatorProvider } from "@/components/calculator/CalculatorProvider";
import { CalculatorSection } from "@/components/calculator/CalculatorSection";
import { MobileBar } from "@/components/calculator/MobileBar";
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }}
      />
      <Header />
      <main id="top">
        <Hero />
        <CalculatorSection />
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
      <MobileBar />
      <RevealObserver />
      <SectionDeepLink />
    </CalculatorProvider>
  );
}
