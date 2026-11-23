import { OFFICE_LINE, PLAN_CTA, TOPICS } from "@/content/xservicesx";
import { XS_CONFIG as C, type Review } from "@/content/xservicesx.config";
import { Icon, MapArt, Stars } from "./ui";
import { XsCta } from "./XsCta";
import { CallbackButton, WallToggle } from "./TrustParts";

/*
  Trust (replaces S7; after S6 when advisors exist): real Google reviews, word for word from XS_CONFIG, and the office
  card. Desktop: with 6 or more reviews a two-row wall that drifts (row 1 left, row 2 right; CSS transform only, each row
  rendered twice for a seamless loop, the copy aria-hidden), paused on hover, on focus and with the button; with fewer,
  one still row. Reduced motion: no movement, the rows scroll by hand. Phones and tablets: a swipe row. The office card
  is left out when S6 is on the page (it has its own).
*/
const WALL_MIN = 6;

function Card({ r, copy }: { r: Review; copy?: boolean }) {
  return (
    <article className="xs-rcard" tabIndex={copy ? -1 : 0} aria-label={copy ? undefined : `Google review from ${r.firstNameInitial}`}>
      <div className="xs-rcard-top">
        {r.stars === 5 ? <Stars label={copy ? undefined : "5 out of 5 stars"} size={15} /> : <span />}
        {r.topic && <span className="xs-rtag">{TOPICS[r.topic].short}</span>}
      </div>
      {/* Clamped on screen only: the whole review stays in the page. */}
      <p className="xs-rtext" data-review-quote>
        &ldquo;{r.text}&rdquo;
      </p>
      <div className="xs-rby">
        <span className="xs-rinitial" aria-hidden="true">
          {r.firstNameInitial.charAt(0)}
        </span>
        <span>
          <b>{r.firstNameInitial}</b>
          <small>{["Google", r.month].filter(Boolean).join(" · ")}</small>
        </span>
      </div>
    </article>
  );
}

function Row({ list, dir }: { list: Review[]; dir: "left" | "right" }) {
  return (
    <div className={`xs-wall-row is-${dir}`}>
      <div className="xs-wall-track">
        {list.map((r, i) => (
          <Card key={`a${i}`} r={r} />
        ))}
        <div className="xs-wall-copy" aria-hidden="true">
          {list.map((r, i) => (
            <Card key={`b${i}`} r={r} copy />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Trust({ withOffice }: { withOffice: boolean }) {
  const reviews = C.reviews;
  const wall = reviews.length >= WALL_MIN;
  const rating = C.googleRating && C.googleReviewCount ? { score: C.googleRating, count: C.googleReviewCount } : null;
  const readAll = C.googleReviewsUrl && (
    <a className="xs-link" href={C.googleReviewsUrl} target="_blank" rel="noopener">
      Read them all <span aria-hidden="true">→</span>
    </a>
  );
  const ratingBlock = rating && (
    <span className="xs-trust-rating">
      <b>{rating.score}</b>
      <Stars label={`Rated ${rating.score} out of 5`} />
      <span>from {rating.count} Google reviews</span>
    </span>
  );

  return (
    <section className="xs-sec xs-trustsec" id="reviews" aria-labelledby="xsTrust">
      <div className="xs-wrap">
        <div className="xs-trust-head">
          <div>
            <span className="xs-eyebrow">WHY FOUNDERS TRUST US</span>
            <h2 id="xsTrust">Don&apos;t take our word for it.</h2>
            <p>Real Google reviews from founders we&apos;ve advised. Word for word.</p>
          </div>
          <div className="xs-trust-meta d-only">
            {ratingBlock}
            {readAll}
            {wall && <WallToggle />}
          </div>
        </div>
        <div className="xs-trust-pill m-only">
          {ratingBlock}
          {readAll}
        </div>
      </div>

      {reviews.length > 0 && (
        <>
          {wall ? (
            <div className="xs-wall d-only" id="xs-wall">
              <Row list={reviews.filter((_, i) => i % 2 === 0)} dir="left" />
              <Row list={reviews.filter((_, i) => i % 2 === 1)} dir="right" />
            </div>
          ) : (
            <div className="xs-wrap d-only">
              <div className="xs-still">
                {reviews.map((r, i) => (
                  <Card key={i} r={r} />
                ))}
              </div>
            </div>
          )}
          <div className="xs-wrap m-only">
            <div className="xs-swipe">
              {reviews.map((r, i) => (
                <Card key={i} r={r} />
              ))}
            </div>
            {reviews.length > 1 && (
              <p className="xs-swipe-hint">
                Swipe for more reviews <span aria-hidden="true">→</span>
              </p>
            )}
          </div>
        </>
      )}

      <div className="xs-wrap">
        {withOffice && (
          <div className="xs-office-card">
            <div className="xs-oc-map d-only">
              <MapArt />
              <span className="xs-pulse" aria-hidden="true" />
            </div>
            <div className="xs-oc-visit">
              <span className="xs-eyebrow">VISIT US</span>
              <b>{OFFICE_LINE}</b>
              {C.officeHours && (
                <span className="xs-oc-line">
                  <Icon name="clock" size={15} />
                  {C.officeHours}
                </span>
              )}
              <a className="xs-link" href={C.mapsUrl} target="_blank" rel="noopener noreferrer">
                Get directions <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="xs-oc-call">
              <p>
                <strong>Prefer to talk first?</strong> The first available advisor calls you in office hours.
              </p>
              <CallbackButton />
            </div>
          </div>
        )}
        <div className="xs-trust-cta m-only">
          <XsCta id="trust_plan" location="trust">
            {PLAN_CTA}
          </XsCta>
        </div>
      </div>
    </section>
  );
}
