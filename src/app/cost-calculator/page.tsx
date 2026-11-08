import type { Metadata } from "next";
import { CLAIMS, SITE } from "@/content/site";
import { CC_FAQ, CC_URL } from "@/content/costCalculator";
import { CC_MARKUP } from "@/components/costCalculator/markup";
import { CcScript } from "@/components/costCalculator/CcScript";
import "./cost-calculator.css";

const TITLE = "Plan Your UAE Company Budget | Best Solution";
const DESCRIPTION =
  "Compare mainland, free zone and offshore, plan your UAE company and review the cost areas with a private advisor.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CC_URL },
  // openGraph and twitter replace the layout's objects rather than merging, so the shared fields are repeated.
  openGraph: { type: "website", siteName: SITE.name, title: TITLE, description: DESCRIPTION, url: CC_URL },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: CC_FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const faqHtml = CC_FAQ.map(
  ([q, a], i) => `<details class="qa"${i ? "" : ' id="faq-why" open'}><summary>${esc(q)}<i></i></summary><p>${esc(a)}</p></details>`,
).join("");

/* Star icons for the review cards (the text star symbol is not used). */
const STAR = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';
/* Stat numbers render only once confirmed (content/site CLAIMS), as final values; the tiles keep their place. */
const lead = (claim: string | null, re: RegExp) => (claim ? esc(claim.match(re)?.[0] ?? "") : "");

const html = CC_MARKUP.replace("__FAQ__", () => faqHtml)
  .split("__STARS__").join(STAR.repeat(5))
  .replace("__STAT_BUSINESSES__", lead(CLAIMS.businesses, /^[\d,]+\+?/))
  .replace("__STAT_COUNTRIES__", lead(CLAIMS.countries, /[\d,]+\+?/))
  .replace("__STAT_TEAM__", lead(CLAIMS.team, /^[\d,]+\+?/))
  .replace("__STAT_RATING__", lead(CLAIMS.rating, /\d\.\d/));

/*
  /cost-calculator: "Plan your budget", the old configurator design with advice-only content (Google Ads policy). The
  body is the design's static HTML (components/costCalculator/markup); CcScript runs the planner, the plan card, the
  comparison, the "Send to an advisor" pop-up and the lead forms. English only (?lang= URLs 301 to this page). No price
  data reaches the browser: the planner uses lib/setupPlan; /api/cost-calculator describes the choice for the ERP.
*/
export default function CostCalculatorPage() {
  return (
    <div className="cc-page" id="ccPage" lang="en" dir="ltr">
      <a className="skip-link" href="#calculator">
        Skip to the planner
      </a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <CcScript />
    </div>
  );
}
