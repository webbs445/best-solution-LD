"use client";

import type { ReactNode } from "react";
import { useInView } from "./motion";
import "./an-s4.css";

const icon = (d: ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const ASKS = [
  {
    icon: icon(
      <>
        <path d="M3 10 12 4l9 6" />
        <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" />
        <path d="M3 20h18" />
      </>,
    ),
    who: "The bank",
    sub: "Account reviews and finance requests",
    ask: '"Please send your latest financial statements for your account review."',
    ok: "Ready.",
    reply: "We prepare them from books that already balance.",
  },
  {
    icon: icon(
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-4.5-4.5" />
      </>,
    ),
    who: "Your auditor",
    sub: "Year-end review",
    ask: `"We'll need your ledgers and bank reconciliations for the year."`,
    ok: "Ready.",
    reply: "Books that answer their questions the first time.",
  },
  {
    icon: icon(
      <>
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M4 10h16M9 3v4M15 3v4" />
      </>,
    ),
    who: "The tax return",
    sub: "Corporate Tax and VAT",
    ask: '"Your Corporate Tax return is due within 9 months of the end of your financial year."',
    ok: "Filed.",
    reply: "We prepare it from your books and file it for you. Same for VAT.",
  },
  {
    icon: icon(
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
      </>,
    ),
    who: "You",
    sub: "Most of all, you",
    ask: '"Can we afford to hire someone next quarter?"',
    ok: "Answered.",
    reply: "Pricing, hiring and spending decisions are easier when you know your margin.",
    you: true,
  },
];

/* Section 4: who asks for your numbers. The replies land one by one the first time the cards scroll into view. */
export function AnAsks() {
  const [ref, seen, visible] = useInView<HTMLDivElement>(0.25);
  const cls = `s4-grid${seen ? " s4-go" : ""}${seen && !visible ? " s4-paused" : ""}`;
  return (
    <section className="s4" aria-labelledby="s4-h">
      <div className="an-wrap s4-wrap">
        <div className="s4-top">
          <div className="s4-hcol">
            <span className="s4-eyebrow">Who asks for your numbers</span>
            <h2 id="s4-h" className="an-h s4-h">
              Sooner or later, someone
              <br className="s4-br" /> <b>asks for your numbers.</b>
            </h2>
          </div>
          <p className="s4-lead">When they do, you want to send them the same day, not spend a week finding them.</p>
        </div>

        <div className={cls} ref={ref}>
          {ASKS.map((a, i) => (
            <div className="s4-req" key={a.who}>
              <div className="s4-from">
                <span className={a.you ? "s4-av s4-you" : "s4-av"}>{a.icon}</span>
                <span className="s4-who">
                  <b>{a.who}</b>
                  <span>{a.sub}</span>
                </span>
              </div>
              <div className="s4-bubble">{a.ask}</div>
              <div className="s4-reply" style={{ animationDelay: `${0.3 + i * 0.4}s` }}>
                <span className="s4-ok">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                </span>
                <span>
                  <b>{a.ok}</b> {a.reply}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="s4-years">
          <span className="s4-seven an-num">
            7<span>years</span>
          </span>
          <span className="s4-rule" aria-hidden="true" />
          <span className="s4-yt">
            UAE companies must keep their records for at least 7 years. <b>We keep yours in order every month.</b>
          </span>
        </div>
      </div>
    </section>
  );
}
