"use client";

import { useCalculator } from "./CalculatorProvider";
import { CtaLink } from "@/components/ui/CtaLink";
import { formatAED } from "@/lib/pricing";
import styles from "./MobileBar.module.css";

/** Sticky bottom bar on phones: an invitation before the estimate, the figure after it. */
export function MobileBar() {
  const { result } = useCalculator();
  return (
    <div className={styles.bar}>
      <div aria-live="polite">
        <span>{result ? (result.from ? "Your estimate, from" : "Your estimate") : "Setup cost estimate"}</span>
        <b>{result ? `AED ${formatAED(result.total)}` : "A few short questions"}</b>
      </div>
      <CtaLink
        className="btn btn-primary btn-sm"
        href={result ? "#leadForm" : "#calculator"}
        location={result ? "LP Mobile Bar — Get It in Writing" : "LP Mobile Bar — Start"}
      >
        {result ? "Get it in writing" : "Start"}
      </CtaLink>
    </div>
  );
}
