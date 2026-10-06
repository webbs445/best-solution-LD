"use client";

import { useEffect } from "react";
import { FZ_SITELINK_VIEWS, type FzSitelinkView } from "@/content/freezone";
import { trackEvent } from "@/lib/analytics";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import { OPEN_CALLBACK } from "@/components/sections/Callback";
import { FZ_ZONES_PRESET, type ZonesPreset } from "./FzZones";

/*
  Google Ads sitelink routes (/freezone/<view>): once the page has laid out, scroll to the matching
  section and set its state. The header offset comes from scroll-margin-top in freezone.css.
  The URL and its query string are left untouched, so UTMs and gclid still reach the lead forms.
*/

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });

const presetZones = (detail: ZonesPreset) => window.dispatchEvent(new CustomEvent(FZ_ZONES_PRESET, { detail }));

const ACTIONS: Record<FzSitelinkView, () => void> = {
  planner: () => scrollTo("planner"),
  compare: () => scrollTo("zones"),
  activity: () => {
    scrollTo("zones");
    // Focusing opens the on-screen keyboard on phones, so only focus where there's a real pointer.
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      document.getElementById("zxQ")?.focus({ preventScroll: true });
    }
  },
  budget: () => {
    presetZones({ group: "value", sort: "price" });
    scrollTo("zones");
  },
  dubai: () => {
    presetZones({ group: "dubai" });
    scrollTo("zones");
  },
  "vs-mainland": () => scrollTo("free-zone-vs-mainland"),
  consultation: () => {
    scrollTo("consultation");
    // The popup locks page scrolling, so let a smooth scroll finish first.
    window.setTimeout(() => window.dispatchEvent(new Event(OPEN_CALLBACK)), prefersReducedMotion() ? 0 : 600);
  },
};

const isView = (v: string): v is FzSitelinkView => (FZ_SITELINK_VIEWS as readonly string[]).includes(v);

// Report the sitelink landing once per page load (React dev mode runs effects twice).
let reported = false;

export function FzSitelink({ view }: { view: string }) {
  useEffect(() => {
    if (!isView(view)) return; // Unknown view: the page simply opens at the top.
    if (!reported) {
      reported = true;
      trackEvent("sitelink_view", { view });
    }
    let raf = 0;
    let timer = 0;
    const run = () => {
      raf = requestAnimationFrame(() => {
        timer = window.setTimeout(ACTIONS[view], 300);
      });
    };
    if (document.readyState === "complete") run();
    else window.addEventListener("load", run, { once: true });
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener("load", run);
    };
  }, [view]);

  return null;
}
