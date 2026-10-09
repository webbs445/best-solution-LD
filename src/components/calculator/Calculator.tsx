"use client";

import { useEffect, useRef } from "react";
import { useCalculator } from "./CalculatorProvider";
import { QuizStep } from "./QuizStep";
import { ResultView } from "./ResultView";
import { estimateRange, formatAED } from "@/lib/pricing";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Calculator.module.css";

export function Calculator() {
  const { state, order, result } = useCalculator();
  const ref = useRef<HTMLDivElement>(null);

  const idx = Math.max(0, order.indexOf(state.stepId));
  const label = result ? "Your estimate" : `Step ${idx + 1} of ${order.length}`;
  const progress = result ? 100 : (idx / order.length) * 100;
  const range = result ? null : estimateRange(state.answers);

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
        <ResultView result={result} />
      ) : (
        <>
          {range ? (
            <p className={styles.range} aria-live="polite">
              <span>Estimate so far</span>
              <b>
                {range.low === range.high ? `AED ${formatAED(range.low)}` : `AED ${formatAED(range.low)} – ${formatAED(range.high)}`}
              </b>
            </p>
          ) : null}
          <QuizStep key={state.navKey} />
        </>
      )}
    </div>
  );
}
