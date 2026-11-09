import type { Metadata } from "next";
import { SITE } from "@/content/site";
import type { AdvicePage } from "@/content/advice";
import { FzHeader } from "./FzHeader";
import { FzMotion } from "./FzMotion";
import { FzHero } from "./FzHero";
import { FzPartners } from "./FzPartners";
import { FzHowItWorks } from "./FzHowItWorks";
import { FzFaq } from "./FzFaq";
import { FzFooter } from "./FzFooter";
import { FzClosing, FzConsultation, FzReviews, FzVsMainland, FzWhyUs } from "./FzSections";
import { MobileEstimateBar } from "@/components/ui/MobileEstimateBar";
import "@/app/freezone/freezone.css";

export const adviceMetadata = (p: AdvicePage): Metadata => ({
  title: p.title,
  description: p.description,
  alternates: { canonical: `https://business.best-solution.ae/${p.slug}` },
  openGraph: { type: "website", siteName: SITE.name, title: p.title, description: p.description, images: [SITE.ogImage] },
  twitter: { card: "summary_large_image", title: p.title, description: p.description, images: [SITE.ogImage] },
});

/*
  /mainland and /offshore: advice pages made only from the /freezone page's sections (same hero, strip, sections,
  Why us, reviews, FAQ, closing, footer and consultation pop-up), with their own content (content/advice).
  GTM, consent and the cookie banner come from the root layout.
*/
export function AdviceLanding({ p }: { p: AdvicePage }) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: p.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <div className="fz-page">
      <a className="skip-link" href="#think">
        Skip to the main content
      </a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />
      <FzHeader nav={p.nav} tag={p.tag} />
      <FzMotion />
      <main id="top">
        <FzHero c={p.hero} />
        <FzPartners title={p.strip.title} sub={p.strip.sub} items={p.strip.items} />
        <FzConsultation c={p.think} />
        <FzHowItWorks c={p.how} />
        {p.vs && <FzVsMainland c={p.vs} />}
        <FzWhyUs />
        <FzReviews />
        <FzFaq faqs={p.faqs} title="Common questions" tabs={false} ctaLocation={`${p.tag} FAQ - Request a Callback`} />
        <FzClosing c={p.closing} />
      </main>
      <FzFooter
        blurb={p.blurb}
        nav={p.nav}
        defaultInterest={p.interest}
        ctaLocation={`${p.tag} Footer - Book a Callback`}
        formId={p.formId}
      />
      <MobileEstimateBar targetId="closeTitle" location={`${p.tag} Mobile Bar - Book a Consultation`} label="Book a Consultation" callback />
    </div>
  );
}
