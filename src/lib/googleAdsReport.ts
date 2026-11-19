import type { Cell } from "@/lib/googleAdsSheet";

/*
  The maths behind the Google Ads view (/ads-report?view=google-ads): Sheet rows by header name, periods and the
  previous equal period, totals and ratios, the campaign / keyword / search term / ad joins, the "Spend, no conv."
  flag, the settings history diff and the freshness badge. Pure functions only; the Sheet comes from lib/googleAdsSheet.
  Missing columns give null (shown as "–"), never 0 and never an error.
*/

export type Row = Record<string, Cell>;

/* ---------- Cells ---------- */

/** One tab as objects keyed by its header row (row `headerRow`); blank rows are dropped. Columns are found by name. */
export function rowsOf(values: Cell[][] | undefined, headerRow = 0): Row[] {
  const v = values ?? [];
  const head = (v[headerRow] ?? []).map((h) => String(h ?? "").trim());
  return v
    .slice(headerRow + 1)
    .filter((r) => r.some((c) => c !== "" && c != null))
    .map((r) => Object.fromEntries(head.flatMap((h, i) => (h ? [[h, r[i] ?? ""]] : []))));
}

export const str = (r: Row | undefined, h: string) => String(r?.[h] ?? "").trim();

/** A number, or null when the column is missing or empty. "<10%" and ">90%" become Google's 0.0999 and 0.9001. */
export function num(r: Row | undefined, h: string): number | null {
  const v = r?.[h];
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/,/g, "");
  if (/^<\s*10\s*%$/.test(s)) return 0.0999;
  if (/^>\s*90\s*%$/.test(s)) return 0.9001;
  const p = /^(-?[\d.]+)\s*%$/.exec(s);
  const n = p ? Number(p[1]) / 100 : s ? Number(s) : NaN;
  return Number.isFinite(n) ? n : null;
}

const serialIso = (v: number) => new Date(Math.round((v - 25569) * 86_400_000)).toISOString();

/** YYYY-MM-DD from a date cell (a Sheets serial number or text starting with the date), or "". */
export function dateOf(v: Cell | undefined): string {
  if (typeof v === "number") return v > 20000 && v < 100000 ? serialIso(v).slice(0, 10) : "";
  return /^(\d{4}-\d{2}-\d{2})/.exec(String(v ?? "").trim())?.[1] ?? "";
}

/** "YYYY-MM-DD HH:MM" (Dubai, the account's time zone) from a date-time cell; other text as it is. */
export function stampOf(v: Cell | undefined): string {
  if (typeof v === "number") return v > 20000 && v < 100000 ? serialIso(v).slice(0, 16).replace("T", " ") : String(v);
  const s = String(v ?? "").trim();
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/.exec(s);
  return m ? `${m[1]} ${m[2]}` : s;
}

/** Milliseconds for a "YYYY-MM-DD HH:MM" Dubai stamp, or null. */
export const stampMs = (stamp: string) => (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(stamp) ? Date.parse(`${stamp.replace(" ", "T")}:00+04:00`) : null);

/* ---------- Formatting ---------- */

export const DASH = "–";
const fixed = (v: number, dp: number) => v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

/** A share (0.07 = 7%). Google's "<10%" (0.0999) and ">90%" (0.9001) show as such. */
export function fmtShare(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return DASH;
  if (Math.abs(v - 0.0999) < 1e-6) return "<10%";
  if (Math.abs(v - 0.9001) < 1e-6) return ">90%";
  return `${(v * 100).toFixed(1)}%`;
}
export const fmtAed = (v: number | null, dp = 2) => (v == null || !Number.isFinite(v) ? DASH : `AED ${fixed(v, dp)}`);
/** Counts; conversions can be fractional (up to 2 decimals). */
export const fmtNum = (v: number | null) => (v == null || !Number.isFinite(v) ? DASH : v.toLocaleString("en-US", { maximumFractionDigits: 2 }));

/* ---------- Periods ---------- */

const DAY = 86_400_000;
export const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
export const daysIn = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY) + 1;
const isDate = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

export const PERIODS = [["today", "Today"], ["7d", "7D"], ["30d", "30D"], ["month", "MTD"]] as const;
export type PeriodKey = (typeof PERIODS)[number][0] | "custom";
export interface Period {
  key: PeriodKey;
  from: string;
  to: string;
  /** The previous period of the same length, ending the day before `from`. */
  prevFrom: string;
  prevTo: string;
  /** Why a custom range was refused (the default is shown instead), or "". */
  error: string;
}

/**
 * The period from ?range= (or ?from=&to=), as Google Ads counts them: "Last 7 / 30 days" end yesterday (today is
 * partial); MTD is this month to today. Default: last 7 days.
 */
export function pickPeriod(q: URLSearchParams, today: string): Period {
  let key: PeriodKey = PERIODS.find(([k]) => k === q.get("range"))?.[0] ?? "7d";
  const yesterday = addDays(today, -1);
  const preset: Record<Exclude<PeriodKey, "custom">, [string, string]> = {
    today: [today, today],
    "7d": [addDays(today, -7), yesterday],
    "30d": [addDays(today, -30), yesterday],
    month: [`${today.slice(0, 7)}-01`, today],
  };
  let [from, to] = preset[key as Exclude<PeriodKey, "custom">];
  let error = "";
  const qf = q.get("from"), qt = q.get("to");
  if (qf || qt) {
    if (!isDate(qf) || !isDate(qt)) error = "Choose both dates.";
    else if (qt > today) error = "The end date can't be in the future.";
    else if (qt < qf) error = "The end date must be on or after the start date.";
    else [key, from, to] = ["custom", qf, qt];
  }
  // MTD compares with the same days of last month (cut at its end); every other period with the same number of days
  // just before it.
  if (key === "month") {
    const pFrom = `${addDays(from, -1).slice(0, 7)}-01`;
    const pEnd = addDays(from, -1);
    return { key, from, to, prevFrom: pFrom, prevTo: [addDays(pFrom, daysIn(from, to) - 1), pEnd].sort()[0], error };
  }
  const prevTo = addDays(from, -1);
  return { key, from, to, prevFrom: addDays(from, -daysIn(from, to)), prevTo, error };
}

/** Rows whose Date is in [from, to], and of one campaign when `campaign` is set. */
export const inPeriod = (rows: Row[], from: string, to: string, campaign = "") =>
  rows.filter((r) => {
    const d = dateOf(r.Date);
    return d >= from && d <= to && (!campaign || str(r, "Campaign") === campaign);
  });

/* ---------- Totals ---------- */

export interface Totals {
  impr: number | null;
  clicks: number | null;
  cost: number | null;
  conv: number | null;
  allConv: number | null;
  /** Impression share parts: impressions with a share, and the eligible impressions they imply (impr ÷ share). */
  isImpr: number;
  elig: number;
  lostBudgetW: number;
  lostBudgetElig: number;
}

const plus = (a: number | null, b: number | null) => (b == null ? a : (a ?? 0) + b);
export const div = (a: number | null, b: number | null) => (a == null || b == null || b === 0 ? null : a / b);

export function totals(rows: Row[]): Totals {
  const t: Totals = { impr: null, clicks: null, cost: null, conv: null, allConv: null, isImpr: 0, elig: 0, lostBudgetW: 0, lostBudgetElig: 0 };
  for (const r of rows) {
    const impr = num(r, "Impr.");
    t.impr = plus(t.impr, impr);
    t.clicks = plus(t.clicks, num(r, "Clicks"));
    t.cost = plus(t.cost, num(r, "Cost (AED)"));
    t.conv = plus(t.conv, num(r, "Conversions"));
    t.allConv = plus(t.allConv, num(r, "All conv."));
    // Shares over several days or campaigns: weighted by eligible impressions, not averaged.
    const is = num(r, "Search impr. share");
    if (impr && is && is > 0) {
      const elig = impr / is;
      t.isImpr += impr;
      t.elig += elig;
      const lost = num(r, "Lost IS (budget)");
      if (lost != null) {
        t.lostBudgetW += lost * elig;
        t.lostBudgetElig += elig;
      }
    }
  }
  return t;
}

export const ctr = (t: Totals) => div(t.clicks, t.impr);
export const cpc = (t: Totals) => div(t.cost, t.clicks);
export const cpa = (t: Totals) => div(t.cost, t.conv);
export const imprShare = (t: Totals) => (t.elig ? t.isImpr / t.elig : null);
export const lostBudget = (t: Totals) => (t.lostBudgetElig ? t.lostBudgetW / t.lostBudgetElig : null);

/** Change on the previous period as a fraction (0.1 = +10%), or null without a fair base. */
export const change = (cur: number | null, prev: number | null) => (cur == null || prev == null || prev === 0 ? null : (cur - prev) / prev);

/** Cost at or above AED 50 with no conversion in the period. */
export const SPEND_NO_CONV_AED = 50;
export const spendNoConv = (t: Totals) => t.cost != null && t.cost >= SPEND_NO_CONV_AED && t.conv === 0;

export function groupBy(rows: Row[], key: (r: Row) => string): Map<string, Row[]> {
  const m = new Map<string, Row[]>();
  for (const r of rows) {
    const k = key(r);
    m.set(k, [...(m.get(k) ?? []), r]);
  }
  return m;
}
const newest = (rows: Row[]) => rows.reduce((a, b) => (dateOf(b.Date) >= dateOf(a.Date) ? b : a));
const byCostDesc = <T extends { t: Totals }>(a: T, b: T) => (b.t.cost ?? -1) - (a.t.cost ?? -1);

/* ---------- Campaigns ---------- */

export interface CampaignRow {
  id: string;
  name: string;
  /** From Setup_Campaigns (status now); the latest daily row when the campaign isn't in Setup. */
  status: string;
  type: string;
  budget: number | null;
  bidding: string;
  maxCpc: number | null;
  t: Totals;
  /** Not enabled now: shown greyed. */
  inactive: boolean;
  channel: Channel;
}

export const isEnabled = (status: string) => /^enabled$/i.test(status.trim());

/** Search, Demand Gen, or other (Performance Max, Display, …: only in "All"). */
/** A campaign type as Google writes it, normalised ("Demand Gen", "DEMAND_GEN" → "DEMAND_GEN"); "UNKNOWN" when blank. */
export type Channel = string;
export const channelOf = (type: string): Channel => type.trim().toUpperCase().replace(/[\s-]+/g, "_") || "UNKNOWN";

/**
 * Every campaign type the dashboard knows: its label, colour and short tag. The channel filter, the spend donut, the
 * stacked chart, legends and campaign icons all read from here. A type that isn't listed gets a title-cased label and
 * grey, so a new campaign type shows up without a code change.
 */
export const CHANNELS: Record<string, { label: string; color: string; tag: string }> = {
  SEARCH: { label: "Search", color: "#2F5BD3", tag: "S" },
  DEMAND_GEN: { label: "Demand Gen", color: "#E0702F", tag: "DG" },
  PERFORMANCE_MAX: { label: "Performance Max", color: "#7B5CE0", tag: "PM" },
  DISPLAY: { label: "Display", color: "#1F9E9E", tag: "D" },
  VIDEO: { label: "YouTube", color: "#E0457B", tag: "YT" },
  SHOPPING: { label: "Shopping", color: "#C99A12", tag: "SH" },
};
export function channelInfo(ch: Channel): { label: string; color: string; tag: string } {
  if (CHANNELS[ch]) return CHANNELS[ch];
  const label = ch.toLowerCase().split("_").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") || "Other";
  return { label, color: "#7A7F8C", tag: label.split(" ").map((w) => w[0]).join("").slice(0, 2) };
}
/** The channel in a URL (?channel=search, demand_gen; the older "demandgen" still works), or "" for All. */
export const channelParam = (v: string | null) => (v && v !== "all" ? channelOf(v === "demandgen" ? "DEMAND_GEN" : v) : "");

/**
 * Every campaign in Setup_Campaigns (enabled, paused or removed, with or without spend), plus any campaign that only
 * appears in `perf` (already cut to the period), with its period totals; joined by Campaign ID (or name). Cost high to low.
 */
export function campaignRows(perf: Row[], setup: Row[], campaign = ""): CampaignRow[] {
  const keyOf = (r: Row) => str(r, "Campaign ID") || str(r, "Campaign");
  const setupBy = new Map(setup.flatMap((r) => [[keyOf(r), r], [`name:${str(r, "Campaign")}`, r]] as [string, Row][]));
  const groups = groupBy(perf, keyOf);
  for (const s of setup) if (!groups.has(keyOf(s)) && (!campaign || str(s, "Campaign") === campaign)) groups.set(keyOf(s), []);
  return [...groups]
    .map(([id, rows]) => {
      const last = rows.length ? newest(rows) : undefined;
      const s = setupBy.get(id) ?? setupBy.get(`name:${str(last, "Campaign")}`);
      const status = str(s, "Campaign status") || str(last, "Campaign status");
      return {
        id,
        name: str(s, "Campaign") || str(last, "Campaign"),
        status,
        type: str(s, "Campaign type") || str(last, "Campaign type"),
        budget: num(s, "Daily budget (AED)"),
        bidding: str(s, "Bidding"),
        maxCpc: num(s, "Max CPC cap (AED)") || null,
        t: totals(rows),
        inactive: !isEnabled(status),
        channel: channelOf(str(s, "Campaign type") || str(last, "Campaign type")),
      };
    })
    .sort((a, b) => byCostDesc(a, b) || a.name.localeCompare(b.name));
}

/* ---------- Keywords and search terms ---------- */

/** Keyword text as Google may write it ("[a b]", "\"a b\"", "+a +b"), compared without the match-type marks. */
const kwText = (s: string) => s.toLowerCase().replace(/[[\]"+]/g, "").replace(/\s+/g, " ").trim();
/** "EXACT", "Exact", "Exact match" are one match type. */
export const matchType = (s: string) => s.toLowerCase().replace(/[_\s]*match$/, "").trim();
const isNegative = (v: Cell | undefined) => v === true || /^(true|yes|negative|1)$/i.test(String(v ?? "").trim());
const kwKey = (r: Row) => [str(r, "Campaign"), str(r, "Ad group"), kwText(str(r, "Keyword")), matchType(str(r, "Match type"))].join("|").toLowerCase();

export interface KeywordRow {
  campaign: string;
  adGroup: string;
  keyword: string;
  match: string;
  status: string;
  t: Totals;
  qs: number | null;
  expCtr: string;
  adRelevance: string;
  landingPage: string;
  finalUrl: string;
  flag: boolean;
}

/** Period metrics per keyword, with Quality Score and its 3 parts from Setup_Keywords (Campaign + Ad group + Keyword + Match type). */
export function keywordRows(perf: Row[], setup: Row[]): KeywordRow[] {
  const setupBy = new Map(setup.filter((r) => !isNegative(r.Negative)).map((r) => [kwKey(r), r]));
  return [...groupBy(perf, kwKey)]
    .map(([k, rows]) => {
      const last = newest(rows), s = setupBy.get(k), t = totals(rows);
      return {
        campaign: str(last, "Campaign"),
        adGroup: str(last, "Ad group"),
        keyword: str(last, "Keyword"),
        match: str(last, "Match type"),
        status: str(s, "Status"),
        t,
        qs: num(s, "Quality Score") || null,
        expCtr: str(s, "Expected CTR"),
        adRelevance: str(s, "Ad relevance"),
        landingPage: str(s, "Landing page experience"),
        finalUrl: str(s, "Keyword final URL"),
        flag: spendNoConv(t),
      };
    })
    .sort(byCostDesc);
}

export interface TermRow {
  campaign: string;
  adGroup: string;
  term: string;
  added: string;
  matched: string;
  t: Totals;
  flag: boolean;
}

/** Search terms over the period, one row per campaign + ad group + term (Added / excluded and the keyword: latest day). */
export function searchTermRows(perf: Row[]): TermRow[] {
  return [...groupBy(perf, (r) => [str(r, "Campaign"), str(r, "Ad group"), str(r, "Search term").toLowerCase()].join("|"))]
    .map(([, rows]) => {
      const last = newest(rows), t = totals(rows);
      return { campaign: str(last, "Campaign"), adGroup: str(last, "Ad group"), term: str(last, "Search term"), added: str(last, "Added / excluded"), matched: str(last, "Matched keyword"), t, flag: spendNoConv(t) };
    })
    .sort(byCostDesc);
}

/* ---------- Ad groups, ads, conversions, segments ---------- */

export interface NamedRow {
  key: string;
  label: string;
  sub: string;
  status: string;
  t: Totals;
}

export function adGroupRows(perf: Row[]): NamedRow[] {
  return [...groupBy(perf, (r) => `${str(r, "Campaign")}|${str(r, "Ad group ID") || str(r, "Ad group")}`)]
    .map(([key, rows]) => {
      const last = newest(rows);
      return { key, label: str(last, "Ad group"), sub: str(last, "Campaign"), status: str(last, "Ad group status"), t: totals(rows) };
    })
    .sort(byCostDesc);
}

export interface AdRow {
  setup: Row;
  t: Totals;
}

/** Every ad in Setup_Ads (of the campaign, when filtered) with its period metrics from Perf_Ads_Daily by Ad ID. */
export function adRows(setup: Row[], perf: Row[], campaign = ""): AdRow[] {
  const by = groupBy(perf, (r) => str(r, "Ad ID"));
  return setup
    .filter((r) => !campaign || str(r, "Campaign") === campaign)
    .map((r) => ({ setup: r, t: totals(by.get(str(r, "Ad ID")) ?? []) }))
    .sort(byCostDesc);
}

/** Conversions per campaign and conversion action. */
export function conversionRows(perf: Row[]): NamedRow[] {
  return [...groupBy(perf, (r) => `${str(r, "Campaign")}|${str(r, "Conversion action")}`)]
    .map(([key, rows]) => {
      const last = newest(rows);
      return { key, label: str(last, "Conversion action") || "(not set)", sub: str(last, "Campaign"), status: str(last, "Conversion category"), t: totals(rows) };
    })
    .sort((a, b) => (b.t.conv ?? 0) - (a.t.conv ?? 0) || (b.t.allConv ?? 0) - (a.t.allConv ?? 0));
}

/** Rows summed by one column (device, network, city, age range, audience name). */
export function segmentRows(rows: Row[], column: string): NamedRow[] {
  return [...groupBy(rows, (r) => str(r, column) || "(not set)")].map(([key, rs]) => ({ key, label: key, sub: "", status: "", t: totals(rs) })).sort(byCostDesc);
}

/* ---------- Status, alerts, freshness ---------- */

/** The _Status tab: label in column A, value in column B. */
export const statusOf = (values: Cell[][] | undefined) => new Map((values ?? []).map((r) => [String(r[0] ?? "").trim().toLowerCase(), r[1] ?? ""] as const));

export interface Alerts {
  /** "YYYY-MM-DD HH:MM" (Dubai), or "" when the tab has no "Checked at". */
  checkedAt: string;
  items: { type: string; where: string; detail: string }[];
}

/**
 * The Alerts tab, by position: header row ["Checked at <time>", "Type", "Where", "Detail"] (the time in A1), then one
 * row per alert ["", type, where, detail]. "All clear" is the script's "nothing found" row, not an alert.
 */
export function alertsOf(values: Cell[][] | undefined): Alerts {
  const v = values ?? [];
  const a1 = String(v[0]?.[0] ?? "").trim();
  const checkedAt = /^checked at\b/i.test(a1) ? stampOf(a1.replace(/^checked at\s*/i, "")) : "";
  const cell = (r: Cell[], i: number) => String(r[i] ?? "").trim();
  const items = v
    .slice(1)
    .map((r) => ({ type: cell(r, 1), where: cell(r, 2), detail: cell(r, 3) }))
    .filter((a) => (a.type || a.where || a.detail) && !/^all clear$/i.test(a.type));
  return { checkedAt, items };
}

/** The script runs at 06:00, 13:00 and 20:00 Dubai: the next run after a "YYYY-MM-DD HH:MM" update, as "HH:00". */
export function nextRun(updated: string): string {
  const h = Number(updated.slice(11, 13));
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(updated)) return "";
  return `${String([6, 13, 20].find((r) => r > h) ?? 6).padStart(2, "0")}:00`;
}

export type Fresh = "good" | "warn" | "bad" | "unknown";
/** Under 9 hours: good; 9 to 24: warn; over 24: the report isn't updating. */
export function freshness(updatedMs: number | null, now: number): Fresh {
  if (updatedMs == null) return "unknown";
  const h = (now - updatedMs) / 3_600_000;
  return h < 9 ? "good" : h <= 24 ? "warn" : "bad";
}

/* ---------- Settings history ---------- */

export interface HistEntity {
  id: string;
  label: string;
}

/** Each campaign or ad in Setup_History once, for the picker. */
export function historyEntities(rows: Row[]): HistEntity[] {
  const seen = new Map<string, HistEntity>();
  for (const r of rows) {
    const id = str(r, "ID");
    if (!id) continue;
    const name = str(r, "Name") || id, camp = str(r, "Campaign"), type = str(r, "Type");
    seen.set(id, { id, label: [type, name, camp && camp !== name ? camp : ""].filter(Boolean).join(" · ") });
  }
  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export interface HistStep {
  at: string;
  /** key, value, changed since the step before (the first step: nothing is marked). */
  lines: [string, string, boolean][];
  removed: string[];
}

/** Nested settings as "a.b" keys; arrays and values as text. */
function flatten(o: unknown, prefix = "", out: Record<string, string> = {}): Record<string, string> {
  if (o && typeof o === "object" && !Array.isArray(o)) for (const [k, v] of Object.entries(o)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  else if (prefix) out[prefix] = typeof o === "string" ? o : JSON.stringify(o);
  return out;
}
const settingsOf = (v: Cell | undefined): Record<string, string> => {
  try {
    return flatten(JSON.parse(String(v ?? "")));
  } catch {
    return String(v ?? "").trim() ? { Settings: String(v) } : {};
  }
};

/** A Setup_History row's settings (its "Settings" column) as flat "a.b" keys. */
export const settingsOfRow = (r: Row) => settingsOf(r.Settings);

/** One item's settings over time, newest first, each line marked when it differs from the step before. */
export function historySteps(rows: Row[], id: string): HistStep[] {
  const own = rows.filter((r) => str(r, "ID") === id).sort((a, b) => stampOf(a["Recorded at"]).localeCompare(stampOf(b["Recorded at"])));
  let prev: Record<string, string> | null = null;
  const steps: HistStep[] = [];
  for (const r of own) {
    const cur = settingsOfRow(r);
    const p: Record<string, string> | null = prev;
    steps.push({
      at: stampOf(r["Recorded at"]),
      lines: Object.entries(cur).map(([k, v]) => [k, v, !!p && p[k] !== v]),
      removed: p ? Object.keys(p).filter((k) => !(k in cur)) : [],
    });
    prev = cur;
  }
  return steps.reverse();
}
