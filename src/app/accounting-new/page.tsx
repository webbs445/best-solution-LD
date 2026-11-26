import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import { SITE } from "@/content/site";
import { AnHeader, AnHero } from "@/components/accountingNew/AnHero";
import { AnBalance } from "@/components/accountingNew/AnBalance";
import { AnCheck } from "@/components/accountingNew/AnCheck";
import { AnAsks } from "@/components/accountingNew/AnAsks";
import { AnFlow } from "@/components/accountingNew/AnFlow";
import { AnSteps } from "@/components/accountingNew/AnSteps";
import { AnTeam } from "@/components/accountingNew/AnTeam";
import { AN_FAQS, AnFaq } from "@/components/accountingNew/AnFaq";
import { AnQuote } from "@/components/accountingNew/AnQuote";
import { AnFooter } from "@/components/accountingNew/AnFooter";
import "./accounting-new.css";

// Variable font: one file covers the 200 to 800 weights the design uses. Inter itself comes from the root layout.
const interTight = Inter_Tight({ subsets: ["latin"], display: "swap", variable: "--font-inter-tight" });

const TITLE = "Accounting and Bookkeeping Services in Dubai | Best Solution";
const DESCRIPTION =
  "Monthly books, a one-page report and your VAT and Corporate Tax returns filed. Qualified accountants in Business Bay. Get your quote the same working day.";

/*
  /accounting-new: the new accounting landing page, built beside the live /accounting until it is approved to replace it.
  The canonical already points at /accounting. noindex comes from the root layout (robots) and the X-Robots-Tag header,
  as on every page of this subdomain. GTM, consent and the cookie banner come from the root layout.
*/
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://business.best-solution.ae/accounting" },
  // openGraph and twitter replace the layout's objects rather than merging, so the shared fields are repeated.
  openGraph: { type: "website", siteName: SITE.name, title: TITLE, description: DESCRIPTION, images: [SITE.ogImage] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [SITE.ogImage] },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: AN_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function AccountingNewPage() {
  return (
    <div className={`an ${interTight.variable}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />
      <AnHeader />
      <main>
        <AnHero />
        <AnBalance />
        <AnCheck />
        <AnAsks />
        <AnFlow />
        <AnSteps />
        <AnTeam />
        <AnFaq />
        <AnQuote />
      </main>
      <AnFooter />
    </div>
  );
}
