"use client";

import { useEffect, useRef } from "react";
import { REVIEW_ROWS } from "@/content/site";
import { useCalculator } from "./CalculatorProvider";
import { Scramble } from "./Scramble";
import { answerLabel } from "./answers";
import { STEPS } from "@/content/calculator";
import { jurisdictionLabel } from "@/lib/analytics";
import { FORM_ID } from "@/lib/lead";
import { RATES, formatAED, pick, type Answers, type Estimate } from "@/lib/pricing";
import { useCountUp } from "@/components/ui/useCountUp";
import { QuickCapture } from "@/components/ui/QuickCapture";
import { LockedFigure, useEstimateUnlocked } from "@/components/ui/LockedFigure";
import styles from "./Calculator.module.css";

/** The selections in words (and the figure once unlocked), for the WhatsApp message and the success card. */
function summaryText(a: Answers, r: Estimate, unlocked: boolean): string {
  const p = pick(a);
  const where = p && p.chosen ? p.opt.name : `${STEPS.jurisdiction.options?.find((o) => o[0] === a.jurisdiction)?.[1] ?? "UAE company"}, advisor to recommend`;
  const people = a.jurisdiction !== "offshore" && r.residents > 0 ? `, ${r.residents} ${r.residents === 1 ? "person" : "people"} with residency` : "";
  return `${where}${people}${unlocked ? `, ${r.from ? "from " : ""}AED ${formatAED(r.total)}` : ""}`;
}

/** A verified Google review shown with the form. */
const NEAR_FORM_REVIEW = REVIEW_ROWS.flat().find((r) => r.name === "Hadi Hamedi");

const LOCK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

/* Counts up to the real figure when it is unlocked. */
function UnlockedFigure({ result }: { result: Estimate }) {
  const total = useCountUp(result.total, { clientOnly: true, duration: 1100 });
  return (
    <>
      <p className={styles.fig}>
        <small>{result.from ? "From AED" : "AED"}</small>
        {formatAED(total)}
      </p>
      <span className={styles.unlocked}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
        Unlocked
      </span>
      <span className={styles.shine} aria-hidden="true" />
    </>
  );
}

export function ResultView({ result }: { result: Estimate }) {
  const { state, order, goTo, setBank } = useCalculator();
  const answers = state.answers;
  const unlocked = useEstimateUnlocked();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className={styles.result}>
      <div className={styles.q}>
        <h3 ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
          {unlocked ? "Here is your exact figure." : "Your estimate is ready."}
        </h3>
        <div className={styles.changeRow} role="group" aria-label="Your answers. Select one to change it.">
          {order.map((id) => (
            <button key={id} type="button" title="Change this answer" onClick={() => goTo(id)}>
              {answerLabel(id, answers)}
            </button>
          ))}
        </div>
      </div>

      <section className={styles.vault} aria-label="Your estimate">
        <div className={styles.vaultMain}>
          <span className={styles.vaultLabel}>Your first-year company cost</span>
          {unlocked ? (
            <UnlockedFigure key={`u${state.resultKey}`} result={result} />
          ) : (
            <>
              <Scramble className={`${styles.fig} ${styles.figLocked}`} />
              <span className={styles.lockPill}>
                <i>{LOCK}</i>
                Locked. Send your details below to reveal it.
              </span>
            </>
          )}
          <p className={styles.basis}>
            <b>{result.name}</b>
            {result.basis ? `. ${result.basis}.` : null}
          </p>
        </div>

        <div className={styles.lines}>
          <ol>
            {result.lines.map((l) => (
              <li key={l.label}>
                <span>
                  {l.label}
                  {l.note ? <small>{l.note}</small> : null}
                </span>
                {l.text ? <b className={styles.muted}>{l.text}</b> : <b><LockedFigure text={`AED ${formatAED(l.amount ?? 0)}`} unlocked={unlocked} /></b>}
              </li>
            ))}
            <li>
              <span>Year two renewal</span>
              <b>
                <LockedFigure text={`approx. AED ${formatAED(result.renewal)}`} unlocked={unlocked} />
              </b>
            </li>
          </ol>
          <label className={styles.bankToggle}>
            <input type="checkbox" checked={answers.bank === "yes"} onChange={(e) => setBank(e.target.checked)} />
            <span>
              Add bank account help{unlocked ? <b> +AED {formatAED(RATES.bank)}</b> : null}
              <small>The final decision rests with the bank.</small>
            </span>
          </label>
        </div>
      </section>

      <div className={styles.sheet}>
        {unlocked ? null : (
          <div className={styles.sheetHead}>
            <h3>Unlock your exact figure</h3>
            <p>It appears above straight away. No obligation.</p>
          </div>
        )}
        <QuickCapture
          formId={FORM_ID}
          service={jurisdictionLabel(answers.jurisdiction) || "undecided"}
          payload={() => ({ answers, estimate: result })}
          summary={summaryText(answers, result, unlocked)}
          tone="light"
          cta="Show my exact figure"
        />
        {NEAR_FORM_REVIEW ? (
          <figure className={styles.review}>
            <blockquote>&ldquo;{NEAR_FORM_REVIEW.quote}&rdquo;</blockquote>
            <figcaption>
              {NEAR_FORM_REVIEW.name}, {NEAR_FORM_REVIEW.company}. Google review
            </figcaption>
          </figure>
        ) : null}
      </div>

      <p className={styles.resNote}>
        Figures are Best Solution rate-card estimates in AED. They are indicative and subject to authority updates. Your advisor confirms the
        final figure in writing.
      </p>
    </div>
  );
}
