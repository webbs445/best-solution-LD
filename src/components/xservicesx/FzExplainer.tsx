"use client";

import { useEffect, useSyncExternalStore } from "react";
import { xsTrack } from "./store";

/*
  "What's the difference?" on the S3 free zone or mainland card. One open/closed state, two places for the text:
  from 768 px it opens inside the card in place of the short description (the card grows; its chip and link stay
  in view); on phones it opens as a full row under the tile pair, pushing the tiles below down. Escape closes it
  wherever focus is and puts focus back on the button.
*/
let open = false;
const listeners = new Set<() => void>();
const setOpen = (v: boolean) => ((open = v), listeners.forEach((l) => l()));
const useOpen = () =>
  useSyncExternalStore(
    (l) => (listeners.add(l), () => void listeners.delete(l)),
    () => open,
    () => false,
  );

const BTN = "xs-explain-btn";
const focusButton = () => (document.getElementById(BTN) as HTMLButtonElement | null)?.focus();

export function FzExplainButton() {
  const isOpen = useOpen();
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      focusButton();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);
  return (
    <button
      id={BTN}
      type="button"
      className="xs-explain-btn"
      aria-expanded={isOpen}
      aria-controls="xs-explain-card xs-explain-row"
      onClick={() => {
        if (!isOpen) xsTrack("xs_explainer_open", { location: "s3" });
        setOpen(!isOpen);
      }}
    >
      What&apos;s the difference?
    </button>
  );
}

function Text() {
  return (
    <>
      <p>
        <b>Free zone:</b> a business area with its own authority, often used for international trade and services.
      </p>
      <p>
        <b>Mainland:</b> trade directly across the UAE market.
      </p>
      <p>Which fits depends on who your customers are and what you do. We&apos;ll tell you in writing.</p>
      <button type="button" className="xs-explain-close" onClick={() => (setOpen(false), focusButton())}>
        Close
      </button>
    </>
  );
}

/** Inside the card (768 px and up): the explainer replaces the short description while open. */
export function FzExplainInCard({ what }: { what: string }) {
  const isOpen = useOpen();
  return isOpen ? (
    <div className="xs-explain-panel is-card" id="xs-explain-card">
      <Text />
    </div>
  ) : (
    <p className="d-only">{what}</p>
  );
}

/** Phones: a full-width row in the grid, right after the tile pair. */
export function FzExplainRow() {
  const isOpen = useOpen();
  return isOpen ? (
    <div className="xs-explain-panel is-row" id="xs-explain-row">
      <Text />
    </div>
  ) : null;
}
