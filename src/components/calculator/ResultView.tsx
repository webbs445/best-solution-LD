"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { REVIEW_ROWS } from "@/content/site";
import { useCalculator } from "./CalculatorProvider";
import { Scramble } from "./Scramble";
import { answerLabel } from "./answers";
import { STEPS } from "@/content/calculator";
import { jurisdictionLabel } from "@/lib/analytics";
import { FORM_ID } from "@/lib/lead";
import {
  RATES,
  formatAED,
  pick,
  type Answers,
  type Estimate,
} from "@/lib/pricing";
import { useCountUp } from "@/components/ui/useCountUp";
import { QuickCapture } from "@/components/ui/QuickCapture";
import {
  LockedFigure,
  useEstimateUnlocked,
} from "@/components/ui/LockedFigure";
import styles from "./Calculator.module.css";

/** The selections in words (and the figure once unlocked), for the WhatsApp message and the success card. */
function summaryText(a: Answers, r: Estimate, unlocked: boolean): string {
  const p = pick(a);
  const where =
    p && p.chosen
      ? p.opt.name
      : `${STEPS.jurisdiction.options?.find((o) => o[0] === a.jurisdiction)?.[1] ?? "UAE company"}, advisor to recommend`;
  const people =
    a.jurisdiction !== "offshore" && r.residents > 0
      ? `, ${r.residents} ${r.residents === 1 ? "person" : "people"} with residency`
      : "";
  return `${where}${people}${unlocked ? `, ${r.from ? "from " : ""}AED ${formatAED(r.total)}` : ""}`;
}

/** A verified Google review shown with the form. */
const NEAR_FORM_REVIEW = REVIEW_ROWS.flat().find(
  (r) => r.name === "Hadi Hamedi",
);

const LOCK = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
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
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
        Unlocked
      </span>
      <span className={styles.shine} aria-hidden="true" />
    </>
  );
}

/*
  The details form in a popup (native dialog: focus stays inside, Escape closes). After sending, the thank-you
  shows for a moment, then it closes by itself and the figure is revealed behind it.
*/
function UnlockDialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  // `open` drives the native dialog both ways; closing it any way (Escape, backdrop, X) reports back via onClose.
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (!open) {
      if (d.open) d.close();
      return;
    }
    if (!d.open) d.showModal();
    document.documentElement.classList.add(styles.noScroll);
    return () => document.documentElement.classList.remove(styles.noScroll);
  }, [open]);

  const close = () => dialog.current?.close();

  return (
    <dialog
      ref={dialog}
      className={styles.dlg}
      aria-labelledby="unlockTitle"
      onClick={(e) => e.target === e.currentTarget && close()}
      onClose={() => {
        document.documentElement.classList.remove(styles.noScroll);
        onClose();
      }}
    >
      {open ? (
        <div className={styles.dlgCard}>
          <button
            type="button"
            className={styles.dlgClose}
            aria-label="Close"
            onClick={close}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}

/** How long the thank-you stays before the popup closes itself. */
const THANKS_MS = 4000;

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
        <div
          className={styles.changeRow}
          role="group"
          aria-label="Your answers. Select one to change it."
        >
          {order.map((id) => (
            <button
              key={id}
              type="button"
              title="Change this answer"
              onClick={() => goTo(id)}
            >
              {answerLabel(id, answers)}
            </button>
          ))}
        </div>
      </div>

      <section className={styles.vault} aria-label="Your estimate">
        <div className={styles.vaultMain}>
          <span className={styles.vaultLabel}>
            Your first-year company cost
          </span>
          {revealed ? (
            <UnlockedFigure key={`u${state.resultKey}`} result={result} />
          ) : (
            <>
              <Scramble className={`${styles.fig} ${styles.figLocked}`} />
              <span className={styles.lockPill}>
                <i>{LOCK}</i>
                Locked until you send your details
              </span>
              <button
                type="button"
                className={styles.unlockBtn}
                onClick={() => setOpen(true)}
              >
                Show my exact figure
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
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
                    <LockedFigure
                      text={`AED ${formatAED(l.amount ?? 0)}`}
                      unlocked={revealed}
                    />
                  </b>
                )}
              </li>
            ))}
            <li>
              <span>Year two renewal</span>
              <b>
                <LockedFigure
                  text={`approx. AED ${formatAED(result.renewal)}`}
                  unlocked={revealed}
                />
              </b>
            </li>
          </ol>
          <label className={styles.bankToggle}>
            <input
              type="checkbox"
              checked={answers.bank === "yes"}
              onChange={(e) => setBank(e.target.checked)}
            />
            <span>
              Add bank account help
              {revealed ? <b> +AED {formatAED(RATES.bank)}</b> : null}
              <small>The final decision rests with the bank.</small>
            </span>
          </label>
        </div>
      </section>

      <UnlockDialog open={open} onClose={() => setOpen(false)}>
        <>
          {/* Once sent, the form's own thank-you takes over; the popup then closes by itself. */}
          {unlocked ? (
            <p id="unlockTitle" className={styles.dlgSoon}>
              Showing your figure in a moment…
            </p>
          ) : (
            <div className={styles.dlgHead}>
              <span className={styles.dlgLock}>{LOCK}</span>
              <h3 id="unlockTitle">Unlock your exact figure</h3>
              <p>Send your details and it appears straight away. No obligation.</p>
            </div>
          )}
          <QuickCapture
            formId={FORM_ID}
            service={jurisdictionLabel(answers.jurisdiction) || "undecided"}
            payload={() => ({ answers, estimate: result })}
            summary={summaryText(answers, result, unlocked)}
            tone="light"
            cta="Show my exact figure"
            onSent={() => window.setTimeout(() => setOpen(false), THANKS_MS)}
            onDone={() => setOpen(false)}
          />
          {NEAR_FORM_REVIEW ? (
            <figure className={styles.review}>
              <blockquote>&ldquo;{NEAR_FORM_REVIEW.quote}&rdquo;</blockquote>
              <figcaption>
                {NEAR_FORM_REVIEW.name}, {NEAR_FORM_REVIEW.company}. Google
                review
              </figcaption>
            </figure>
          ) : null}
        </>
      </UnlockDialog>

      <p className={styles.resNote}>
        Figures are Best Solution rate-card estimates in AED. They are
        indicative and subject to authority updates. Your advisor confirms the
        final figure in writing.
      </p>
    </div>
  );
}
