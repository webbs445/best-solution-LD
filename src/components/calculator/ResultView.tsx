"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { REVIEW_ROWS, SITE } from "@/content/site";
import { useCalculator } from "./CalculatorProvider";
import { STEPS } from "@/content/calculator";
import { jurisdictionLabel } from "@/lib/analytics";
import { FORM_ID } from "@/lib/lead";
import { RATES, formatAED, maxResidents, pick, resultBand, type Answers, type Estimate, type StepId } from "@/lib/pricing";
import { useCountUp } from "@/components/ui/useCountUp";
import { QuickCapture } from "@/components/ui/QuickCapture";
import { LockedFigure, useEstimateUnlocked } from "@/components/ui/LockedFigure";
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

const bandText = (r: Estimate) => {
  const { low, high } = resultBand(r.total);
  return `AED ${formatAED(low)} to ${formatAED(high)}`;
};

/** The selections and estimate in words, for the WhatsApp message and the success card (the band until unlocked). */
function summaryText(a: Answers, r: Estimate, unlocked: boolean): string {
  const p = pick(a);
  const where = p && p.chosen ? p.opt.name : `${STEPS.jurisdiction.options?.find((o) => o[0] === a.jurisdiction)?.[1] ?? "UAE company"}, advisor to recommend`;
  const people = a.jurisdiction !== "offshore" && r.residents > 0 ? `, ${r.residents} ${r.residents === 1 ? "person" : "people"} with residency` : "";
  return `${where}${people}, ${unlocked || r.from ? `${r.from ? "from " : ""}AED ${formatAED(r.total)}` : bandText(r)}`;
}

/** A verified Google review shown beside the form. */
const NEAR_FORM_REVIEW = REVIEW_ROWS.flat().find((r) => r.name === "Hadi Hamedi");

const delay = (i: number): CSSProperties => ({ animationDelay: `${i * 140}ms` });

/* The figure first: on phones this, then the number field, sit together on one screen. */
function SummaryHead({ result, unlocked }: { result: Estimate; unlocked: boolean }) {
  const { state, setBank } = useCalculator();
  const total = useCountUp(result.total, { clientOnly: true });
  const band = resultBand(result.total);
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
      {/* A "From" figure is already a starting price, not the exact one, so it stays as it is. */}
      {unlocked || result.from ? (
        <p className={styles.resTotal}>
          <small>{result.from ? "From AED" : "AED"}</small>
          <span>{formatAED(total)}</span>
        </p>
      ) : (
        <>
          <p className={`${styles.resTotal} ${styles.resBand}`}>
            <small>AED</small>
            <span>{`${formatAED(band.low)} – ${formatAED(band.high)}`}</span>
          </p>
          <p className={styles.resExact}>
            Your exact figure: <LockedFigure text={`AED ${formatAED(result.total)}`} unlocked={false} />
          </p>
        </>
      )}
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

function Breakdown({ result, unlocked }: { result: Estimate; unlocked: boolean }) {
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
              {l.text ? <b className={styles.muted}>{l.text}</b> : <b><LockedFigure text={`AED ${formatAED(l.amount ?? 0)}`} unlocked={unlocked} /></b>}
            </li>
          ))}
          <li className={styles.sum} style={delay(result.lines.length)}>
            <span>First-year total</span>
            <b>
              <LockedFigure text={`${result.from ? "From AED " : "AED "}${formatAED(result.total)}`} unlocked={unlocked} />
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
            <b><LockedFigure text={`AED ${formatAED(result.total)}`} unlocked={unlocked} /></b>
          </div>
          <div className={styles.yr}>
            <span>Year two renewal</span>
            <div className={styles.yrBar}>
              <i className={styles.soft} style={{ width: barsIn ? `${renewalShare}%` : 0 }} />
            </div>
            <b>
              approx. <LockedFigure text={`AED ${formatAED(result.renewal)}`} unlocked={unlocked} />
            </b>
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
  const unlocked = useEstimateUnlocked();
  return (
    <div className={styles.result}>
      <div className={styles.resultLayout}>
        <SummaryHead key={`h${state.resultKey}`} result={result} unlocked={unlocked} />
        <aside className={styles.contact}>
          <div className={styles.contactMark}>
            <Image src={SITE.mark} alt="Best Solution" width={240} height={112} />
          </div>
          <p className={styles.contactEyebrow}>Your next step</p>
          {unlocked ? (
            <h3>Your exact figure is shown.</h3>
          ) : (
            <>
              <h3>See your exact figure.</h3>
              <p className={styles.contactCopy}>
                Send your details to show the exact figure and itemised breakdown here. Your advisor also sends it on WhatsApp and talks
                it through with you. No obligation.
              </p>
            </>
          )}
          <div className={styles.capture}>
            <QuickCapture
              formId={FORM_ID}
              service={jurisdictionLabel(answers.jurisdiction) || "undecided"}
              payload={() => ({ answers, estimate: result })}
              summary={summaryText(answers, result, unlocked)}
              tone="dark"
            />
          </div>
          {NEAR_FORM_REVIEW ? (
            <figure className={styles.nearReview}>
              <blockquote>&ldquo;{NEAR_FORM_REVIEW.quote}&rdquo;</blockquote>
              <figcaption>
                {NEAR_FORM_REVIEW.name}, {NEAR_FORM_REVIEW.company}. Google review
              </figcaption>
            </figure>
          ) : null}
        </aside>
        <Breakdown key={`b${state.resultKey}`} result={result} unlocked={unlocked} />
      </div>
    </div>
  );
}
