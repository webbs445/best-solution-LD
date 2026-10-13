import type { Metadata } from "next";
import { CT_FAQS } from "@/content/corporateTax";
import { SITE } from "@/content/site";
import { CT_MARKUP } from "@/components/corporateTax/markup";
import { CtScript } from "@/components/corporateTax/CtScript";
import "./corporate-tax.css";

const TITLE = "UAE Corporate Tax Advice and Returns | Best Solution";
const DESCRIPTION =
  "Know your UAE Corporate Tax date, estimate what you owe and get your return prepared and filed on time. Free tax review with our Business Bay team.";
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
// The first question starts open, as in the design.
const faqHtml = CT_FAQS.map(
  (f, i) =>
    `<div class="qa${i ? "" : " open"}"><button type="button" aria-expanded="${i ? "false" : "true"}">${esc(f.q)}<i></i></button><div class="ans"><div><p>${esc(f.a)}</p></div></div></div>`,
).join("");

/*
  /corporate-tax: UAE Corporate Tax landing page. The body is the design's static HTML (components/corporateTax/markup);
  CtScript runs its dial, estimator, checkers and the review form. GTM, consent and the cookie banner come from the
  root layout.
*/
export default function CorporateTaxPage() {
  return (
    <div className="ct-page" id="ctPage">
      <a className="skip-link" href="#top">
        Skip to main content
      </a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />
      <div dangerouslySetInnerHTML={{ __html: CT_MARKUP.replace("__FAQ__", () => faqHtml) }} />
      <CtScript />
    </div>
  );
}
