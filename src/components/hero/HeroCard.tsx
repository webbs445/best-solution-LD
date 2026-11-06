import Image from "next/image";
import { CheckIcon } from "@/components/ui/Icons";
import styles from "./HeroCard.module.css";

const COVERS = [
  "Mainland, free zone or offshore: which could fit your plans",
  "What to think about for your activity",
  "What to budget for",
  "Your next steps, in plain terms",
];

/* Hero card: an office photo band, then what a consultation covers. */
export function HeroCard() {
  return (
    <aside aria-label="What a consultation covers" className={styles.card}>
      <div className={styles.photo} aria-hidden="true">
        <Image
          src="/images/why-consultation.webp"
          alt=""
          fill
          sizes="(max-width: 1020px) 560px, 520px"
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <div className={styles.top}>
        <span>BEST SOLUTION · DUBAI</span>
        <span>BUSINESS BAY</span>
      </div>
      <div className={styles.copy}>
        <p className={styles.kicker}>YOUR CONSULTATION</p>
        <h2>
          Clear advice,
          <br />
          <em>before you decide.</em>
        </h2>
        <div className={styles.qc}>
          <p className={styles.q}>What a consultation covers</p>
          <ul className={styles.list}>
            {COVERS.map((c) => (
              <li key={c}>
                <CheckIcon />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
