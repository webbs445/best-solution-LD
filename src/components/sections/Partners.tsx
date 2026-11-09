import { ZONES } from "@/content/freezone";
import { Marquee } from "@/components/ui/Marquee";
import styles from "./Partners.module.css";

/* Zones we compare, as text tiles in the same moving strip. No authority logos (Google Ads policy on implied affiliation). */
export function Partners() {
  return (
    <section className={styles.partners} aria-labelledby="partners-title">
      <div className={`wrap ${styles.head}`} data-reveal="">
        <div>
          <h2 id="partners-title">Free zones and jurisdictions we advise on</h2>
          <p className={styles.note}>We are a private consultancy and not affiliated with any of them.</p>
        </div>
        <p>Mainland, free zone and offshore structures across the UAE.</p>
      </div>
      <Marquee speed={55}>
        {(copy) => (
          <ul className={styles.row} aria-hidden={copy || undefined}>
            {ZONES.map((z) => (
              <li key={z.id}>
                <span className={styles.name}>
                  <b>{z.short[0]}</b>
                  <small>{z.emirate}</small>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Marquee>
    </section>
  );
}
