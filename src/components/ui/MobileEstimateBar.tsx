"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/content/site";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { OPEN_CALLBACK } from "@/components/sections/Callback";
import styles from "./MobileEstimateBar.module.css";

/*
  Sticky bottom bar on phones (home and /freezone): "Get my estimate" scrolls to the calculator, the icon
  opens WhatsApp. It slides away while the calculator itself is on screen, so it never covers the estimate
  or the number field. Contact clicks report cta_location "Mobile Bar" (data-area).
*/
export function MobileEstimateBar({
  targetId,
  hideOver = [],
  location,
  label = "Get my estimate",
  callback = false,
}: {
  targetId: string;
  hideOver?: string[];
  location: string;
  label?: string;
  /** The main button opens the page's callback popup instead of scrolling to targetId (/services). */
  callback?: boolean;
}) {
  const [hidden, setHidden] = useState(false);
  const watch = [targetId, ...hideOver].join(" ");

  // Hidden while any watched section (the calculator, or one with its own bottom bar) is on screen.
  useEffect(() => {
    const els = watch.split(" ").map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length || !("IntersectionObserver" in window)) return;
    const on = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? on.add(e.target) : on.delete(e.target)));
        setHidden(on.size > 0);
      },
      { threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [watch]);

  return (
    <div className={`${styles.bar}${hidden ? ` ${styles.hidden}` : ""}`} data-area="Mobile Bar" aria-hidden={hidden || undefined}>
      {callback ? (
        <button
          type="button"
          className={`btn btn-primary ${styles.go}`}
          aria-controls="cbModal"
          data-cta-location={location}
          tabIndex={hidden ? -1 : undefined}
          onClick={() => window.dispatchEvent(new Event(OPEN_CALLBACK))}
        >
          {label}
        </button>
      ) : (
        <a className={`btn btn-primary ${styles.go}`} href={`#${targetId}`} data-cta-location={location} tabIndex={hidden ? -1 : undefined}>
          {label}
        </a>
      )}
      <a className={styles.wa} href={SITE.whatsapp} target="_blank" rel="noopener" aria-label="Message us on WhatsApp" tabIndex={hidden ? -1 : undefined}>
        <WhatsAppIcon />
      </a>
    </div>
  );
}
