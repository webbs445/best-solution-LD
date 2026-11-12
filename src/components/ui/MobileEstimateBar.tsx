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
  aboveCookie = false,
}: {
  targetId: string;
  hideOver?: string[];
  location: string;
  label?: string;
  /** The main button opens the page's callback popup instead of scrolling to targetId (/services). */
  callback?: boolean;
  /** Sit just above the cookie banner while it shows (stacked, not covering it), so the bar is visible before the choice. */
  aboveCookie?: boolean;
}) {
  const [hidden, setHidden] = useState(false);
  const [lift, setLift] = useState(0);
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

  // The banner (in the root layout, a direct child of <body>) is found by its title, so the consent code is untouched.
  useEffect(() => {
    if (!aboveCookie) return;
    let ro: ResizeObserver | undefined;
    const measure = () => {
      const card = document.getElementById("consent-title")?.closest("[role=region]");
      // The fixed banner's offset and height (layout values, so its slide-in transform doesn't skew them).
      const banner = card?.parentElement;
      setLift(banner ? Math.ceil(parseFloat(getComputedStyle(banner).bottom) + banner.offsetHeight) + 8 : 0);
      return card;
    };
    const watch = () => {
      ro?.disconnect();
      const card = measure();
      if (card && "ResizeObserver" in window) (ro = new ResizeObserver(measure)).observe(card);
    };
    watch();
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true });
    window.addEventListener("resize", measure);
    return () => {
      mo.disconnect();
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [aboveCookie]);

  return (
    <div
      style={lift && !hidden ? { bottom: lift } : undefined}
      className={`${styles.bar}${hidden ? ` ${styles.hidden}` : ""}`} data-area="Mobile Bar" aria-hidden={hidden || undefined}>
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
