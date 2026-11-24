"use client";

import { useState } from "react";
import { S2_ADVISOR_LINE, WORRIES } from "@/content/xservicesx";
import { getXs, setXs, useXs, xsTrack } from "./store";
import { Icon } from "./ui";
import { XsCta } from "./XsCta";

/*
  Section 2: five worry toggles (multi-select, aria-pressed) saved to the shared state, and the navy card answering the
  picked ones (the first four until something is picked). The newest answer slides in with a short glow.
*/
export function Worries() {
  const { worries } = useXs();
  const [last, setLast] = useState(-1);
  const n = worries.length;
  const shown = n ? [...worries].sort((a, b) => a - b) : [0, 1, 2, 3];
  const toggle = (i: number) => {
    const cur = getXs().worries;
    const on = !cur.includes(i);
    const next = on ? [...cur, i] : cur.filter((x) => x !== i);
    setXs({ worries: next });
    setLast(on ? i : -1);
    xsTrack("xs_worry_toggle", { worry_id: i, on, count: next.length });
  };
  const cta = n > 1 ? `Get answers to my ${n} questions` : n === 1 ? "Get my answer" : "Get my answers";
  return (
    <section className="xs-sec xs-s2" aria-labelledby="xsS2">
      <div className="xs-wrap xs-s2-grid">
        <div className="xs-s2-list">
          <span className="xs-eyebrow">SOUND FAMILIAR?</span>
          <h2 id="xsS2">Which of these is on your mind?</h2>
          <p className="xs-lede">
            Tap all that apply.<span className="d-only"> We&apos;ll show you how we answer them.</span>
          </p>
          {WORRIES.map((w, i) => {
            const on = worries.includes(i);
            return (
              <button key={w.tag} type="button" className="xs-worry" aria-pressed={on} onClick={() => toggle(i)}>
                <span className="xs-box" aria-hidden="true">
                  {on && <Icon name="check" size={14} strokeWidth={3.2} />}
                </span>
                <span className="d-only">{w.text}</span>
                <span className="m-only">{w.textShort}</span>
              </button>
            );
          })}
        </div>
        <div className="xs-answer">
          <div className="xs-answer-by">
            <span className="xs-answer-av" aria-hidden="true">
              <Icon name="user" size={18} />
            </span>
            <span>{S2_ADVISOR_LINE}</span>
          </div>
          <h3>
            <span className="d-only">{n ? "Here's how we sort that out," : "That's exactly what we sort out,"}</span>
            <span className="m-only">{n ? "Here's how we sort that out," : "That's what we sort out,"}</span>{" "}
            <span className="xs-copper-l">in one consultation.</span>
          </h3>
          <ul aria-live="polite">
            {shown.map((i) => (
              // Phones, nothing ticked: only the first two answers (the rest from 768 px).
              <li key={i} className={[i === last && "is-new", !n && i > 1 && "t-up"].filter(Boolean).join(" ") || undefined}>
                <span className="xs-tick" aria-hidden="true">
                  <Icon name="check" size={15} strokeWidth={3} />
                </span>
                <span className="d-only">
                  <b>{WORRIES[i].lead}</b> {WORRIES[i].rest}
                </span>
                <span className="m-only">
                  <b>{WORRIES[i].leadShort}</b> {WORRIES[i].restShort}
                </span>
              </li>
            ))}
          </ul>
          <div className="xs-answer-foot">
            <XsCta id="s2_get_answers" location="s2">
              {cta}
            </XsCta>
            <span>One consultation · answers in writing</span>
          </div>
        </div>
      </div>
    </section>
  );
}
