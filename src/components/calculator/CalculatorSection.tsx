import { Calculator } from "./Calculator";
import styles from "./CalculatorSection.module.css";

export function CalculatorSection() {
  return (
    <section className={styles.stage} id="calculator-stage" aria-labelledby="calculator-title">
      <div className="wrap">
        <div className={styles.intro} data-reveal="">
          <div>
            <p className="eyebrow">Your company, clearly costed</p>
            <h2 id="calculator-title">Build your UAE company estimate.</h2>
            <p className={styles.lede}>
              Answer a few short questions to see your likely first-year cost. Your consultant then confirms the exact
              figure in writing.
            </p>
          </div>
          <div className={styles.note}>
            <span>NO OBLIGATION</span>
            <b>Clear before you commit.</b>
            <small>Indicative estimate · final figure confirmed by your consultant</small>
          </div>
        </div>
        <div className={styles.frame}>
          <Calculator />
        </div>
      </div>
    </section>
  );
}
