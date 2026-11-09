import { CLAIMS } from "@/content/site";
import { Calculator } from "./Calculator";
import styles from "./CalculatorSection.module.css";

export function CalculatorSection() {
  return (
    <section className={styles.stage} id="calculator-stage" aria-labelledby="calculator-title">
      <div className="wrap">
        <div className={styles.intro} data-reveal="">
          <div>
            <p className="eyebrow">Plan with an advisor</p>
            <h2 id="calculator-title">Plan your UAE company structure.</h2>
            <p className={styles.lede}>
              Answer a few short questions to build a shortlist. An advisor then talks it through with you and explains
              your options in plain terms.
            </p>
          </div>
          <div className={styles.note}>
            <span>NO OBLIGATION</span>
            <b>Clear before you commit.</b>
            <small>{CLAIMS.writtenFees ? "Advice only · any fees confirmed in writing" : "Advice only · in plain terms"}</small>
          </div>
        </div>
        <div className={styles.frame}>
          <Calculator />
        </div>
      </div>
    </section>
  );
}
