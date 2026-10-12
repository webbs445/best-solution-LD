"use client";

import { useEffect } from "react";
import {
  captureClickIds,
  FORM_SUCCESS_EVENT,
  pushPageContext,
  trackConsultationCta,
  trackContentView,
  trackEmailClick,
  trackEngagedTime,
  trackFaqExpand,
  trackFileDownload,
  trackFormAbandon,
  trackFormError,
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
  - form_start / form_error / form_abandon for every <form>, using its data-track value as form_id
    (abandon carries where the visitor stopped: field names, errors, attempts, time; never typed values);
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

  // form_start on first field focus. form_abandon on page leave if started but the lead was never confirmed,
  // with where the visitor stopped (field names, errors, attempts, time; never what they typed).
  // form_error when a send attempt is stopped by field errors.
  useEffect(() => {
    interface FormState {
      id: string;
      t0: number;
      lastField: string;
      errors: Set<string>;
      attempts: number;
      whatsapp: boolean;
    }
    const started = new Map<HTMLFormElement, FormState>();
    const succeeded = new Set<string>();
    let counter = 0;
    const formId = (form: HTMLFormElement) => form.dataset.track || form.getAttribute("name") || form.id || `form_${++counter}`;
    const fieldName = (el: Element) => el.getAttribute("name") || el.id || (el as HTMLInputElement).type || el.tagName.toLowerCase();
    const isSpamTrap = (el: Element) => el.getAttribute("name") === "website";
    const filled = (form: HTMLFormElement) =>
      Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea"))
        .filter((el) => !isSpamTrap(el) && !/^(hidden|radio|checkbox|submit|button)$/.test(el.type) && el.value.trim())
        .map(fieldName);
    const invalid = (form: HTMLFormElement) =>
      Array.from(form.querySelectorAll('[aria-invalid="true"]')).filter((el) => !isSpamTrap(el)).map(fieldName);

    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as Element | null;
      const form = el?.closest?.("form") as HTMLFormElement | null;
      if (!form) return;
      let st = started.get(form);
      if (!st) {
        st = { id: formId(form), t0: Date.now(), lastField: "", errors: new Set(), attempts: 0, whatsapp: false };
        started.set(form, st);
        trackFormStart(st.id);
      }
      if (el && el.matches("input, select, textarea") && !isSpamTrap(el)) st.lastField = fieldName(el);
    };
    const onSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement | null;
      const st = form && started.get(form);
      if (!form || !st) return;
      st.attempts++;
      // The form marks bad fields right after its own submit handler runs.
      window.setTimeout(() => {
        const bad = invalid(form);
        if (!bad.length) return;
        bad.forEach((f) => st.errors.add(f));
        trackFormError(st.id, bad, st.attempts);
      }, 150);
    };
    const onSuccess = (e: Event) => succeeded.add(String((e as CustomEvent).detail));
    // A WhatsApp tap after starting a form means they contacted us instead: still reported, marked as such.
    const onClick = (e: MouseEvent) => {
      if (!(e.target as Element | null)?.closest?.('a[href*="wa.me"]')) return;
      started.forEach((st) => (st.whatsapp = true));
    };
    let reported = false;
    const onPageHide = () => {
      if (reported) return;
      reported = true;
      started.forEach((st, form) => {
        if (succeeded.has(st.id)) return;
        invalid(form).forEach((f) => st.errors.add(f));
        trackFormAbandon(st.id, {
          last_field: st.lastField || undefined,
          fields_filled: filled(form).join(",") || undefined,
          error_fields: [...st.errors].join(",") || undefined,
          submit_attempts: st.attempts,
          seconds_in_form: Math.round((Date.now() - st.t0) / 1000),
          exit: st.whatsapp ? "whatsapp" : "page_leave",
        });
      });
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("submit", onSubmit, { capture: true });
    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener(FORM_SUCCESS_EVENT, onSuccess);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("submit", onSubmit, { capture: true });
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener(FORM_SUCCESS_EVENT, onSuccess);
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
