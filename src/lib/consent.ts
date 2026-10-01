/*
  Cookie-consent state + Google Consent Mode v2 plumbing, ported as-is from best-solution.ae
  (webbs445/bestsolution lib/consent.ts) so both sites share one consent contract.

  The visitor's category choices live in one first-party cookie (`bs_consent`). The default state
  (everything except strictly-necessary denied) is set by <ConsentInit> BEFORE GTM loads; this module
  handles the update path: saving the choice and pushing it to gtag/dataLayer.

  Keep the cookie name, shape and version in sync with the inline restore logic in
  src/components/analytics/ConsentInit.tsx and with the main site.
*/

export const CONSENT_COOKIE = "bs_consent";
// Bump when the category set changes: older cookies become invalid and the banner re-prompts.
export const CONSENT_VERSION = 1;
const CONSENT_MAX_AGE = 60 * 60 * 24 * 180; // 180 days, in seconds

// `necessary` is always on (not stored as a choice) and maps to security_storage only.
export type ConsentCategory = "analytics" | "marketing" | "functional";

export type ConsentChoices = Record<ConsentCategory, boolean>;

export interface StoredConsent extends ConsentChoices {
  v: number;
  ts: number;
}

export const ALL_GRANTED: ConsentChoices = { analytics: true, marketing: true, functional: true };
export const ALL_DENIED: ConsentChoices = { analytics: false, marketing: false, functional: false };

/** Map the categories onto Google Consent Mode v2 signals. security_storage is always granted. */
export function toConsentSignals(c: ConsentChoices): Record<string, "granted" | "denied"> {
  const g = (v: boolean) => (v ? "granted" : "denied");
  return {
    security_storage: "granted",
    analytics_storage: g(c.analytics),
    ad_storage: g(c.marketing),
    ad_user_data: g(c.marketing),
    ad_personalization: g(c.marketing),
    functionality_storage: g(c.functional),
    personalization_storage: g(c.functional),
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
    return { analytics: !!parsed.analytics, marketing: !!parsed.marketing, functional: !!parsed.functional };
  } catch {
    return null;
  }
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
  const w = window as typeof window & {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    clarity?: (...args: unknown[]) => void;
    __bsReleaseClarity?: () => void;
  };
  // Clarity ignores Consent Mode; its own consent API lifts the cookie block set in ConsentInit.
  const g = (v: boolean) => (v ? "granted" : "denied");
  w.clarity?.("consentv2", { ad_Storage: g(choices.marketing), analytics_Storage: g(choices.analytics) });
  // Let the parked Clarity script load now that analytics is allowed (see ConsentInit).
  if (choices.analytics) w.__bsReleaseClarity?.();
  w.dataLayer = w.dataLayer || [];
  if (typeof w.gtag === "function") {
    w.gtag("consent", "update", toConsentSignals(choices));
  } else {
    // Fallback if the gtag shim somehow hasn't initialised yet.
    w.dataLayer.push(["consent", "update", toConsentSignals(choices)]);
  }
  w.dataLayer.push({ event: "consent_update", consent: choices });
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
