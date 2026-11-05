import Image from "next/image";
import { REVIEW_ROWS, SITE, TRUST } from "@/content/site";
import { ArrowIcon, StarIcon } from "@/components/ui/Icons";
import { CallbackTrigger } from "@/components/freezone/CallbackTrigger";

const advised = TRUST.find((t) => t.label === "Businesses advised")!;

const countries = TRUST.find((t) => t.label === "Client countries")!;
/* The hero review: a verified Google review already shown on /freezone. */
const REVIEW = REVIEW_ROWS.flat().find((r) => r.name === "Michael Doherty")!;

/* The hero: headline, buttons and a stat strip on the left; the Best Solution office with a client review on the right. */
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
            Best Solution services
          </p>
          <h1 id="svTitle">
            Set up and run your UAE business, <span className="accent sv-keep">with one consultant.</span>
          </h1>
          <h2 className="sv-hero-h2">Company setup, accounting, corporate tax and structuring. Your costs are confirmed in writing before you start.</h2>
          <div className="sv-hero-cta">
            <CallbackTrigger className="btn btn-primary" location="SV Hero — Book a Consultation">
              Book a Consultation <ArrowIcon />
            </CallbackTrigger>
            <a className="fz-btn-ghost" href="#services" data-cta-location="SV Hero — See All Services">
              See all services
            </a>
          </div>
          <p className="sv-hero-note">Free consultation · No obligation · We reply by phone, WhatsApp or email</p>
          <ul className="sv-stats">
            <li>
              <b>{SITE.founded}</b>
              <span>Advising since</span>
            </li>
            <li>
              <b>
                {advised.count.toLocaleString("en-US")}
                {advised.suffix}
              </b>
              <span>Businesses advised</span>
            </li>
            <li>
              <b>
                {countries.count}
                {countries.suffix}
              </b>
              <span>Client countries</span>
            </li>
          </ul>
        </div>
        <div className="sv-visual">
          <div className="sv-photo">
            <Image src="/images/about-office.webp" alt="Best Solution office reception in Business Bay, Dubai" fill priority sizes="(max-width: 1020px) 100vw, 480px" />
          </div>
          <span className="sv-live qc-live">
            <i />
            Consultants available
          </span>
          <figure className="sv-review">
            <div className="sv-review-top">
              <span className="sv-stars" role="img" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }, (_, i) => (
                  <StarIcon key={i} />
                ))}
              </span>
              <span className="sv-review-src">Google review</span>
            </div>
            <blockquote>&ldquo;{REVIEW.quote}&rdquo;</blockquote>
            <figcaption>
              <Image src={REVIEW.photo} alt="" width={44} height={44} />
              <span>
                <b>{REVIEW.name}</b>
                {REVIEW.role}, {REVIEW.company}
              </span>
            </figcaption>
            <a className="sv-review-all" href={SITE.googleReviews} target="_blank" rel="noopener" data-cta-location="SV Hero — Google Reviews">
              <b>{SITE.rating.score}</b> from {SITE.rating.count}+ Google reviews <ArrowIcon />
            </a>
          </figure>
        </div>
      </div>
    </section>
  );
}
