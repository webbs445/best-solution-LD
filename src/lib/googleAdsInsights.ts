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
  /** Red: a campaign spent at least this (AED) with 0 ERP leads and 0 Google conversions. */
  noLeadsCostAed: 50,
  /** Red: a Demand Gen campaign whose clicks cost less than this (AED) each … */
  junkClickCpcAed: 0.2,
  /** … with at least this many clicks and 0 leads: the clicks look accidental. */
  junkClickMinClicks: 500,
  /** Orange: ERP leads above Google conversions by at least this many: a tracking gap. */
  trackingGapLeads: 2,
  /** Orange: lost impression share because of budget at least this (0.5 = 50%) on a campaign that brings ERP leads. */
  lostIsBudget: 0.5,
  /** Yellow: keywords that spent at least this (AED) with 0 conversions and 0 ERP leads. */
  keywordNoLeadsCostAed: 50,
  /** Yellow: search terms that spent at least this (AED) with 0 conversions: negative keyword candidates. */
  searchTermCostAed: 20,
  /** Yellow: keywords with impressions and a Quality Score at or below this. */
  lowQualityScore: 4,
  /** How many items show before "Show all". */
  visibleItems: 6,
};

/* ---------- ERP leads ---------- */

/** A Google Ads lead from the ERP: created (Dubai, "YYYY-MM-DD HH:MM"), its campaign and keyword as tracked, qualified or not. */
export interface ErpLead {
  created: string;
  campaign: string;
  keyword: string;
  qualified: boolean;
}

const norm = (s: string) => s.trim().toLowerCase();
const kwNorm = (s: string) => norm(s).replace(/[[\]"+]/g, "").replace(/\s+/g, " ");
export const erpIn = (leads: ErpLead[], from: string, to: string) => leads.filter((l) => l.created.slice(0, 10) >= from && l.created.slice(0, 10) <= to);
/** ERP leads whose campaign is this Google Ads campaign (names compared without case). */
export const erpFor = (leads: ErpLead[], campaign: string) => leads.filter((l) => norm(l.campaign) === norm(campaign));
const erpForKeyword = (leads: ErpLead[], campaign: string, keyword: string) => erpFor(leads, campaign).filter((l) => kwNorm(l.keyword) === kwNorm(keyword));

/* ---------- Needs attention ---------- */

export type Level = "red" | "orange" | "yellow" | "info";
const LEVEL_ORDER: Record<Level, number> = { red: 0, orange: 1, yellow: 2, info: 3 };

export interface Attention {
  level: Level;
  /** One plain sentence. */
  text: string;
  /** The money involved, for ranking and the badge (null: none). */
  aed: number | null;
  /** Query keys for "See details" (section, sub, campaign, flag). */
  link: Record<string, string>;
  /** "check" (computed on the period) or the Sheet's own alert. */
  source: "check" | "sheet";
}

export interface AttentionInput {
  /** Every campaign with its totals for the period. */
  campaigns: CampaignRow[];
  /** ERP Google Ads leads in the period, or null when the ERP isn't connected. */
  erp: ErpLead[] | null;
  keywords: KeywordRow[];
  terms: TermRow[];
  /** Change_Log_30d rows. */
  changes: Row[];
  from: string;
  to: string;
  alerts: Alerts;
  /** _Status "Ad approval data". */
  approvalData: string;
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

/** Ranked: red, orange, yellow, info; then by money involved. */
export function attention(i: AttentionInput): Attention[] {
  const T = THRESHOLDS;
  const items: Attention[] = [];
  const flagged = new Set<string>();
  for (const c of i.campaigns) {
    const cost = c.t.cost ?? 0, clicks = c.t.clicks ?? 0, conv = c.t.conv ?? 0;
    const leads = i.erp ? erpFor(i.erp, c.name).length : null;
    const link = { section: "campaigns", campaign: c.name };
    const noLeads = (leads ?? 0) === 0 && conv === 0;
    if (cost >= T.noLeadsCostAed && noLeads) {
      const junk = c.channel === "demandgen" && (cpc(c.t) ?? Infinity) < T.junkClickCpcAed && clicks >= T.junkClickMinClicks;
      const each = `AED ${(cpc(c.t) ?? 0).toFixed(2)} each`;
      items.push({
        level: "red",
        text: `${c.name} spent ${aed(cost)} for ${count(clicks, "click")} and 0 leads${leads == null ? " (Google conversions; the ERP isn't connected here)" : ""}.${junk ? ` Clicks look accidental (${each}): check placements or pause.` : ""}`,
        aed: cost,
        link,
        source: "check",
      });
      flagged.add(c.name);
    } else if (c.channel === "demandgen" && (cpc(c.t) ?? Infinity) < T.junkClickCpcAed && clicks >= T.junkClickMinClicks && noLeads) {
      items.push({ level: "red", text: `${c.name}: clicks look accidental (AED ${(cpc(c.t) ?? 0).toFixed(2)} each, ${count(clicks, "click")}, 0 leads). Check placements or pause.`, aed: cost, link, source: "check" });
      flagged.add(c.name);
    }
    if (leads != null && leads - conv >= T.trackingGapLeads) {
      items.push({ level: "orange", text: `ERP got ${count(leads, "lead")} from ${c.name}, Google Ads counted ${conv.toLocaleString("en-US")}: tracking gap.`, aed: cost, link, source: "check" });
      flagged.add(c.name);
    }
    const lost = lostBudget(c.t);
    if (leads && lost != null && lost >= T.lostIsBudget) {
      items.push({ level: "orange", text: `${c.name} misses ${Math.round(lost * 100)}% of possible impressions because of budget.`, aed: cost, link, source: "check" });
    }
  }
  for (const [camp, days] of statusChanges(i.changes, i.from, i.to)) {
    const dates = [...new Set(days)].sort().map(DAY_MONTH).join(", ");
    const cost = i.campaigns.find((c) => c.name === camp)?.t.cost ?? null;
    items.push({ level: "orange", text: `${camp} was turned on/off ${count(days.length, "time")} on ${dates}.`, aed: cost, link: { section: "history", campaign: camp }, source: "check" });
  }
  const noLeadKw = i.keywords.filter((k) => noLeadKeyword(k, i.erp));
  if (noLeadKw.length) {
    const sum = noLeadKw.reduce((s, k) => s + (k.t.cost ?? 0), 0);
    items.push({ level: "yellow", text: `${count(noLeadKw.length, "keyword")} spent ${aed(sum)} with no leads.`, aed: sum, link: { section: "search", sub: "keywords", flag: "noleads" }, source: "check" });
  }
  const negatives = i.terms.filter(negativeCandidate);
  if (negatives.length) {
    const sum = negatives.reduce((s, t) => s + (t.t.cost ?? 0), 0);
    items.push({ level: "yellow", text: `${count(negatives.length, "search term")} ${negatives.length === 1 ? "is a" : "are"} negative-keyword candidate${negatives.length === 1 ? "" : "s"} (${aed(sum)}, no conversions).`, aed: sum, link: { section: "search", sub: "terms", flag: "negative" }, source: "check" });
  }
  const lowQs = i.keywords.filter(lowQualityScore);
  if (lowQs.length) {
    const sum = lowQs.reduce((s, k) => s + (k.t.cost ?? 0), 0);
    items.push({ level: "yellow", text: `${count(lowQs.length, "keyword")} ${lowQs.length === 1 ? "has a" : "have a"} low Quality Score (${T.lowQualityScore} or less).`, aed: sum, link: { section: "search", sub: "keywords", flag: "lowqs" }, source: "check" });
  }
  // The Sheet's own alerts, unless a check above already covers that campaign (its "No leads" counts Google conversions only).
  for (const a of i.alerts.items) {
    const camp = i.campaigns.find((c) => c.name === a.where);
    if (camp && flagged.has(camp.name) && /no leads/i.test(a.type)) continue;
    // Money involved: only an amount spent (a CPC is not money at risk).
    const money = /AED\s*([\d,]+(?:\.\d+)?)\s+spent/i.exec(a.detail)?.[1];
    items.push({
      level: /no leads/i.test(a.type) ? "red" : /cpc|tracking|budget|disapprov/i.test(a.type) ? "orange" : "yellow",
      text: `${a.type}${a.where ? ` · ${a.where}` : ""}: ${a.detail}`,
      aed: money ? Number(money.replace(/,/g, "")) : null,
      link: camp ? { section: "campaigns", campaign: camp.name } : { section: "campaigns" },
      source: "sheet",
    });
  }
  if (/not\s+available/i.test(i.approvalData)) {
    items.push({ level: "info", text: "Headline approvals can't be read by the script; check the asset report weekly.", aed: null, link: { section: "search", sub: "ads" }, source: "check" });
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

