import type { Metadata } from "next";
import { SITE } from "@/content/site";
import { SPV_FAQS } from "@/content/spv";
import { SpvChrome } from "@/components/spv/SpvChrome";
import { SpvHero } from "@/components/spv/SpvHero";
import { SpvStamps } from "@/components/spv/SpvStamps";
import { SpvWhy } from "@/components/spv/SpvWhy";
import { SpvLayers } from "@/components/spv/SpvLayers";
import { SpvPillars } from "@/components/spv/SpvPillars";
import { SpvCompare } from "@/components/spv/SpvCompare";
import { SpvProcess } from "@/components/spv/SpvProcess";
import { SpvFit } from "@/components/spv/SpvFit";
import { SpvWho } from "@/components/spv/SpvWho";
import { SpvTrust } from "@/components/spv/SpvTrust";
import { SpvFaq } from "@/components/spv/SpvFaq";
import { SpvConsult } from "@/components/spv/SpvConsult";
import { SpvFooter } from "@/components/spv/SpvFooter";
import { SpvMotion } from "@/components/spv/SpvMotion";
import "./spv.css";

const TITLE = "Foundations, SPVs and Holding Structures | Best Solution";
const DESCRIPTION =
  "Plan who controls your assets and how they pass to your family. Advice on foundations, SPVs, holding and offshore companies in the UAE. Free consultation.";
const SHARE_TITLE = "Your assets need a structure, not just a bank account.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://business.best-solution.ae/spv" },
  // openGraph and twitter replace the layout's objects rather than merging, so the shared fields are repeated.
  openGraph: { type: "website", siteName: SITE.name, title: SHARE_TITLE, description: DESCRIPTION, images: [SITE.ogImage] },
  twitter: { card: "summary_large_image", title: SHARE_TITLE, description: DESCRIPTION, images: [SITE.ogImage] },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: SPV_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

/* /spv: foundations, SPVs, holding and offshore companies. GTM, consent and the cookie banner come from the root layout. */
export default function SpvPage() {
  return (
    <div className="spv-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />
      <a className="skip" href="#main">
        Skip to main content
      </a>
      <SpvChrome />
      <main id="main" tabIndex={-1}>
        <SpvHero />
        <SpvStamps />
        <SpvWhy />
        <SpvLayers />
        <SpvPillars />
        <SpvCompare />
        <SpvProcess />
        <SpvFit />
        <SpvWho />
        <SpvTrust />
        <SpvFaq />
        <SpvConsult />
      </main>
      <SpvFooter />
      <SpvMotion />
    </div>
  );
}
