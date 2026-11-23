"use client";

import { useState } from "react";
import { CTA_NOTE, PLAN_CTA, TOPICS, TOPIC_IDS } from "@/content/xservicesx";
import { XS_CONFIG as C, type Review, type TopicId } from "@/content/xservicesx.config";
import { xsTrack } from "./store";
import { Icon, Stars } from "./ui";
import { XsCta } from "./XsCta";

/*
  Section 7: real Google reviews only (XS_CONFIG.reviews, word for word). Topic tabs show only for topics that have
  reviews; reviews without a topic share one list (no tabs). The rating pill needs both the rating and the count; the
  client story needs an approved story. With no reviews at all the page leaves the section out (page.tsx).
*/
const topicsWithReviews = TOPIC_IDS.filter((t) => C.reviews.some((r) => r.topic === t));
const advisorName = (id?: string) => C.advisors.find((a) => a.id === id)?.name;

export function Reviews() {
  const tabs = topicsWithReviews;
  const [tab, setTab] = useState<TopicId | null>(tabs[0] ?? null);
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  const list: Review[] = tab ? C.reviews.filter((r) => r.topic === tab) : C.reviews;
  const r = list[Math.min(i, list.length - 1)];
  const len = list.length;
  const pick = (t: TopicId) => {
    if (t === tab) return;
    setTab(t);
    setI(0);
    setN(n + 1);
    xsTrack("xs_review_topic", { topic: t });
  };
  const step = (d: number) => {
    setI((i + d + len) % len);
    setN(n + 1);
  };
  const by = advisorName(r.advisorId);
  const meta = ["Google review", r.month, by ? `Advised by ${by}` : null].filter(Boolean).join(" · ");
  const rating = C.googleRating && C.googleReviewCount ? { score: C.googleRating, count: C.googleReviewCount } : null;

  return (
    <section className="xs-sec xs-s7" id="reviews" aria-labelledby="xsS7">
      <div className="xs-wrap">
        <div className="xs-s7-head">
          <div>
            <span className="xs-eyebrow">WHAT CLIENTS SAY</span>
            <h2 id="xsS7">Don&apos;t take our word for it.</h2>
          </div>
          {rating && C.googleReviewsUrl ? (
            <a className="xs-rating" href={C.googleReviewsUrl} target="_blank" rel="noopener">
              <b>{rating.score}</b>
              <Stars label={`Rated ${rating.score} out of 5`} />
              <span>{rating.count} Google reviews</span>
              <em>Read all →</em>
            </a>
          ) : (
            C.googleReviewsUrl && (
              <a className="xs-link" href={C.googleReviewsUrl} target="_blank" rel="noopener">
                Read all Google reviews <span aria-hidden="true">→</span>
              </a>
            )
          )}
        </div>

        {tabs.length > 0 && (
          <div className="xs-chiprail m-only" role="group" aria-label="Review topics">
            {tabs.map((t) => (
              <button key={t} type="button" className="xs-fchip" aria-pressed={t === tab} onClick={() => pick(t)}>
                {TOPICS[t].short}
              </button>
            ))}
          </div>
        )}

        <div className={`xs-stage${tabs.length ? "" : " no-tabs"}`}>
          <div className="xs-quote">
            <span className="xs-qmark" aria-hidden="true">
              &ldquo;
            </span>
            {tab && <span className="xs-qtag">{TOPICS[tab].short}</span>}
            <blockquote className={n % 2 ? "qa" : "qb"} key={`${tab}-${i}`} data-review-quote aria-live="polite">
              {r.text}
            </blockquote>
            <div className="xs-quote-foot">
              <div className="xs-reviewer">
                <span className="xs-initial d-only" aria-hidden="true">
                  {r.firstNameInitial.charAt(0)}
                </span>
                <span>
                  <b>
                    {r.firstNameInitial}
                    {r.stars === 5 && (
                      <>
                        {" · "}
                        <Stars label="5 out of 5 stars" size={14} />
                      </>
                    )}
                  </b>
                  <small>{meta}</small>
                </span>
              </div>
              <div className="xs-qnav">
                {tab && (
                  <XsCta id="s7_ask_mobile" location="s7" variant="chip" set={{ topic: tab }} source="s7" className="m-only xs-textlink">
                    Ask about this →
                  </XsCta>
                )}
                {len > 1 && (
                  <span className="xs-qnav-btns">
                    <span className="xs-counter">
                      {i + 1} / {len}
                    </span>
                    <button type="button" className="xs-round" aria-label="Previous review" onClick={() => step(-1)}>
                      <Icon name="chevronLeft" size={18} strokeWidth={2.4} />
                    </button>
                    <button type="button" className="xs-round" aria-label="Next review" onClick={() => step(1)}>
                      <Icon name="chevronRight" size={18} strokeWidth={2.4} />
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
          {tabs.length > 0 && tab && (
            <div className="xs-tabs d-only">
              <span className="xs-eyebrow xs-grey">WHAT&apos;S ON YOUR MIND?</span>
              {tabs.map((t) => {
                const count = C.reviews.filter((x) => x.topic === t).length;
                return (
                  <button key={t} type="button" className="xs-tab" aria-pressed={t === tab} onClick={() => pick(t)}>
                    <b>{TOPICS[t].short}</b>
                    <span>
                      {count} {count === 1 ? "review" : "reviews"}
                    </span>
                  </button>
                );
              })}
              <XsCta id="s7_ask" location="s7" variant="chip" set={{ topic: tab }} source="s7">
                Ask about {TOPICS[tab].short.charAt(0).toLowerCase() + TOPICS[tab].short.slice(1)} →
              </XsCta>
            </div>
          )}
        </div>

        {C.clientStory && (
          <div className="xs-story">
            <div className="xs-story-who">
              <span className="xs-eyebrow xs-on-navy">CLIENT STORY</span>
              <b>
                {C.clientStory.businessType} from {C.clientStory.country}
              </b>
            </div>
            <div className="xs-story-flow">
              <div>
                <span>CAME IN</span>
                {C.clientStory.cameIn}
              </div>
              <Icon name="arrowRight" size={26} className="d-only" />
              <div className="is-out">
                <span>LEFT WITH</span>
                {C.clientStory.leftWith}
              </div>
            </div>
            {C.clientStory.url && (
              <a href={C.clientStory.url}>
                Read the story <span aria-hidden="true">→</span>
              </a>
            )}
          </div>
        )}

        <div className="xs-s7-cta">
          <XsCta id="s7_plan" location="s7">
            {PLAN_CTA}
          </XsCta>
          <span className="d-only">Join them. {CTA_NOTE}</span>
        </div>
      </div>
    </section>
  );
}
