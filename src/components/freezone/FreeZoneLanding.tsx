import type { Metadata } from "next";
import { FZ_FAQS } from "@/content/freezone";
import { SITE } from "@/content/site";
import { PlannerProvider } from "./PlannerProvider";
import { FzHeader } from "./FzHeader";
import { FzMotion } from "./FzMotion";
import { FzHero } from "./FzHero";
import { FzPartners } from "./FzPartners";
import { FzPlanner } from "./FzPlanner";
import { FzZones } from "./FzZones";
import { FzHowItWorks } from "./FzHowItWorks";
import { FzFaq } from "./FzFaq";
import { FzFooter } from "./FzFooter";
import { FzSitelink } from "./FzSitelink";
import { FzClosing, FzConsultation, FzMobileBar, FzReviews, FzVsMainland, FzWhyUs } from "./FzSections";
import "@/app/freezone/freezone.css";

const TITLE = "UAE Free Zone Costs & Comparison | Best Solution";
const DESCRIPTION =
  "Compare 28 UAE free zones by activity, office and cost. Get an indicative cost estimate, shortlist suitable zones and speak with a dedicated advisor. No obligation.";
const SHARE_TITLE = "The right free zone costs less than the wrong one";
const SHARE_DESCRIPTION = "Compare UAE free zones by activity, office and cost, then speak to a dedicated advisor.";

/** Shared by /freezone and every sitelink route (/freezone/planner, ...): one canonical for all of them. */
export const FZ_METADATA: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://business.best-solution.ae/freezone" },
  // openGraph and twitter replace the layout's objects rather than merging, so the shared fields are repeated.
  openGraph: { type: "website", siteName: SITE.name, title: SHARE_TITLE, description: SHARE_DESCRIPTION, images: [SITE.ogImage] },
  twitter: { card: "summary_large_image", title: SHARE_TITLE, description: SHARE_DESCRIPTION, images: [SITE.ogImage] },
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
  The UAE free zone planner and comparison landing page. GTM, consent and the cookie banner come from
  the root layout. `view` is the sitelink route's name (planner, compare, ...); FzSitelink acts on it.
*/
export function FreeZoneLanding({ view }: { view?: string }) {
  return (
    <div className="fz-page">
      <a className="skip-link" href="#planner">
        Skip to the free zone planner
      </a>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }}
      />
      <PlannerProvider>
        <FzHeader />
        <FzMotion />
        <main id="top">
          <FzHero />
          <FzPartners />
          <FzPlanner />
          <FzZones />
          <FzVsMainland />
          <FzConsultation />
          <FzHowItWorks />
          <FzWhyUs />
          <FzReviews />
          <FzFaq />
          <FzClosing />
        </main>
        <FzFooter />
        <FzMobileBar />
        {view && <FzSitelink view={view} />}
      </PlannerProvider>
    </div>
  );
}
