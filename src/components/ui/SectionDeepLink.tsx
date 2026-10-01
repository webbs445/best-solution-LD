"use client";

import { useEffect } from "react";
import { pushEvent } from "@/lib/analytics";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import { OPEN_CALLBACK } from "@/components/sections/Callback";

/*
  Google Ads sitelinks land on /calculator, /mainland, /free-zone, /offshore, /consultation and /reviews.
  next.config.ts rewrites each to this page; here we open the matching section once the page has loaded.
  `?section=<name>` on any URL does the same.
*/

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });

const showTab = (tabId: string) => {
  document.getElementById(tabId)?.click();
  scrollTo("jurisdiction");
};

const openCallback = () => window.dispatchEvent(new Event(OPEN_CALLBACK));

const ROUTES: Record<string, () => void> = {
  calculator: () => scrollTo("calculator"),
  mainland: () => showTab("tab-mainland"),
  "free-zone": () => showTab("tab-freezone"),
  offshore: () => showTab("tab-offshore"),
  reviews: () => scrollTo("reviews"),
  consultation: () => {
    scrollTo("consultation");
    openCallback();
  },
};

// Report the sitelink landing once per page load, even if the effect re-runs (React dev mode runs it twice).
let reported = false;

export function SectionDeepLink() {
  useEffect(() => {
    const section =
      window.location.pathname.replace(/\/+$/, "").split("/").pop() ||
      new URLSearchParams(window.location.search).get("section") ||
      "";
    const route = ROUTES[section];
    if (!route) return;

    if (!reported) {
      reported = true;
      pushEvent("sitelink_landing", { section });
    }
    let timer = 0;
    const run = () => {
      timer = window.setTimeout(route, 300);
    };
    if (document.readyState === "complete") run();
    else window.addEventListener("load", run, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("load", run);
    };
  }, []);

  return null;
}
