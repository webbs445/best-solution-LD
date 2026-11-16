/*
  The maths behind /internal/ad-landings: date ranges and the previous equal period, totals and rates, the change on
  the previous period, test-visit exclusion, breakdowns by page and click type, and the CSV. Pure functions only; the
  stored data comes from lib/adLandings (readRaw) and the notes from lib/adLandingsNotes.
*/
import { KEEP_DAYS, METRICS, type ClickParam, type Metric } from "@/lib/adLandings";
import type { TestNote } from "@/lib/adLandingsNotes";

export interface Entry {
  date: string;
  path: string;
  param: ClickParam;
  metric: Metric;
  n: number;
}

export interface Totals {
  land: number;
  shown: number;
  accept_all: number;
  reject_all: number;
  manage: number;
  /** Banner shown minus the three choices: visitors who left the banner unanswered. */
  none: number;
}

export interface Rates {
  accept: number | null;
  reject: number | null;
  manage: number | null;
  none: number | null;
}

/* ---------- Dates and ranges ---------- */

const DAY = 86_400_000;
export const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
export const daysIn = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY) + 1;
/** Every date from `from` to `to`, oldest first. */
export const datesBetween = (from: string, to: string) => Array.from({ length: Math.max(0, daysIn(from, to)) }, (_, i) => addDays(from, i));
const isDate = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

/** The day the counter went live (the "From start" range starts here). */
export const COUNT_START = "2026-11-16";

/** Same keys as the ads dashboard's range chips, so the range carries over between its views. */
export type RangeKey = "today" | "7d" | "30d" | "since" | "custom";
export interface Range {
  key: RangeKey;
  from: string;
  to: string;
  /** The previous period of equal length, or null when it reaches past what is kept. */
  prevFrom: string | null;
  prevTo: string | null;
  /** Why a custom range was refused (the page falls back to the default), or "". */
  error: string;
}

/** The selected range from the query (?range=today|7d|30d, or ?from=&to=), defaulting to the last 7 days. */
export function pickRange(q: URLSearchParams, today: string): Range {
  const oldest = addDays(today, -(KEEP_DAYS - 1));
  const from = q.get("from"), to = q.get("to");
  let key: RangeKey = (["today", "7d", "30d", "since"] as const).find((k) => k === q.get("range")) ?? "7d";
  let start = key === "since" ? (COUNT_START < today ? COUNT_START : today) : addDays(today, key === "today" ? 0 : key === "7d" ? -6 : -29);
  let end = today, error = "";
  if (from || to) {
    if (!isDate(from) || !isDate(to)) error = "Choose both dates.";
    else if (to > today) error = "The end date can't be in the future.";
    else if (to < from) error = "The end date must be on or after the start date.";
    else if (from < oldest) error = `Counts are kept for ${KEEP_DAYS} days. Pick a start on or after ${oldest}.`;
    else [key, start, end] = ["custom", from, to];
  }
  const prevFrom = addDays(start, -daysIn(start, end));
  // No comparison for "From start" (nothing before it) or past what is kept (same rule as the ads dashboard).
  return key === "since" || prevFrom < oldest
    ? { key, from: start, to: end, prevFrom: null, prevTo: null, error }
    : { key, from: start, to: end, prevFrom, prevTo: addDays(start, -1), error };
}

/* ---------- Entries, exclusion and totals ---------- */

/** One day's stored hash (flat [field, value, ...]) as entries. Skips the daily-cap field (`<path>|*`) and anything unknown. */
export function parseDay(date: string, flat: unknown): Entry[] {
  const list = Array.isArray(flat) ? flat : [];
  const out: Entry[] = [];
  for (let i = 0; i + 1 < list.length; i += 2) {
    const [path, param, metric] = String(list[i]).split("|");
    const n = Number(list[i + 1]) || 0;
    if (path && param && METRICS.includes(metric as Metric) && n > 0) out.push({ date, path, param: param as ClickParam, metric: metric as Metric, n });
  }
  return out;
}

/** Take each test note's counts off its own day, page and click type (never below zero). */
export function excludeTests(entries: Entry[], notes: TestNote[]): Entry[] {
  return entries.map((e) => {
    const off = notes
      .filter((t) => t.date === e.date && t.path === e.path && t.param === e.param)
      .reduce((s, t) => s + (t.counts[e.metric] ?? 0), 0);
    return off ? { ...e, n: Math.max(0, e.n - off) } : e;
  });
}

export function totals(entries: Entry[]): Totals {
  const t: Totals = { land: 0, shown: 0, accept_all: 0, reject_all: 0, manage: 0, none: 0 };
  for (const e of entries) t[e.metric] += e.n;
  t.none = Math.max(0, t.shown - t.accept_all - t.reject_all - t.manage);
  return t;
}

/* ---------- Rates and change ---------- */

/** a ÷ b, or null when b is 0 (shown as "–"). */
export const ratio = (a: number, b: number) => (b > 0 ? a / b : null);

/** Banner choices as shares of banners shown. */
export const rates = (t: Totals): Rates => ({
  accept: ratio(t.accept_all, t.shown),
  reject: ratio(t.reject_all, t.shown),
  manage: ratio(t.manage, t.shown),
  none: ratio(t.none, t.shown),
});

/** Below this, a change on the previous period is noise and is not shown (same rule as the Ads dashboard). */
export const MIN_FOR_CHANGE = 5;

/** Count change in whole percent, or null with no fair comparison (no previous period, or under 5 either side). */
export function countChange(cur: number, prev: number | null): number | null {
  if (prev == null || cur < MIN_FOR_CHANGE || prev < MIN_FOR_CHANGE) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

/** Rate change in percentage points (one decimal), or null unless both periods showed the banner at least 5 times. */
export function rateChange(cur: number | null, prev: number | null, curShown: number, prevShown: number | null): number | null {
  if (cur == null || prev == null || prevShown == null || curShown < MIN_FOR_CHANGE || prevShown < MIN_FOR_CHANGE) return null;
  return Math.round((cur - prev) * 1000) / 10;
}

/* ---------- Breakdowns ---------- */

export interface DayRow extends Totals {
  date: string;
}

/** One row per date in the range (oldest first), zeros included. */
export function dailyRows(entries: Entry[], from: string, to: string): DayRow[] {
  const by = new Map<string, Entry[]>();
  for (const e of entries) by.set(e.date, [...(by.get(e.date) ?? []), e]);
  return datesBetween(from, to).map((date) => ({ date, ...totals(by.get(date) ?? []) }));
}

export interface GroupRow extends Totals {
  key: string;
  label: string;
}

const group = (entries: Entry[], keyOf: (e: Entry) => string, labelOf: (k: string) => string): GroupRow[] => {
  const by = new Map<string, Entry[]>();
  for (const e of entries) by.set(keyOf(e), [...(by.get(keyOf(e)) ?? []), e]);
  return [...by]
    .map(([key, es]) => ({ key, label: labelOf(key), ...totals(es) }))
    .filter((r) => r.land > 0 || r.shown > 0)
    .sort((a, b) => b.land - a.land || a.key.localeCompare(b.key));
};

export const byPath = (entries: Entry[]) => group(entries, (e) => e.path, (k) => k);

/** gbraid and wbraid come from iPhone / iOS clicks; gclid from other clicks. */
export const CLICK_TYPE_LABEL = { ios: "iPhone / iOS clicks", other: "Other clicks" } as const;
export const byClickType = (entries: Entry[]) =>
  group(entries, (e) => (e.param === "gclid" ? "other" : "ios"), (k) => CLICK_TYPE_LABEL[k as keyof typeof CLICK_TYPE_LABEL]);

/* ---------- Chart axis ---------- */

/** Y-axis steps from 0 to a round top at or above max: 1, 2 or 5 × 10ⁿ apart, about four steps, whole numbers. */
export function yTicks(max: number): number[] {
  const raw = Math.max(1, max) / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = Math.max(1, [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow);
  const top = Math.max(step, Math.ceil(Math.max(1, max) / step) * step);
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

/* ---------- CSV ---------- */

const pct = (v: number | null) => (v == null ? "" : (v * 100).toFixed(1));

/** The daily rows (newest first) and a total row, for the selected range. */
export function toCsv(rows: DayRow[], total: Totals): string {
  const head = "date,ad_landings,banner_shown,accept,reject,manage,no_choice,accept_rate_pct,reject_rate_pct,no_choice_rate_pct";
  const line = (date: string, t: Totals) => {
    const r = rates(t);
    return [date, t.land, t.shown, t.accept_all, t.reject_all, t.manage, t.none, pct(r.accept), pct(r.reject), pct(r.none)].join(",");
  };
  return [head, ...[...rows].reverse().map((r) => line(r.date, r)), line("total", total)].join("\n") + "\n";
}
