import { ZONES } from "@/content/freezone";
import styles from "./Hero.module.css";

/* Plain facts about what we compare, shown as they are (no count-up, no unconfirmed claims: content/site CLAIMS). */
const STATS = [
  { value: String(ZONES.length), label: "Free zones compared" },
  { value: "7", label: "Emirates covered" },
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
            <b>{t.value}</b>
            <span>{t.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
