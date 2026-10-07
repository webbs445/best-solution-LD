import { getClid } from "./analytics";

/*
  Lead attribution for the visit, without cookies: Google Ads click IDs (gclid, gbraid, wbraid) and the
  five UTM parameters. On the first landing of a visit they are read from the URL and kept in
  sessionStorage (this tab only, cleared when the tab closes). First touch wins: once stored, they are
  never overwritten, so a lead sent later in the visit, on any page, still carries them. Nothing is
  stored when the URL has none of them, and nothing is pushed to the dataLayer.
*/

const KEY = "bs_attribution";
const KEYS = ["gclid", "gbraid", "wbraid", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

export type Attribution = Record<(typeof KEYS)[number], string>;

function fromUrl(): Attribution {
  const q = new URLSearchParams(window.location.search);
  return Object.fromEntries(KEYS.map((k) => [k, (q.get(k) || "").trim().slice(0, 500)])) as Attribution;
}

/** Store this visit's first-touch attribution from the URL, unless the visit already has it. */
export function captureAttribution(): void {
  try {
    if (sessionStorage.getItem(KEY)) return;
    const a = fromUrl();
    if (KEYS.some((k) => a[k])) sessionStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    // Storage blocked (private mode, disabled site data): leads fall back to the current URL.
  }
}

/** This visit's attribution: the stored first touch, or the current URL when nothing is stored. */
export function getAttribution(): Attribution {
  try {
    const stored = JSON.parse(sessionStorage.getItem(KEY) || "null") as Partial<Attribution> | null;
    if (stored) return Object.fromEntries(KEYS.map((k) => [k, stored[k] || ""])) as Attribution;
  } catch {
    // Fall through to the URL.
  }
  return fromUrl();
}

/**
  The attribution fields every lead form sends. click_id is the Google click ID (gclid, then gbraid,
  then wbraid); without one it falls back to the consented ad cookies (gclid, fbclid, li_fat_id).
*/
export function attributionFields(): Attribution & { click_id: string } {
  captureAttribution();
  const a = getAttribution();
  return { ...a, click_id: a.gclid || a.gbraid || a.wbraid || getClid() };
}
