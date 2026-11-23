"use client";

import { useEffect, useState } from "react";
import { CTA_NOTE, PLAN_CTA, TOPICS } from "@/content/xservicesx";
import { useXs } from "./store";
import { Icon } from "./ui";
import { XsCta, XsWhatsApp } from "./XsCta";

/*
  Phones and tablets: WhatsApp plus "Get my written plan". Hidden while the hero buttons are on screen, slides up once
  they scroll away, hides again while the form (#plan) is on screen. IntersectionObserver only. While the cookie
  banner shows, the bar sits above it (--xs-consent-h).
*/
export function StickyBar() {
  const { topic } = useXs();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("xs-hero-ctas");
    const plan = document.getElementById("plan");
    if (!hero || !plan || !("IntersectionObserver" in window)) return;
    const vis = { hero: true, plan: false };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (vis[e.target === hero ? "hero" : "plan"] = e.isIntersecting));
      setShow(!vis.hero && !vis.plan);
    });
    io.observe(hero);
    io.observe(plan);

    // The cookie banner is a direct child of <body> while no choice is saved.
    const root = document.documentElement;
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
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", lift);
      root.style.removeProperty("--xs-consent-h");
    };
  }, []);

  return (
    <div className={`xs-sticky${show ? " is-on" : ""}`} data-area="Mobile Bar" aria-hidden={!show} inert={!show}>
      <XsWhatsApp location="sticky" className="xs-sticky-wa" label="Chat on WhatsApp">
        <Icon name="whatsapp" size={22} />
      </XsWhatsApp>
      <XsCta id="sticky_plan" location="sticky" className="xs-sticky-go" arrow={false}>
        <span>
          {PLAN_CTA}
          <small>{topic ? `${TOPICS[topic].short} · 2 minutes` : CTA_NOTE}</small>
        </span>
      </XsCta>
    </div>
  );
}
