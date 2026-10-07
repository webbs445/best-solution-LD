"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

const STEPS: { title: string; body: string; tags: string[]; icon: ReactNode }[] = [
  {
    title: "Review",
    body: "We look at your business, your transactions and how records are kept today.",
    tags: ["Written scope", "Fixed quote"],
    icon: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="M20 20l-4.2-4.2M8.5 11h5M11 8.5v5" />
      </>
    ),
  },
  {
    title: "Collect",
    body: "Send your invoices and statements by email, shared folder or software access. One checklist, no chasing.",
    tags: ["Invoices", "Bank statements", "Payroll"],
    icon: (
      <>
        <path d="M4 13l2.5-7h11L20 13v6H4z" />
        <path d="M4 13h4.5l1.5 2.5h4l1.5-2.5H20" />
      </>
    ),
  },
  {
    title: "Record and reconcile",
    body: "Every entry recorded, every bank line matched, every gap flagged with a note.",
    tags: ["Zoho Books", "QuickBooks", "Tally"],
    icon: <path d="M4 8h13l-3-3M20 16H7l3 3" />,
  },
  {
    title: "Report and review",
    body: "Your monthly reports, plus a short call to walk through what changed.",
    tags: ["P&L", "Balance Sheet", "Cash Flow"],
    icon: <path d="M4 20V10M10 20V5M16 20v-7M22 20H2" />,
  },
];

const TICK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

/*
  "Four steps, every month": as the section scrolls past, the progress strip on top of each card fills
  (--p, per card via --i) and the current step turns into the dark, raised card; earlier steps show as done.
*/
export function AcProcess() {
  const row = useRef<HTMLDivElement>(null);
  const [cur, setCur] = useState(0);

  useEffect(() => {
    const root = row.current;
    if (!root) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = root.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.max(0, Math.min(1, (vh * 0.72 - r.top) / (r.height + vh * 0.2)));
      root.style.setProperty("--p", p.toFixed(3));
      const next = Math.min(STEPS.length - 1, Math.floor(p * STEPS.length));
      setCur((c) => (c === next ? c : next));
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section className="sheet s-tint light-zone" id="process">
      <div className="wrap">
        <div className="head center rv">
          <span className="kicker">How it works</span>
          <h2>Four steps, every month.</h2>
          <p className="lede">The same routine each month, so you always know what&apos;s due and when your reports arrive.</p>
        </div>
        <div className="steps4" ref={row}>
          <ol>
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className={`s4 rv${i ? ` d${Math.min(i, 3)}` : ""}${i === cur ? " cur" : i < cur ? " done" : ""}`}
                style={{ "--i": i } as CSSProperties}
                aria-current={i === cur ? "step" : undefined}
              >
                <span className="s4-bar" aria-hidden="true">
                  <i />
                </span>
                <div className="s4-top">
                  <span className="s4-num" aria-hidden="true">
                    0{i + 1}
                  </span>
                  <span className="s4-ic" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      {s.icon}
                    </svg>
                  </span>
                </div>
                <span className="s4-state">{i < cur ? "Done" : `Step ${i + 1}`}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <ul className="s4-tags">
                  {s.tags.map((t) => (
                    <li key={t}>
                      {TICK}
                      {t}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <p className="s4-loop rv">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4.5h-4.5" />
            </svg>
            Then the cycle repeats next month.
          </p>
        </div>
        <div className="note rv">
          <i>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </i>
          <div>
            <b>Records incomplete? That&apos;s normal.</b>
            <p>Most clients come to us with missing or late records. Send what you have and we&apos;ll tell you exactly what&apos;s needed.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
