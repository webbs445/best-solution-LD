import { CTA_NOTE, DISCLAIMER, HERO_TRUST, PLAN_CTA } from "@/content/xservicesx";
import { XS_CONFIG as C } from "@/content/xservicesx.config";
import { Icon, Stars } from "./ui";
import { XsCta, XsWhatsApp } from "./XsCta";
import { HeroCard } from "./HeroCard";

/* The hero (section 1). Server rendered; the plan card and buttons are small client parts. The header: Header.tsx. */
export function XsHero() {
  return (
    <section className="xs-hero" aria-labelledby="xsTitle">
      <div className="xs-wrap xs-hero-grid">
        <div className="xs-hero-copy">
          <span className="xs-pill">Private business advisors · Business Bay, Dubai</span>
          <h1 id="xsTitle">
            Make the right call on your UAE company, <span className="xs-copper">
              {/* "before you" never splits (phones broke the line after "before"). */}
              <span className="xs-nowrap">before you</span> commit your savings.
            </span>
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
          <div className="xs-proof">
            {/* The Google rating as plain text (no box, no link: "Read them all" lives in the Trust section). */}
            {C.googleRating && C.googleReviewCount && (
              <p className="xs-proof-line" data-google-rating>
                <Stars label={`Rated ${C.googleRating} out of 5 from ${C.googleReviewCount} Google reviews`} size={14} />
                <b>{C.googleRating}</b>
                <span> · {C.googleReviewCount} Google reviews</span>
              </p>
            )}
            <ul className="xs-trust">
              {HERO_TRUST.map((t) => (
                <li key={t}>
                  <Icon name="check" size={16} strokeWidth={2.2} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <HeroCard />
        <p className="xs-hero-disc" data-legal>
          {DISCLAIMER}
        </p>
      </div>
    </section>
  );
}
