"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/content/site";
import { WhatsAppIcon } from "@/components/ui/Icons";
import styles from "./MobileEstimateBar.module.css";

/*
  Sticky bottom bar on phones (home and /freezone): "Get my estimate" scrolls to the calculator, the icon
  opens WhatsApp. It slides away while the calculator itself is on screen, so it never covers the estimate
  or the number field. Contact clicks report cta_location "Mobile Bar" (data-area).
*/
export function MobileEstimateBar({ targetId, location }: { targetId: string; location: string }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setHidden(e.isIntersecting), { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, [targetId]);

  return (
    <div className={`${styles.bar}${hidden ? ` ${styles.hidden}` : ""}`} data-area="Mobile Bar" aria-hidden={hidden || undefined}>
      <a className={`btn btn-primary ${styles.go}`} href={`#${targetId}`} data-cta-location={location} tabIndex={hidden ? -1 : undefined}>
        Get my estimate
      </a>
      <a className={styles.wa} href={SITE.whatsapp} target="_blank" rel="noopener" aria-label="Message us on WhatsApp" tabIndex={hidden ? -1 : undefined}>
        <WhatsAppIcon />
      </a>
    </div>
  );
}
