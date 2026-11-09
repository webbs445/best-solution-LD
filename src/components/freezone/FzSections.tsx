import Image from "next/image";
import { CLAIMS, REVIEW_ROWS, SITE, WHY, type Review, firstName, statTile } from "@/content/site";
import { ArrowIcon, StarIcon } from "@/components/ui/Icons";
import { CallbackTrigger } from "./CallbackTrigger";

/*
  The /freezone page's static sections. Server components: no client JavaScript. Advice only (Google Ads government
  documents policy): no prices, licences, residency, timelines or claims that are not confirmed.
*/

const VS_ROWS: [string, string, string][] = [
  ["Ownership", "Foreign ownership is common, depending on activity", "Foreign ownership is possible for many activities"],
  ["Where you trade", "Within the zone and internationally", "Anywhere in the UAE"],
  ["Corporate tax", "0% on qualifying income, subject to QFZP conditions. 9% on other income", "9% on profit above AED 375,000"],
  ["Workspace", "Flexi-desk, shared office or private office, depending on the zone", "A physical office"],
  ["Often suits", "International and business-to-business work", "Selling directly to UAE customers"],
];

export interface VsBand {
  id: string;
  title: string;
  text: string;
  /** The free zone and mainland table (left out when false). */
  table: boolean;
  note: string;
  cta: { label: string; location: string };
  /** An extra link under the note (e.g. to /freezone/vs-mainland). */
  link?: { label: string; href: string; location: string };
}
export const FZ_VS: VsBand = {
  id: "free-zone-vs-mainland",
  title: "Is a free zone the right choice?",
  text: "A free zone can suit international, business-to-business and location-flexible work. Mainland may suit you better when selling directly to UAE customers is central to your plans.",
  table: true,
  note: "Some eligible free zone businesses may have options to operate on the mainland. Your advisor explains the route that applies to your activity and business model.",
  cta: { label: "Not sure? Ask an Advisor", location: "FZ Free Zone vs Mainland - Ask an Advisor" },
};

export function FzVsMainland({ c = FZ_VS }: { c?: VsBand } = {}) {
  return (
    <section className="fz-block fz-vs" id={c.id} aria-labelledby="vsTitle">
      <div className="wrap">
        <div className="fz-head-split fz-on-navy">
          <h2 id="vsTitle">{c.title}</h2>
          <p>{c.text}</p>
        </div>
        {c.table && <div className="fz-vs-table" role="table" aria-label="Free zone compared with mainland">
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
        </div>}
        <p className="fz-vs-note">
          {c.note}
          {c.link && (
            <>
              {" "}
              <a href={c.link.href} data-cta-location={c.link.location} style={{ color: "inherit", textDecoration: "underline" }}>
                {c.link.label}
              </a>
            </>
          )}
        </p>
        <CallbackTrigger className="fz-btn-light" location={c.cta.location}>
          {c.cta.label} <ArrowIcon />
        </CallbackTrigger>
      </div>
    </section>
  );
}

const BRIEF = [
  { title: "A shortlist of zones to consider", body: "Matched to your activity, customers and team." },
  { title: "What to plan for in your budget", body: "Workspace, team size and the yearly running costs to think about." },
  { title: "Answers to your questions", body: "Including how corporate tax rules may apply to your business." },
  { title: "Your next step", body: "Decided by you, with no obligation to proceed." },
];

export interface BriefBlock {
  id: string;
  title: string;
  text: string;
  cta: { label: string; location: string };
  briefTitle: string;
  briefNote: string;
  items: { title: string; body: string }[];
}
export const FZ_BRIEF: BriefBlock = {
  id: "consultation",
  title: "What you leave your consultation with",
  text: "One conversation with a dedicated advisor, in person or by video call. No obligation to proceed.",
  cta: { label: "Book a Consultation", location: "FZ Consultation - Book My Consultation" },
  briefTitle: "Your free zone brief",
  briefNote: "Prepared by your advisor",
  items: BRIEF,
};

export function FzConsultation({ c = FZ_BRIEF }: { c?: BriefBlock } = {}) {
  return (
    <section className="fz-block fz-consult" id={c.id} aria-labelledby={`${c.id}Title`}>
      <div className="wrap fz-consult-grid">
        <div className="fz-consult-copy">
          <h2 id={`${c.id}Title`}>{c.title}</h2>
          <p>{c.text}</p>
          <CallbackTrigger className="btn btn-primary" location={c.cta.location}>
            {c.cta.label} <ArrowIcon />
          </CallbackTrigger>
        </div>
        <div className="fz-brief spot" aria-label={c.briefTitle}>
          <div className="fz-brief-top">
            <span>{c.briefTitle}</span>
            <span>{c.briefNote}</span>
          </div>
          <ul>
            {c.items.map((b, i) => (
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

/* The home page's "Why Best Solution" photos, with an office photo in the lead spot. */
const PHOTOS = [
  { src: "/images/why-event.webp", alt: "Best Solution advisors with clients at a Dubai business event", w: 760, h: 507 },
  { src: "/images/why-team.webp", alt: "Best Solution team at a client event", w: 760, h: 503 },
  { src: "/images/why-founder.webp", alt: "An advisor in a client meeting", w: 760, h: 507 },
  { src: "/images/why-consultation.webp", alt: "Client consultation at the Best Solution office", w: 760, h: 563 },
];

/* The home page's WHY list; the ownership card (a claim not yet confirmed: content/site CLAIMS) becomes "In person or by video call". */
const WHY_CARDS = WHY.map((w) =>
  w.title === "Fees in writing"
    ? { title: "Fees confirmed in writing", body: "Any fees are set out in writing before work begins." }
    : w.title === "Emirati-owned"
      ? { title: "In person or by video call", body: "Meet us at our office in Business Bay, Dubai, or talk it through online." }
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

const WHY_STATS = [
  statTile(CLAIMS.zones, "Free zones compared", "explain"),
  statTile(CLAIMS.emirates, "Emirates covered", "meet"),
  statTile(null, "", "office"),
  statTile(null, "", "support"),
];

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
              Best Solution advises entrepreneurs and investors on structuring and running businesses in the UAE, from the first
              conversation onwards.
            </p>
          </div>
          <ul className="wy-stats">
            {/* A confirmed claim fills the number slot; until then plain text (content/site statTile). */}
            {WHY_STATS.map((t) => (
              <li key={t.label}>
                <b>{t.value}</b>
                <span>{t.label}</span>
              </li>
            ))}
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
      <blockquote lang={r.lang} data-review-quote>&ldquo;{r.quote}&rdquo;</blockquote>
      <figcaption>
        <Image className="t-photo" src={r.photo} alt="" width={44} height={44} />
        <span>
          <b>{firstName(r.name)}</b>
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
          <h2 id="revTitle">What our clients say</h2>
          <p className="lede">Google reviews from our clients.</p>
        </div>
        <div className="t-score">
          {/* The rating shows only once confirmed against the live Google profile (content/site CLAIMS). */}
          {CLAIMS.rating && (
            <>
              <b>{CLAIMS.rating}</b>
              <div>
                <Stars />
              </div>
            </>
          )}
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

export interface ClosingBlock {
  title: string;
  text: string;
  /** Main call to action: opens the page's consultation pop-up. */
  primary: { label: string; location: string };
  /** Secondary: a link on the page or WhatsApp. */
  secondary: { label: string; href: string; location: string; external?: boolean };
}
export const FZ_CLOSING: ClosingBlock = {
  title: "Begin with the right free zone",
  text: "Tell us about your business. Your advisor helps you compare suitable zones and plan your next step.",
  primary: { label: "Book a Consultation", location: "FZ Closing - Book a Consultation" },
  secondary: { label: "Plan my free zone", href: "#planner", location: "FZ Closing - Plan My Free Zone" },
};

export function FzClosing({ c = FZ_CLOSING }: { c?: ClosingBlock } = {}) {
  return (
    <section className="fz-close" aria-labelledby="closeTitle">
      <div className="wrap">
        <div className="fz-close-in">
          <div>
            <h2 id="closeTitle">{c.title}</h2>
            <p>{c.text}</p>
          </div>
          <div className="fz-close-cta">
            <CallbackTrigger className="btn btn-primary" location={c.primary.location}>
              {c.primary.label} <ArrowIcon />
            </CallbackTrigger>
            <a
              className="fz-btn-ghost"
              style={{ textDecoration: "none" }}
              href={c.secondary.href}
              data-cta-location={c.secondary.location}
              {...(c.secondary.external ? { target: "_blank", rel: "noopener" } : {})}
            >
              {c.secondary.label}
            </a>
            <p>No obligation · We reply by phone, WhatsApp or email</p>
          </div>
        </div>
      </div>
    </section>
  );
}
