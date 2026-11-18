/*
  The Google Ads report Sheet (/ads-report?view=google-ads), read through the owner's Apps Script bridge (no Google
  Cloud project): POST {token, tabs} to ADS_SHEET_BRIDGE_URL; Apps Script answers with a 302 to
  script.googleusercontent.com, which fetch follows (as a GET). Off unless ADS_SHEET_BRIDGE_URL and
  ADS_SHEET_BRIDGE_TOKEN are set. Server side only: the token and the URL never reach the browser, a log or an error.
  Only the tabs in TABS are requested: Perf_Clicks_Last7Days (click IDs) never is.
*/

export const TABS = [
  "_Status", "Alerts",
  "Perf_Campaigns_Daily", "Perf_AdGroups_Daily", "Perf_Ads_Daily", "Perf_Conversions_Daily", "Perf_Devices_Daily", "Perf_Channels_Daily",
  "Perf_Keywords_Daily", "Perf_SearchTerms_Daily", "Perf_Locations_30d", "Perf_Ages_30d", "Perf_Audiences_30d", "Perf_CampaignAssets_30d",
  "Setup_Campaigns", "Setup_Keywords", "Setup_Ads", "Change_Log_30d", "Setup_History",
] as const;
export type Tab = (typeof TABS)[number];
export type Cell = string | number | boolean;
export interface SheetData {
  /** Each tab as rows, its header row first (the Sheet's own layout). */
  tabs: Partial<Record<Tab, Cell[][]>>;
  fetchedAt: number;
}

export const ENV_NAMES = ["ADS_SHEET_BRIDGE_URL", "ADS_SHEET_BRIDGE_TOKEN"] as const;
export const TIMEOUT_MS = 30_000;

/* ---------- Status checks, shown on the card when the view isn't working (signed-in users only) ---------- */

export interface Check {
  label: string;
  /** true passed, false failed, null not reached. */
  ok: boolean | null;
  detail: string;
}
export interface Diagnosis {
  /** Each variable's name and whether it is set (never its value). */
  env: { name: string; set: boolean }[];
  checks: Check[];
}

const CHECKS = ["Bridge reachable", "Password accepted", "Tabs received"] as const;
const checks = (states: [boolean, string][]): Check[] =>
  CHECKS.map((label, i) => ({ label, ok: states[i]?.[0] ?? null, detail: states[i]?.[1] ?? "not reached" }));
const diagnose = (c: Check[]): Diagnosis => ({ env: ENV_NAMES.map((name) => ({ name, set: !!process.env[name] })), checks: c });

/** A failed bridge call, with the checks up to the one that failed. */
export class BridgeError extends Error {
  constructor(readonly checks: Check[]) {
    super(checks.find((c) => c.ok === false)?.detail ?? "bridge failed");
  }
}

/* ---------- The bridge call ---------- */

type BridgeJson = { ok?: boolean; error?: unknown; tabs?: Record<string, { headers?: unknown; rows?: unknown }>; missing?: unknown };
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/**
 * One POST to the bridge for every tab in TABS. Returns the tabs as rows (header row first) and the checks, or throws
 * a BridgeError saying which check failed. Text from the bridge is cut short and never carries the token.
 */
export async function callBridge(url: string, token: string, fetchImpl: FetchLike = fetch): Promise<{ data: SheetData; checks: Check[] }> {
  const safe = (s: unknown) => String(s ?? "").split(token).join("[hidden]").slice(0, 160);
  let res: Response;
  try {
    res = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, tabs: TABS }),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    throw new BridgeError(checks([[false, timedOut ? `No answer within ${TIMEOUT_MS / 1000} s` : "No answer (network error)"]]));
  }
  const text = await res.text().catch(() => "");
  let out: BridgeJson | null = null;
  try {
    out = JSON.parse(text) as BridgeJson;
  } catch {
    // Apps Script error pages (script errors, wrong deployment access) are HTML, often with HTTP 200.
  }
  if (!res.ok) throw new BridgeError(checks([[false, `HTTP ${res.status}`]]));
  if (!out || typeof out !== "object") throw new BridgeError(checks([[false, `HTTP ${res.status}, but not JSON (an HTML page: a script error or the wrong access setting)`]]));
  const reached: [boolean, string] = [true, `HTTP ${res.status}`];
  if (out.ok !== true) throw new BridgeError(checks([reached, [false, out.error === "unauthorized" ? "No: unauthorized (the token doesn't match)" : `No: ${safe(out.error) || "the bridge said not ok"}`]]));
  // Only known tabs are kept, as rows with the header row first; anything else the bridge sends is dropped.
  const tabs: SheetData["tabs"] = {};
  for (const t of TABS) {
    const v = out.tabs?.[t];
    if (v && Array.isArray(v.headers) && Array.isArray(v.rows)) tabs[t] = [v.headers as Cell[], ...(v.rows as unknown[]).filter(Array.isArray) as Cell[][]];
  }
  const missing = TABS.filter((t) => !tabs[t]);
  const received = TABS.length - missing.length;
  const tabsCheck: [boolean, string] = [received > 0, `${received} of ${TABS.length} received${missing.length ? `; missing: ${missing.join(", ")}` : ""}`];
  const all = checks([reached, [true, "Yes"], tabsCheck]);
  if (!received) throw new BridgeError(all);
  return { data: { tabs, fetchedAt: Date.now() }, checks: all };
}

/* ---------- Cache and read ---------- */

function config() {
  const url = process.env.ADS_SHEET_BRIDGE_URL, token = process.env.ADS_SHEET_BRIDGE_TOKEN;
  return url && token ? { url, token } : null;
}

export const CACHE_MS = 15 * 60_000;
const RETRY_MS = 60_000;

// ponytail: per-instance memory cache (the keyword and search-term tabs can pass Next's 2 MB data-cache limit).
// Each server instance reads the Sheet at most once per 15 minutes; move to a shared store if instances multiply.
let last: SheetData | null = null;
let lastFail = 0;
let inflight: Promise<{ data: SheetData; checks: Check[] }> | null = null;

export type SheetRead = { kind: "off" | "error"; diagnosis: Diagnosis } | { kind: "ok" | "stale"; data: SheetData };

/**
 * The Sheet, from memory when under 15 minutes old. `force` (the Refresh button) reads it now. When the bridge fails:
 * the last copy as "stale", or "error" with the checks. Without the env vars: "off". Never throws.
 */
export async function readGoogleAdsSheet(force = false): Promise<SheetRead> {
  const c = config();
  if (!c) return { kind: "off", diagnosis: diagnose(checks([])) };
  const now = Date.now();
  if (!force && last && now - last.fetchedAt < CACHE_MS) return { kind: "ok", data: last };
  // Right after a failure, don't call the bridge again on every page load.
  if (!force && last && now - lastFail < RETRY_MS) return { kind: "stale", data: last };
  try {
    inflight ??= callBridge(c.url, c.token).finally(() => (inflight = null));
    last = (await inflight).data;
    return { kind: "ok", data: last };
  } catch (err) {
    lastFail = Date.now();
    const list = err instanceof BridgeError ? err.checks : checks([[false, "Unexpected error"]]);
    const failed = list.find((x) => x.ok === false);
    // The failed check and its detail only (an HTTP status or the bridge's short error): never the token or URL.
    console.error(`Google Ads bridge failed: ${failed?.label ?? "unknown"}: ${failed?.detail ?? ""}`);
    return last ? { kind: "stale", data: last } : { kind: "error", diagnosis: diagnose(list) };
  }
}
