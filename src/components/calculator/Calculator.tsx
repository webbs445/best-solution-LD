"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useCalculator } from "./CalculatorProvider";
import { QuizStep } from "./QuizStep";
import { ResultView } from "./ResultView";
import { answerLabel } from "./answers";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Calculator.module.css";

const two = (n: number) => String(n).padStart(2, "0");

/*
  The home cost calculator: a dark stage with one question at a time, then the result. No price is shown
  until the visitor sends their details (see ResultView).
*/
export function Calculator() {
  const { state, order, result } = useCalculator();
  const ref = useRef<HTMLDivElement>(null);

  const idx = Math.max(0, order.indexOf(state.stepId));
  const done = result ? order.length : idx;
  const label = result ? "Your estimate" : `Step ${two(idx + 1)} / ${two(order.length)}`;
  const answered = order.filter((id) => state.answers[id] !== undefined && (result || order.indexOf(id) < idx));

  /* Keep the calculator in view when a step change would otherwise leave its top off-screen. */
  useEffect(() => {
    if (state.navKey === 0 || !ref.current) return;
    if (ref.current.getBoundingClientRect().top < 0) {
      ref.current.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    }
  }, [state.navKey]);

  return (
    <div ref={ref} className={styles.calc} id="calculator">
      <div className={styles.glow} aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className={styles.top}>
        <h2>Cost calculator</h2>
        <span aria-live="polite">{label}</span>
      </div>
      <div className={styles.progress} aria-hidden="true" style={{ "--n": order.length } as CSSProperties}>
        {order.map((id, i) => (
          <span key={id}>
            <i style={{ width: i < done ? "100%" : i === done ? "45%" : "0%" }} />
          </span>
        ))}
      </div>
      {answered.length && !result ? (
        <ul className={styles.chips} aria-label="Your answers so far">
          {answered.map((id) => (
            <li key={id}>{answerLabel(id, state.answers)}</li>
          ))}
        </ul>
      ) : null}
      {result ? <ResultView result={result} /> : <QuizStep key={state.navKey} />}
    </div>
  );
}
