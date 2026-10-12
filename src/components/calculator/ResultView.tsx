"use client";

import { useEffect, useRef, useState } from "react";
import { useCalculator } from "./CalculatorProvider";
import { answerLabel } from "./answers";
import { STEPS } from "@/content/calculator";
import { jurisdictionLabel } from "@/lib/analytics";
import { FORM_ID } from "@/lib/lead";
import { RATES, formatAED, pick, type Answers, type Estimate } from "@/lib/pricing";
import { useCountUp } from "@/components/ui/useCountUp";
import { QuickCapture } from "@/components/ui/QuickCapture";
import { Scramble } from "@/components/ui/Scramble";
import { LOCK_ICON, UNLOCK_THANKS_MS, UnlockDialog } from "@/components/ui/UnlockDialog";
import { LockedFigure, useEstimateUnlocked } from "@/components/ui/LockedFigure";
import styles from "./Calculator.module.css";

/** The selections in words (and the figure once unlocked), for the WhatsApp message and the success card. */
function summaryText(a: Answers, r: Estimate, unlocked: boolean): string {
  const p = pick(a);
  const where = p && p.chosen ? p.opt.name : `${STEPS.jurisdiction.options?.find((o) => o[0] === a.jurisdiction)?.[1] ?? "UAE company"}, advisor to recommend`;
  const people = a.jurisdiction !== "offshore" && r.residents > 0 ? `, ${r.residents} ${r.residents === 1 ? "person" : "people"} with residency` : "";
  return `${where}${people}${unlocked ? `, ${r.from ? "from " : ""}AED ${formatAED(r.total)}` : ""}`;
}

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
  const [open, setOpen] = useState(false);
  // The figure appears once the popup has closed, so the count-up is seen.
  const revealed = unlocked && !open;

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Locked: the popup opens by itself a moment after the result appears (once; the button reopens it).
  useEffect(() => {
    if (unlocked) return;
    const t = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the result first shows
  }, []);

  return (
    <div className={styles.result}>
      <div className={styles.q}>
        <h3 ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
          {revealed ? "Here is your exact figure." : "Your estimate is ready."}
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
          {revealed ? (
            <UnlockedFigure key={`u${state.resultKey}`} result={result} />
          ) : (
            <>
              <Scramble className={`${styles.fig} ${styles.figLocked}`} />
              <span className={styles.lockPill}>
                <i>{LOCK_ICON}</i>
                Locked until you send your details
              </span>
              <button type="button" className={styles.unlockBtn} onClick={() => setOpen(true)}>
                Show my exact figure
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
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
                {l.text ? (
                  <b className={styles.muted}>{l.text}</b>
                ) : (
                  <b>
                    <LockedFigure text={`AED ${formatAED(l.amount ?? 0)}`} unlocked={revealed} />
                  </b>
                )}
              </li>
            ))}
            <li>
              <span>Year two renewal</span>
              <b>
                <LockedFigure text={`approx. AED ${formatAED(result.renewal)}`} unlocked={revealed} />
              </b>
            </li>
          </ol>
          <label className={styles.bankToggle}>
            <input type="checkbox" checked={answers.bank === "yes"} onChange={(e) => setBank(e.target.checked)} />
            <span>
              Add bank account help{revealed ? <b> +AED {formatAED(RATES.bank)}</b> : null}
              <small>The final decision rests with the bank.</small>
            </span>
          </label>
        </div>
      </section>

      <UnlockDialog open={open} onClose={() => setOpen(false)} sent={unlocked} intro="Send your details and it appears straight away. No obligation.">
        <QuickCapture
          formId={FORM_ID}
          service={jurisdictionLabel(answers.jurisdiction) || "undecided"}
          payload={() => ({ answers, estimate: result })}
          summary={summaryText(answers, result, unlocked)}
          tone="light"
          cta="Show my exact figure"
          onSent={() => window.setTimeout(() => setOpen(false), UNLOCK_THANKS_MS)}
          onDone={() => setOpen(false)}
        />
      </UnlockDialog>

      <p className={styles.resNote}>
        Figures are Best Solution rate-card estimates in AED. They are indicative and subject to authority updates. Your advisor confirms the
        final figure in writing.
      </p>
    </div>
  );
}
