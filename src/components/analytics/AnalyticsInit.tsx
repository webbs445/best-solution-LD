"use client";

import { useEffect } from "react";
import {
  captureClickIds,
  pushPageContext,
  trackConsultationCta,
  trackContentView,
  trackEmailClick,
  trackEngagedTime,
  trackFaqExpand,
  trackFileDownload,
  trackFormAbandon,
  trackFormStart,
  trackMapClick,
  trackOutboundClick,
  trackPhoneClick,
  trackScrollDepth,
  trackWhatsappClick,
} from "@/lib/analytics";

/*
  Page-wide dataLayer wiring, ported from best-solution.ae AnalyticsInit (minus interest scoring and
  locale handling). Mounted once in the layout:
  - content_view on load, plus click-id capture on load and whenever consent changes;
  - one delegated click listener: [data-cta-location] CTAs, FAQ opens, tel / wa.me / mailto / Maps /
    pdf / other outbound links. Anchors with data-no-track opt out;
  - form_start / form_abandon for every <form>, using its data-track value as form_id;
  - engaged_time_on_topic (30/45/60/120 s of active time) and scroll_depth (25/50/75/90 %).
*/
/**
 * Where a contact link sits, for whatsapp_click / phone_click / email_click: its own data-cta-location, else
 * a data-area marker, else the page area it is in.
 */
function contactLocation(a: Element): string {
  const own = a.closest("[data-cta-location]")?.getAttribute("data-cta-location");
  if (own) return own;
  const area = a.closest("[data-area]")?.getAttribute("data-area");
  if (area) return area;
  if (a.closest("header")) return "Header";
  if (a.closest("footer")) return "Footer";
  if (a.closest("dialog, [role=dialog]")) return "Popup";
  const sec = a.closest("section[id]");
  return sec ? `Section: ${sec.id}` : "Page";
}

export function AnalyticsInit() {
  useEffect(() => {
    const path = window.location.pathname;
    pushPageContext(path);
    trackContentView(path);
  }, []);

  // Capture on landing, and again when the visitor grants consent, so a gclid present at landing is
  // stored as soon as marketing is allowed. captureClickIds() is itself consent-gated.
  useEffect(() => {
    captureClickIds();
    const onConsent = () => captureClickIds();
    window.addEventListener("consent_update", onConsent);
    return () => window.removeEventListener("consent_update", onConsent);
  }, []);

  // Runs on capture so the push is queued before a same-tab navigation begins.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;

      // CTAs opt in with data-cta-location (a fixed English literal, never visible text). Resolved before
      // the anchor lookup because some CTAs are <button>s.
      const cta = target?.closest?.("[data-cta-location]") as HTMLElement | null;
      if (cta && !cta.hasAttribute("data-no-track")) trackConsultationCta(cta.getAttribute("data-cta-location") || "");

      // FAQ: a click on a closed question's <summary> opens it (keyboard Enter/Space also fires click).
      // Not a `toggle` listener, which would also count the question that starts open.
      const faq = target?.closest?.("summary")?.parentElement as HTMLDetailsElement | null;
      if (faq?.dataset.faqQuestion && !faq.open) trackFaqExpand(faq.dataset.faqQuestion);

      const a = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!a || a.hasAttribute("data-no-track")) return;
      const href = a.getAttribute("href") || "";

      if (href.startsWith("tel:")) {
        trackPhoneClick(href.replace("tel:", ""), contactLocation(a));
      } else if (href.includes("wa.me")) {
        trackWhatsappClick(contactLocation(a));
      } else if (/\.pdf($|\?)/i.test(href) || a.hasAttribute("download")) {
        const clean = href.split("?")[0];
        trackFileDownload(clean.split("/").pop() || "", clean.split(".").pop() || "");
      } else if (href.startsWith("mailto:")) {
        trackEmailClick(href.replace("mailto:", "").split("?")[0], contactLocation(a));
      } else if (/(maps\.google\.|google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(href)) {
        trackMapClick(href);
      } else if (/^https?:\/\//i.test(href) && a.hostname && a.hostname !== location.hostname) {
        const label = (a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 60);
        trackOutboundClick(href, label);
      }
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  // form_start on first field focus, form_abandon on page leave if started but not submitted.
  useEffect(() => {
    const started = new Map<HTMLFormElement, string>();
    const submitted = new WeakSet<HTMLFormElement>();
    let counter = 0;
    const formId = (form: HTMLFormElement) =>
      started.get(form) || form.dataset.track || form.getAttribute("name") || form.id || `form_${++counter}`;

    const onFocusIn = (e: FocusEvent) => {
      const form = (e.target as Element | null)?.closest?.("form") as HTMLFormElement | null;
      if (!form || started.has(form)) return;
      const id = formId(form);
      started.set(form, id);
      trackFormStart(id);
    };
    const onSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement | null;
      if (form && form.tagName === "FORM") submitted.add(form);
    };
    const onPageHide = () => {
      started.forEach((id, form) => {
        if (!submitted.has(form)) trackFormAbandon(id);
      });
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("submit", onSubmit, { capture: true });
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("submit", onSubmit, { capture: true });
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  // Active engaged time: idle (no input for 30 s) and hidden-tab time don't count.
  useEffect(() => {
    const thresholds = [30, 45, 60, 120];
    let active = 0;
    let idx = 0;
    let last = Date.now();
    const bump = () => {
      last = Date.now();
    };
    const evts: (keyof DocumentEventMap)[] = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    evts.forEach((ev) => document.addEventListener(ev, bump, { passive: true }));
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      if (Date.now() - last < 30000) active++;
      while (idx < thresholds.length && active >= thresholds[idx]) {
        trackEngagedTime(active, thresholds[idx]);
        idx++;
      }
      if (idx >= thresholds.length) window.clearInterval(timer);
    }, 1000);
    return () => {
      window.clearInterval(timer);
      evts.forEach((ev) => document.removeEventListener(ev, bump));
    };
  }, []);

  useEffect(() => {
    const thresholds = [25, 50, 75, 90];
    const fired = new Set<number>();
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const pct = (window.scrollY / scrollable) * 100;
      for (const t of thresholds) {
        if (pct >= t && !fired.has(t)) {
          fired.add(t);
          trackScrollDepth(t);
        }
      }
      if (fired.size === thresholds.length) window.removeEventListener("scroll", onScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
