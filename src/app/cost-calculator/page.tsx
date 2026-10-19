import type { Metadata } from "next";
import { SITE } from "@/content/site";
import { CC_FAQ } from "@/content/costCalculator";
import { CC_MARKUP } from "@/components/costCalculator/markup";
import { CcScript } from "@/components/costCalculator/CcScript";
import "./cost-calculator.css";

const TITLE = "UAE Company Setup Cost Calculator | Best Solution";
const DESCRIPTION =
  "Compare mainland, free zone and offshore, build an itemised first-year estimate for your UAE company and have every figure confirmed in writing.";
const SHARE_TITLE = "What will your UAE company cost?";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://business.best-solution.ae/cost-calculator" },
  // openGraph and twitter replace the layout's objects rather than merging, so the shared fields are repeated.
  openGraph: { type: "website", siteName: SITE.name, title: SHARE_TITLE, description: DESCRIPTION, images: [SITE.ogImage] },
  twitter: { card: "summary_large_image", title: SHARE_TITLE, description: DESCRIPTION, images: [SITE.ogImage] },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: CC_FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
// English on the server (for search and before the script runs); CcScript rebuilds it in the visitor's language.
const faqHtml = CC_FAQ.map(
  ([q, a], i) => `<details class="qa"${i ? "" : ' id="faq-why" open'}><summary>${esc(q)}<i></i></summary><p>${esc(a)}</p></details>`,
).join("");

/*
  /cost-calculator: the UAE company setup cost configurator. The body is the design's static HTML
  (components/costCalculator/markup); CcScript runs the configurator, the price pop-up, the five languages and the
  lead forms. The wrapper carries the page language and direction (Arabic is right to left), so the root layout's
  <html lang="en"> stays as it is. GTM, consent and the cookie banner come from the root layout.
*/
export default function CostCalculatorPage() {
  return (
    <div className="cc-page" id="ccPage" lang="en" dir="ltr">
      <a className="skip-link" href="#calculator">
        Skip to the calculator
      </a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />
      <div dangerouslySetInnerHTML={{ __html: CC_MARKUP.replace("__FAQ__", () => faqHtml) }} />
      <CcScript />
    </div>
  );
}
