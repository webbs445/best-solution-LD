import { ConsultForm } from "@/components/consult/ConsultForm";
import { CheckIcon } from "@/components/ui/Icons";
import { FORM_ID } from "@/lib/lead";
import styles from "./CalculatorSection.module.css";

const POINTS = [
  "Where to base your business: mainland, free zone or offshore",
  "What to think about for your activity",
  "What to budget for, so there are fewer surprises later",
  "Office options, from a flexi desk to a private office",
];

/* Replaces the old cost calculator. Keeps id "calculator" (anchors, /calculator rewrite) and FORM_ID for reporting. */
export function AdviceSection() {
  return (
    <section className={styles.stage} id="calculator" aria-labelledby="calculator-title">
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.intro} data-reveal="">
          <p className="eyebrow">Plan with an advisor</p>
          <h2 id="calculator-title">Talk your plans through with an advisor.</h2>
          <p className={styles.lede}>
            Tell us what you have in mind. Your advisor reviews it with you and explains your options in plain terms,
            so you can decide your next step.
          </p>
          <ul className={styles.points}>
            {POINTS.map((p) => (
              <li key={p}>
                <CheckIcon />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.card}>
          <h3>Book a consultation</h3>
          <p>In person in Business Bay, or by video call.</p>
          <ConsultForm formId={FORM_ID} formType="calculator" idPrefix="home" />
        </div>
      </div>
    </section>
  );
}
