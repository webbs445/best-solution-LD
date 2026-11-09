import { CLAIMS, statTile } from "@/content/site";
import styles from "./Hero.module.css";

/* A confirmed claim fills the number slot as a final value (no count-up); until then plain text (content/site statTile). */
const STATS = [statTile(CLAIMS.zones, "Free zones compared", "office"), statTile(CLAIMS.emirates, "Emirates covered", "meet"), statTile(null, "", "explain")];

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
