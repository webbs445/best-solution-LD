"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { cheapest, DATA, formatAED, type Jurisdiction } from "@/lib/pricing";
import { track } from "@/lib/analytics";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import { useCalculator } from "@/components/calculator/CalculatorProvider";
import { ArrowIcon } from "@/components/ui/Icons";
import styles from "./HeroCard.module.css";

type Answer = "uae" | "intl" | "offshore";

const svg = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

/* One question that points to a likely structure. The calculator and the consultant still decide. */
/* `from` overrides the rate card's lowest price where that option is too niche to headline. */
const OPTIONS: { key: Answer; label: string; icon: ReactNode; j: Jurisdiction; name: string; from?: number }[] = [
  {
    key: "uae",
    label: "UAE",
    j: "mainland",
    name: "Mainland",
    // The cheapest mainland entry is the AED 1,500 E-Trader licence, which few company setups qualify for.
    from: 13000,
    icon: (
      <svg {...svg}>
        <path d="M12 22s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
  {
    key: "intl",
    label: "International",
    j: "freezone",
    name: "Free zone",
    icon: (
      <svg {...svg}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
    ),
  },
  {
    key: "offshore",
    label: "Offshore holding",
    j: "offshore",
    name: "Offshore",
    icon: (
      <svg {...svg}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" />
      </svg>
    ),
  },
];

function QuickCheck() {
  const { startWithJurisdiction } = useCalculator();
  const [picked, setPicked] = useState<(typeof OPTIONS)[number] | null>(null);

  const choose = (o: (typeof OPTIONS)[number]) => {
    setPicked(o);
    track("hero_quick_check", { answer: o.key });
  };

  const seeCost = () => {
    if (!picked) return;
    startWithJurisdiction(picked.j, "hero_quick_check");
    document
      .getElementById("calculator")
      ?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  };

  const detail = picked && `Setup from AED ${formatAED(picked.from ?? cheapest(DATA[picked.j]).price)}`;

  return (
    <div className={`${styles.qc} ${picked ? styles.done : ""}`}>
      <div className={styles.qcHead}>
        <span className={styles.live}>
          <i aria-hidden="true" />
          Quick check
        </span>
        <span className={styles.chip}>1 tap</span>
      </div>
      <p className={styles.q} id="qc-question">
        How will your company operate?
      </p>
      <div className={styles.opts} role="group" aria-labelledby="qc-question">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            className={styles.opt}
            aria-pressed={picked?.key === o.key}
            onClick={() => choose(o)}
          >
            <span className={styles.ic}>{o.icon}</span>
            <span className={styles.optText}>{o.label}</span>
          </button>
        ))}
      </div>
      <div aria-live="polite">
        {picked && (
          <div className={styles.res} key={picked.key}>
            <div>
              <small>Often suited</small>
              <b>{picked.name}</b>
              <span>{detail}</span>
            </div>
            <button type="button" className={styles.go} onClick={seeCost}>
              See my cost <ArrowIcon />
            </button>
          </div>
        )}
      </div>
      <p className={styles.note}>
        {picked ? (
          "Indicative only. Your consultant confirms the right structure."
        ) : (
          <>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 15V5M5 10l5-5 5 5" />
            </svg>
            Tap an answer to see a suggested structure and cost
          </>
        )}
      </p>
    </div>
  );
}

/* Hero card: the copper logo wall from the About Us page as a photo band, the quick check below it. */
export function HeroCard() {
  return (
    <aside aria-label="Quick check: which UAE structure suits you" className={styles.card}>
      <div className={styles.photo} aria-hidden="true">
        <Image
          src="/images/about-office.webp"
          alt=""
          fill
          sizes="(max-width: 1020px) 560px, 520px"
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <div className={styles.top}>
        <span>BEST SOLUTION · DUBAI</span>
        <span>EST. 2014</span>
      </div>
      <div className={styles.copy}>
        <p className={styles.kicker}>THE FIRST DECISION</p>
        <h2>
          Structure
          <br />
          <em>before paperwork.</em>
        </h2>
        <QuickCheck />
      </div>
    </aside>
  );
}
