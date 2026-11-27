/*
  Cookie-consent state + Google Consent Mode v2 plumbing, ported as-is from best-solution.ae
  (webbs445/bestsolution lib/consent.ts) so both sites share one consent contract.

  The visitor's category choices live in one first-party cookie (`bs_consent`). The defaults are set by <ConsentInit>
  BEFORE GTM loads: denied in the EEA, UK and Switzerland (lib/consentRegions), granted everywhere else. This module
  handles the update path (saving the choice and pushing it to gtag, Clarity and Meta) and effectiveConsent(), the
  page's own view of the same state for code that must follow it (user_data on conversions, click-id capture).

  Keep the cookie name, shape and version in sync with the inline restore logic in
  src/components/analytics/ConsentInit.tsx and with the main site.
*/

import { eventContext } from "./eventContext";

export const CONSENT_COOKIE = "bs_consent";
// Bump when the category set changes: older cookies become invalid and the banner re-prompts.
// v2 (Oct 2026): Necessary, Analytics, Marketing; the Functional category is gone.
export const CONSENT_VERSION = 2;
const CONSENT_MAX_AGE = 60 * 60 * 24 * 180; // 180 days, in seconds

// `necessary` is always on (not stored as a choice) and maps to security_storage only.
/** Analytics: Google Analytics and Microsoft Clarity. Marketing: Google Ads and Meta. */
export type ConsentCategory = "analytics" | "marketing";

export type ConsentChoices = Record<ConsentCategory, boolean>;

export interface StoredConsent extends ConsentChoices {
  v: number;
  ts: number;
}

export const ALL_GRANTED: ConsentChoices = { analytics: true, marketing: true };
export const ALL_DENIED: ConsentChoices = { analytics: false, marketing: false };

/** Map the categories onto Google Consent Mode v2 signals. security_storage is always granted; nothing uses the functionality signals, so they stay denied. */
export function toConsentSignals(c: ConsentChoices): Record<string, "granted" | "denied"> {
  const g = (v: boolean) => (v ? "granted" : "denied");
  return {
    security_storage: "granted",
    analytics_storage: g(c.analytics),
    ad_storage: g(c.marketing),
    ad_user_data: g(c.marketing),
    ad_personalization: g(c.marketing),
    functionality_storage: "denied",
    personalization_storage: "denied",
  };
}

/** Read the saved choice, or null if absent, invalid or from an older version. */
export function readConsent(): ConsentChoices | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`))
    ?.split("=")
    .slice(1)
    .join("=");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<StoredConsent>;
    if (parsed.v !== CONSENT_VERSION) return null;
    return { analytics: !!parsed.analytics, marketing: !!parsed.marketing };
  } catch {
    return null;
  }
}

type ConsentWindow = typeof window & {
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
  clarity?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
  __bsReleaseClarity?: () => void;
};

// Whether the visitor is in an opt-in region (EEA, UK, Switzerland), from /api/geo. null until it answers.
let optInRegion: boolean | null = null;
// Conversion pushes waiting for the region (whenConsentKnown).
const regionWaiters: (() => void)[] = [];

/**
 * Runs fn once consent is known: at once if a choice is saved or the region is known, else when /api/geo answers, but
 * at most `ms` later (then the region counts as opt-in, so nothing is assumed granted). Callbacks keep their order.
 */
export function whenConsentKnown(fn: () => void, ms = 1000): void {
  if (readConsent() || optInRegion !== null) return fn();
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    fn();
  };
  regionWaiters.push(run);
  setTimeout(run, ms);
}

/**
 * Consent as Google's tags see it: the saved choice, else the regional default (granted outside the EEA, UK and
 * Switzerland). Until /api/geo answers, an unknown region counts as opt-in, so nothing is assumed granted.
 */
export function effectiveConsent(): ConsentChoices {
  return readConsent() ?? (optInRegion === false ? ALL_GRANTED : ALL_DENIED);
}

/**
 * The banner passes /api/geo's answer here. Outside the opt-in regions, with no saved choice, Google's region default
 * already granted everything; Clarity and Meta (which do not follow Consent Mode) are brought in line. Not a choice:
 * no consent_update event and nothing saved.
 */
export function applyRegionDefault(optIn: boolean): void {
  optInRegion = optIn;
  regionWaiters.splice(0).forEach((run) => run());
  if (optIn || readConsent() || typeof window === "undefined") return;
  const w = window as ConsentWindow;
  w.clarity?.("consentv2", { ad_Storage: "granted", analytics_Storage: "granted" });
  w.__bsReleaseClarity?.();
  w.fbq?.("consent", "grant");
}

/** The saved choice as the label every lead carries (lib/lead LEAD_CONSENT). */
export function consentLabel(): string {
  const c = readConsent();
  if (!c) return "No choice yet";
  if (c.analytics && c.marketing) return "Accepted all";
  if (c.marketing) return "Marketing only";
  if (c.analytics) return "Analytics only";
  return "Rejected all";
}

/** Persist the choice. Host-only like the main site, so the two never hold clashing copies. */
export function saveConsent(choices: ConsentChoices): void {
  if (typeof document === "undefined") return;
  const value: StoredConsent = { v: CONSENT_VERSION, ts: Date.now(), ...choices };
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(value))}` + `; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

/** Push the choice to Consent Mode and emit `consent_update` so GTM/Stape triggers react at once. */
export function applyConsent(choices: ConsentChoices): void {
  if (typeof window === "undefined") return;
  const w = window as ConsentWindow;
  // Clarity ignores Consent Mode; its own consent API lifts the cookie block set in ConsentInit.
  const g = (v: boolean) => (v ? "granted" : "denied");
  w.clarity?.("consentv2", { ad_Storage: g(choices.marketing), analytics_Storage: g(choices.analytics) });
  // Let the parked Clarity script load now that analytics is allowed (see ConsentInit).
  if (choices.analytics) w.__bsReleaseClarity?.();
  // The Meta pixel follows Marketing at once if it is already on the page (its GTM tags also need ad_storage).
  w.fbq?.("consent", choices.marketing ? "grant" : "revoke");
  w.dataLayer = w.dataLayer || [];
  if (typeof w.gtag === "function") {
    w.gtag("consent", "update", toConsentSignals(choices));
  } else {
    // Fallback if the gtag shim somehow hasn't initialised yet.
    w.dataLayer.push(["consent", "update", toConsentSignals(choices)]);
  }
  w.dataLayer.push({ event: "consent_update", consent: choices, ...eventContext() });
  // DOM event so client code (click-id capture) can react without polling the dataLayer.
  try {
    window.dispatchEvent(new CustomEvent("consent_update", { detail: choices }));
  } catch {
    /* CustomEvent unsupported: non-fatal */
  }
}

/** Save + apply in one call (the banner's accept / reject / save actions). */
export function setConsent(choices: ConsentChoices): void {
  saveConsent(choices);
  applyConsent(choices);
}
