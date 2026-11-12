import type { Metadata } from "next";
import { FZ_FAQS, FZ_FAQ_TOPICS, POPULAR_ACTS } from "@/content/freezone";
import { activityIcon } from "@/content/activityIcons";
import { CLAIMS, SITE } from "@/content/site";
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
import { BudgetConsult } from "./BudgetConsult";
import { FzClosing, FzConsultation, FzReviews, FzVsMainland, FzWhyUs } from "./FzSections";
import { MobileEstimateBar } from "@/components/ui/MobileEstimateBar";
import "@/app/freezone/freezone.css";

const TITLE = "Compare UAE Free Zones with an Advisor | Best Solution";
const DESCRIPTION =
  `Compare UAE free zones by activity and workspace type, plan what to budget for and talk it through with ${CLAIMS.oneAdvisor ? "a dedicated advisor" : "an advisor"} in Business Bay.`;
const SHARE_TITLE = "Compare UAE free zones with an advisor";
const SHARE_DESCRIPTION = `Compare UAE free zones by activity and workspace type, then talk it through with ${CLAIMS.oneAdvisor ? "a dedicated advisor" : "an advisor"}.`;

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
  The UAE free zone planner and comparison landing page, advice only (Google Ads government documents policy). GTM, consent and the cookie banner come from
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
          {/* Only the popular chips' icons ship with the page; the full icon set loads when the search is used. */}
          <FzZones popularIcons={Object.fromEntries(POPULAR_ACTS.map((n) => [n, activityIcon(n)]))} />
          <FzVsMainland />
          <FzConsultation />
          <FzHowItWorks />
          <FzWhyUs />
          <FzReviews />
          <FzFaq faqs={FZ_FAQS} topics={FZ_FAQ_TOPICS} />
          <FzClosing />
        </main>
        <FzFooter />
        <MobileEstimateBar targetId="planner" hideOver={["zones"]} label="Plan my free zone" location="FZ Mobile Bar - Plan My Free Zone" aboveCookie />
        <BudgetConsult />
        {view && <FzSitelink view={view} />}
      </PlannerProvider>
    </div>
  );
}
