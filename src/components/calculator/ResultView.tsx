"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { SITE } from "@/content/site";
import { useCalculator } from "./CalculatorProvider";
import { STEPS } from "@/content/calculator";
import { jurisdictionLabel } from "@/lib/analytics";
import { FORM_ID } from "@/lib/lead";
import { RATES, formatAED, maxResidents, pick, type Answers, type Estimate, type StepId } from "@/lib/pricing";
import { useCountUp } from "@/components/ui/useCountUp";
import { QuickCapture } from "@/components/ui/QuickCapture";
import styles from "./Calculator.module.css";

function labelFor(id: StepId, a: Answers): string {
  if (id === "residency") {
    const n = Math.min(a.residency ?? 0, maxResidents(a));
    return n === 0 ? "No residency" : n + (n === 1 ? " person" : " people");
  }
  if (id === "option") {
    const p = pick(a);
    return p && p.chosen ? p.opt.name : "Recommend one for me";
  }
  const opt = STEPS[id].options?.find((o) => o[0] === a[id]);
  return opt ? opt[1] : "";
}

/** The selections and estimate in words, for the WhatsApp message and the success card. */
function summaryText(a: Answers, r: Estimate): string {
  const p = pick(a);
  const where = p && p.chosen ? p.opt.name : `${STEPS.jurisdiction.options?.find((o) => o[0] === a.jurisdiction)?.[1] ?? "UAE company"}, advisor to recommend`;
  const people = a.jurisdiction !== "offshore" && r.residents > 0 ? `, ${r.residents} ${r.residents === 1 ? "person" : "people"} with residency` : "";
  return `${where}${people}, ${r.from ? "from " : ""}AED ${formatAED(r.total)}`;
}

const delay = (i: number): CSSProperties => ({ animationDelay: `${i * 140}ms` });

/* The figure first: on phones this, then the number field, sit together on one screen. */
function SummaryHead({ result }: { result: Estimate }) {
  const { state, setBank } = useCalculator();
  const total = useCountUp(result.total, { clientOnly: true });
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section aria-label="Your estimate" className={styles.summary}>
      <div className={styles.resultKicker}>
        <span className={styles.resultDot} /> Your estimate
        <span className={styles.kickerBrand}>
          <span className={styles.resultRule} /> Best Solution
        </span>
      </div>
      <h3 ref={headingRef} tabIndex={-1} className={styles.resLabel}>
        Your first-year company cost
      </h3>
      <p className={styles.resTotal}>
        <small>{result.from ? "From AED" : "AED"}</small>
        <span>{formatAED(total)}</span>
      </p>
      <p className={styles.resSub}>
        <b>{result.name}</b>
        {result.basis ? `. ${result.basis}.` : null}
      </p>
      <label className={styles.bankToggle}>
        <input type="checkbox" checked={state.answers.bank === "yes"} onChange={(e) => setBank(e.target.checked)} />
        <span>
          Add bank account help <b>+AED {formatAED(RATES.bank)}</b>
          <small>The final decision rests with the bank.</small>
        </span>
      </label>
    </section>
  );
}

function Breakdown({ result }: { result: Estimate }) {
  const { state, order, goTo } = useCalculator();
  const [open, setOpen] = useState(false);
  const [barsIn, setBarsIn] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setBarsIn(true), 350);
    return () => window.clearTimeout(id);
  }, []);

  const renewalShare = Math.min(100, (result.renewal / result.total) * 100);

  return (
    <section aria-label="Itemised breakdown" className={styles.breakdown}>
      {/* Phones: collapsed under the number field; desktop always shows it. */}
      <button type="button" className={styles.breakToggle} aria-expanded={open} aria-controls="calcBreakdown" onClick={() => setOpen((o) => !o)}>
        {open ? "Hide the breakdown" : "See the breakdown"}
      </button>
      <div id="calcBreakdown" className={`${styles.breakBody} ${open ? styles.breakOpen : ""}`}>
        <div className={styles.sectionHead}>
          <span>Cost build-up</span>
          <small>First year</small>
        </div>
        <ol className={styles.build}>
          {result.lines.map((l, i) => (
            <li key={l.label} style={delay(i)}>
              <span>
                {l.label}
                {l.note ? <small>{l.note}</small> : null}
              </span>
              {l.text ? <b className={styles.muted}>{l.text}</b> : <b>AED {formatAED(l.amount ?? 0)}</b>}
            </li>
          ))}
          <li className={styles.sum} style={delay(result.lines.length)}>
            <span>First-year total</span>
            <b>
              {result.from ? "From AED " : "AED "}
              {formatAED(result.total)}
            </b>
          </li>
        </ol>

        <div className={styles.years}>
          <p className={styles.yearsHead}>Planning ahead</p>
          <div className={styles.yr}>
            <span>Year one</span>
            <div className={styles.yrBar}>
              <i style={{ width: barsIn ? "100%" : 0 }} />
            </div>
            <b>AED {formatAED(result.total)}</b>
          </div>
          <div className={styles.yr}>
            <span>Year two renewal</span>
            <div className={styles.yrBar}>
              <i className={styles.soft} style={{ width: barsIn ? `${renewalShare}%` : 0 }} />
            </div>
            <b>approx. AED {formatAED(result.renewal)}</b>
          </div>
        </div>

        <p className={styles.resNote}>
          Figures are Best Solution rate-card estimates in AED. They are indicative and subject to authority updates.
          Your advisor confirms the final figure in writing.
        </p>
        <div aria-label="Your answers. Select one to change it." className={styles.answers} role="group">
          {order.map((id) => (
            <button key={id} type="button" title="Change this answer" onClick={() => goTo(id)}>
              {labelFor(id, state.answers)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ResultView({ result }: { result: Estimate }) {
  const { state } = useCalculator();
  const answers = state.answers;
  return (
    <div className={styles.result}>
      <div className={styles.resultLayout}>
        <SummaryHead key={`h${state.resultKey}`} result={result} />
        <aside className={styles.contact}>
          <div className={styles.contactMark}>
            <Image src={SITE.mark} alt="Best Solution" width={240} height={112} />
          </div>
          <p className={styles.contactEyebrow}>Your next step</p>
          <h3>Get the itemised breakdown.</h3>
          <p className={styles.contactCopy}>Your advisor sends it on WhatsApp and talks it through with you. No obligation.</p>
          <div className={styles.capture}>
            <QuickCapture
              formId={FORM_ID}
              service={jurisdictionLabel(answers.jurisdiction) || "undecided"}
              payload={() => ({ answers, estimate: result })}
              summary={summaryText(answers, result)}
              tone="dark"
            />
          </div>
        </aside>
        <Breakdown key={`b${state.resultKey}`} result={result} />
      </div>
    </div>
  );
}
