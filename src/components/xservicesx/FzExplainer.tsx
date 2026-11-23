"use client";

import { useId, useRef, useState } from "react";
import { xsTrack } from "./store";

/*
  "What's the difference?" on the S3 free zone or mainland card. The panel floats inside the card (over its lower part,
  and below it on a short phone tile), so no other card moves. Escape closes it and returns focus to the button.
*/
export function FzExplainer() {
  const [open, setOpen] = useState(false);
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  return (
    <div
      className={`xs-explain${open ? " is-open" : ""}`}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !open) return;
        setOpen(false);
        btn.current?.focus();
      }}
    >
      <button
        ref={btn}
        type="button"
        className="xs-explain-btn"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          if (!open) xsTrack("xs_cta_click", { cta_id: "fz_explainer", location: "s3" });
          setOpen(!open);
        }}
      >
        What&apos;s the difference?
      </button>
      <div
        className="xs-explain-panel"
        id={id}
        hidden={!open}
      >
        <p>
          <b>Free zone:</b> a business area with its own authority, often used for international trade and services.
        </p>
        <p>
          <b>Mainland:</b> trade directly across the UAE market.
        </p>
        <p>Which fits depends on who your customers are and what you do. We&apos;ll tell you in writing.</p>
        <button type="button" className="xs-explain-close" onClick={() => (setOpen(false), btn.current?.focus())}>
          Close
        </button>
      </div>
    </div>
  );
}
