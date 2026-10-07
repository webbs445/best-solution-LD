import Image from "next/image";
import { REVIEW_ROWS, SITE, WHY, type Review } from "@/content/site";
import { ArrowIcon, StarIcon } from "@/components/ui/Icons";
import { CallbackTrigger } from "./CallbackTrigger";
import { FzCount } from "./FzCount";

/* The /freezone page's static sections. Server components: no client JavaScript. */

const VS_ROWS: [string, string, string][] = [
  ["Ownership", "Full foreign ownership", "Full foreign ownership for most activities"],
  ["Where you trade", "Within the zone and internationally", "Anywhere in the UAE"],
  ["Corporate tax", "0% on qualifying income, subject to QFZP conditions. 9% on other income", "9% on profit above AED 375,000"],
  ["Office", "Flexi-desk in every estimate, office upgrades available", "Physical office with a tenancy contract"],
  ["Suits", "International and B2B businesses", "Businesses selling directly to UAE customers"],
];

export function FzVsMainland() {
  return (
    <section className="fz-block fz-vs" id="free-zone-vs-mainland" aria-labelledby="vsTitle">
      <div className="wrap">
        <div className="fz-head-split fz-on-navy">
          <h2 id="vsTitle">Is a free zone the right choice?</h2>
          <p>
            A free zone can be a strong fit for international, B2B and location-flexible businesses. Mainland may suit you
            better when selling directly to UAE customers is central to your plans.
          </p>
        </div>
        <div className="fz-vs-table" role="table" aria-label="Free zone compared with mainland">
          <div className="fz-vs-row fz-vs-h" role="row">
            <span role="columnheader" />
            <span role="columnheader">Free zone</span>
            <span role="columnheader">Mainland</span>
          </div>
          {VS_ROWS.map(([head, fz, ml]) => (
            <div className="fz-vs-row" role="row" key={head}>
              <span role="rowheader">{head}</span>
              <span role="cell">{fz}</span>
              <span role="cell">{ml}</span>
            </div>
          ))}
        </div>
        <p className="fz-vs-note">
          Some eligible free zone businesses may have options to operate on the mainland. Your advisor explains the route
          that applies to your activity and business model.
        </p>
        <CallbackTrigger className="fz-btn-light" location="FZ Free Zone vs Mainland — Ask an Advisor">
          Not sure? Ask an Advisor <ArrowIcon />
        </CallbackTrigger>
      </div>
    </section>
  );
}

const BRIEF = [
  { title: "A shortlist of two or three zones", body: "Matched to your activity, customers and team." },
  {
    title: "Your estimated first-year cost",
    body: "Based on your zone, office and residency needs, with the expected renewal shown separately.",
  },
  { title: "A paperwork checklist", body: "Exactly what your chosen zone asks for." },
  { title: "A realistic timeline", body: "Confirmed in writing, with clear responsibilities." },
];

export function FzConsultation() {
  return (
    <section className="fz-block fz-consult" id="consultation" aria-labelledby="consTitle">
      <div className="wrap fz-consult-grid">
        <div className="fz-consult-copy">
          <h2 id="consTitle">What you leave your consultation with</h2>
          <p>One conversation with a dedicated advisor. Complimentary, with no obligation to proceed.</p>
          <CallbackTrigger className="btn btn-primary" location="FZ Consultation — Book My Consultation">
            Book My Consultation <ArrowIcon />
          </CallbackTrigger>
        </div>
        <div className="fz-brief spot" aria-label="Your free zone brief">
          <div className="fz-brief-top">
            <span>Your free zone brief</span>
            <span>Prepared by your advisor</span>
          </div>
          <ul>
            {BRIEF.map((b, i) => (
              <li key={b.title}>
                <b>0{i + 1}</b>
                <div>
                  <h3>{b.title}</h3>
                  <p>{b.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* Same photos as the home page's "Why Best Solution". */
const PHOTOS = [
  { src: "/images/why-event.webp", alt: "Best Solution consultants with clients at a Dubai business event", w: 760, h: 507 },
  { src: "/images/why-team.webp", alt: "Best Solution team at a client event", w: 760, h: 503 },
  { src: "/images/why-founder.webp", alt: "Founder Essa Al Harthi in a client meeting", w: 760, h: 507 },
  { src: "/images/why-consultation.webp", alt: "Client consultation at the Best Solution office", w: 760, h: 563 },
];

/* As the home page's WHY list, with this page's wording for the fees card. */
const WHY_CARDS = WHY.map((w) =>
  w.title === "Fees in writing"
    ? { title: "Fees confirmed in writing", body: "Your costs are set out in writing before you proceed." }
    : w,
);

/*
  Reviews kept off this page because their wording uses terms our Google Ads rules exclude (same as the
  home page). The rest are repeated within the row so the loop fills wide screens; repeats are hidden
  from screen readers.
*/
const FZ_EXCLUDED = ["Chandra Mohan", "Javed Khan", "Tanwir Chowdhury", "Carlos Freyre"];
const FZ_REVIEWS = REVIEW_ROWS.flat().filter((r) => !FZ_EXCLUDED.includes(r.name));
const FZ_REVIEW_LOOP = Array.from({ length: Math.max(1, Math.ceil(6 / FZ_REVIEWS.length)) }, () => FZ_REVIEWS).flat();

export function FzWhyUs() {
  return (
    <section className="fz-block wy" aria-labelledby="wyTitle">
      <div className="wrap">
        <div className="wy-top">
          <div>
            <p className="fz-tag">
              <span />
              Why Best Solution
            </p>
            <h2 id="wyTitle">One team for every stage of your business</h2>
            <p className="wy-lede">
              Since {SITE.founded}, Best Solution has advised entrepreneurs and investors on structuring and running businesses in
              the UAE.
            </p>
          </div>
          <ul className="wy-stats">
            <li>
              <b>{SITE.founded}</b>
              <span>Advising since</span>
            </li>
            <li>
              <FzCount to={5000} suffix="+" />
              <span>Businesses advised</span>
            </li>
            <li>
              <FzCount to={80} suffix="+" />
              <span>Client countries</span>
            </li>
            <li>
              <b>Emirati</b>
              <span>Owned and based in Dubai</span>
            </li>
          </ul>
        </div>
        <div className="wy-mosaic">
          {PHOTOS.map((p, i) => (
            <figure key={p.src}>
              <Image src={p.src} alt={p.alt} width={p.w} height={p.h} sizes={i === 0 || i === 3 ? "(max-width: 920px) 100vw, 560px" : "(max-width: 920px) 50vw, 320px"} />
              {/* The glass quote sits on the large lead photo, over its darkened lower edge, clear of faces. */}
              {i === 0 && (
                <figcaption className="wy-quote">
                  <span>Best Solution</span>
                  <strong>
                    One consultant.{" "}
                    <br />
                    One clear path.
                  </strong>
                </figcaption>
              )}
            </figure>
          ))}
        </div>
        <div className="wy-cards">
          {WHY_CARDS.map((w, i) => (
            <article key={w.title}>
              <span>0{i + 1}</span>
              <h3>{w.title}</h3>
              <p>{w.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stars({ label }: { label?: string }) {
  return (
    <div className="stars" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} />
      ))}
    </div>
  );
}

function ReviewCard({ r, copy }: { r: Review; copy: boolean }) {
  return (
    <figure className="t-card">
      <div className="t-top">
        <Stars label={copy ? undefined : "5 out of 5 stars"} />
        <Image className="t-logo" src={r.logo} alt={copy ? "" : r.company} width={92} height={30} />
      </div>
      <h3>{r.title}</h3>
      <blockquote lang={r.lang}>&ldquo;{r.quote}&rdquo;</blockquote>
      <figcaption>
        <Image className="t-photo" src={r.photo} alt="" width={44} height={44} />
        <span>
          <b>{r.name}</b>
          {r.role}
        </span>
        <em>Google review</em>
      </figcaption>
    </figure>
  );
}

export function FzReviews() {
  return (
    <section className="block testimonials sec-light" id="reviews" aria-labelledby="revTitle">
      <div className="wrap t-head">
        <div>
          <p className="section-kicker">
            Client reviews
          </p>
          <h2 id="revTitle">Trusted by business owners from more than 80 countries</h2>
          <p className="lede">Google reviews from our clients.</p>
        </div>
        <div className="t-score">
          <b>4.8</b>
          <div>
            <Stars />
            <span>from more than 200 Google reviews</span>
          </div>
          <a className="t-all" href={SITE.googleReviews} target="_blank" rel="noopener">
            Read all Google reviews <ArrowIcon />
          </a>
        </div>
      </div>
      <div className="marquee t-marquee">
        <div className="marquee-track">
          {[false, true].map((copy) => (
            <ul key={String(copy)} className="t-row" aria-hidden={copy || undefined}>
              {FZ_REVIEW_LOOP.map((r, k) => {
                const repeat = copy || k >= FZ_REVIEWS.length;
                return (
                  <li key={`${r.name}-${k}`} aria-hidden={!copy && repeat ? true : undefined}>
                    <ReviewCard r={r} copy={repeat} />
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FzClosing() {
  return (
    <section className="fz-close" aria-labelledby="closeTitle">
      <div className="wrap">
        <div className="fz-close-in">
          <div>
            <h2 id="closeTitle">Begin with the right free zone</h2>
            <p>Tell us about your business. We help you compare suitable zones and prepare an estimate.</p>
          </div>
          <div className="fz-close-cta">
            <a className="btn btn-primary" href="#planner" data-cta-location="FZ Closing — Plan My Free Zone">
              Plan My Free Zone <ArrowIcon />
            </a>
            <CallbackTrigger className="fz-btn-ghost" location="FZ Closing — Request a Callback">
              Request a Callback
            </CallbackTrigger>
            <p>Complimentary · No obligation · We reply by phone, WhatsApp or email</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Sticky planner shortcut on phones (shown by freezone.css under 640px). */
export function FzMobileBar() {
  return (
    <div className="fz-mbar">
      <div>
        <span>Zone Planner</span>
        <b>See matching zones and cost</b>
      </div>
      <a className="btn btn-primary btn-sm" href="#planner" data-cta-location="FZ Mobile Bar — Start">
        Begin
      </a>
    </div>
  );
}
