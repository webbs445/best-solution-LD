import Image from "next/image";
import { CLAIMS, REVIEW_ROWS, SITE, WHY, type Review } from "@/content/site";
import { OFFICE_TYPES, ZONE_QUESTIONS } from "@/content/freezone";
import { ArrowIcon } from "@/components/ui/Icons";
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

export function FzVsMainland() {
  return (
    <section className="fz-block fz-vs" id="free-zone-vs-mainland" aria-labelledby="vsTitle">
      <div className="wrap">
        <div className="fz-head-split fz-on-navy">
          <h2 id="vsTitle">Is a free zone the right choice?</h2>
          <p>
            A free zone can suit international, business-to-business and location-flexible work. Mainland may suit you
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
          Some free zone businesses may be able to serve mainland customers. Your advisor explains what may apply to your
          activity and business model.
        </p>
        <CallbackTrigger className="fz-btn-light" location="FZ Free Zone vs Mainland - Ask an Advisor">
          Not sure? Ask an Advisor <ArrowIcon />
        </CallbackTrigger>
      </div>
    </section>
  );
}

/* "Plan your budget": what to think about before choosing a zone. No figures. */
const BUDGET_POINTS = [
  { title: "Workspace", body: "Which type of space suits how you and your team will work, and how that changes over time." },
  { title: "Team size", body: "How many people will work in the business now, and how many you expect in the next few years." },
  { title: "Yearly running costs", body: "The costs that come round every year, so there are fewer surprises later." },
  { title: "Bookkeeping and tax", body: "Keeping your books up to date and planning for corporate tax from the first year." },
];

export function FzBudget() {
  return (
    <section className="fz-block fz-budget" id="budget" aria-labelledby="budgetTitle">
      <div className="wrap">
        <div className="fz-head-split">
          <p className="fz-tag">
            <span />
            Plan your budget
          </p>
          <h2 id="budgetTitle">What to plan for before you choose a zone</h2>
          <p>Costs differ from zone to zone. These are the points your advisor talks through with you.</p>
        </div>
        <ul className="fz-budget-grid">
          {BUDGET_POINTS.map((b, i) => (
            <li key={b.title}>
              <b>0{i + 1}</b>
              <h3>{b.title}</h3>
              <p>{b.body}</p>
            </li>
          ))}
        </ul>
        <div className="fz-budget-more">
          <div>
            <h3>Workspace types we explain</h3>
            <ul className="fz-chips">
              {OFFICE_TYPES.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Questions worth asking about any zone</h3>
            <ul className="fz-qlist">
              {ZONE_QUESTIONS.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        </div>
        <a className="fz-budget-link" href="/cost-calculator" data-cta-location="FZ Budget - Planning guide">
          Read our budget planning guide <ArrowIcon />
        </a>
      </div>
    </section>
  );
}

const BRIEF = [
  { title: "A shortlist of zones to consider", body: "Matched to your activity, customers and team." },
  { title: "What to plan for", body: "Workspace, team size and the yearly running costs to think about." },
  { title: "Answers to your questions", body: "Including how corporate tax rules may apply to your business." },
  { title: "Your next step", body: "Decided by you, with no obligation to proceed." },
];

export function FzConsultation() {
  return (
    <section className="fz-block fz-consult" id="consultation" aria-labelledby="consTitle">
      <div className="wrap fz-consult-grid">
        <div className="fz-consult-copy">
          <h2 id="consTitle">What a consultation covers</h2>
          <p>One conversation with a dedicated advisor, in Business Bay or by video call. No obligation to proceed.</p>
          <CallbackTrigger className="btn btn-primary" location="FZ Consultation - Book My Consultation">
            Book My Consultation <ArrowIcon />
          </CallbackTrigger>
        </div>
        <div className="fz-brief spot" aria-label="What we cover">
          <div className="fz-brief-top">
            <span>What we cover</span>
            <span>With your advisor</span>
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

/* Photos of our own team and office (no event signage). */
const PHOTOS = [
  { src: "/images/why-team.webp", alt: "Best Solution advisors talking with a client", w: 760, h: 503 },
  { src: "/images/why-founder.webp", alt: "An advisor in a client meeting", w: 760, h: 507 },
  { src: "/images/why-consultation.webp", alt: "Client consultation at the Best Solution office", w: 760, h: 563 },
];

/* The home page's WHY list without the ownership card (a claim not yet confirmed: content/site CLAIMS). */
const WHY_CARDS = WHY.filter((w) => w.title !== "Emirati-owned").map((w) =>
  w.title === "Fees in writing" ? { title: "Fees confirmed in writing", body: "Any fees are set out in writing before work begins." } : w,
);
const TRUST_LINE = [CLAIMS.since, CLAIMS.businesses, CLAIMS.countries, CLAIMS.ownership].filter(Boolean);

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
            <h2 id="wyTitle">One advisor to talk your plans through</h2>
            <p className="wy-lede">A private business consultancy in Business Bay, Dubai, advising entrepreneurs and investors on their plans in the UAE.</p>
          </div>
          {TRUST_LINE.length > 0 && (
            <ul className="wy-stats">
              {TRUST_LINE.map((c) => (
                <li key={c}>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="wy-mosaic">
          {PHOTOS.map((p, i) => (
            <figure key={p.src}>
              <Image src={p.src} alt={p.alt} width={p.w} height={p.h} sizes={i === 0 ? "(max-width: 920px) 100vw, 560px" : "(max-width: 920px) 50vw, 320px"} />
              {i === 0 && (
                <figcaption className="wy-quote">
                  <span>Best Solution</span>
                  <strong>
                    One advisor.{" "}
                    <br />
                    Clear advice.
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

/*
  Reviews kept off this page because their wording uses terms our Google Ads rules exclude (same as the
  home page). Each review is shown once.
*/
const FZ_EXCLUDED = ["Chandra Mohan", "Javed Khan", "Tanwir Chowdhury", "Carlos Freyre"];
const FZ_REVIEWS = REVIEW_ROWS.flat().filter((r) => !FZ_EXCLUDED.includes(r.name));

/* A client's Google review, word for word: no star rating or title of our own. */
function ReviewCard({ r }: { r: Review }) {
  return (
    <figure className="t-card">
      <div className="t-top">
        <Image className="t-logo" src={r.logo} alt={r.company} width={92} height={30} />
      </div>
      <blockquote lang={r.lang} data-review-quote>
        &ldquo;{r.quote}&rdquo;
      </blockquote>
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
          <p className="section-kicker">Client reviews</p>
          <h2 id="revTitle">What our clients say</h2>
          <p className="lede">Google reviews from our clients, word for word.</p>
        </div>
        <div className="t-score">
          {/* The rating shows only once confirmed against the live Google profile (content/site CLAIMS). */}
          {CLAIMS.rating && <b className="t-claim">{CLAIMS.rating}</b>}
          <a className="t-all" href={SITE.googleReviews} target="_blank" rel="noopener">
            Read all Google reviews <ArrowIcon />
          </a>
        </div>
      </div>
      <ul className="wrap t-grid">
        {FZ_REVIEWS.map((r) => (
          <li key={r.name}>
            <ReviewCard r={r} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FzClosing() {
  return (
    <section className="fz-close" aria-labelledby="closeTitle">
      <div className="wrap">
        <div className="fz-close-in">
          <div>
            <h2 id="closeTitle">Choose your free zone with an advisor</h2>
            <p>Tell us about your business. We help you compare suitable zones and plan what comes next.</p>
          </div>
          <div className="fz-close-cta">
            <a className="btn btn-primary" href="#planner" data-cta-location="FZ Closing - Plan My Free Zone">
              Plan My Free Zone <ArrowIcon />
            </a>
            <CallbackTrigger className="fz-btn-ghost" location="FZ Closing - Request a Callback">
              Request a Callback
            </CallbackTrigger>
            <p>No obligation · We reply by phone, WhatsApp or email</p>
          </div>
        </div>
      </div>
    </section>
  );
}
