import type { Metadata } from "next";
import { HOME_FAQS, SITE } from "@/content/site";
import { Header } from "@/components/header/Header";
import { Hero } from "@/components/hero/Hero";
import { AdviceSection } from "@/components/calculator/CalculatorSection";
import { MobileEstimateBar } from "@/components/ui/MobileEstimateBar";
import { Consultation } from "@/components/sections/Consultation";
import { WhyUs } from "@/components/sections/WhyUs";
import { Jurisdictions } from "@/components/sections/Jurisdictions";
import { Process } from "@/components/sections/Process";
import { Reviews } from "@/components/sections/Reviews";
import { Faq } from "@/components/sections/Faq";
import { Closing, Footer } from "@/components/sections/Closing";
import { RevealObserver } from "@/components/ui/RevealObserver";
import { SectionDeepLink } from "@/components/ui/SectionDeepLink";

const TITLE = "UAE Business Advice | Best Solution";
const DESCRIPTION =
  "Talk to a private advisor in Business Bay, Dubai, about mainland, free zone and offshore options. Clear advice in plain terms, no obligation.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // Page-level openGraph/twitter replace the layout's whole objects, so the shared fields are repeated here.
  openGraph: { type: "website", siteName: SITE.name, title: TITLE, description: DESCRIPTION, images: [SITE.ogImage] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [SITE.ogImage] },
  // The sitelink paths (/mainland, /reviews, ...) serve this same page; they all point back to its root.
  // Absolute, because metadataBase is the main www site.
  alternates: { canonical: "https://business.best-solution.ae/" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: HOME_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#calculator">
        Skip to the consultation form
      </a>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }}
      />
      <Header />
      <main id="top">
        <Hero />
        <AdviceSection />
        <Consultation />
        <WhyUs />
        <Jurisdictions />
        <Process />
        <Reviews />
        <Faq />
        <Closing />
      </main>
      <Footer />
      <MobileEstimateBar targetId="calculator" location="LP Mobile Bar - Book a Consultation" label="Book a consultation" />
      <RevealObserver />
      <SectionDeepLink />
    </>
  );
}
