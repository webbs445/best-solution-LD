import type { Metadata } from "next";
import { FZ_FAQS, FZ_FAQ_TOPICS } from "@/content/freezone";
import { SITE } from "@/content/site";
import { FzHeader } from "./FzHeader";
import { FzMotion } from "./FzMotion";
import { FzHero } from "./FzHero";
import { FzZones } from "./FzZones";
import { FzHowItWorks } from "./FzHowItWorks";
import { FzFaq } from "./FzFaq";
import { FzFooter } from "./FzFooter";
import { FzSitelink } from "./FzSitelink";
import {
  FzBudget,
  FzClosing,
  FzConsultation,
  FzPlan,
  FzReviews,
  FzVsMainland,
  FzWhyUs,
} from "./FzSections";
import { MobileEstimateBar } from "@/components/ui/MobileEstimateBar";
import "@/app/freezone/freezone.css";

const TITLE = "Compare UAE Free Zones with an Advisor | Best Solution";
const DESCRIPTION =
  "Compare UAE free zones by activity and workspace type, plan what to budget for and talk it through with a dedicated advisor in Business Bay. No obligation.";
const SHARE_TITLE = "Compare UAE free zones with an advisor";
const SHARE_DESCRIPTION =
  "Compare UAE free zones by activity and workspace type, then talk it through with a dedicated advisor.";

/** Shared by /freezone and every sitelink route (/freezone/planner, ...): one canonical for all of them. */
export const FZ_METADATA: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://business.best-solution.ae/freezone" },
  // openGraph and twitter replace the layout's objects rather than merging, so the shared fields are repeated.
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: [SITE.ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: [SITE.ogImage],
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FZ_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

/*
  The UAE free zone comparison landing page, advice only (Google Ads government documents policy). GTM, consent and the cookie banner come from
  the root layout. `view` is the sitelink route's name (planner, compare, ...); FzSitelink acts on it.
*/
export function FreeZoneLanding({ view }: { view?: string }) {
  return (
    <div className="fz-page">
      <a className="skip-link" href="#planner">
        Skip to the consultation form
      </a>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c"),
        }}
      />
      <FzHeader />
      <FzMotion />
      <main id="top">
        <FzHero />
        <FzPlan />
        <FzZones />
        <FzBudget />
        <FzVsMainland />
        <FzConsultation />
        <FzHowItWorks />
        <FzWhyUs />
        <FzReviews />
        <FzFaq faqs={FZ_FAQS} topics={FZ_FAQ_TOPICS} />
        <FzClosing />
      </main>
      <FzFooter />
      <MobileEstimateBar
        targetId="planner"
        hideOver={["planner"]}
        label="Book a Consultation"
        location="FZ Mobile Bar - Book a Consultation"
      />
      {view && <FzSitelink view={view} />}
    </div>
  );
}
