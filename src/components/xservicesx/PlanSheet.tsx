"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { FORM_COPY } from "@/content/xservicesx";
import { PlanForm } from "./PlanForm";

/*
  The /xservicesx pop-up form: a bottom sheet on phones, a centred dialog on wider screens. Every opener is a button
  with aria-controls="cbModal" (the cards, the section buttons, the header and the sticky phone bar), read here with one
  click listener: data-need pre-fills "Need", data-cta-location goes on form_open. Also on this page:
  - [data-fold] buttons open and close the details folded on phones (card details, full reviews, the client story);
  - the sticky phone bar sits above the cookie banner while it shows (--xs-consent-h).
*/
export function PlanSheet() {
  const ref = useRef<HTMLDialogElement>(null);
  const [need, setNeed] = useState("");

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      const fold = t?.closest?.("[data-fold]");
      if (fold) {
        const open = fold.getAttribute("aria-expanded") !== "true";
        fold.setAttribute("aria-expanded", String(open));
        fold.closest(".xs-fold")?.classList.toggle("is-open", open);
        return;
      }
      const opener = t?.closest?.('[aria-controls="cbModal"]');
      const dlg = ref.current;
      if (!opener || !dlg || dlg.open) return;
      setNeed(opener.getAttribute("data-need") || "");
      dlg.showModal();
      trackEvent("form_open", { cta_location: opener.getAttribute("data-cta-location") || "", need: opener.getAttribute("data-need") || undefined });
    };
    document.addEventListener("click", onClick);

    // The cookie banner is a direct child of <body>, shown until the visitor chooses.
    const root = document.documentElement;
    // Layout sizes, not the on-screen box: the banner slides in with a transform, which would read short.
    const lift = () => {
      const card = document.querySelector<HTMLElement>('[aria-labelledby="consent-title"]');
      const gap = card?.parentElement ? parseFloat(getComputedStyle(card.parentElement).bottom) || 0 : 0;
      root.style.setProperty("--xs-consent-h", card ? `${Math.ceil(gap + card.offsetHeight + 8)}px` : "0px");
    };
    const mo = new MutationObserver(lift);
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", lift);
    lift();
    return () => {
      document.removeEventListener("click", onClick);
      mo.disconnect();
      window.removeEventListener("resize", lift);
      root.style.removeProperty("--xs-consent-h");
    };
  }, []);

  return (
    <dialog
      ref={ref}
      id="cbModal"
      className="xs-sheet"
      aria-labelledby="xsSheetTitle"
      // A tap on the backdrop (outside the panel) closes it.
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      <div className="xs-sheet-in">
        <div className="xs-sheet-head">
          <div>
            <h2 id="xsSheetTitle">{FORM_COPY.title}</h2>
            <p>{FORM_COPY.line}</p>
          </div>
          <button type="button" className="xs-close" aria-label="Close" onClick={() => ref.current?.close()}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {/* Keyed on the need, so a card's choice shows even after another card opened the form. */}
        <PlanForm key={need} idPrefix="xs-pop" need={need} />
      </div>
    </dialog>
  );
}
