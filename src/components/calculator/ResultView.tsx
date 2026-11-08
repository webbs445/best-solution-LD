"use client";

import { useEffect, useRef, useState } from "react";
import { useCalculator } from "./CalculatorProvider";
import { jurisdictionLabel } from "@/lib/analytics";
import { FORM_ID } from "@/lib/lead";
import { chosenOption, jurisdictionName, leadAnswers, planAnswerLabel, type PlanAnswers } from "@/lib/setupPlan";
import { QuickCapture } from "@/components/ui/QuickCapture";
import { UNLOCK_THANKS_MS, UnlockDialog } from "@/components/ui/UnlockDialog";
import styles from "./Calculator.module.css";

/* What the advisor covers, in the place the cost lines used to be. */
const COVERS = [
  ["Where to base the business", "Mainland, free zone or offshore, for your activity"],
  ["What to plan for in your budget", "Workspace, team size and yearly running costs"],
  ["Corporate tax and bookkeeping", "What applies to you from the first year"],
  ["Your next step", "Decided by you, with no obligation"],
] as const;

/** The choices in words, for the WhatsApp message and the success card. */
function summaryText(a: PlanAnswers): string {
  const where = chosenOption(a)?.name ?? `${jurisdictionName(a.jurisdiction)}, advisor to recommend`;
  return a.jurisdiction === "offshore" ? where : `${where}, ${planAnswerLabel("team", a).toLowerCase()}`;
}

export function ResultView() {
  const { state, order, goTo } = useCalculator();
  const answers = state.answers;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const pick = chosenOption(answers);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className={styles.result}>
      <div className={styles.q}>
        <h3 ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
          {sent ? "Your advisor will be in touch." : "Your shortlist is ready."}
        </h3>
        <div className={styles.changeRow} role="group" aria-label="Your answers. Select one to change it.">
          {order.map((id) => (
            <button key={id} type="button" title="Change this answer" onClick={() => goTo(id)}>
              {planAnswerLabel(id, answers)}
            </button>
          ))}
        </div>
      </div>

      <section className={styles.vault} aria-label="Your shortlist">
        <div className={styles.vaultMain}>
          <span className={styles.vaultLabel}>Your first choice</span>
          <p className={`${styles.fig} ${styles.figName}`}>{pick?.name ?? jurisdictionName(answers.jurisdiction)}</p>
          <p className={styles.basis}>
            {pick?.desc ? <b>{pick.desc}. </b> : null}
            {pick ? "Your advisor compares it with the alternatives for your activity." : "Your advisor suggests where to begin, for your activity."}
          </p>
          <button type="button" className={styles.unlockBtn} onClick={() => setOpen(true)}>
            {sent ? "Details sent" : "Send to an advisor"}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        <div className={styles.lines}>
          <ol>
            {COVERS.map(([label, note]) => (
              <li key={label}>
                <span>
                  {label}
                  <small>{note}</small>
                </span>
                <b className={styles.muted}>Covered</b>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <UnlockDialog open={open} onClose={() => setOpen(false)} sent={sent} intro="Send your details and an advisor will talk your shortlist through with you. No obligation.">
        <QuickCapture
          formId={FORM_ID}
          service={jurisdictionLabel(answers.jurisdiction) || "undecided"}
          payload={() => ({ answers: leadAnswers(answers) })}
          summary={summaryText(answers)}
          tone="light"
          cta="Send to an advisor"
          onSent={() => {
            setSent(true);
            window.setTimeout(() => setOpen(false), UNLOCK_THANKS_MS);
          }}
          onDone={() => setOpen(false)}
        />
      </UnlockDialog>

      <p className={styles.resNote}>
        Your shortlist is where the conversation begins. Your advisor confirms what suits your exact activity.
      </p>
    </div>
  );
}
