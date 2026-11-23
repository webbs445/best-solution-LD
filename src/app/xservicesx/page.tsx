import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import { SITE } from "@/content/site";
import { FAQS } from "@/content/xservicesx";
import { XS_CONFIG as C } from "@/content/xservicesx.config";
import { XsHeader, XsHero } from "@/components/xservicesx/Top";
import { Worries } from "@/components/xservicesx/Worries";
import { Situations } from "@/components/xservicesx/Situations";
import { Outcomes } from "@/components/xservicesx/Outcomes";
import { HowItWorks } from "@/components/xservicesx/HowItWorks";
import { Advisors } from "@/components/xservicesx/Advisors";
import { Trust } from "@/components/xservicesx/Trust";
import { Questions } from "@/components/xservicesx/Questions";
import { PlanSection } from "@/components/xservicesx/PlanSection";
import { XsFooter } from "@/components/xservicesx/Footer";
import { StickyBar } from "@/components/xservicesx/StickyBar";
import { PlanDialog } from "@/components/xservicesx/PlanDialog";
import "./xservicesx.css";

const interTight = Inter_Tight({ subsets: ["latin"], weight: ["700", "800"], display: "swap", variable: "--font-inter-tight" });

const TITLE = "Business advice in Dubai, in writing | Best Solution";
const DESCRIPTION = "Get a clear written plan for your UAE company from a private advisor in Business Bay, Dubai: structure, costs and next steps.";

// noindex comes from the root layout (robots) and the X-Robots-Tag header, as on every page of this subdomain. Not in a
// sitemap (there is none) and not linked from any nav.
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "https://business.best-solution.ae/xservicesx" },
  openGraph: { type: "website", siteName: SITE.name, title: TITLE, description: DESCRIPTION, images: [SITE.ogImage] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [SITE.ogImage] },
};

/** ProfessionalService and FAQPage structured data, from confirmed values only. */
function jsonLd() {
  const service = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: SITE.name,
    url: "https://business.best-solution.ae/xservicesx",
    telephone: C.phoneNumber.href.replace("tel:", ""),
    email: C.email,
    address: {
      "@type": "PostalAddress",
      ...(C.officeAddress ? { streetAddress: C.officeAddress } : null),
      addressLocality: "Business Bay, Dubai",
      addressCountry: "AE",
    },
    // SITE.hours: Monday to Friday, 9am to 6pm.
    ...(C.officeHours ? { openingHours: "Mo-Fr 09:00-18:00" } : null),
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return JSON.stringify([service, faq]).replace(/</g, "\\u003c");
}

/*
  /xservicesx: the Services landing page (design/xservicesx). Server rendered; each section's interactive part is a
  small client component sharing one page state (components/xservicesx/store). One form, in section 9 (#plan).
*/
export default function XServicesPage() {
  const hasAdvisors = C.advisors.length > 0;
  return (
    <div className={`xs ${interTight.variable}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd() }} />
      <a className="skip-link" href="#plan">
        Skip to the form
      </a>
      <XsHeader showReviews />
      <main id="top">
        <XsHero />
        <Worries />
        <Situations />
        <Outcomes />
        <HowItWorks />
        {hasAdvisors && <Advisors />}
        <Trust withOffice={!hasAdvisors} />
        <Questions />
        <PlanSection />
      </main>
      <XsFooter showReviews />
      <StickyBar />
      <PlanDialog />
    </div>
  );
}
