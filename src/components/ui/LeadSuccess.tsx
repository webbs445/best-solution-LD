"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { SITE } from "@/content/site";
import { WhatsAppIcon } from "@/components/ui/Icons";
import styles from "./LeadForm.module.css";

/*
  The "Request received" card shown after a lead is saved: an animated check, a thank-you line, an
  optional summary chip, the next steps, a Done button (when given) and a WhatsApp shortcut.
  Focus moves to the heading so screen readers and keyboard users land on the confirmation.
*/
export function LeadSuccess({
  firstName,
  message,
  summary,
  steps,
  onDone,
  title = "Request received",
}: {
  firstName?: string;
  /** Sentence after "Thank you, <name>." */
  message: string;
  summary?: string;
  steps: string[];
  onDone?: () => void;
  title?: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);

  return (
    <div className={styles.success}>
      <div className={styles.badge} aria-hidden="true">
        <span className={styles.ring} />
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} className={styles.spark} style={{ "--a": `${i * 45}deg` } as CSSProperties} />
        ))}
        <svg viewBox="0 0 52 52">
          <circle className={styles.circle} cx="26" cy="26" r="24" />
          <path className={styles.tick} d="M15 27.5l7 7 15-16" />
        </svg>
      </div>
      <h3 ref={heading} tabIndex={-1} className={styles.title}>
        {title}
      </h3>
      <p className={styles.lede} role="status">
        Thank you{firstName ? `, ${firstName}` : ""}. {message}
      </p>
      {summary && <p className={styles.chip}>{summary}</p>}
      <ol className={styles.steps}>
        {steps.map((s, i) => (
          <li key={s} style={{ "--i": i } as CSSProperties}>
            <b>{i + 1}</b>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <div className={styles.actions}>
        {onDone && (
          <button type="button" className="btn btn-primary" onClick={onDone}>
            Done
          </button>
        )}
        <a className={styles.wa} href={SITE.whatsapp} target="_blank" rel="noopener">
          <WhatsAppIcon />
          Chat on WhatsApp now
        </a>
      </div>
    </div>
  );
}
