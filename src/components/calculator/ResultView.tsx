"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { SITE } from "@/content/site";
import { useCalculator } from "./CalculatorProvider";
import { LeadForm, type LeadState } from "./LeadForm";
import { STEPS } from "@/content/calculator";
import { formatAED, maxResidents, pick, type Answers, type Estimate, type StepId } from "@/lib/pricing";
import { useCountUp } from "@/components/ui/useCountUp";
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
  if (id === "bank") return a.bank === "yes" ? "Bank assistance" : "No bank assistance";
  const opt = STEPS[id].options?.find((o) => o[0] === a[id]);
  return opt ? opt[1] : "";
}

const delay = (i: number): CSSProperties => ({ animationDelay: `${i * 140}ms` });

function Summary({ result }: { result: Estimate }) {
  const { state, order, goTo } = useCalculator();
  const total = useCountUp(result.total, { clientOnly: true });
  const [barsIn, setBarsIn] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    const id = window.setTimeout(() => setBarsIn(true), 350);
    return () => window.clearTimeout(id);
  }, []);

  const renewalShare = Math.min(100, (result.renewal / result.total) * 100);

  return (
    <section aria-label="Your estimate" className={styles.summary}>
      <div className={styles.resultKicker}>
        <span className={styles.resultDot} /> Calculation complete
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

      <div className={styles.divider} />
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
        Figures are Best Solution rate-card prices in AED. They are indicative and subject to authority updates. Your
        consultant confirms the final figure in writing.
      </p>
      <div aria-label="Your answers. Select one to change it." className={styles.answers} role="group">
        {order.map((id) => (
          <button key={id} type="button" title="Change this answer" onClick={() => goTo(id)}>
            {labelFor(id, state.answers)}
          </button>
        ))}
      </div>
    </section>
  );
}

export function ResultView({
  result,
  lead,
  setLead,
}: {
  result: Estimate;
  lead: LeadState;
  setLead: (updater: (prev: LeadState) => LeadState) => void;
}) {
  const { state } = useCalculator();
  return (
    <div className={styles.result}>
      <div className={styles.resultLayout}>
        <Summary key={state.resultKey} result={result} />
        <aside className={styles.contact}>
          <div className={styles.contactMark}>
            <Image src={SITE.mark} alt="Best Solution" width={240} height={112} />
          </div>
          <p className={styles.contactEyebrow}>Your next step</p>
          <h3>Get the exact figure in writing.</h3>
          <p className={styles.contactCopy}>
            Send your details and a Best Solution consultant can review the estimate with you before you commit.
          </p>
          <div className={styles.contactPoints}>
            <span>Written estimate</span>
            <span>Dedicated consultant</span>
            <span>No obligation</span>
          </div>
          <LeadForm answers={state.answers} result={result} lead={lead} setLead={setLead} />
        </aside>
      </div>
    </div>
  );
}
