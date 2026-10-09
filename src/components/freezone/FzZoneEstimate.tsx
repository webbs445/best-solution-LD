"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { ZONE_BY_ID } from "@/content/freezone";
import { cleanPlanner, maxResidents, plannerEstimate } from "@/lib/freezone";
import { formatAED } from "@/lib/pricing";
import { QuickCapture } from "@/components/ui/QuickCapture";
import { LockedFigure, useEstimateUnlocked } from "@/components/ui/LockedFigure";
import { FZ_FORM_ID } from "@/lib/lead";
import { usePlanner } from "./PlannerProvider";
import { ZoneLogo } from "./ZoneLogo";
import styles from "./FzZoneEstimate.module.css";

/*
  "Get My Estimate" popup with the zone filled in: the (blurred) first-year figure and one form for name,
  WhatsApp and email, posted to /api/lead. Once sent, the figures unlock in place.
  - From a zone card or the comparison: one question (people needing residency) and a link to the full planner.
  - From the planner (fromPlanner): the planner's own choices, and the popup closes itself after sending
    so the visitor lands back on the planner with its figures revealed.
*/
export function FzZoneEstimate({
  zoneId,
  onClose,
  fromPlanner = false,
}: {
  zoneId: string | null;
  onClose: () => void;
  fromPlanner?: boolean;
}) {
  const { state, complete, trackStep, goPlanner } = usePlanner();
  const dialog = useRef<HTMLDialogElement>(null);
  const zone = zoneId ? ZONE_BY_ID[zoneId] : null;
  // Mounted per zone (keyed by the parent), so this starts from the planner's residency count each time.
  const [res, setRes] = useState(() => (zone ? Math.min(state.res, maxResidents(zone)) : 0));
  const [sent, setSent] = useState(false);
  // Figures stay blurred until the visitor sends their details (here or in the planner drawer).
  const unlocked = useEstimateUnlocked();

  const input = useMemo(() => (zone ? cleanPlanner({ ...state, zone: zone.id, res }) : null), [state, zone, res]);
  const est = useMemo(() => (input ? plannerEstimate(input) : null), [input]);

  // Open the native dialog when a zone is set (focus trap, Escape to close, top layer).
  useEffect(() => {
    const d = dialog.current;
    if (!d || !zone || d.open) return;
    d.showModal();
    document.documentElement.classList.add(styles.locked);
    return () => document.documentElement.classList.remove(styles.locked);
  }, [zone]);

  // The estimate was requested: one calculator_complete per distinct figure (deduplicated by the provider).
  useEffect(() => {
    if (input && est) complete(input, est, fromPlanner ? "planner" : "zone_card");
  }, [input, est, complete, fromPlanner]);

  // From the planner: a moment to read the thank-you, then back to the planner with the figures revealed.
  useEffect(() => {
    if (!sent || !fromPlanner) return;
    const t = window.setTimeout(() => dialog.current?.close(), 1600);
    return () => window.clearTimeout(t);
  }, [sent, fromPlanner]);

  const onDialogClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) dialog.current?.close();
  };

  const mx = zone ? maxResidents(zone) : 0;
  const stepRes = (d: 1 | -1) => {
    trackStep("residency (zone popup)", d > 0 ? "plus" : "minus");
    setRes((r) => Math.max(0, Math.min(mx, r + d)));
  };

  const openPlanner = () => {
    if (!zone) return;
    dialog.current?.close();
    goPlanner(zone.id, res);
  };

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="ze-title"
      onClick={onDialogClick}
      onClose={() => {
        document.documentElement.classList.remove(styles.locked);
        onClose();
      }}
    >
      {zone && est && input && (
        <div className={styles.card}>
          <button type="button" className={styles.close} aria-label="Close" onClick={() => dialog.current?.close()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>

          <div className={styles.head}>
            <ZoneLogo zone={zone} size="zl-sug" />
            <div>
              <h3 id="ze-title">{sent ? "Your estimate" : "Get your estimate in writing"}</h3>
              <p>{zone.name}</p>
            </div>
          </div>

          {/* Stays on screen after sending, so the figure unlocks in place. */}
          <div className={styles.summary}>
            {fromPlanner ? (
              <div className={styles.people}>
                <span>
                  {input.res} {input.res === 1 ? "person" : "people"} with residency · {input.sh} shareholder
                  {input.sh > 1 ? "s" : ""} · {input.na} activit{input.na > 1 ? "ies" : "y"}
                </span>
              </div>
            ) : (
              <div className={styles.people}>
                <span>People needing residency</span>
                <div className={styles.stepper} role="group" aria-label="People needing residency">
                  <button type="button" aria-label="Fewer people" disabled={res <= 0 || sent} onClick={() => stepRes(-1)}>
                    &minus;
                  </button>
                  <output aria-live="polite">{res}</output>
                  <button type="button" aria-label="More people" disabled={res >= mx || sent} onClick={() => stepRes(1)}>
                    +
                  </button>
                </div>
              </div>
            )}
            <div className={styles.total}>
              <span>Estimated first-year cost</span>
              <b aria-live="polite">
                <LockedFigure text={`AED ${formatAED(est.total)}`} unlocked={unlocked} />
              </b>
              <small>
                {unlocked ? (
                  <>Indicative · flexi-desk included · year two about AED {formatAED(est.renewal)}</>
                ) : (
                  "Unlocks when you send your details · flexi-desk included"
                )}
              </small>
            </div>
          </div>

          {/* Re-keyed per zone so a request for one zone never shows another zone's "sent" state. */}
          <QuickCapture
            key={zone.id}
            formId={FZ_FORM_ID}
            service="free_zone"
            tone="light"
            payload={() => ({ planner: input })}
            summary={`${zone.name}, ${res} ${res === 1 ? "person" : "people"} with residency${unlocked ? `, AED ${formatAED(est.total)}` : ""}`}
            onSent={() => setSent(true)}
            onDone={fromPlanner ? undefined : () => dialog.current?.close()}
          />

          {!sent && !fromPlanner && (
            <button type="button" className={styles.planner} onClick={openPlanner}>
              Adjust activities or shareholders in the full planner
            </button>
          )}
        </div>
      )}
    </dialog>
  );
}
