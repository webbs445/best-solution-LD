import {
  cpc,
  lostBudget,
  stampOf,
  str,
  type Alerts,
  type CampaignRow,
  type KeywordRow,
  type Row,
  type TermRow,
} from "@/lib/googleAdsReport";

/*
  "Needs attention" for the Google Ads view: the checks run on the selected period, the Sheet's own alerts, and the
  ERP join (leads per campaign and keyword). Pure functions; the page renders the list.
*/

/* ---------- Thresholds: change them here ---------- */

export const THRESHOLDS = {
  /** Red: a campaign spent at least this (AED) in the period with 0 ERP leads (0 Google conversions without the ERP). */
  noLeadsCostAed: 50,
  /** Red: a non-Search campaign (Demand Gen, Performance Max, Display, …) whose clicks cost less than this (AED) each … */
  junkClickCpcAed: 0.2,
  /** … with at least this many clicks and 0 leads: the clicks look accidental. */
  junkClickMinClicks: 500,
  /** Amber: lost impression share because of budget at least this (0.5 = 50%) on a campaign with ERP leads since start. */
  lostIsBudget: 0.5,
  /** Budget to redirect: the target campaign loses at least this share to budget (0.3 = 30%). */
  redirectLostIs: 0.3,
  /** Cost per qualified lead the campaigns are measured against (AED). */
  targetCplAed: 80,
  /** Keywords table flag: spent at least this (AED) with 0 conversions and 0 ERP leads. */
  keywordNoLeadsCostAed: 50,
  /** Wasted search terms: spent at least this (AED) with 0 conversions and no ERP lead on that keyword. */
  searchTermCostAed: 20,
  /** Keywords table flag: impressions and a Quality Score at or below this. */
  lowQualityScore: 4,
  /** Tracking banner: Search landings at least this with 0 ERP leads in the period … */
  bannerLandings: 20,
  /** … or the last ERP lead older than this many days while Search got at least `bannerClicks` clicks. */
  bannerLeadDays: 7,
  bannerClicks: 30,
  /** How many attention items show before "Show all". */
  visibleItems: 3,
};

/**
 * Friendly campaign names for the cards and the chart (the detail tables keep Google's names, so search and CSV match
 * the account). A campaign that isn't listed shows its own name. Add new campaigns here.
 */
export const CAMPAIGN_LABELS: Record<string, string> = {
  fz_search_061026: "Free Zone Search",
  BS_DemandGen_Competitor_061126: "Demand Gen Competitor",
  bs_accounting_081026: "Accounting Search",
};
export const friendly = (name: string) => CAMPAIGN_LABELS[name.trim()] ?? name;

/* ---------- ERP leads ---------- */

/**
 * A Google Ads lead from the ERP: created (Dubai, "YYYY-MM-DD HH:MM"), its campaign and keyword as tracked, qualified
 * and won, and its click's device, city and keyword when the click join found it (never the click id itself).
 */
export interface ErpLead {
  created: string;
  campaign: string;
  keyword: string;
  qualified: boolean;
  won?: boolean;
  click?: { device: string; city: string; keyword: string } | null;
}

const norm = (s: string) => s.trim().toLowerCase();
const kwNorm = (s: string) => norm(s).replace(/[[\]"+]/g, "").replace(/\s+/g, " ");
export const erpIn = (leads: ErpLead[], from: string, to: string) => leads.filter((l) => l.created.slice(0, 10) >= from && l.created.slice(0, 10) <= to);
/** ERP leads whose campaign is this Google Ads campaign (names compared without case). */
export const erpFor = (leads: ErpLead[], campaign: string) => leads.filter((l) => norm(l.campaign) === norm(campaign));
const erpForKeyword = (leads: ErpLead[], campaign: string, keyword: string) => erpFor(leads, campaign).filter((l) => kwNorm(l.keyword) === kwNorm(keyword));
/** Keyword text without match-type marks, lower case: how a search term or keyword is compared with an ERP lead's. */
export const kwKey = kwNorm;

/* ---------- Needs attention ---------- */

export type Level = "red" | "amber";
const LEVEL_ORDER: Record<Level, number> = { red: 0, amber: 1 };

export interface Attention {
  level: Level;
  title: string;
  /** One line: why it matters. */
  why: string;
  /** What to do: the label and where the link goes (an id on the page). */
  action: { label: string; target: string };
  /** The money involved (AED), or a share (0.66) when that's the point; null: none. */
  aed: number | null;
  share?: number;
  /** "check" (computed on the period) or the Sheet's own alert. */
  source: "check" | "sheet";
}

export interface AttentionInput {
  /** Campaigns in scope with their totals for the period. */
  campaigns: CampaignRow[];
  /** ERP Google Ads leads in the period, or null when the ERP isn't connected. */
  erp: ErpLead[] | null;
  /** ERP Google Ads leads since counting started (for "a campaign with leads"), or null. */
  erpAll: ErpLead[] | null;
  /** Change_Log_30d rows. */
  changes: Row[];
  from: string;
  to: string;
  alerts: Alerts;
  /** Words for the period, e.g. "12–18 Nov". */
  periodWords: string;
  /** The tracking banner is up: "0 leads" on Search points to the form test first. */
  trackingSuspect: boolean;
  /** A budget-to-redirect card is shown (its id is "redirect"). */
  redirect: boolean;
  /** Campaign names outside the channel switch: their Sheet alerts are left out. */
  hidden: Set<string>;
}

const aed = (v: number) => `AED ${Math.round(v).toLocaleString("en-US")}`;
const count = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
const DAY_MONTH = (d: string) => `${Number(d.slice(8))} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(d.slice(5, 7)) - 1]}`;

/** Status changes of each campaign in the period, from Change_Log_30d: dates (YYYY-MM-DD) per campaign name. */
export function statusChanges(changes: Row[], from: string, to: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const r of changes) {
    const day = stampOf(r["Changed at"]).slice(0, 10);
    const camp = str(r, "Campaign");
    if (!camp || day < from || day > to || !/status/i.test(str(r, "Fields changed")) || (str(r, "Ad group") && !/^campaign$/i.test(str(r, "What changed")))) continue;
    out.set(camp, [...(out.get(camp) ?? []), day]);
  }
  return out;
}

/** Cheap clicks in bulk on any non-Search type (Demand Gen, Performance Max, Display, …): they look accidental. */
export const junkClicks = (c: CampaignRow) =>
  c.channel !== "SEARCH" && (cpc(c.t) ?? Infinity) < THRESHOLDS.junkClickCpcAed && (c.t.clicks ?? 0) >= THRESHOLDS.junkClickMinClicks;

/** Ranked: red, then amber; then by money involved. */
export function attention(i: AttentionInput): Attention[] {
  const T = THRESHOLDS;
  const items: Attention[] = [];
  const flagged = new Set<string>();
  const see = { label: "See campaign", target: "d-campaigns" };
  for (const c of i.campaigns) {
    const cost = c.t.cost ?? 0, clicks = c.t.clicks ?? 0;
    const leads = i.erp ? erpFor(i.erp, c.name).length : null;
    // Without the ERP, Google's own conversions stand in.
    const noLeads = leads == null ? (c.t.conv ?? 0) === 0 : leads === 0;
    const leadWord = leads == null ? "0 Google conversions" : "0 leads";
    if (noLeads && junkClicks(c)) {
      items.push({ level: "red", title: `${friendly(c.name)}: ${count(clicks, "click")}, ${leadWord}`, why: `AED ${(cpc(c.t) ?? 0).toFixed(2)} a click looks like accidental taps`, action: { label: "Check placements or pause", target: "d-campaigns" }, aed: cost, source: "check" });
      flagged.add(c.name);
    } else if (noLeads && cost >= T.noLeadsCostAed) {
      const test = i.trackingSuspect && c.channel === "SEARCH";
      items.push({
        level: "red",
        title: `${friendly(c.name)}: ${leadWord} in ${i.periodWords}`,
        why: test ? `${aed(cost)} for ${count(clicks, "click")}. Run the form test before changing ads` : `${aed(cost)} for ${count(clicks, "click")}`,
        action: test ? { label: "Run form test", target: "form-test" } : see,
        aed: cost,
        source: "check",
      });
      flagged.add(c.name);
    }
    const lost = lostBudget(c.t);
    if (lost != null && lost >= T.lostIsBudget && i.erpAll && erpFor(i.erpAll, c.name).length > 0) {
      items.push({ level: "amber", title: `${Math.round(lost * 100)}% of impressions lost to budget`, why: `${friendly(c.name)} brings leads but runs out of budget early`, action: i.redirect ? { label: "See budget move", target: "redirect" } : see, aed: null, share: lost, source: "check" });
    }
  }
  for (const [camp, days] of statusChanges(i.changes, i.from, i.to)) {
    const dates = [...new Set(days)].sort().map(DAY_MONTH).join(", ");
    const cost = i.campaigns.find((c) => c.name === camp)?.t.cost ?? null;
    items.push({ level: "amber", title: `${friendly(camp)}: status changed ${count(days.length, "time")}`, why: `Turned on or off on ${dates}`, action: { label: "See change history", target: "d-changes" }, aed: cost, source: "check" });
  }
  // The Sheet's own alerts, unless a check above already covers that campaign.
  for (const a of i.alerts.items) {
    if (flagged.has(a.where) && /no leads/i.test(a.type)) continue;
    // A campaign the channel switch hides.
    if (i.hidden.has(a.where)) continue;
    // Money involved: only an amount spent (a CPC is not money at risk).
    const money = /AED\s*([\d,]+(?:\.\d+)?)\s+spent/i.exec(a.detail)?.[1];
    items.push({
      level: /no leads/i.test(a.type) ? "red" : "amber",
      title: `${a.type}${a.where ? ` · ${friendly(a.where)}` : ""}`,
      why: a.detail,
      action: see,
      aed: money ? Number(money.replace(/,/g, "")) : null,
      source: "sheet",
    });
  }
  return items.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || (b.aed ?? -1) - (a.aed ?? -1));
}

/* ---------- Row flags (shared by the checks and the filtered tables) ---------- */

/** Spent at least the threshold with 0 conversions and (when the ERP is connected) 0 ERP leads for that keyword. */
export const noLeadKeyword = (k: KeywordRow, erp: ErpLead[] | null) =>
  (k.t.cost ?? 0) >= THRESHOLDS.keywordNoLeadsCostAed && (k.t.conv ?? 0) === 0 && (!erp || erpForKeyword(erp, k.campaign, k.keyword).length === 0);
/** Spent at least the threshold with 0 conversions, and not already excluded or added as a keyword. */
export const negativeCandidate = (t: TermRow) => (t.t.cost ?? 0) >= THRESHOLDS.searchTermCostAed && (t.t.conv ?? 0) === 0 && !/excluded|added/i.test(t.added);
export const lowQualityScore = (k: KeywordRow) => k.qs != null && k.qs <= THRESHOLDS.lowQualityScore && (k.t.impr ?? 0) > 0;

/* ---------- Paused since ---------- */

/**
 * When a paused campaign was paused: the latest campaign status change in Change_Log_30d (the exact day), else
 * Setup_History (the first snapshot of the latest run of PAUSED, which can be the morning after). "" when neither knows.
 */
export function pausedSince(c: { id: string; name: string }, history: Row[], changes: Row[]): string {
  const log = changes
    .filter((r) => str(r, "Campaign") === c.name && !str(r, "Ad group") && /status/i.test(str(r, "Fields changed")))
    .map((r) => stampOf(r["Changed at"]).slice(0, 10))
    .sort();
  if (log.length) return log.at(-1)!;
  const own = history
    .filter((r) => str(r, "ID") === c.id || (str(r, "Name") === c.name && /campaign/i.test(str(r, "Type"))))
    .map((r) => ({ at: stampOf(r["Recorded at"]), status: statusIn(r["Settings (JSON)"]) }))
    .filter((r) => r.status)
    .sort((a, b) => a.at.localeCompare(b.at));
  let since = "";
  for (let k = own.length - 1; k >= 0 && /paused/i.test(own[k].status); k--) since = own[k].at.slice(0, 10);
  return since;
}

function statusIn(v: Row[string] | undefined): string {
  try {
    const o = JSON.parse(String(v ?? "")) as Record<string, unknown>;
    const s = o.status ?? o.Status ?? (o.campaign as Record<string, unknown> | undefined)?.status;
    return typeof s === "string" ? s : "";
  } catch {
    return "";
  }
}

