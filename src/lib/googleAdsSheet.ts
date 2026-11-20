/*
  The Google Ads report Sheet (/ads-report?view=google-ads), read through the owner's Apps Script bridge (no Google
  Cloud project): POST {token, tabs} to ADS_SHEET_BRIDGE_URL; Apps Script answers with a 302 to
  script.googleusercontent.com, which fetch follows (as a GET). Off unless ADS_SHEET_BRIDGE_URL and
  ADS_SHEET_BRIDGE_TOKEN are set. Server side only: the token and the URL never reach the browser, a log or an error.
  The click tabs (CLICK_TABS) are requested only with `clickIds`, the ERP leads' click ids: the bridge returns just
  the rows whose GCLID is in that list, for the server-side lead join. Those rows stay on the server (SheetData.clicks):
  never rendered, logged or sent on. A click tab with any other row means the bridge didn't filter it: dropped.
*/

import { gunzipSync, gzipSync } from "node:zlib";
import { kvConfigured, pipeline as kvPipeline, previewData } from "@/lib/adLandings";

export const TABS = [
  "_Status", "Alerts",
  "Perf_Campaigns_Daily", "Perf_AdGroups_Daily", "Perf_Ads_Daily", "Perf_Conversions_Daily", "Perf_Devices_Daily",
  "Perf_Keywords_Daily", "Perf_SearchTerms_Daily", "Perf_Locations_30d", "Perf_CampaignAssets_30d",
  "Setup_Campaigns", "Setup_Keywords", "Setup_Ads", "Change_Log_30d", "Setup_History",
] as const;
/** Clicks_History (kept by the script) when the Sheet has it, else Perf_Clicks_Last7Days. */
export const CLICK_TABS = ["Clicks_History", "Perf_Clicks_Last7Days"] as const;
export type Tab = (typeof TABS)[number];
export type Cell = string | number | boolean;
export interface SheetData {
  /** Each tab as rows, its header row first (the Sheet's own layout). */
  tabs: Partial<Record<Tab, Cell[][]>>;
  /** Click rows of the ERP leads' click ids (header row first), or null: the join isn't available. Server only. */
  clicks: Cell[][] | null;
  fetchedAt: number;
}

/**
 * The first click tab the bridge sent, if every row's GCLID is one of `ids` (the bridge filtered it); else null.
 * An empty list of ids asks for nothing, so there's nothing to join.
 */
export function filteredClicks(tabs: Record<string, { headers?: unknown; rows?: unknown }> | undefined, ids: string[]): Cell[][] | null {
  const want = new Set(ids);
  for (const t of CLICK_TABS) {
    const v = tabs?.[t];
    if (!v || !Array.isArray(v.headers) || !Array.isArray(v.rows)) continue;
    const col = (v.headers as Cell[]).findIndex((h) => String(h).trim() === "GCLID");
    const rows = (v.rows as unknown[]).filter(Array.isArray) as Cell[][];
    if (col < 0 || !want.size || !rows.every((r) => want.has(String(r[col] ?? "").trim()))) return null;
    return [v.headers as Cell[], ...rows];
  }
  return null;
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
 * One POST to the bridge for every tab in TABS (and the click tabs, filtered to `clickIds`). Returns the tabs as rows
 * (header row first) and the checks, or throws a BridgeError saying which check failed. Text from the bridge is cut
 * short and never carries the token.
 */
export async function callBridge(url: string, token: string, fetchImpl: FetchLike = fetch, clickIds: string[] = []): Promise<{ data: SheetData; checks: Check[] }> {
  const safe = (s: unknown) => String(s ?? "").split(token).join("[hidden]").slice(0, 160);
  let res: Response;
  try {
    res = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, tabs: clickIds.length ? [...TABS, ...CLICK_TABS] : TABS, ...(clickIds.length ? { clickIds } : {}) }),
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
  return { data: { tabs, clicks: filteredClicks(out.tabs, clickIds), fetchedAt: Date.now() }, checks: all };
}

/* ---------- Cache and read ---------- */

function config() {
  const url = process.env.ADS_SHEET_BRIDGE_URL, token = process.env.ADS_SHEET_BRIDGE_TOKEN;
  return url && token ? { url, token } : null;
}

const RETRY_MS = 60_000;

/*
  The last good bridge read is kept in the KV store (the landing counter's Upstash Redis), shared by every server
  instance: one string, the TABS (never the click tabs) and the read time as gzipped JSON, base64. Preview
  deployments keep their own key, as the counter does. A memory copy stands in when the store is off or fails.
*/
export const cacheKey = () => `${previewData() ? "gads-preview" : "gads"}:sheet:v1`;
const CACHE_TTL_S = 7 * 86_400;
/** Upstash takes up to 10 MB per request (Free and Pay as you go); a bigger copy isn't stored (the memory copy still is). */
export const MAX_STORED = 9_000_000;

export const packCopy = (d: Pick<SheetData, "tabs" | "fetchedAt">) => gzipSync(JSON.stringify({ tabs: d.tabs, fetchedAt: d.fetchedAt })).toString("base64");
/** The stored copy back, known tabs only (never click rows, whatever the string holds); null if it isn't one. */
export function unpackCopy(s: string): SheetData | null {
  const v = JSON.parse(gunzipSync(Buffer.from(s, "base64")).toString("utf8")) as { tabs?: Record<string, unknown>; fetchedAt?: unknown };
  if (typeof v?.fetchedAt !== "number" || !v.tabs || typeof v.tabs !== "object") return null;
  const tabs: SheetData["tabs"] = {};
  for (const t of TABS) if (Array.isArray(v.tabs[t])) tabs[t] = v.tabs[t] as Cell[][];
  return { tabs, clicks: null, fetchedAt: v.fetchedAt };
}

/** The script fills the Sheet at 06:00, 13:00 and 20:00 Dubai; a copy read before the latest of these + 15 min is due. */
const RUNS_MIN = [6 * 60 + 15, 13 * 60 + 15, 20 * 60 + 15];
const DUBAI_MS = 4 * 3_600_000;
export function lastScheduledRun(now = Date.now()): number {
  const local = now + DUBAI_MS;
  const day = local - (local % 86_400_000);
  const mins = (local - day) / 60_000;
  const m = RUNS_MIN.findLast((r) => r <= mins);
  return (m != null ? day + m * 60_000 : day - 86_400_000 + RUNS_MIN[RUNS_MIN.length - 1] * 60_000) - DUBAI_MS;
}

const why = (err: unknown) => (err instanceof Error ? err.message : "unexpected error").slice(0, 80);

async function loadCopy(): Promise<SheetData | null> {
  if (!kvConfigured()) return null;
  const [r] = await kvPipeline([["GET", cacheKey()]]);
  return typeof r?.result === "string" ? unpackCopy(r.result) : null;
}

/** Store the copy (sizes logged, never content); a failure is logged and the read still counts. */
async function storeCopy(d: SheetData) {
  if (!kvConfigured()) return;
  try {
    const packed = packCopy(d);
    if (packed.length > MAX_STORED) return console.warn(`Google Ads cache not stored: ${packed.length} bytes is over ${MAX_STORED}`);
    await kvPipeline([["SET", cacheKey(), packed, "EX", CACHE_TTL_S]]);
    console.log(`Google Ads cache stored: ${packed.length} bytes (gzip + base64 of ${Buffer.byteLength(JSON.stringify(d.tabs))} bytes of tabs)`);
  } catch (err) {
    console.error(`Google Ads cache write failed: ${why(err)}`);
  }
}

// Memory: the tabs copy (used when the store is off, fails or is older) and the click rows, which never leave this
// instance. A copy from the store has no click rows: one background bridge call per instance fetches them.
let last: SheetData | null = null;
let clicks: Cell[][] | null = null;
let clicksAsked = false;
let lastFail = 0;
let inflight: Promise<SheetData> | null = null;
/** The latest click ids the page passed: the next bridge call asks for their click rows. */
let ids: string[] = [];

/** One bridge call at a time; a success replaces the copy (memory and store), a failure is logged (check and detail only) and rethrown. */
function refresh(url: string, token: string): Promise<SheetData> {
  const asked = ids.length > 0;
  inflight ??= callBridge(url, token, fetch, ids)
    .then(async (r) => {
      last = { ...r.data, clicks: null };
      clicks = r.data.clicks;
      clicksAsked = asked;
      await storeCopy(r.data);
      return r.data;
    })
    .catch((err: unknown) => {
      lastFail = Date.now();
      const failed = (err instanceof BridgeError ? err.checks : []).find((x) => x.ok === false);
      // The failed check and its detail only (an HTTP status or the bridge's short error): never the token or URL.
      console.error(`Google Ads bridge failed: ${failed?.label ?? "unknown"}: ${failed?.detail ?? "unexpected error"}`);
      throw err;
    })
    .finally(() => (inflight = null));
  return inflight;
}

/** Where the copy came from: the store, this instance's memory, or the bridge just now (the load waited for it). */
export type Via = "redis" | "memory" | "bridge";
export type SheetRead = { kind: "off" | "error"; diagnosis: Diagnosis } | { kind: "ok" | "stale"; data: SheetData; via: Via; due?: boolean };

/**
 * The Sheet: the stored copy (or the memory copy when newer, or when the store is off or fails) at once. When it was
 * read before the latest scheduled script run (+15 min, `due`), or this instance has no click rows yet, a bridge read
 * starts in the background (`schedule`: Next's after(), so it outlives the response). Only a load with no copy anywhere
 * and the Refresh button (`force`) wait for the bridge. "stale" when the latest read failed (the page says "Data could
 * not be refreshed"); "error" with the checks when there is no copy; "off" without the env vars.
 * `clickIds`: the ERP leads' click ids for the next bridge call's click rows. Never throws.
 */
export async function readGoogleAdsSheet(force = false, schedule: (task: () => Promise<unknown>) => void = (t) => void t(), clickIds?: string[]): Promise<SheetRead> {
  const c = config();
  if (!c) return { kind: "off", diagnosis: diagnose(checks([])) };
  if (clickIds) ids = [...new Set(clickIds.map((s) => s.trim()).filter(Boolean))].sort();
  if (!force) {
    let copy: SheetData | null = null;
    let via: Via = "redis";
    try {
      copy = await loadCopy();
    } catch (err) {
      console.error(`Google Ads cache read failed: ${why(err)}`);
    }
    if (last && (!copy || last.fetchedAt > copy.fetchedAt)) [copy, via] = [last, "memory"];
    if (copy) {
      last = copy;
      const now = Date.now();
      const due = copy.fetchedAt < lastScheduledRun(now);
      const needClicks = !clicks && !clicksAsked && ids.length > 0;
      if ((due || needClicks) && now - lastFail >= RETRY_MS) schedule(() => refresh(c.url, c.token).catch(() => undefined));
      return { kind: lastFail > copy.fetchedAt ? "stale" : "ok", data: { ...copy, clicks }, via, due };
    }
  }
  try {
    return { kind: "ok", data: await refresh(c.url, c.token), via: "bridge" };
  } catch (err) {
    const list = err instanceof BridgeError ? err.checks : checks([[false, "Unexpected error"]]);
    return last ? { kind: "stale", data: { ...last, clicks }, via: "memory" } : { kind: "error", diagnosis: diagnose(list) };
  }
}
