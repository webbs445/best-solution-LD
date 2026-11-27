"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useInView, useReducedMotion } from "./motion";
import { AN_BOOK_STATES, AN_SOFTWARE, AN_VOLUMES } from "@/content/accountingNew";
import { AnCta } from "./AnLinks";
import type { QuoteAnswers } from "./quoteLogic";
import { openQuote, pick, useQuote } from "./quoteStore";
import { accTrack } from "./track";
import "./an-s6.css";

/* S6 "Four steps. Then it runs every month.": the steps light up along a progress line, then an example year fills in. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TAGS: Record<number, string> = { 0: "VAT", 3: "VAT", 6: "VAT", 8: "CT", 9: "VAT" };
// Share of the progress line filled at each step count (desktop runs across, phone runs down).
const FILL_X = [0, 0, 0.29, 0.58, 1];
const FILL_Y = [0, 0, 0.3, 0.56, 1];

const STEPS = [
  {
    when: "TODAY · 2 MINUTES",
    h: "Tell us about your books.",
    p: "Online or on WhatsApp.",
    scene: null,
  },
  {
    when: "SAME DAY",
    h: "Get your quote the same day.",
    p: "Fee and scope explained before any work begins.",
    scene: (
      <>
        <span className="s6-chip">Your fee <span className="s6-tk">✓ Explained</span></span>
        <span className="s6-chip">What&apos;s included <span className="s6-tk">✓ Explained</span></span>
        <span className="s6-chip">What we need from you <span className="s6-tk">✓ Listed</span></span>
      </>
    ),
  },
  {
    when: "FIRST MONTH",
    h: "We take over.",
    p: "Whatever state the books are in.",
    scene: null,
  },
];

// Step 3: each starting point opens the quote with the need it means.
const TAKE_OVER = [
  ["New books", "My company is new"],
  ["A catch-up on past months", "Catch up on past months"],
  ["Your file from your old accountant", "Keep my books every month"],
] as const;

/**
 * Step 1: the quote form's three book questions (its exact options), answered in place and shared with the quote form
 * and pop-up. One line each: icon, the design's short label, the picker. The button opens the pop-up.
 */
function BooksPick() {
  const { answers } = useQuote();
  const row = (k: keyof QuoteAnswers, label: string, full: string, list: readonly string[], icon: ReactNode) => (
    <label className="s6-pick">
      <span className="s6-pi" aria-hidden="true">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </span>
      {/* The visible field; the native picker sits over it (transparent), so phones get their own picker. */}
      <span className="s6-pv" aria-hidden="true">
        <small>{label}</small>
        <b className={answers[k] ? "" : "s6-pv-none"}>{answers[k] || "Choose"}</b>
      </span>
      <select value={answers[k]} aria-label={full} onChange={(e) => pick(k, e.target.value)}>
        <option value="">Choose</option>
        {list.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="s6-scene s6-live">
      <span className="s6-ex s6-ex-live">Your answers</span>
      {row("volume", "Payments a month", "payments and invoices per month", AN_VOLUMES, <><path d="M6 3h9l3 3v15H6z" /><path d="M9 10h6M9 14h6M9 18h3" /></>)}
      {row("books", "Books", "how up to date are your books", AN_BOOK_STATES, <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l-3 2" /></>)}
      {row("software", "Software", "software you use, if any", AN_SOFTWARE, <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 21h8M12 18v3" /></>)}
      <AnCta section={6} className="an-btn1 s6-link" topic="books">
        Tell us about your books →
      </AnCta>
    </div>
  );
}

/** Step 3: pick where the books start; it opens the quote pop-up with that need. */
function TakeOver() {
  return (
    <div className="s6-scene s6-live">
      <span className="s6-ex s6-ex-live">Pick one</span>
      {TAKE_OVER.map(([label, need]) => (
        <button
          key={label}
          type="button"
          className="s6-opt"
          data-need={need}
          onClick={(e) => {
            accTrack("acc_cta_click", { section: 6 });
            openQuote(6, { need }, e.currentTarget, "start", label);
          }}
        >
          <i aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}

const FACTORS = [
  { t: "Payments and invoices each month", icon: <><path d="M6 3h9l3 3v15H6z" /><path d="M9 10h6M9 14h6M9 18h3" /></> },
  { t: "How many bank accounts", icon: <><path d="M3 10 12 4l9 6" /><path d="M5 10v8M12 10v8M19 10v8" /><path d="M3 20h18" /></> },
  { t: "How far behind the books are", icon: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l-3 2" /></> },
  { t: "Whether you charge VAT", icon: <><path d="M19 5 5 19" /><circle cx="7" cy="7" r="2.5" /><circle cx="17" cy="17" r="2.5" /></> },
];

export function AnSteps() {
  const [ref, seen, visible] = useInView<HTMLElement>(0.3);
  const reduced = useReducedMotion();
  const [s, setS] = useState(0);
  const [m, setM] = useState(0);

  // One timer at a time, only while on screen: steps 1 to 4, then the twelve months.
  useEffect(() => {
    if (!seen || !visible || reduced) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    if (s < 4) t = setTimeout(() => setS(s + 1), s === 0 ? 500 : 900);
    else if (m < 12) t = setTimeout(() => setM(m + 1), m === 0 ? 700 : 420);
    return () => clearTimeout(t);
  }, [seen, visible, reduced, s, m]);

  const S = reduced ? 4 : s;
  const M = reduced ? 12 : m;
  const replay = () => {
    setS(0);
    setM(0);
  };

  return (
    <section id="how" className="s6" ref={ref} aria-labelledby="s6-h">
      <div className="an-wrap s6-in">
        <div className="s6-head">
          <div className="s6-ttl">
            <span className="s6-eye">How it works</span>
            <h2 id="s6-h" className="an-h">
              Four steps.
              <br />
              <b>
                Then it runs
                <br className="s6-pbr" /> every month.
              </b>
            </h2>
          </div>
          <p className="s6-lead">Three of them happen once. The fourth repeats every month, without you chasing anyone.</p>
        </div>

        <div className="s6-track" style={{ "--s6x": FILL_X[S], "--s6y": FILL_Y[S] } as CSSProperties}>
          <div className="s6-rail" aria-hidden="true">
            <div className="s6-fill" />
          </div>

          {STEPS.map((st, i) => (
            <div key={st.h} className={S > i ? "s6-st on" : "s6-st"}>
              <span className="s6-dot an-num">{i + 1}</span>
              <span className="s6-when">{st.when}</span>
              <h3 className="s6-sh">{st.h}</h3>
              <p className="s6-sp">{st.p}</p>
              {i === 0 ? (
                <BooksPick />
              ) : i === 2 ? (
                <TakeOver />
              ) : (
                <div className="s6-scene" aria-hidden="true">
                  <span className="s6-ex">Example</span>
                  {st.scene}
                </div>
              )}
            </div>
          ))}

          <div className={S > 3 ? "s6-four on" : "s6-four"}>
            <div className="s6-fhead">
              <span className="s6-dot an-num">4</span>
              <span className="s6-ctl">
                <span className="s6-exy">Example year</span>
                <button type="button" className="s6-again" onClick={replay}>
                  See it again
                </button>
              </span>
            </div>
            <div className="s6-ftxt">
              <span className="s6-when">EVERY MONTH, AFTER THAT</span>
              <h3 className="s6-sh">Your report every month.</h3>
              <p className="s6-sp">Plus your VAT and Corporate Tax returns, filed on time.</p>
            </div>
            <div className="s6-months an-num" role="img" aria-label="Twelve monthly reports, with VAT and Corporate Tax returns filed">
              {MONTHS.map((n, i) => (
                // December settles to the finished look once the year is complete.
                <div key={n} className={i < M - 1 || M === 12 ? "s6-m done" : i === M - 1 ? "s6-m now" : "s6-m"}>
                  <b>{n}</b>
                  <span className="s6-r">✓ Report</span>
                  {TAGS[i] && <span className="s6-tag">{TAGS[i]}</span>}
                </div>
              ))}
            </div>
            <span className="s6-exy s6-key">VAT: VAT return filed · CT: Corporate Tax return filed</span>
          </div>
        </div>

        <div className="s6-fee">
          <div className="s6-fee-t">
            <span className="s6-fee-h">What sets your fee</span>
            <span className="s6-fee-n">Our fees exclude VAT.</span>
          </div>
          <div className="s6-fac">
            {FACTORS.map((f) => (
              <span key={f.t} className="s6-f">
                <span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {f.icon}
                  </svg>
                </span>
                {f.t}
              </span>
            ))}
          </div>
          <AnCta section={6} className="an-btn1 s6-btn">
            Get my quote today{" "}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </AnCta>
        </div>
      </div>
    </section>
  );
}
