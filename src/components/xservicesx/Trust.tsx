import { CTA_NOTE, OFFICE_LINE, PLAN_CTA, TOPICS } from "@/content/xservicesx";
import { XS_CONFIG as C, type Review } from "@/content/xservicesx.config";
import { Icon, MapArt, Stars } from "./ui";
import { XsCta } from "./XsCta";
import { CallbackButton, WallToggle } from "./TrustParts";

/*
  Trust (design/xservicesx/06-Trust.desktop.html; replaces S7, after S6 when advisors exist): real Google reviews,
  word for word from XS_CONFIG, the office card and the plan button. Desktop: with 6 or more reviews a two-row wall
  that drifts (row 1 left, row 2 right; CSS transform only, each row rendered twice for a seamless loop, the copy
  aria-hidden), paused on hover, on focus and with the button; with fewer, a still row of equal columns showing each
  review in full. Reduced motion: no movement, the rows scroll by hand. Phones and tablets: a swipe row. The office
  card is left out when S6 is on the page (it has its own).
*/
const WALL_MIN = 6;
/** An upright, rounded opening quote mark for the desktop still cards. */
const QuoteMark = () => (
  <svg className="xs-rmark" width="36" height="28" viewBox="0 0 36 28" aria-hidden="true" focusable="false">
    {[0, 19].map((x) => (
      <g key={x} transform={`translate(${x} 0)`}>
        <circle cx="8.5" cy="19.5" r="7.5" />
        <path d="M2.2 19.5C2.2 10.5 6.5 4.2 14 1.6" fill="none" strokeWidth="4.2" strokeLinecap="round" />
      </g>
    ))}
  </svg>
);


/** A review card. wall: the cream card in the moving wall (3 lines on screen); still: full text, large quote. */
function Card({ r, kind, copy, featured }: { r: Review; kind: "wall" | "still" | "swipe"; copy?: boolean; featured?: boolean }) {
  const stars = r.stars === 5 && <Stars label={copy ? undefined : "5 out of 5 stars"} size={kind === "still" ? 16 : 14} />;
  const tag = r.topic && <span className="xs-rtag">{TOPICS[r.topic].short}</span>;
  return (
    <article className={`xs-rcard is-${kind}${featured ? " is-featured" : ""}`} tabIndex={copy ? -1 : 0} aria-label={copy ? undefined : `Google review from ${r.firstNameInitial}`}>
      {kind === "still" ? (
        <div className="xs-rcard-top">
          <QuoteMark />
          <span className="xs-rcard-tags">
            {tag}
            {stars}
          </span>
        </div>
      ) : (
        <div className="xs-rcard-top">
          {stars || <span />}
          {tag}
        </div>
      )}
      {/* The whole review stays in the page; the wall and phone cards only clamp it on screen. */}
      <p className="xs-rtext" data-review-quote>
        {kind === "still" ? r.text : <>&ldquo;{r.text}&rdquo;</>}
      </p>
      <div className="xs-rby">
        <span className="xs-rinitial" aria-hidden="true">
          {r.firstNameInitial.charAt(0)}
        </span>
        <b>{r.firstNameInitial}</b>
        <small>· Google review</small>
      </div>
    </article>
  );
}

function Row({ list, dir }: { list: Review[]; dir: "left" | "right" }) {
  return (
    <div className={`xs-wall-row is-${dir}`}>
      <div className="xs-wall-track">
        {list.map((r, i) => (
          <Card key={`a${i}`} r={r} kind="wall" />
        ))}
        <div className="xs-wall-copy" aria-hidden="true">
          {list.map((r, i) => (
            <Card key={`b${i}`} r={r} kind="wall" copy />
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
    <a className="xs-ulink" href={C.googleReviewsUrl} target="_blank" rel="noopener">
      Read them all <span aria-hidden="true">→</span>
    </a>
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
            {rating && (
              <b className="xs-trust-score" data-google-rating>
                {rating.score}
              </b>
            )}
            <span className="xs-trust-meta-col">
              {rating && (
                <span className="xs-contents" data-google-rating>
                  <Stars label={`Rated ${rating.score} out of 5`} size={20} />
                  <span>from {rating.count} Google reviews</span>
                </span>
              )}
              {readAll}
            </span>
            {wall && <WallToggle />}
          </div>
        </div>
        <div className="xs-trust-pill m-only">
          {rating && (
            <span className="xs-trust-rating" data-google-rating>
              <b>{rating.score}</b>
              <Stars label={`Rated ${rating.score} out of 5`} />
              <span>from {rating.count} Google reviews</span>
            </span>
          )}
          {readAll}
        </div>
      </div>

      {reviews.length > 0 && (
        <>
          {wall ? (
            <div className="xs-wall d-only" id="xs-wall" role="region" aria-label="Client reviews">
              <Row list={reviews.filter((_, i) => i % 2 === 0)} dir="left" />
              <Row list={reviews.filter((_, i) => i % 2 === 1)} dir="right" />
            </div>
          ) : (
            <div className="xs-wrap d-only">
              <div className={`xs-still${reviews.length === 2 ? " is-two" : ""}`}>
                {reviews.map((r, i) => (
                  <Card key={i} r={r} kind="still" featured={i === 0} />
                ))}
              </div>
            </div>
          )}
          <div className="xs-wrap m-only">
            <div className="xs-swipe">
              {reviews.map((r, i) => (
                <Card key={i} r={r} kind="swipe" featured={i === 0} />
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
                  <Icon name="clock" size={15} className="m-only" />
                  {C.officeHours}
                  <span className="d-only"> · or by video from anywhere</span>
                </span>
              )}
              <a className="xs-ulink" href={C.mapsUrl} target="_blank" rel="noopener noreferrer">
                Get directions <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="xs-oc-call">
              <b className="d-only">Prefer to talk first?</b>
              <p>
                <strong className="m-only">Prefer to talk first? </strong>The first available advisor calls you in office hours.
              </p>
              <CallbackButton />
            </div>
          </div>
        )}
        <div className="xs-trust-cta">
          <XsCta id="trust_plan" location="trust">
            {PLAN_CTA}
          </XsCta>
          <span className="d-only">Join them. {CTA_NOTE}</span>
        </div>
      </div>
    </section>
  );
}
