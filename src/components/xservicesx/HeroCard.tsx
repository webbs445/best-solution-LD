"use client";

import Image from "next/image";
import { HERO_PLANS, HERO_PREPARED, TOPICS, TOPIC_IDS, isTopic } from "@/content/xservicesx";
import { setXs, useXs, xsTrack } from "./store";
import { XsCta } from "./XsCta";

/*
  The hero's "Your written plan for" card: a native select (good on phones) that sets the page topic; the rows and the
  button follow the pick. Bars stand in for figures the advisor fills in later (never real numbers).
*/
export function HeroCard() {
  const s = useXs();
  const topic = s.topic ?? "new_company";
  const plan = HERO_PLANS[topic];
  return (
    <div className="xs-hcard-wrap">
      <div className="xs-hcard">
        <label className="xs-hcard-label">
          <span className="xs-eyebrow">YOUR WRITTEN PLAN FOR</span>
          <select
            value={topic}
            onChange={(e) => {
              if (!isTopic(e.target.value)) return;
              setXs({ topic: e.target.value });
              xsTrack("xs_topic_select", { topic: e.target.value, source: "hero" });
            }}
          >
            {TOPIC_IDS.map((t) => (
              <option key={t} value={t}>
                {TOPICS[t].label}
              </option>
            ))}
          </select>
        </label>
        <dl className="xs-hcard-rows">
          {plan.rows.map((r) => (
            <div key={r.label}>
              <dt>{r.label}</dt>
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
        <div className="xs-hcard-lines" aria-hidden="true">
          <span />
          <span />
        </div>
        <div className="xs-hcard-by">
          <span className="xs-hcard-av">
            <Image src="/brand/icon-mark.webp" alt="Best Solution" width={20} height={28} loading="eager" />
          </span>
          <span>{HERO_PREPARED}</span>
        </div>
        <XsCta id="hero_card" location="hero" variant="dark" set={{ topic }} source="hero" className="xs-block" arrow={false}>
          {plan.cta}
        </XsCta>
      </div>
      <span className="xs-hcard-note">Example layout. Your plan depends on your activity and team.</span>
    </div>
  );
}
