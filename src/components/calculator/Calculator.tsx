"use client";

import { useEffect, useRef, useState } from "react";
import { useCalculator } from "./CalculatorProvider";
import { QuizStep } from "./QuizStep";
import { ResultView } from "./ResultView";
import { EMPTY_LEAD, type LeadState } from "./LeadForm";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Calculator.module.css";

export function Calculator() {
  const { state, order, result } = useCalculator();
  const [lead, setLead] = useState<LeadState>(EMPTY_LEAD);
  const ref = useRef<HTMLDivElement>(null);

  const idx = Math.max(0, order.indexOf(state.stepId));
  const label = result ? "Your estimate" : `Step ${idx + 1} of ${order.length}`;
  const progress = result ? 100 : (idx / order.length) * 100;

  /* Keep the calculator in view when a step change would otherwise leave its top off-screen. */
  useEffect(() => {
    if (state.navKey === 0 || !ref.current) return;
    if (ref.current.getBoundingClientRect().top < 0) {
      ref.current.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    }
  }, [state.navKey]);

  return (
    <div ref={ref} className={`${styles.calc} ${result ? styles.isResult : ""}`} id="calculator">
      <div className={styles.head}>
        <h2>Cost calculator</h2>
        <span aria-live="polite">{label}</span>
      </div>
      <div className={styles.bar} aria-hidden="true">
        <i style={{ width: `${progress}%` }} />
      </div>
      {result ? (
        <ResultView result={result} lead={lead} setLead={setLead} />
      ) : (
        <QuizStep key={state.navKey} />
      )}
    </div>
  );
}
