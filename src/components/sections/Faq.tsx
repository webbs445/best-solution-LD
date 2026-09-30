import { FAQS } from "@/content/site";
import styles from "./Faq.module.css";

export function Faq() {
  return (
    <section className="block sec-warm" id="faq" aria-labelledby="faq-title">
      <div className={`wrap ${styles.split}`}>
        <div data-reveal="">
          <p className="section-kicker">Questions</p>
          <h2 id="faq-title">Frequently asked questions</h2>
          <p className="lede">Prefer to ask directly? A consultant is available Monday to Friday, 9am to 6pm.</p>
        </div>
        <div className={styles.faq} data-reveal="">
          {FAQS.map((f, i) => (
            <details key={f.q} open={i === 0}>
              <summary>
                {f.q}
                <i aria-hidden="true" />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
