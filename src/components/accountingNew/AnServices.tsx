"use client";

import type { CSSProperties, ReactNode } from "react";
import { AnCta } from "./AnLinks";
import { useInView } from "./motion";
import { needFromServices } from "./quoteLogic";
import { toggleService, useQuote } from "./quoteStore";
import "./an-s1b.css";

/*
  "What we do" (designs S1B desktop, S1BPhone phone), between the hero and section 2. Cream. The seven rows tick in
  one by one once the list scrolls into view (once); reduced motion shows them at once. One flat grid: desktop puts
  the text column beside the sheet, phone stacks text, sheet, facts, then a full-width button.
*/

// [service, line, how often, navy tag]
const ROWS: [string, string, string, boolean][] = [
  ["Bookkeeping", "Every sale, bill and expense recorded in your books.", "EVERY MONTH", true],
  ["Bank reconciliation", "Every bank and card line matched, with nothing left over.", "EVERY MONTH", true],
  ["Financial statements", "Profit and loss, balance sheet and cash flow.", "MONTHLY OR YEAR END", false],
  ["VAT returns", "Prepared from your books and filed for you.", "EACH VAT PERIOD", false],
  ["Corporate Tax return", "Prepared and filed within 9 months of your year end.", "ONCE A YEAR", false],
  ["Catch-up bookkeeping", "Months behind brought up to date, month by month.", "ONCE", false],
  ["Audit-ready records", "Ledgers and reconciliations your auditor can use.", "YEAR END", false],
];

const ico = (d: ReactNode) => (
  <i aria-hidden="true">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  </i>
);

export function AnServices() {
  const [ref, seen] = useInView<HTMLDivElement>(0.2);
  // Ticked rows are shared with the quote pop-up: they ride on the lead, and settle its need when they can.
  const { services } = useQuote();
  const need = needFromServices(services);
  return (
    <section id="services" className="s1b" aria-labelledby="s1b-h">
      <div className="an-wrap s1b-wrap">
        <span className="s1b-eye">What we do</span>
        <h2 id="s1b-h" className="an-h s1b-h">
          Pick one,
          <br />
          <b>or let us run it all.</b>
        </h2>
        <p className="s1b-lead">Seven services, one team. Take only what you need, or the full set for one monthly fee.</p>

        <div className={seen ? "s1b-sheet seen" : "s1b-sheet"} ref={ref}>
          <div className="s1b-sh" aria-hidden="true">
            <span>NO.</span>
            <span>WHAT WE DO</span>
            <span>HOW OFTEN</span>
          </div>
          <ol className="s1b-rows">
            {ROWS.map(([t, s, f, m], i) => (
              <li key={t} className={services.includes(t) ? "s1b-row on" : "s1b-row"} style={{ "--d": `${(0.15 + i * 0.09).toFixed(2)}s` } as CSSProperties}>
                <span className="s1b-no an-num" aria-hidden="true">
                  {services.includes(t) ? "✓" : `0${i + 1}`}
                </span>
                <span className="s1b-nm">
                  {/* The whole row is the tick box (the button stretches over it). */}
                  <button type="button" className="s1b-pick" aria-pressed={services.includes(t)} onClick={() => toggleService(t)}>
                    {t}
                  </button>
                  <span>{s}</span>
                </span>
                <span className={m ? "s1b-fq m" : "s1b-fq"}>{f}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="s1b-facts">
          <span className="s1b-ft">
            {ico(<path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" />)}
            <span>
              <b>Mainland and free zone</b> companies
            </span>
          </span>
          <span className="s1b-ft">
            {ico(
              <>
                <rect x="3" y="4" width="18" height="14" rx="2" />
                <path d="M8 21h8M12 18v3" />
              </>,
            )}
            <span>
              <b>Zoho Books, QuickBooks, Tally</b> or Excel
            </span>
          </span>
          <span className="s1b-ft">
            {ico(
              <>
                <circle cx="12" cy="10" r="3" />
                <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
              </>,
            )}
            <span>
              <b>In person in Business Bay,</b> or by video
            </span>
          </span>
        </div>

        <p className="s1b-hint" aria-live="polite">
          {services.length ? `${services.length} picked. Your quote covers ${services.length === 1 ? "it" : "them"}.` : "Tick what you need, then get your quote."}
        </p>
        <AnCta section="services" className="an-btn1 s1b-btn" prefill={need ? { need } : {}} topic="services">
          Get my quote today{" "}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </AnCta>
      </div>
    </section>
  );
}
