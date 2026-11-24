"use client";

import { useSyncExternalStore } from "react";
import { pushEvent } from "@/lib/analytics";
import { WORRIES, isTopic, type TopicId } from "@/content/xservicesx";
import { XS_CONFIG } from "@/content/xservicesx.config";

/*
  The /xservicesx shared page state: what the visitor picked anywhere on the page, read by section 9's plan and sent
  with the lead. One small store (useSyncExternalStore, so server HTML and the first client render match), kept in
  sessionStorage under bsx_xs_state so a refresh keeps it. Never holds a name, number or email.
*/

export interface XsState {
  topic: TopicId | null;
  worries: number[];
  advisor: string | null;
  contactPref: "whatsapp" | "call";
  consultMode: "video" | "office" | null;
}

const KEY = "bsx_xs_state";
export const XS_DEFAULT: XsState = { topic: null, worries: [], advisor: null, contactPref: "whatsapp", consultMode: null };

/** Only values the page offers survive a reload (sessionStorage can hold anything). */
export function cleanState(raw: unknown): XsState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const advisorIds = XS_CONFIG.advisors.map((a) => a.id);
  return {
    topic: isTopic(r.topic) ? r.topic : null,
    worries: Array.isArray(r.worries) ? [...new Set(r.worries.filter((i): i is number => Number.isInteger(i) && i >= 0 && i < WORRIES.length))] : [],
    advisor: r.advisor === "any" || advisorIds.includes(r.advisor as string) ? (r.advisor as string) : null,
    contactPref: r.contactPref === "call" ? "call" : "whatsapp",
    consultMode: r.consultMode === "video" || r.consultMode === "office" ? r.consultMode : null,
  };
}

let state: XsState | null = null;
const listeners = new Set<() => void>();

function current(): XsState {
  if (state) return state;
  try {
    state = cleanState(JSON.parse(sessionStorage.getItem(KEY) || "null"));
  } catch {
    state = XS_DEFAULT;
  }
  return state;
}

/** The state right now (for handlers that must not read a stale render). */
export const getXs = (): XsState => current();

export function setXs(patch: Partial<XsState>): void {
  state = { ...current(), ...patch };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage blocked: the page still works for this view.
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => (listeners.add(l), () => void listeners.delete(l));
export const useXs = () => useSyncExternalStore(subscribe, current, () => XS_DEFAULT);

/** dataLayer push for this page's own events. Never a name, number or email. */
export const xsTrack = (event: string, params: Record<string, unknown> = {}) => pushEvent(event, { ...params, page: "/xservicesx" });

export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let opener: HTMLElement | null = null;
/** The button that last opened the plan pop-up (focus goes back to it when the pop-up closes). */
export const popupOpener = () => opener;

/**
 * Open the plan pop-up and put the cursor in its first empty field (the submit button, or the thank-you once sent).
 * Without the pop-up (never expected) it falls back to scrolling to the section 9 form.
 */
export function goToPlan(): void {
  const dlg = document.getElementById("xs-plan-dialog") as HTMLDialogElement | null;
  if (dlg) {
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // The hero card always shows a topic (its default too): with nothing picked yet, the pop-up and the lead take that one.
    const hero = (document.getElementById("xs-hero-topic") as HTMLSelectElement | null)?.value;
    if (!current().topic && isTopic(hero)) setXs({ topic: hero });
    if (!dlg.open) dlg.showModal();
    const fields = ["xsd-name", "xsd-email", "xsd-phone"].map((id) => document.getElementById(id) as HTMLInputElement | null);
    const target = fields.find((f) => f && !f.value.trim()) ?? (dlg.querySelector("button[type=submit], #xsd-thanks") as HTMLElement | null);
    target?.focus();
    return;
  }
  scrollToForm();
}

/** Scroll to the section 9 form (#plan) and put the cursor in its first empty field. */
export function scrollToForm(): void {
  const plan = document.getElementById("plan");
  if (!plan) return;
  // scrollTo, not scrollIntoView: the site-wide scroll-padding-top (for other pages' sticky headers) would stop short.
  window.scrollTo({ top: plan.getBoundingClientRect().top + window.scrollY, behavior: reducedMotion() ? "auto" : "smooth" });
  // If something above changed height during the smooth scroll, land exactly on the form once it ends.
  window.addEventListener("scrollend", () => Math.abs(plan.getBoundingClientRect().top) > 2 && window.scrollTo({ top: plan.getBoundingClientRect().top + window.scrollY }), { once: true });
  const fields = ["xs-name", "xs-email", "xs-phone"].map((id) => document.getElementById(id) as HTMLInputElement | null);
  const target = fields.find((f) => f && !f.value.trim()) ?? (plan.querySelector("button[type=submit]") as HTMLElement | null);
  target?.focus({ preventScroll: true });
}

/** A media query's match, false on the server and in the first client render. */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (l) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", l);
      return () => mq.removeEventListener("change", l);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
