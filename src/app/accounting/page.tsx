import type { Metadata } from "next";
import { AC_FAQS, AC_OFFER, AC_OFFER_EXTRA } from "@/content/accounting";
import { SITE } from "@/content/site";
import { AcChrome } from "@/components/accounting/AcChrome";
import { AcHero } from "@/components/accounting/AcHero";
import { AcAbout } from "@/components/accounting/AcAbout";
import { AcServices } from "@/components/accounting/AcServices";
import { AcHealthCheck } from "@/components/accounting/AcHealthCheck";
import { AcProcess } from "@/components/accounting/AcProcess";
import { AcReports } from "@/components/accounting/AcReports";
import { AcWhy } from "@/components/accounting/AcWhy";
import { AcFaq } from "@/components/accounting/AcFaq";
import { AcQuote } from "@/components/accounting/AcQuote";
import { AcFooter } from "@/components/accounting/AcFooter";
import { AcMotion } from "@/components/accounting/AcMotion";
import "./accounting.css";

const TITLE = "Accounting and Bookkeeping in Dubai | Best Solution";
const DESCRIPTION =
  `Monthly bookkeeping, bank reconciliation and financial statements for UAE businesses, from an accounting team in Business Bay, Dubai. ${AC_OFFER}.${AC_OFFER_EXTRA ? ` ${AC_OFFER_EXTRA}` : ""}`;
const SHARE_TITLE = "Clean books. Every month.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://business.best-solution.ae/accounting" },
  // openGraph and twitter replace the layout's objects rather than merging, so the shared fields are repeated.
  openGraph: { type: "website", siteName: SITE.name, title: SHARE_TITLE, description: DESCRIPTION, images: [SITE.ogImage] },
  twitter: { card: "summary_large_image", title: SHARE_TITLE, description: DESCRIPTION, images: [SITE.ogImage] },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: AC_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

/* /accounting: accounting and bookkeeping landing page. GTM, consent and the cookie banner come from the root layout. */
export default function AccountingPage() {
  return (
    <div className="ac-page">
      <a className="skip-link" href="#top">
        Skip to main content
      </a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#cc8667" />
            <stop offset=".5" stopColor="#d4956f" />
            <stop offset="1" stopColor="#b5775a" />
          </linearGradient>
        </defs>
      </svg>
      <AcChrome />
      <main id="top" tabIndex={-1}>
        <AcHero />
        <AcAbout />
        <AcServices />
        <AcHealthCheck />
        <AcProcess />
        <AcReports />
        <AcWhy />
        <AcFaq />
        <AcQuote />
      </main>
      <AcFooter />
      <AcMotion />
    </div>
  );
}
