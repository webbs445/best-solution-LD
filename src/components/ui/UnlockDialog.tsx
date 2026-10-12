"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { REVIEW_ROWS } from "@/content/site";
import styles from "./UnlockDialog.module.css";

/*
  The "Unlock your exact figure" popup used by the home calculator and the free zone planner: a native dialog
  (focus stays inside, Escape closes), a centred card on desktop and a bottom sheet on phones. The page puts its
  details form inside; after sending, the form's thank-you shows and the page closes the popup after
  UNLOCK_THANKS_MS, then reveals its figures.
*/

/** How long the thank-you stays before the popup closes itself. */
export const UNLOCK_THANKS_MS = 4000;

/** A verified Google review shown with the form. */
const REVIEW = REVIEW_ROWS.flat().find((r) => r.name === "Hadi Hamedi");

export const LOCK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

interface Props {
  open: boolean;
  onClose: () => void;
  /** True once the details are sent: the heading gives way to the form's own thank-you. */
  sent: boolean;
  intro: string;
  /** The visitor's choices as small tags, e.g. the zone and team size. */
  tags?: string[];
  children: ReactNode;
}

export function UnlockDialog({ open, onClose, sent, intro, tags, children }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  // `open` drives the native dialog both ways; closing it any way (Escape, backdrop, X) reports back via onClose.
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (!open) {
      if (d.open) d.close();
      return;
    }
    if (!d.open) d.showModal();
    document.documentElement.classList.add(styles.noScroll);
    return () => document.documentElement.classList.remove(styles.noScroll);
  }, [open]);

  const close = () => dialog.current?.close();

  return (
    <dialog
      ref={dialog}
      className={styles.dlg}
      aria-labelledby="unlockTitle"
      onClick={(e) => e.target === e.currentTarget && close()}
      onClose={() => {
        document.documentElement.classList.remove(styles.noScroll);
        onClose();
      }}
    >
      {open ? (
        <div className={styles.card}>
          <button type="button" className={styles.close} aria-label="Close" onClick={close}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          {sent ? (
            <p id="unlockTitle" className={styles.soon}>
              Showing your figure in a moment…
            </p>
          ) : (
            <div className={styles.head}>
              <span className={styles.lock}>{LOCK_ICON}</span>
              <h3 id="unlockTitle">Unlock your exact figure</h3>
              <p>{intro}</p>
              {tags?.length ? (
                <ul className={styles.tags}>
                  {tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
          {children}
          {REVIEW ? (
            <figure className={styles.review}>
              <blockquote>&ldquo;{REVIEW.quote}&rdquo;</blockquote>
              <figcaption>
                {REVIEW.name}, {REVIEW.company}. Google review
              </figcaption>
            </figure>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
