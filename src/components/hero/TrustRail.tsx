import { CLAIMS } from "@/content/site";
import styles from "./Hero.module.css";

/* Counts render only once confirmed (content/site CLAIMS), as final values (no count-up); each tile keeps its place. */
const STATS = [
  { value: CLAIMS.zones, label: "Free zones compared" },
  { value: CLAIMS.emirates, label: "Emirates covered" },
  { value: "3", label: "Structures explained" },
];

export function TrustRail() {
  return (
    <div aria-label="What we advise on" className={styles.rail} role="group">
      <div className={styles.railIntro}>
        <span>Best Solution</span>
        <b>Built for clarity.</b>
        <small>Business Bay · Dubai</small>
      </div>
      <ul className={styles.trust}>
        {STATS.map((t) => (
          <li key={t.label}>
            {t.value && <b>{t.value}</b>}
            <span>{t.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
