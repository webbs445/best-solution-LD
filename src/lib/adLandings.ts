/*
  Ad landing counts: aggregate daily totals only. No cookies, no IP, no IDs, no click ID values: the browser reports
  that a page was opened with a gclid / gbraid / wbraid (the parameter's name only), whether the cookie banner showed,
  and the banner choice. Stored in Vercel KV (Upstash Redis REST API) as one hash per Dubai day (key adl:<date>, or
  adl-preview:<date> on preview deployments, so test counts never mix with the live site's),
  field `<path>|<param>|<metric>`, kept for 400 days, plus `<path>|*` (beacons that day, for the daily cap; not shown).
  Also, since device counting went live, `dev|<device>|<metric>` and `os|<system>|<metric>`: the device type and system as bucket
  names only (worked out in the browser; the user agent string and screen size never leave it). Days before that, and
  pages loaded before the update, have no device fields: the dashboard shows them as "Not recorded".
  "No choice" is derived: banner shown minus the three choices.
*/

export const CLICK_PARAMS = ["gclid", "gbraid", "wbraid"] as const;
export const METRICS = ["land", "shown", "accept_all", "reject_all", "manage"] as const;
export const DEVICES = ["phone", "tablet", "desktop"] as const;
export const SYSTEMS = ["ios", "android", "other"] as const;
export type ClickParam = (typeof CLICK_PARAMS)[number];
export type Metric = (typeof METRICS)[number];
export type Device = (typeof DEVICES)[number];
export type System = (typeof SYSTEMS)[number];
export interface Beacon {
  path: string;
  param: ClickParam;
  metrics: Metric[];
  /** Bucket names only; missing on pages loaded before device counting started. */
  device?: Device;
  system?: System;
}

export const KEEP_DAYS = 400;
const PATH_RE = /^\/[a-z0-9-]{0,40}(\/[a-z0-9-]{1,40})?$/;

/** The beacon body, or null for anything outside the fixed vocabulary (so nothing free-form is ever stored). */
export function parseBeacon(body: string): Beacon | null {
  if (body.length > 300) return null;
  try {
    const b = JSON.parse(body) as Partial<Beacon>;
    const metrics = Array.isArray(b.metrics) ? [...new Set(b.metrics)] : [];
    if (typeof b.path !== "string" || !PATH_RE.test(b.path)) return null;
    if (!CLICK_PARAMS.includes(b.param as ClickParam)) return null;
    if (!metrics.length || metrics.length > 2 || !metrics.every((m) => METRICS.includes(m as Metric))) return null;
    // Device and system: optional, but when sent they must be one of the bucket names (never a raw value).
    if (b.device !== undefined && !DEVICES.includes(b.device as Device)) return null;
    if (b.system !== undefined && !SYSTEMS.includes(b.system as System)) return null;
    // Only these fields are kept: anything else in the body is dropped here.
    const out: Beacon = { path: b.path, param: b.param as ClickParam, metrics: metrics as Metric[] };
    if (b.device) out.device = b.device as Device;
    if (b.system) out.system = b.system as System;
    return out;
  } catch {
    return null;
  }
}

/** YYYY-MM-DD in Dubai time (UTC+4, no daylight saving). */
export const dubaiDate = (ms = Date.now()) => new Date(ms + 4 * 3_600_000).toISOString().slice(0, 10);

const key = (date: string) => `${isPreview() ? "adl-preview" : "adl"}:${date}`;

/** True on a preview deployment, whose counts are kept apart from the live site's. */
export const previewData = () => isPreview();

function kv() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

/** True when the KV store is connected (env vars set). */
export const kvConfigured = () => !!kv();

async function pipeline(cmds: (string | number)[][]): Promise<{ result: unknown }[]> {
  const c = kv();
  if (!c) throw new Error("KV not configured");
  const res = await fetch(`${c.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KV ${res.status}`);
  return res.json();
}

/** Beacons counted per path per day; anything above is ignored, so a flood can't inflate a day's totals without limit. */
export const DAILY_CAP = 5000;

/** Vercel preview deployments share the production store, so they count into their own keys (adl-preview:). */
const isPreview = () => process.env.VERCEL_ENV === "preview";

/**
 * The page origins whose beacons count: the live site (AD_LANDING_ORIGIN overrides it for local test runs) and, on a
 * preview deployment only, that deployment's own address.
 */
export const allowedOrigin = (origin: string | null) =>
  !!origin &&
  (origin === (process.env.AD_LANDING_ORIGIN || "https://business.best-solution.ae") ||
    (isPreview() && [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL].some((h) => h && origin === `https://${h}`)));

/** Add one to each metric of the beacon in today's totals, unless the path already had DAILY_CAP beacons today. */
export async function countBeacon(b: Beacon, ms = Date.now()): Promise<boolean> {
  const k = key(dubaiDate(ms));
  const [seen] = await pipeline([["HINCRBY", k, `${b.path}|*`, 1], ["EXPIRE", k, KEEP_DAYS * 86_400]]);
  if (Number(seen?.result) > DAILY_CAP) return false;
  await pipeline(
    b.metrics.flatMap((m) => [
      ["HINCRBY", k, `${b.path}|${b.param}|${m}`, 1],
      ...(b.device ? [["HINCRBY", k, `dev|${b.device}|${m}`, 1]] : []),
      ...(b.system ? [["HINCRBY", k, `os|${b.system}|${m}`, 1]] : []),
    ]),
  );
  return true;
}

/** Each day's stored hash as HGETALL returns it (flat [field, value, ...]), keyed by date. Read only. */
export async function readRaw(dates: string[]): Promise<Record<string, unknown>> {
  if (!dates.length) return {};
  const out = await pipeline(dates.map((d) => ["HGETALL", key(d)]));
  return Object.fromEntries(dates.map((d, i) => [d, out[i]?.result]));
}
