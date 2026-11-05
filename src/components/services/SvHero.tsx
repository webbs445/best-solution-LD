import Image from "next/image";
import { REVIEW_ROWS, SITE, TRUST } from "@/content/site";
import { ArrowIcon, StarIcon } from "@/components/ui/Icons";
import { CallbackTrigger } from "@/components/freezone/CallbackTrigger";

const advised = TRUST.find((t) => t.label === "Businesses advised")!;

const countries = TRUST.find((t) => t.label === "Client countries")!;
/* The hero review: a verified Google review already shown on /freezone. */
const REVIEW = REVIEW_ROWS.flat().find((r) => r.name === "Michael Doherty")!;
/* Its closing sentence, word for word. */
const QUOTE_LINE = REVIEW.quote.slice(REVIEW.quote.indexOf("From day one"));

/* The hero: headline, buttons and a stat strip on the left; the Best Solution office in an arch, with a rating seal and a client quote, on the right. */
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
          <div className="sv-arch">
            <div className="sv-photo">
              <Image src="/images/about-office.webp" alt="Best Solution office reception in Business Bay, Dubai" fill priority sizes="(max-width: 1020px) 90vw, 440px" />
            </div>
            <span className="sv-live qc-live">
              <i />
              Consultants available
            </span>
          </div>
          {/* Rotating seal: the rating in the middle, the consultation promise turning around it. */}
          <a className="sv-seal" href={SITE.googleReviews} target="_blank" rel="noopener" data-cta-location="SV Hero — Google Reviews" aria-label={`Rated ${SITE.rating.score} from ${SITE.rating.count}+ Google reviews`}>
            <svg className="sv-seal-ring" viewBox="0 0 120 120" aria-hidden="true">
              <defs>
                <path id="svSealPath" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
              </defs>
              <text>
                <textPath href="#svSealPath" textLength="286">
                  FREE CONSULTATION • NO OBLIGATION •
                </textPath>
              </text>
            </svg>
            <span className="sv-seal-c" aria-hidden="true">
              <b>{SITE.rating.score}</b>
              <StarIcon />
            </span>
          </a>
          <figure className="sv-quote">
            <Image src={REVIEW.photo} alt="" width={44} height={44} />
            <div>
              <blockquote>&ldquo;{QUOTE_LINE}&rdquo;</blockquote>
              <figcaption>
                {REVIEW.name}, {REVIEW.company}
              </figcaption>
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
