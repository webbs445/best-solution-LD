"use client";

import { useSyncExternalStore } from "react";

/*
  Estimate figures stay blurred until the visitor has sent their details in this visit. QuickCapture
  stores the server's signed lead reference (sessionStorage) and calls markLeadSent(); either unlocks.
  The blurred text is placeholder digits, so the real figure is not readable on the page before then.
  ponytail: the planner's prices still ship in the page's JavaScript; this hides them from view, not from a determined visitor.
*/

const LEAD_SENT_EVENT = "bs:lead-sent";
const REF_KEY = "bs_lead_ref";
// Also covers a lead saved without a reference, or storage being blocked.
let sentThisPage = false;

/** Called by QuickCapture once the API confirms the lead. */
export function markLeadSent() {
  sentThisPage = true;
  window.dispatchEvent(new Event(LEAD_SENT_EVENT));
}

const subscribe = (cb: () => void) => {
  window.addEventListener(LEAD_SENT_EVENT, cb);
  return () => window.removeEventListener(LEAD_SENT_EVENT, cb);
};
const snapshot = () => {
  if (sentThisPage) return true;
  try {
    return !!sessionStorage.getItem(REF_KEY);
  } catch {
    return false;
  }
};

/** True once this visit has sent a lead. */
export function useEstimateUnlocked() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}

/** `text` as written once unlocked; before that, the same shape with every digit replaced, blurred. */
export function LockedFigure({ text, unlocked }: { text: string; unlocked: boolean }) {
  if (unlocked) return <span className="lock-open">{text}</span>;
  return (
    <span className="lock-fig">
      <span aria-hidden="true">{text.replace(/\d/g, "8")}</span>
      <span className="sr-only">Shown after you send your details</span>
    </span>
  );
}
