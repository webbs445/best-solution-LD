import Image from "next/image";
import { DISCLAIMER, REVIEW_ROWS } from "@/content/site";
import { ArrowIcon } from "@/components/ui/Icons";
import { CallbackTrigger } from "@/components/freezone/CallbackTrigger";

/* The hero review: a Google review already shown on /freezone. */
const REVIEW = REVIEW_ROWS.flat().find((r) => r.name === "Michael Doherty")!;
/* Its closing sentence, word for word. */
const QUOTE_LINE = REVIEW.quote.slice(REVIEW.quote.indexOf("From day one"));

/* The hero: headline, buttons and the disclaimer on the left; an advisor meeting and a client quote on the right. */
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
            UAE business advice
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
          <p className="fz-disclaimer" role="note" data-legal>
            {DISCLAIMER}
          </p>
        </div>
        <div className="sv-visual">
          <div className="sv-arch">
            <div className="sv-photo">
              <Image
                src="/images/why-consultation.webp"
                alt="An advisor meeting clients at the Best Solution office in Business Bay"
                fill
                priority
                sizes="(max-width: 1020px) 90vw, 440px"
              />
            </div>
          </div>
          <figure className="sv-quote">
            <Image src={REVIEW.photo} alt="" width={44} height={44} />
            <div>
              <blockquote data-review-quote>&ldquo;{QUOTE_LINE}&rdquo;</blockquote>
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
