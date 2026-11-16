"use client";

import { useEffect } from "react";
import { ALL_DENIED, ALL_GRANTED, readConsent, type ConsentChoices } from "@/lib/consent";
import { CLICK_PARAMS, type Metric } from "@/lib/adLandings";

/*
  Aggregate ad landing counts (lib/adLandings): when a page opens with a gclid / gbraid / wbraid, one beacon after the
  page has loaded says so (parameter name and path only, never its value), the device type and system as bucket names,
  and whether the cookie banner showed; if it did, one more beacon carries the choice. Not a tag: no cookie, no ID,
  nothing sent to a third party, so it runs before consent. Renders nothing.
*/

const same = (a: ConsentChoices, b: ConsentChoices) => a.analytics === b.analytics && a.marketing === b.marketing;

export function AdLandingCounter() {
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const param = CLICK_PARAMS.find((p) => q.get(p));
    if (!param) return;
    const path = location.pathname;
    const shown = !readConsent(); // The banner shows exactly when no choice is saved (CookieConsentBanner).
    // Device and system as bucket names only; the user agent string and the screen size never leave the browser.
    // Device from the screen's shorter side (so a turned phone is still a phone); a big touch screen is a tablet.
    const side = Math.min(screen.width, screen.height);
    const device = side < 600 ? "phone" : side < 1100 && matchMedia("(pointer: coarse)").matches ? "tablet" : "desktop";
    const ua = navigator.userAgent;
    // iPadOS reports a Mac user agent; a Mac with a touch screen is an iPad.
    const system = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? "ios" : /Android/.test(ua) ? "android" : "other";
    const send = (metrics: Metric[]) => {
      const body = JSON.stringify({ path, param, metrics, device, system });
      if (!navigator.sendBeacon?.("/api/ad-landing", body)) fetch("/api/ad-landing", { method: "POST", body, keepalive: true }).catch(() => {});
    };

    const land = () => send(shown ? ["land", "shown"] : ["land"]);
    if (document.readyState === "complete") land();
    else window.addEventListener("load", land, { once: true });

    if (!shown) return () => window.removeEventListener("load", land);
    // The banner's choice, once, from the DOM event lib/consent fires on every save.
    const choice = (e: Event) => {
      const c = (e as CustomEvent<ConsentChoices>).detail;
      if (!c) return;
      send([same(c, ALL_GRANTED) ? "accept_all" : same(c, ALL_DENIED) ? "reject_all" : "manage"]);
      window.removeEventListener("consent_update", choice);
    };
    window.addEventListener("consent_update", choice);
    return () => {
      window.removeEventListener("load", land);
      window.removeEventListener("consent_update", choice);
    };
  }, []);

  return null;
}
