"use client";

import { useEffect, useRef, useState } from "react";

const STEPS = [
  { title: "Review", body: "We look at your business, your transactions and how records are kept today.", tags: ["Written scope", "Fixed quote"] },
  { title: "Collect", body: "Send your invoices and statements by email, shared folder or software access. One checklist, no chasing.", tags: ["Invoices", "Bank statements", "Payroll"] },
  { title: "Record and reconcile", body: "Every entry recorded, every bank line matched, every gap flagged with a note.", tags: ["Zoho Books", "QuickBooks", "Tally"] },
  { title: "Report and review", body: "Your monthly reports, plus a short call to walk through what changed.", tags: ["P&L", "Balance Sheet", "Cash Flow"] },
];

/*
  "Four steps, every month": four step cards in a row (2 x 2 on tablets, stacked on phones). The line
  behind the numbers fills as you scroll (--p) and each step lights up as the fill reaches it.
*/
export function AcProcess() {
  const row = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    const root = row.current;
    if (!root) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = root.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (window.innerHeight * 0.75 - r.top) / (r.height * 0.9)));
      root.style.setProperty("--p", p.toFixed(3));
      const n = p >= 1 ? STEPS.length : Math.floor(p * STEPS.length) + (p > 0 ? 1 : 0);
      setLit((cur) => (cur === n ? cur : n));
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
          <span className="s4-line" aria-hidden="true">
            <i />
          </span>
          <ol>
            {STEPS.map((s, i) => (
              <li key={s.title} className={`s4 rv${i ? ` d${Math.min(i, 3)}` : ""}${i < lit ? " on" : ""}`}>
                <span className="s4-dot" aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <div className="tags">
                  {s.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </li>
            ))}
          </ol>
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
