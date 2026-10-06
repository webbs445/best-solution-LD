"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { ZONE_BY_ID } from "@/content/freezone";
import { cleanPlanner, maxResidents, plannerEstimate } from "@/lib/freezone";
import { formatAED } from "@/lib/pricing";
import { FzLeadForm } from "./FzLeadForm";
import { usePlanner } from "./PlannerProvider";
import { ZoneLogo } from "./ZoneLogo";
import styles from "./FzZoneEstimate.module.css";

/*
  "Get My Estimate" from a zone card or the comparison: a compact popup with the zone filled in.
  One question (people needing residency) with a live total, then the planner's lead form, which
  posts to /api/lead like the planner. The full planner stays one tap away.
*/
export function FzZoneEstimate({ zoneId, onClose }: { zoneId: string | null; onClose: () => void }) {
  const { state, complete, trackStep, goPlanner } = usePlanner();
  const dialog = useRef<HTMLDialogElement>(null);
  const zone = zoneId ? ZONE_BY_ID[zoneId] : null;
  // Mounted per zone (keyed by the parent), so this starts from the planner's residency count each time.
  const [res, setRes] = useState(() => (zone ? Math.min(state.res, maxResidents(zone)) : 0));

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
    if (input && est) complete(input, est, "zone_card");
  }, [input, est, complete]);

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
              <h3 id="ze-title">Get your estimate in writing</h3>
              <p>{zone.name}</p>
            </div>
          </div>

          <div className={styles.summary}>
            <div className={styles.people}>
              <span>People needing residency</span>
              <div className={styles.stepper} role="group" aria-label="People needing residency">
                <button type="button" aria-label="Fewer people" disabled={res <= 0} onClick={() => stepRes(-1)}>
                  &minus;
                </button>
                <output aria-live="polite">{res}</output>
                <button type="button" aria-label="More people" disabled={res >= mx} onClick={() => stepRes(1)}>
                  +
                </button>
              </div>
            </div>
            <div className={styles.total}>
              <span>Estimated first-year cost</span>
              <b aria-live="polite">AED {formatAED(est.total)}</b>
              <small>Indicative · flexi-desk included · year two about AED {formatAED(est.renewal)}</small>
            </div>
          </div>

          {/* Re-keyed per zone so a request for one zone never shows another zone's "sent" state. */}
          <FzLeadForm key={zone.id} planner={input} idPrefix="ze-" />

          <button type="button" className={styles.planner} onClick={openPlanner}>
            Adjust activities or shareholders in the full planner
          </button>
        </div>
      )}
    </dialog>
  );
}
