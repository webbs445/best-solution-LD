"use client";

import { useInView } from "./motion";
import { volumeLine } from "./quoteLogic";
import { useQuote } from "./quoteStore";
import { QuoteForm, Tick } from "./QuoteForm";
import "./an-s9.css";

/*
  Section 9, "Next month, know your numbers": a three-step quote form beside a quote paper that fills in as answers
  are picked. Posts to /api/accounting (the accounting lead route: same validation, honeypot and click IDs as the
  other forms). After a confirmed lead the paper gets its "QUOTE TODAY" stamp and the card shows "Request received."
  The acc_* events carry only step numbers and the fixed option labels, never contact details; the confirmed lead's
  form_submit and generate_lead carry user_data for enhanced conversions, exactly as the old /accounting form did.
  The form (QuoteForm) runs on the page's shared quote state (quoteStore), which the pop-up shows too.
*/


/* Decorative drifting ledger figures. Each column repeats its list twice so a -50% drift loops without a jump. */
const FIGS = ["148,200", "22,600", "139,600", "212,640", "276,940", "9,850", "18,400", "186,910", "29,530", "142 / 142", "0.00", "64,300", "227,750", "(118,670)", "2,150", "(113,870)", "7,410", "(49,190)"];
const col = (start: number) => {
  const list = [...FIGS.slice(start), ...FIGS.slice(0, start)];
  return [...list, ...list];
};
const Figs = ({ className, starts }: { className: string; starts: number[] }) => (
  <div className={`s9-figs ${className}`} aria-hidden="true">
    {starts.map((s, i) => (
      <div className="s9-fc" key={i}>
        {col(s).map((n, j) => (
          <span key={j}>{n}</span>
        ))}
      </div>
    ))}
  </div>
);


export function AnQuote() {
  const [ref, seen, visible] = useInView<HTMLElement>(0.15);
  const { answers, phase, open } = useQuote();
  const sent = phase === "sent";
  const row = (label: string, value: string, wait: string, last = false) => (
    <div className={last ? "s9-pl last" : "s9-pl"}>
      <span>{label}</span>
      {value ? <b>{value}</b> : <i>{wait}</i>}
    </div>
  );

  return (
    <section id="quote" ref={ref} className={`s9${seen ? " seen" : ""}${visible ? " live" : ""}`} aria-labelledby="an-q-title">
      <div className="s9-bg s9-glow" aria-hidden="true" />
      <div className="s9-bg s9-ruled" aria-hidden="true" />
      <div className="s9-bg s9-grain" aria-hidden="true" />
      <div className="s9-margin" aria-hidden="true" />
      <div className="s9-topline" aria-hidden="true" />
      <Figs className="s9-figs-r" starts={[0, 11]} />
      <Figs className="s9-figs-b" starts={[3, 9, 13]} />

      <div className="an-wrap s9-wrap">
        <div className="s9-left">
          <span className="s9-eyebrow">Your quote, the same day</span>
          <h2 className="an-h s9-h" id="an-q-title">
            Next month,
            <br />
            <span className="s9-gold">
              know your
              <br className="s9-m" /> numbers.
            </span>
          </h2>
          <p className="s9-lead">Three short steps. Your answers become the brief your accountant prices from.</p>
          <div className="s9-paper an-num" aria-live="polite">
            <div className="s9-ph">
              <b>QUOTE REQUEST</b>
              <span>Read by an accountant</span>
            </div>
            {row("Need", answers.need, "waiting for step 1")}
            {row("Each month", volumeLine(answers.volume), "waiting for step 2")}
            {row("Software", answers.software, "waiting for step 2")}
            {row("Books", answers.books, "waiting for step 2", true)}
            {sent && <span className="s9-stamp">QUOTE TODAY</span>}
          </div>
          <div className="s9-assure">
            <span className="s9-as">
              <i>
                <Tick />
              </i>
              Quote the same working day
            </span>
            <span className="s9-as">
              <i>
                <Tick />
              </i>
              Fee explained before any work
            </span>
          </div>
        </div>

        <div className="s9-bezel">
          <QuoteForm prefix="an-q" active={!open} titleId="an-q-title" showQuestion />
        </div>
      </div>
    </section>
  );
}
