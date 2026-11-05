import type { Metadata } from "next";
import { SITE } from "@/content/site";
import { HUB_FAQS, SERVICES } from "@/content/services";
import { SERVICES_FORM_ID } from "@/lib/lead";
import { FzMotion } from "@/components/freezone/FzMotion";
import { FzPartners } from "@/components/freezone/FzPartners";
import { FzReviews } from "@/components/freezone/FzSections";
import { FzFaq } from "@/components/freezone/FzFaq";
import { FzFooter } from "@/components/freezone/FzFooter";
import { MobileEstimateBar } from "@/components/ui/MobileEstimateBar";
import { SvHeader } from "@/components/services/SvHeader";
import { SvHero } from "@/components/services/SvHero";
import { SvClosing, SvGrid, SvJourney, SvTrust } from "@/components/services/SvSections";
import "@/app/freezone/freezone.css";
import "./services.css";

const TITLE = "UAE Business Services | Best Solution";
const DESCRIPTION =
  "Company setup, free zones, accounting, corporate tax and structuring in the UAE. Pick your goal, see the starting price and speak with a dedicated consultant.";

// noindex comes from the root layout (robots) and the X-Robots-Tag header, as on every page of this subdomain.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://business.best-solution.ae/services" },
  // openGraph and twitter replace the layout's objects rather than merging, so the shared fields are repeated.
  openGraph: { type: "website", siteName: SITE.name, title: TITLE, description: DESCRIPTION, images: [SITE.ogImage] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [SITE.ogImage] },
};

/*
  /services: the hub for every service page. The /freezone page's look and shared sections (reviews, partner logos,
  FAQ, footer with the page's one callback popup), with the goal picker, services grid and journey built for it.
  GTM, consent and the cookie banner come from the root layout.
*/
export default function ServicesPage() {
  return (
    <div className="fz-page sv-page">
      <a className="skip-link" href="#services">
        Skip to the services
      </a>
      <SvHeader />
      <FzMotion />
      <main id="top">
        <SvHero />
        <SvGrid />
        <SvJourney />
        <SvTrust />
        <FzPartners title="Free zones and authorities we work with" sub="Across all seven emirates, matched to your activity and budget." />
        <FzReviews />
        <FzFaq faqs={HUB_FAQS} title="Common questions" tabs={false} ctaLocation="SV FAQ — Request a Callback" />
        <SvClosing />
      </main>
      <FzFooter
        blurb="Company setup, accounting, tax and structuring from Business Bay, Dubai. One consultant, every step, with costs confirmed in writing."
        nav={SERVICES.map((s) => ({ href: s.href, label: s.name }))}
        navLabel="Services"
        defaultInterest="not_sure"
        ctaLocation="SV Footer — Book a Callback"
        formId={SERVICES_FORM_ID}
      />
      <MobileEstimateBar targetId="closing" location="SV Mobile Bar — Book a Consultation" label="Book a Consultation" callback />
    </div>
  );
}
