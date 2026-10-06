"use client";

import { SITE, TRUST } from "@/content/site";
import { formatAED } from "@/lib/pricing";
import { useCountUp } from "@/components/ui/useCountUp";
import styles from "./Hero.module.css";

function Stat({ count, suffix, label }: { count: number; suffix: string; label: string }) {
  const value = useCountUp(count);
  return (
    <li>
      <b>
        {formatAED(value)}
        {suffix}
      </b>
      <span>{label}</span>
    </li>
  );
}

export function TrustRail() {
  return (
    <div aria-label="Best Solution credentials" className={styles.rail} role="group">
      <div className={styles.railIntro}>
        <span>Best Solution</span>
        <b>Built for clarity.</b>
        <small>Dubai · UAE · Since {SITE.founded}</small>
      </div>
      <ul className={styles.trust}>
        {TRUST.map((t) => (
          <Stat key={t.label} {...t} />
        ))}
      </ul>
    </div>
  );
}
