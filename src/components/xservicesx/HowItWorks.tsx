"use client";

import { useEffect, useRef, useState } from "react";
import { MODE_NOTE, S5_CALL, S5_CALL_SHORT, S5_CHIPS, S5_STEP3_LABEL, S5_SUB, S5_TITLE, S5_YOUR_CALL } from "@/content/xservicesx";
import { XS_CONFIG as C } from "@/content/xservicesx.config";
import { setXs, useXs, xsTrack } from "./store";
import { Icon } from "./ui";
import { XsCta } from "./XsCta";

const LABELS = ["TODAY · 10:00 AM", "TODAY · 2:00 PM", S5_STEP3_LABEL];

/*
  Section 5 (navy): three steps on a timeline. The copper line fills to the active step on hover or focus, and as the
  section scrolls into view (one step per third). Step 1 chips set the topic, the step 2 toggle the meeting mode.
*/
export function HowItWorks() {
  const s = useXs();
  const [step, setStep] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const advisor = C.advisors[0];

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        // How far the section has come up the screen: 0 to 1, one step per third.
        const seen = Math.min(1, Math.max(0, (window.innerHeight - e.boundingClientRect.top) / e.boundingClientRect.height));
        setStep((cur) => Math.max(cur, Math.min(2, Math.floor(seen * 3))));
      },
      { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const picked = S5_CHIPS.find((c) => c.topic === s.topic);
  const mode = s.consultMode ?? "video";
  const card = (i: number) => `xs-step${i <= step ? " is-done" : ""}${i === step ? " is-on" : ""}`;
  const go = (i: number) => () => setStep(i);

  return (
    <section ref={ref} className="xs-sec xs-s5" aria-labelledby="xsS5">
      <div className="xs-wrap">
        <div className="xs-s5-head">
          <div>
            <span className="xs-eyebrow xs-on-navy">HOW IT WORKS</span>
            <h2 id="xsS5">
              {S5_TITLE.a} <span className="xs-copper-l">{S5_TITLE.b}</span>
            </h2>
            <p>{S5_SUB}</p>
          </div>
          <span className="xs-s5-note d-only">Example timeline. Times depend on your case.</span>
        </div>

        <div className="xs-tl d-only" aria-hidden="true">
          <span className="xs-tl-line" />
          <span className="xs-tl-fill" style={{ width: `calc(${step} * (100% - 2 * var(--tl-inset)) / 2)` }} />
          {LABELS.map((l, i) => (
            <span key={i} className={`xs-tl-node${i <= step ? " is-done" : ""}`}>
              <span className="xs-tl-lab">{l ?? " "}</span>
              <span className="xs-tl-num">{i + 1}</span>
            </span>
          ))}
        </div>

        <ol className="xs-steps">
          <li className={card(0)} onMouseEnter={go(0)} onFocus={go(0)}>
            <span className="xs-step-num m-only" aria-hidden="true">1</span>
            <div className="xs-step-body">
              <span className="xs-step-lab m-only">{LABELS[0]}</span>
              <h3>Tell us your plan</h3>
              <p>Pick what&apos;s on your mind.<span className="d-only"> A few lines is enough.</span></p>
              <div className="xs-tchips">
                {S5_CHIPS.map((c) => {
                  const on = s.topic === c.topic;
                  return (
                    <button
                      key={c.topic}
                      type="button"
                      className={`xs-tchip${on ? " on" : ""}`}
                      aria-pressed={on}
                      onClick={() => {
                        setXs({ topic: on ? null : c.topic });
                        setStep(0);
                        if (!on) xsTrack("xs_topic_select", { topic: c.topic, source: "s5" });
                      }}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </li>
          <li className={card(1)} onMouseEnter={go(1)} onFocus={go(1)}>
            <span className="xs-step-num m-only" aria-hidden="true">2</span>
            <div className="xs-step-body">
              <span className="xs-step-lab m-only">{LABELS[1]}</span>
              <h3>Talk it through</h3>
              <p>
                <span className="d-only">{S5_CALL}</span>
                <span className="m-only">{S5_CALL_SHORT}</span>
              </p>
              {advisor && (
                <div className="xs-step-adv">
                  <span className="xs-adv-dot" aria-hidden="true">
                    <Icon name="user" size={20} />
                  </span>
                  <span>
                    <b>{advisor.name}</b>
                    <small>
                      {advisor.role} · {advisor.languages}
                    </small>
                  </span>
                </div>
              )}
              <div className="xs-seg" role="group" aria-label="How to meet">
                {(["video", "office"] as const).map((m) => (
                  <button key={m} type="button" aria-pressed={mode === m} onClick={() => (setXs({ consultMode: m }), setStep(1))}>
                    {m === "video" ? "Video call" : "Business Bay office"}
                  </button>
                ))}
              </div>
              <span className="xs-mode-note" key={mode}>
                {MODE_NOTE[mode]}
              </span>
            </div>
          </li>
          <li className={card(2)} onMouseEnter={go(2)} onFocus={go(2)}>
            <span className="xs-step-num m-only" aria-hidden="true">3</span>
            <div className="xs-step-body">
              {LABELS[2] && <span className="xs-step-lab m-only">{LABELS[2]}</span>}
              <h3>Get it in writing</h3>
              <p>
                <span className="d-only">Your plan lands on WhatsApp. Read it, share it, decide in your own time.</span>
                <span className="m-only">Your plan lands on WhatsApp. Decide in your own time.</span>
              </p>
              <div className="xs-msg" aria-hidden="true">
                <span>Hi, your written plan is ready.</span>
                <span className="xs-msg-file">
                  <span className="xs-msg-ico">
                    <Icon name="file" size={18} />
                  </span>
                  <span>
                    <b>Your written plan.pdf</b>
                    <small className="d-only">Structure · costs · timeline · fees</small>
                  </span>
                </span>
                <span className="xs-msg-time">
                  10:12 AM
                  <svg width="16" height="12" viewBox="0 0 28 16" fill="none" stroke="#34B7F1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m2 9 4 4 8-10" />
                    <path d="m12 13 2 0 10-10" />
                  </svg>
                </span>
              </div>
            </div>
          </li>
        </ol>

        <div className="xs-s5-foot">
          <p>
            <strong>Then it&apos;s your call.</strong> {S5_YOUR_CALL}
          </p>
          <div className="xs-s5-cta">
            <span className="d-only">No obligation</span>
            <XsCta id="s5_continue" location="s5" set={picked ? { topic: picked.topic } : undefined} source="s5">
              {picked ? `Continue: ${picked.label}` : "Begin with step 1"}
            </XsCta>
            <span className="m-only">No obligation</span>
          </div>
        </div>
      </div>
    </section>
  );
}
