import type { Metadata } from "next";
import { CT_FAQS } from "@/content/corporateTax";
import { CLAIMS, DISCLAIMER, SITE } from "@/content/site";
import { CT_MARKUP } from "@/components/corporateTax/markup";
import { CtScript } from "@/components/corporateTax/CtScript";
import "./corporate-tax.css";

const TITLE = "UAE Corporate Tax Advice and Return Support | Best Solution";
const DESCRIPTION =
  "Understand your UAE Corporate Tax obligations and due date, see an illustration of the tax and talk it through with our Business Bay team.";
const SHARE_TITLE = "When is your Corporate Tax return due?";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://business.best-solution.ae/corporate-tax" },
  // openGraph and twitter replace the layout's objects rather than merging, so the shared fields are repeated.
  openGraph: { type: "website", siteName: SITE.name, title: SHARE_TITLE, description: DESCRIPTION, images: [SITE.ogImage] },
  twitter: { card: "summary_large_image", title: SHARE_TITLE, description: DESCRIPTION, images: [SITE.ogImage] },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: CT_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
/* Fees-in-writing lines show only once confirmed (content/site CLAIMS.writtenQuote); neutral wording in the same place until then. */
const FEES_CHIP = CLAIMS.writtenQuote ? "Fees <b>in writing</b> first" : "Fees <b>explained</b> first";
const FEES_CARD = CLAIMS.writtenQuote
  ? "<h3>Fees in writing first</h3><p>You get a written fee breakdown after your review call, before any work begins.</p>"
  : "<h3>Fees explained first</h3><p>Your advisor explains the fees for the work you need after your review call, before any work begins.</p>";
// The first question starts open, as in the design.
const faqHtml = CT_FAQS.map(
  (f, i) =>
    `<div class="qa${i ? "" : " open"}"><button type="button" aria-expanded="${i ? "false" : "true"}">${esc(f.q)}<i></i></button><div class="ans"><div><p>${esc(f.a)}</p></div></div></div>`,
).join("");

/*
  /corporate-tax: UAE Corporate Tax landing page. The body is the design's static HTML (components/corporateTax/markup);
  CtScript runs its dial, estimator, checker and the review form. GTM, consent and the cookie banner come from the
  root layout.
*/
export default function CorporateTaxPage() {
  return (
    <div className="ct-page" id="ctPage">
      <a className="skip-link" href="#top">
        Skip to main content
      </a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />
      <div dangerouslySetInnerHTML={{ __html: CT_MARKUP.replace("__FAQ__", () => faqHtml).replaceAll("__DISCLAIMER__", esc(DISCLAIMER)).replace("__CT_FEES_CHIP__", FEES_CHIP).replace("__CT_FEES_CARD__", FEES_CARD)
            .replace("__CT_FEES_LINE__", CLAIMS.writtenQuote ? "You get them in writing before any work begins." : "Your advisor explains them before any work begins.")
            .replace("__CT_FEES_LEGAL__", CLAIMS.writtenQuote ? "Fees are confirmed in writing after your review." : "Fees are explained after your review.") }} />
      <CtScript />
    </div>
  );
}
