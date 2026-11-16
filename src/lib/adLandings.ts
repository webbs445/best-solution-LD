/*
  Ad landing counts: aggregate daily totals only. No cookies, no IP, no IDs, no click ID values: the browser reports
  that a page was opened with a gclid / gbraid / wbraid (the parameter's name only), whether the cookie banner showed,
  and the banner choice. Stored in Vercel KV (Upstash Redis REST API) as one hash per Dubai day,
  field `<path>|<param>|<metric>`, kept for 400 days, plus `<path>|*` (beacons that day, for the daily cap; not shown).
  "No choice" is derived: banner shown minus the three choices.
*/

export const CLICK_PARAMS = ["gclid", "gbraid", "wbraid"] as const;
export const METRICS = ["land", "shown", "accept_all", "reject_all", "manage"] as const;
export type ClickParam = (typeof CLICK_PARAMS)[number];
export type Metric = (typeof METRICS)[number];
export interface Beacon {
  path: string;
  param: ClickParam;
  metrics: Metric[];
}

const KEEP_DAYS = 400;
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
    return { path: b.path, param: b.param as ClickParam, metrics: metrics as Metric[] };
  } catch {
    return null;
  }
}

/** YYYY-MM-DD in Dubai time (UTC+4, no daylight saving). */
export const dubaiDate = (ms = Date.now()) => new Date(ms + 4 * 3_600_000).toISOString().slice(0, 10);

const key = (date: string) => `adl:${date}`;

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

/** The only page origin whose beacons count (AD_LANDING_ORIGIN overrides it for local test runs). */
export const allowedOrigin = (origin: string | null) => origin === (process.env.AD_LANDING_ORIGIN || "https://business.best-solution.ae");

/** Add one to each metric of the beacon in today's totals, unless the path already had DAILY_CAP beacons today. */
export async function countBeacon(b: Beacon, ms = Date.now()): Promise<boolean> {
  const k = key(dubaiDate(ms));
  const [seen] = await pipeline([["HINCRBY", k, `${b.path}|*`, 1], ["EXPIRE", k, KEEP_DAYS * 86_400]]);
  if (Number(seen?.result) > DAILY_CAP) return false;
  await pipeline(b.metrics.map((m) => ["HINCRBY", k, `${b.path}|${b.param}|${m}`, 1]));
  return true;
}

export interface DayRow {
  date: string;
  land: number;
  shown: number;
  accept_all: number;
  reject_all: number;
  manage: number;
  none: number;
}

/** One day's hash (flat [field, value, ...] from HGETALL) summed across paths and click parameters. */
export function summarize(date: string, flat: unknown): DayRow {
  const row: DayRow = { date, land: 0, shown: 0, accept_all: 0, reject_all: 0, manage: 0, none: 0 };
  const list = Array.isArray(flat) ? flat : [];
  for (let i = 0; i + 1 < list.length; i += 2) {
    const metric = String(list[i]).split("|")[2] as Metric;
    if (METRICS.includes(metric)) row[metric] += Number(list[i + 1]) || 0;
  }
  row.none = Math.max(0, row.shown - row.accept_all - row.reject_all - row.manage);
  return row;
}

/** The last `days` Dubai days, newest first. */
export async function readDays(days: number, ms = Date.now()): Promise<DayRow[]> {
  const dates = Array.from({ length: days }, (_, i) => dubaiDate(ms - i * 86_400_000));
  const out = await pipeline(dates.map((d) => ["HGETALL", key(d)]));
  return dates.map((d, i) => summarize(d, out[i]?.result));
}
