import Image from "next/image";
import { SITE } from "@/content/site";
import { CTA_NOTE, DISCLAIMER, HERO_TRUST, PLAN_CTA } from "@/content/xservicesx";
import { XS_CONFIG as C } from "@/content/xservicesx.config";
import { Icon } from "./ui";
import { XsCta, XsPhone, XsWhatsApp } from "./XsCta";
import { HeroCard } from "./HeroCard";

/* Header (light, on cream) and the hero (section 1). Server rendered; the plan card and buttons are small client parts. */
export function XsHeader({ showReviews }: { showReviews: boolean }) {
  return (
    <header className="xs-header">
      <div className="xs-wrap xs-header-in">
        <a className="xs-logo" href="#top" aria-label="Best Solution, back to top">
          <Image src={SITE.logo} alt="Best Solution" width={135} height={60} priority />
        </a>
        <nav className="xs-nav" aria-label="Page">
          <a href="#services">Services</a>
          {showReviews && <a href="#reviews">Reviews</a>}
          <a href="#faq">FAQ</a>
        </nav>
        <XsPhone location="header" href={C.phoneNumber.href} className="xs-header-phone">
          {C.phoneNumber.display}
        </XsPhone>
        <div className="xs-header-icons">
          <XsPhone location="header" href={C.phoneNumber.href} className="xs-icon-btn" label={`Call ${C.phoneNumber.display}`}>
            <Icon name="phone" size={20} />
          </XsPhone>
          <XsWhatsApp location="header" className="xs-icon-btn" label="Chat on WhatsApp">
            <Icon name="whatsapp" size={20} className="xs-wa-ico" />
          </XsWhatsApp>
        </div>
      </div>
    </header>
  );
}

export function XsHero() {
  return (
    <section className="xs-hero" aria-labelledby="xsTitle">
      <div className="xs-wrap xs-hero-grid">
        <div className="xs-hero-copy">
          <span className="xs-pill">Private business advisors · Business Bay, Dubai</span>
          <h1 id="xsTitle">
            Make the right call on your UAE company, <span className="xs-copper">before you commit your savings.</span>
          </h1>
          <p className="xs-hero-sub">
            Free zone or mainland? What will year two really cost? Tell us your plan, and an advisor sends you a clear answer, in writing.
          </p>
          <div className="xs-hero-ctas" id="xs-hero-ctas">
            <XsCta id="hero_primary" location="hero">
              {PLAN_CTA}
            </XsCta>
            <XsWhatsApp location="hero" />
          </div>
          <span className="xs-micro">{CTA_NOTE}</span>
          <ul className="xs-trust">
            {HERO_TRUST.map((t) => (
              <li key={t}>
                <Icon name="check" size={16} strokeWidth={2.2} />
                {t}
              </li>
            ))}
            {C.googleRating && C.googleReviewCount && C.googleReviewsUrl && (
              <li>
                <a className="xs-trust-g" href={C.googleReviewsUrl} target="_blank" rel="noopener">
                  <Icon name="star" size={15} />
                  {C.googleRating} on Google · {C.googleReviewCount} reviews
                </a>
              </li>
            )}
          </ul>
        </div>
        <HeroCard />
        <p className="xs-hero-disc" data-legal>
          {DISCLAIMER}
        </p>
      </div>
    </section>
  );
}
