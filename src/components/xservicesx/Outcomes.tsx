"use client";

import { useState } from "react";
import { OUTCOMES, PLAN_CTA, S4_DELIVERY, S4_DELIVERY_SHORT, S4_FEES_LINE } from "@/content/xservicesx";
import { Icon } from "./ui";
import { XsCta } from "./XsCta";

/*
  Section 4: five outcomes; hover, focus or tap on one lights up its block on the tilted written-plan document.
  Phone: the document first, the tap list under it.
*/
export function Outcomes() {
  const [on, setOn] = useState(0);
  const blk = (i: number) => `xs-doc-blk${i === on ? " is-on" : ""}`;
  return (
    <section className="xs-sec xs-s4" aria-labelledby="xsS4">
      <div className="xs-wrap xs-s4-grid">
        <div className="xs-s4-head">
          <span className="xs-eyebrow">WHAT YOU WALK AWAY WITH</span>
          <h2 id="xsS4">In one consultation, you&apos;ll know</h2>
        </div>
        <div className="xs-s4-list">
          {OUTCOMES.map((o, i) => (
            <button key={o.title} type="button" className="xs-outcome" aria-pressed={i === on} onMouseEnter={() => setOn(i)} onFocus={() => setOn(i)} onClick={() => setOn(i)}>
              <span className="xs-onum">{i + 1}</span>
              <span className="xs-otext">
                <b>{o.title}</b>
                <span className="d-only">{o.sub}</span>
                <span className="m-only">{o.subShort}</span>
              </span>
            </button>
          ))}
          <div className="xs-s4-cta">
            <XsCta id="s4_plan" location="s4">
              {PLAN_CTA}
            </XsCta>
            <span>
              No pressure to buy<span className="d-only"> anything</span>. If we&apos;re not the right fit, we&apos;ll tell you.
            </span>
          </div>
        </div>
        <div className="xs-s4-stage">
          <div className="xs-doc" aria-hidden="true">
            <div className="xs-doc-head">
              <b>Best Solution · Written plan</b>
              <span>For: your name</span>
            </div>
            {S4_DELIVERY && (
              <span className="xs-sent">
                <Icon name="check" size={13} strokeWidth={2.4} />
                <span className="d-only">{S4_DELIVERY}</span>
                <span className="m-only">{S4_DELIVERY_SHORT}</span>
              </span>
            )}
            <div className={blk(0)}>
              <span className="xs-doc-k">
                1 · <span className="d-only">RECOMMENDED </span>STRUCTURE
              </span>
              <span className="d-only xs-doc-v">Free zone company, matched to your activity</span>
              <span className="xs-bar" style={{ width: "86%" }} />
            </div>
            <div className={blk(1)}>
              <span className="xs-doc-k">2 · COSTS</span>
              <span className="xs-doc-row d-only">
                <span>Year one</span>
                <span>
                  AED <span className="xs-bar" style={{ width: 64 }} />
                </span>
              </span>
              <span className="xs-doc-row d-only">
                <span>Every year after</span>
                <span>
                  AED <span className="xs-bar" style={{ width: 52 }} />
                </span>
              </span>
              <span className="xs-bar m-only" style={{ width: "66%" }} />
            </div>
            <div className={blk(2)}>
              <span className="xs-doc-k">3 · WHAT TO PREPARE</span>
              <span className="xs-doc-checks d-only">
                {[70, 55, 62].map((w) => (
                  <span key={w}>
                    <i />
                    <span className="xs-bar" style={{ width: `${w}%` }} />
                  </span>
                ))}
              </span>
              <span className="xs-bar m-only" style={{ width: "72%" }} />
            </div>
            <div className={blk(3)}>
              <span className="xs-doc-k">4 · TIMELINE</span>
              <span className="xs-doc-tl">
                <i />
                <i />
                <i />
              </span>
              <span className="xs-doc-row xs-doc-steps d-only">
                <span>Prepare</span>
                <span>Submit</span>
                <span>Ready</span>
              </span>
            </div>
            <div className={blk(4)}>
              <span className="xs-doc-k">5 · OUR FEES</span>
              <span className="xs-doc-row d-only">
                <span>{S4_FEES_LINE}</span>
                <span>
                  AED <span className="xs-bar" style={{ width: 44 }} />
                </span>
              </span>
              <span className="xs-bar m-only" style={{ width: "50%" }} />
            </div>
          </div>
          <span className="xs-stage-note d-only">Example layout. Your plan depends on your activity and team.</span>
        </div>
      </div>
    </section>
  );
}
