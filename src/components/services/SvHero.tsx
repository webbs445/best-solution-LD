import Image from "next/image";
import { CLAIMS, DISCLAIMER, REVIEW_ROWS, SITE, firstName, statTile } from "@/content/site";
import { ArrowIcon, StarIcon } from "@/components/ui/Icons";
import { CallbackTrigger } from "@/components/freezone/CallbackTrigger";
import { SvLive } from "./SvLive";

/* The hero review: a Google review already shown on /freezone. */
const REVIEW = REVIEW_ROWS.flat().find((r) => r.name === "Michael Doherty")!;
/* Its closing sentence, word for word. */
const QUOTE_LINE = REVIEW.quote.slice(REVIEW.quote.indexOf("From day one"));

/*
  The hero: headline, buttons, a stat strip and the disclaimer on the left; an advisor meeting in an arch, with a
  Google reviews seal and a client quote, on the right. Counts and the rating show only once confirmed (content/site CLAIMS);
  no count-up.
*/
export function SvHero() {
  return (
    <section className="fz-hero sv-hero" aria-labelledby="svTitle">
      <div className="fz-hero-bg" aria-hidden="true">
        <i />
        <i />
      </div>
      <div className="wrap fz-hero-grid sv-hero-grid">
        <div className="sv-hero-copy">
          <p className="fz-tag">
            <span />
            For founders and business owners in the UAE
          </p>
          <h1 id="svTitle">
            Plan and run your UAE business, <span className="accent sv-keep">with one advisor.</span>
          </h1>
          <h2 className="sv-hero-h2">
            Advice on where to base your business, budgeting, bookkeeping, corporate tax and holding structures. Any fees are
            confirmed in writing before work begins.
          </h2>
          <div className="sv-hero-cta">
            <CallbackTrigger className="btn btn-primary" location="SV Hero - Book a Consultation">
              Book a Consultation <ArrowIcon />
            </CallbackTrigger>
            <a className="fz-btn-ghost" href="#services" data-cta-location="SV Hero - See All Services">
              See all services
            </a>
          </div>
          <p className="sv-hero-note">No obligation · We reply by phone, WhatsApp or email</p>
          <ul className="sv-stats">
            {/* A confirmed claim fills the number slot; until then plain text (content/site statTile). */}
            {[statTile(CLAIMS.zones, "Free zones compared", "office"), statTile(CLAIMS.emirates, "Emirates covered", "meet"), statTile(null, "", "explain")].map((t) => (
              <li key={t.label}>
                <b>{t.value}</b>
                <span>{t.label}</span>
              </li>
            ))}
          </ul>
          <p className="fz-disclaimer" role="note" data-legal>
            {DISCLAIMER}
          </p>
        </div>
        <div className="sv-visual">
          <div className="sv-arch">
            <div className="sv-photo">
              <Image
                src="/images/office-wall.webp"
                alt="The reception and logo wall at the Best Solution office in Business Bay"
                fill
                priority
                sizes="(max-width: 1020px) 90vw, 440px"
              />
            </div>
            <SvLive />
          </div>
          {/* Rotating seal: Google reviews in the middle, the consultation promise turning around it. */}
          <a className="sv-seal" href={SITE.googleReviews} target="_blank" rel="noopener" data-cta-location="SV Hero - Google Reviews" aria-label="Read our Google reviews">
            <svg className="sv-seal-ring" viewBox="0 0 120 120" aria-hidden="true">
              <defs>
                <path id="svSealPath" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
              </defs>
              <text>
                <textPath href="#svSealPath" textLength="286">
                  BOOK A CONSULTATION • NO OBLIGATION •
                </textPath>
              </text>
            </svg>
            <span className={`sv-seal-c${CLAIMS.rating ? "" : " is-star"}`} aria-hidden="true">
              {CLAIMS.rating && <b>{CLAIMS.rating}</b>}
              <StarIcon />
            </span>
          </a>
          <figure className="sv-quote">
            <Image src={REVIEW.photo} alt="" width={44} height={44} />
            <div>
              <blockquote data-review-quote>&ldquo;{QUOTE_LINE}&rdquo;</blockquote>
              <figcaption>
                {firstName(REVIEW.name)}, {REVIEW.company}
              </figcaption>
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
