"use client";

import { useState } from "react";
import { getXs, goToPlan, setXs, xsTrack } from "./store";
import { BtnArrow, Icon } from "./ui";

/** Pauses and plays the review wall (#xs-wall). Hover and focus inside the wall pause it too (CSS). */
export function WallToggle() {
  const [paused, setPaused] = useState(false);
  return (
    <button
      type="button"
      className="xs-round xs-wall-toggle"
      aria-controls="xs-wall"
      aria-label={paused ? "Play reviews" : "Pause reviews"}
      onClick={() => {
        const next = !paused;
        setPaused(next);
        document.getElementById("xs-wall")?.classList.toggle("is-paused", next);
      }}
    >
      {paused ? <Icon name="play" size={16} /> : <Icon name="pause" size={16} />}
    </button>
  );
}

/** "Request a call back": reply by phone, topic "Not sure yet" unless one is picked, then to the form. */
export function CallbackButton() {
  return (
    <button
      type="button"
      className="xs-btn xs-dark"
      data-xs-cta="callback"
      data-cta=""
      onClick={() => {
        setXs({ contactPref: "call", topic: getXs().topic ?? "not_sure" });
        xsTrack("xs_cta_click", { cta_id: "callback", location: "trust" });
        goToPlan();
      }}
    >
      Request a call back
      <BtnArrow />
    </button>
  );
}
