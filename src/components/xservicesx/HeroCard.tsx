"use client";

import Image from "next/image";
import { HERO_PLANS, HERO_PREPARED, TOPICS, TOPIC_IDS, isTopic } from "@/content/xservicesx";
import { setXs, useXs, xsTrack } from "./store";
import { Icon } from "./ui";
import { XsCta } from "./XsCta";

/*
  The hero's "Your written plan for" card, drawn as the first page of a written plan: a copper top edge, a stacked
  sheet behind it on desktop, a native select (good on phones) that sets the page topic, and rows that follow the pick.
  Bars stand in for figures the advisor fills in later (never real numbers); the lock line says so.
*/
export function HeroCard() {
  const s = useXs();
  const topic = s.topic ?? "new_company";
  const plan = HERO_PLANS[topic];
  return (
    <div className="xs-hcard-wrap">
      <span className="xs-hcard-back" aria-hidden="true" />
      <div className="xs-hcard">
        <div className="xs-hcard-top">
          <label className="xs-hcard-label" htmlFor="xs-hero-topic">
            <span className="xs-eyebrow">WHAT DO YOU NEED ADVICE ON?</span>
          </label>
        </div>
        <span className="xs-hcard-select">
          <select
            id="xs-hero-topic"
            value={topic}
            onChange={(e) => {
              if (!isTopic(e.target.value)) return;
              setXs({ topic: e.target.value });
              xsTrack("topic_select", { topic: e.target.value, source: "hero" });
            }}
          >
            {TOPIC_IDS.map((t) => (
              <option key={t} value={t}>
                {TOPICS[t].label}
              </option>
            ))}
          </select>
          <Icon name="chevronRight" size={18} strokeWidth={2.4} className="xs-hcard-chev" />
        </span>
        {/* Phones: what this plan covers, as a short checklist (the preview rows show from 768 px). */}
        <ul className="xs-hcard-mini p-only" key={"m-" + topic} aria-label="Your written plan covers">
          {plan.rows.map((r) => (
            <li key={r.label}>
              <Icon name="check" size={13} strokeWidth={2.8} />
              {r.label}
            </li>
          ))}
        </ul>
        <dl className="xs-hcard-rows" key={topic}>
          {plan.rows.map((r) => (
            <div key={r.label}>
              <dt>
                <Icon name="check" size={14} strokeWidth={2.6} />
                {r.label}
              </dt>
              <dd>
                {r.text ?? (
                  <>
                    {r.pre}
                    <span className="xs-blur" style={{ width: r.bar }} aria-label="to be filled in your plan" role="img" />
                    {r.post}
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
        <p className="xs-hcard-lock">
          <Icon name="lock" size={14} strokeWidth={2.4} />
          Figures filled in by your advisor after your call.
        </p>
        <div className="xs-hcard-by">
          <span className="xs-hcard-av">
            <Image src="/brand/icon-mark.webp" alt="Best Solution" width={20} height={28} loading="eager" />
          </span>
          <span className="xs-hcard-by-t">
            <b>{HERO_PREPARED.by}</b>
            <small>{HERO_PREPARED.to}</small>
          </span>
          <span className="xs-hcard-wa" aria-hidden="true">
            <Icon name="whatsapp" size={16} />
          </span>
        </div>
        <XsCta id="hero_card" location="hero" variant="dark" set={{ topic }} source="hero" className="xs-block">
          {plan.cta}
        </XsCta>
      </div>
    </div>
  );
}
