import { COUNT_START, campaignLabel, type Entry } from "@/lib/adLandingsReport";
import { REPORT_START } from "@/lib/adsReport";
import { THRESHOLDS, attention, erpFor, erpIn, kwKey, type Attention, type ErpLead } from "@/lib/googleAdsInsights";
import {
  addDays,
  alertsOf,
  campaignRows,
  change,
  channelInfo,
  channelOf,
  channelParam,
  cpc,
  dateOf,
  daysIn,
  settingsOfRow,
  div,
  inPeriod,
  isEnabled,
  lostBudget,
  num,
  pickPeriod,
  rowsOf,
  stampOf,
  str,
  totals,
  type CampaignRow,
  type Channel,
  type Row,
} from "@/lib/googleAdsReport";
import type { SheetData } from "@/lib/googleAdsSheet";

/*
  The numbers behind each block of the Google Ads view (/ads-report?view=google-ads), from the report Sheet, the ERP's
  Google Ads leads and the ad landing counter. Pure functions: googleAdsPage only formats what this returns.
  Every block follows the period and the channel switch ("All" · Search · Demand Gen), except where a block says it
  covers a fixed window (the 30-day chart and terms, since-start lead quality and cost per qualified lead).
  Missing data is null (shown "–" with a reason), never 0.
*/

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const dayMonth = (d: string) => `${Number(d.slice(8, 10))} ${MONTHS[Number(d.slice(5, 7)) - 1]}`;
export const span = (a: string, b: string) => (a === b ? dayMonth(a) : a.slice(0, 7) === b.slice(0, 7) ? `${Number(a.slice(8))}–${dayMonth(b)}` : `${dayMonth(a)} – ${dayMonth(b)}`);
export const datesBetween = (a: string, b: string) => Array.from({ length: Math.max(0, daysIn(a, b)) }, (_, i) => addDays(a, i));
const sum = (xs: (number | null)[]) => xs.reduce<number>((s, x) => s + (x ?? 0), 0);
const daysAgo = (today: string, d: string) => daysIn(d, today) - 1;

/** "all", or a campaign type ("SEARCH", "DEMAND_GEN", …). */
export type ChannelKey = Channel | "all";
export type LeadSource = "erp" | "sheet" | "google";

/** Google conversions as stand-in leads (one per whole conversion, on its day and campaign): counts only, no status. */
export const conversionLeads = (perf: Row[]): ErpLead[] =>
  perf.flatMap((r) => Array.from({ length: Math.round(num(r, "Conversions") ?? 0) }, () => ({ created: `${dateOf(r.Date)} 12:00`, campaign: str(r, "Campaign"), keyword: "", qualified: false, won: false })));
/** The campaign type a landing page belongs to (the counter counts pages, not campaigns), or null for other pages. */
export const pageChannel = (path: string): Channel | null => {
  const lab = campaignLabel(path);
  return lab.startsWith("Search") ? "SEARCH" : lab.startsWith("Demand Gen") ? "DEMAND_GEN" : null;
};

/** Google's device names ("MOBILE", "Mobile devices with full browsers", "Computers") as Mobile / Desktop / Tablet / Other. */
export const deviceName = (s: string) => (/tablet/i.test(s) ? "Tablet" : /mobile|phone/i.test(s) ? "Mobile" : /desktop|computer/i.test(s) ? "Desktop" : s ? "Other" : "Not set");
/** "Dubai,Dubai,United Arab Emirates" → "Dubai". */
export const cityName = (s: string) => s.split(",")[0].trim() || "Not set";

export interface BlocksInput {
  data: SheetData;
  /** Google Ads leads since REPORT_START (with their click's device/city/keyword when joined), or null: ERP not here. */
  erp: ErpLead[] | null;
  /** Where `erp` came from: the ERP (with status) or the lead log sheet (no status). Without either: Google conversions. */
  leadSource?: "erp" | "sheet" | null;
  /** The click join ran (the bridge returned the filtered click rows). */
  joinReady: boolean;
  /** Ad landings in the period from the counter's first day, or null: counter not here. */
  landings: Entry[] | null;
  q: URLSearchParams;
  today: string;
}

export interface Delta {
  /** Change as a fraction (0.05 = +5%). */
  ch: number;
  /** good / bad / neutral, from the direction and whether down is good. */
  tone: "good" | "bad" | "neu";
}
export interface Kpi {
  key: "spend" | "clicks" | "cpc" | "leads" | "cpl";
  label: string;
  /** The number, or null with `reason` ("ERP not connected here"). For cost per qualified lead with 0 qualified: "No leads". */
  value: number | null;
  text?: string;
  reason?: string;
  delta: Delta | null;
  /** Cost per qualified lead with none in the period: since start against the target (a gauge instead of a sparkline). */
  gauge?: { value: number; target: number };
  /** A neutral chip instead of a delta (e.g. "Target AED 80"). */
  chip?: string;
  spark: number[];
  sub: string;
  money: boolean;
}

const delta = (cur: number | null, prev: number | null, goodDown: boolean | null): Delta | null => {
  const ch = change(cur, prev);
  if (ch == null) return null;
  const p = Math.round(ch * 100);
  return { ch, tone: goodDown == null || p === 0 ? "neu" : (p < 0) === goodDown ? "good" : "bad" };
};

/** Change_Log_30d rows as markers: status, budget or bidding changes of a campaign on a day. */
export interface Marker {
  day: string;
  /** The day's latest change of this kind, "YYYY-MM-DD HH:MM". */
  at: string;
  campaign: string;
  kind: "Status" | "Budget" | "Bidding";
  /** Who made the latest change (several people: theirs). */
  who: string;
  /** How many changes of this kind that day. */
  n: number;
  /** The new settings, from the first Setup_History record after the change ("Max clicks, cap AED 8"), or "". */
  detail: string;
}
export function markers(changes: Row[], history: Row[] = []): Marker[] {
  const out = new Map<string, Marker>();
  for (const r of [...changes].sort((a, b) => stampOf(a["Changed at"]).localeCompare(stampOf(b["Changed at"])))) {
    const f = `${str(r, "What changed")} ${str(r, "Fields changed")}`;
    // Status first: a campaign created with its budget is "turned on", the event that matters on the chart.
    const kind = /status/i.test(f) ? "Status" : /budget|amount_micros/i.test(f) ? "Budget" : /bidding|bid_|cpc|target_|maximi[sz]e/i.test(f) ? "Bidding" : null;
    const camp = str(r, "Campaign");
    // Campaign-level changes only (an ad group's status is not the campaign's).
    if (!kind || !camp || (str(r, "Ad group") && kind === "Status")) continue;
    const at = stampOf(r["Changed at"]), day = at.slice(0, 10), key = `${day}|${camp}|${kind}`;
    out.set(key, { day, at, campaign: camp, kind, who: str(r, "Changed by"), n: (out.get(key)?.n ?? 0) + 1, detail: "" });
  }
  return [...out.values()].sort((a, b) => a.at.localeCompare(b.at)).map((m) => ({ ...m, detail: changeDetail(m, history) }));
}

const BIDDING: Record<string, string> = {
  MAXIMIZE_CLICKS: "Max clicks", TARGET_SPEND: "Max clicks", MAXIMIZE_CONVERSIONS: "Max conversions", MAXIMIZE_CONVERSION_VALUE: "Max conversion value",
  MANUAL_CPC: "Manual CPC", ENHANCED_CPC: "Enhanced CPC", TARGET_CPA: "Target CPA", TARGET_ROAS: "Target ROAS", TARGET_IMPRESSION_SHARE: "Target impression share",
};
const words = (s: string) => (s ? (s[0] + s.slice(1).toLowerCase()).replace(/_/g, " ") : "");
/** "MAXIMIZE_CLICKS" → "Max clicks", "MANUAL_CPC" → "Manual CPC"; other strategies in plain words. */
export const biddingLabel = (s: string) => BIDDING[s.trim().toUpperCase()] ?? words(s.trim());
const aedOf = (v: string) => {
  const n = Number(v);
  // Google API amounts can come in micros.
  return Number.isFinite(n) ? `AED ${(n >= 100_000 ? n / 1e6 : n).toLocaleString("en-US", { maximumFractionDigits: 2 })}` : v;
};

/**
 * The campaign's new settings after a change, from its first Setup_History Campaign row at or after it ("" when
 * there's none). Keys as the report script (v5.2) writes them: status, budget and maxCpc in AED, bidding.
 */
export function changeDetail(m: Pick<Marker, "at" | "campaign" | "kind">, history: Row[]): string {
  // Type "Campaign" rows only, matched on Name: "Campaign targeting" rows carry the campaign in the Campaign column but
  // have no budget or bidding. A row is written only when the campaign's settings change.
  const own = history
    .filter((r) => str(r, "Type") === "Campaign" && str(r, "Name") === m.campaign)
    .map((r) => ({ at: stampOf(r["Recorded at"]), s: settingsOfRow(r) }))
    .sort((a, b) => a.at.localeCompare(b.at));
  const i = own.findIndex((r) => r.at >= m.at);
  if (i < 0) return "";
  const s = own[i].s;
  if (m.kind === "Status") return words(s.status ?? "");
  if (m.kind === "Budget") {
    // Google logs delivery-method edits as budget changes too: the same amount as before shows no amount.
    const b = s.budget ?? "";
    return b !== "" && Number.isFinite(Number(b)) && b !== own[i - 1]?.s.budget ? `budget ${aedOf(b)}` : "";
  }
  const bid = s.bidding ?? "", cap = s.maxCpc ?? "";
  return [BIDDING[bid] ?? words(bid), cap ? `cap ${aedOf(cap)}` : ""].filter(Boolean).join(", ");
}

export function blocks(i: BlocksInput) {
  const { data: d, today, q } = i;
  const T = THRESHOLDS;
  const period = pickPeriod(q, today);
  const p7 = pickPeriod(new URLSearchParams("range=7d"), today);
  const p30 = pickPeriod(new URLSearchParams("range=30d"), today);
  const perfAll = rowsOf(d.tabs.Perf_Campaigns_Daily);
  const setup = rowsOf(d.tabs.Setup_Campaigns);
  const changes = rowsOf(d.tabs.Change_Log_30d);
  // Leads, best source first: the ERP (with status); the lead log sheet (no status); else Google's own conversions,
  // one per conversion on its day and campaign. Blocks that need a lead's status (qualified, won) need the ERP.
  const lsrc: LeadSource = i.erp ? (i.leadSource ?? "erp") : "google";
  const erp: ErpLead[] = i.erp ?? conversionLeads(perfAll);
  const qualOk = lsrc === "erp";

  // Channel of each campaign (by name), from Setup_Campaigns, else the daily rows.
  const chOf = new Map<string, Channel>();
  for (const r of perfAll) chOf.set(str(r, "Campaign"), channelOf(str(r, "Campaign type")));
  for (const r of setup) chOf.set(str(r, "Campaign"), channelOf(str(r, "Campaign type")));
  // The filter: "All" + each campaign type with spend in the period, highest spend first (the URL may name any known type).
  const want = channelParam(q.get("channel"));
  const channel: ChannelKey = want && [...chOf.values()].includes(want) ? want : "all";
  const spendByType = new Map<Channel, number>();
  for (const r of inPeriod(perfAll, period.from, period.to)) {
    const ch = chOf.get(str(r, "Campaign")) ?? channelOf(str(r, "Campaign type"));
    spendByType.set(ch, (spendByType.get(ch) ?? 0) + (num(r, "Cost (AED)") ?? 0));
  }
  const types = [...spendByType].filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]).map(([ch]) => ch);
  if (channel !== "all" && !types.includes(channel)) types.push(channel);
  const channels = types.map((ch) => ({ key: ch, ...channelInfo(ch), cost: spendByType.get(ch) ?? 0 }));
  const inCh = (name: string, ch: ChannelKey) => ch === "all" || chOf.get(name) === ch;
  const inScope = (name: string) => inCh(name, channel);
  const scoped = (rows: Row[], ch: ChannelKey = channel) => rows.filter((r) => inCh(str(r, "Campaign"), ch));
  const lower = (ch: ChannelKey) => new Set([...chOf.keys()].filter((n) => inCh(n, ch)).map((n) => n.trim().toLowerCase()));
  // ERP leads of a channel: "All" counts every Google Ads lead, a channel only its campaigns' leads.
  const erpCh = (leads: ErpLead[], ch: ChannelKey = channel) => {
    if (ch === "all") return leads;
    const names = lower(ch);
    return leads.filter((l) => names.has(l.campaign.trim().toLowerCase()));
  };
  const erpScoped = erpCh(erp);
  const erpReason = qualOk ? "" : lsrc === "sheet" ? "Lead status needs the ERP (not connected here)" : "ERP and lead log not connected here";
  const leadsIn = (from: string, to: string, ch: ChannelKey = channel) => (erp && to >= REPORT_START ? erpIn(erpCh(erp, ch), from, to) : null);
  const costByDay = (rows: Row[]) => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(dateOf(r.Date), (m.get(dateOf(r.Date)) ?? 0) + (num(r, "Cost (AED)") ?? 0));
    return m;
  };

  /* ----- Period numbers ----- */
  const cur = scoped(inPeriod(perfAll, period.from, period.to));
  const prev = scoped(inPeriod(perfAll, period.prevFrom, period.prevTo));
  const tCur = totals(cur), tPrev = totals(prev);
  const days = datesBetween(period.from, period.to);
  const byDay = (rows: Row[], h: string) => days.map((day) => sum(rows.filter((r) => dateOf(r.Date) === day).map((r) => num(r, h))));
  const leadsCur = leadsIn(period.from, period.to);
  const leadsPrev = period.prevFrom >= REPORT_START ? leadsIn(period.prevFrom, period.prevTo) : null;
  const qual = (l: ErpLead[] | null) => (l ? l.filter((x) => x.qualified).length : null);
  const lastLead = erpScoped?.map((l) => l.created.slice(0, 10)).sort().at(-1) ?? null;
  const ofType = (rows: Row[], ch: Channel) => rows.filter((r) => chOf.get(str(r, "Campaign")) === ch);
  const allSearch = (rows: Row[]) => ofType(rows, "SEARCH");
  const aedShort = (v: number | null) => (v == null ? "–" : Math.round(v).toLocaleString("en-US"));

  /* ----- 2. Tracking banner (Search) ----- */
  const searchPaths = (e: Entry) => /^Search/.test(campaignLabel(e.path));
  const landOf = (pred: (e: Entry) => boolean) => (i.landings ? sum(i.landings.filter((e) => e.metric === "land" && pred(e)).map((e) => e.n)) : null);
  const searchLand = landOf(searchPaths);
  const allLeadsP = erp ? erpIn(erp, period.from, period.to).length : null;
  const lastAny = erp?.map((l) => l.created.slice(0, 10)).sort().at(-1) ?? null;
  const searchClicksP = totals(allSearch(inPeriod(perfAll, period.from, period.to))).clicks ?? 0;
  const bannerOn =
    erp != null &&
    ((searchLand != null && searchLand >= T.bannerLandings && allLeadsP === 0) ||
      (lastAny != null && daysAgo(today, lastAny) > T.bannerLeadDays && searchClicksP >= T.bannerClicks));
  const banner = bannerOn ? { since: lastAny, landings: searchLand, leads: allLeadsP ?? 0 } : null;

  /* ----- 3. KPIs ----- */
  // Avg CPC is a Search number whatever the filter (Demand Gen and other types bid for very different clicks).
  const cpcRows = allSearch(inPeriod(perfAll, period.from, period.to));
  const cpcPrevRows = allSearch(inPeriod(perfAll, period.prevFrom, period.prevTo));
  const cpcLabel = "Avg CPC · Search";
  const sinceRows = scoped(inPeriod(perfAll, REPORT_START, period.to));
  const costSince = totals(sinceRows).cost;
  const qualSince = qualOk ? erpIn(erpScoped, REPORT_START, period.to).filter((l) => l.qualified).length : null;
  const cplSince = div(costSince, qualSince);
  // Qualified counts need a lead's status: unknown (null) unless the leads come from the ERP.
  const qCur = qualOk ? qual(leadsCur) : null, qPrev = qualOk ? qual(leadsPrev) : null;
  const cplCur = div(tCur.cost, qCur), cplPrev = div(tPrev.cost, qPrev);
  // The cap and the last bidding change of the Search campaigns in view (shown under Avg CPC).
  const searchSetup = setup.filter((r) => channelOf(str(r, "Campaign type")) === "SEARCH" && isEnabled(str(r, "Campaign status")));
  const cap = searchSetup.map((r) => num(r, "Max CPC cap (AED)")).find((v) => v) ?? null;
  const allMarkers = markers(changes, rowsOf(d.tabs.Setup_History));
  const lastBid = allMarkers.filter((m) => m.kind === "Bidding" && searchSetup.some((r) => str(r, "Campaign") === m.campaign)).at(-1) ?? null;
  // Cumulative cost per qualified lead since REPORT_START, at each day of the period (the sparkline).
  const cplSpark = days.map((day) => div(totals(scoped(inPeriod(perfAll, REPORT_START, day))).cost, qualOk ? erpIn(erpScoped, REPORT_START, day).filter((l) => l.qualified).length : null)).filter((v): v is number => v != null);
  // "Search 145 · Demand Gen 221" (the 3 biggest types) in All; the type's name otherwise.
  const splitSub = (money: boolean) =>
    channel === "all"
      ? channels.slice(0, 3).map((c) => { const t = totals(ofType(cur, c.key)); return `${c.label} ${money ? aedShort(t.cost) : (t.clicks ?? 0).toLocaleString("en-US")}`; }).join(" · ")
      : `${channelInfo(channel).label} campaigns`;
  const kpis: Kpi[] = [
    { key: "spend", label: "Spend", value: tCur.cost, delta: delta(tCur.cost, tPrev.cost, true), spark: byDay(cur, "Cost (AED)"), sub: splitSub(true), money: true },
    { key: "clicks", label: "Clicks", value: tCur.clicks, delta: delta(tCur.clicks, tPrev.clicks, null), spark: byDay(cur, "Clicks"), sub: splitSub(false), money: false },
    {
      key: "cpc",
      label: cpcLabel,
      value: cpc(totals(cpcRows)),
      delta: delta(cpc(totals(cpcRows)), cpc(totals(cpcPrevRows)), true),
      spark: days.map((day) => cpc(totals(cpcRows.filter((r) => dateOf(r.Date) === day))) ?? 0),
      sub: cap ? `cap AED ${cap}${lastBid ? ` since ${dayMonth(lastBid.day)}` : ""}` : lastBid ? `bidding changed ${dayMonth(lastBid.day)}` : "",
      money: true,
    },
    {
      key: "leads",
      label: lsrc === "google" ? "Google conversions" : "Tracked leads",
      value: leadsCur?.length ?? null,
      reason: erp ? (leadsCur ? "" : lsrc === "google" ? "Conversions counted from 12 Oct" : lsrc === "sheet" ? "Lead log starts 12 Oct" : "ERP leads start 12 Oct") : erpReason,
      delta: leadsCur && leadsPrev ? delta(leadsCur.length, leadsPrev.length, false) : null,
      spark: days.map((day) => leadsCur?.filter((l) => l.created.slice(0, 10) === day).length ?? 0),
      sub: `${lastLead ? `last ${lsrc === "google" ? "conversion" : "lead"} ${dayMonth(lastLead)}` : `none since ${dayMonth(REPORT_START)}`}${lsrc === "sheet" ? " · lead log" : ""}`,
      money: false,
    },
    {
      key: "cpl",
      label: "Cost / qualified",
      value: qCur ? cplCur : null,
      text: qCur === 0 ? "No leads" : undefined,
      reason: qualOk ? (qCur == null ? "ERP leads start 12 Oct" : "") : "Needs lead status from the ERP",
      delta: qCur ? delta(cplCur, cplPrev, true) : null,
      // No qualified lead in the period: a gauge of the since-start cost against the target (a flat line says nothing).
      chip: qCur === 0 && cplSince != null ? undefined : `Target AED ${T.targetCplAed}`,
      gauge: qCur === 0 && cplSince != null ? { value: cplSince, target: T.targetCplAed } : undefined,
      spark: cplSpark,
      sub: qCur === 0 ? (cplSince != null ? `no qualified lead in ${span(period.from, period.to)}` : "no qualified lead since 12 Oct") : qCur ? `${qCur} qualified` : "",
      money: true,
    },
  ];

  /* ----- 4. Spend and leads, last 30 days ----- */
  const d30 = datesBetween(addDays(today, -29), today);
  const all30 = scoped(inPeriod(perfAll, d30[0], today));
  const leads30 = erpScoped ? erpIn(erpScoped, d30[0], today) : null;
  // One stacked area per campaign type with 30-day spend: Search at the bottom, then the others by spend.
  const cost30 = new Map<Channel, number>();
  for (const r of all30) cost30.set(chOf.get(str(r, "Campaign")) ?? "UNKNOWN", (cost30.get(chOf.get(str(r, "Campaign")) ?? "UNKNOWN") ?? 0) + (num(r, "Cost (AED)") ?? 0));
  const stackTypes = [...cost30].filter(([, c]) => c > 0).sort((a, b) => (a[0] === "SEARCH" ? -1 : b[0] === "SEARCH" ? 1 : b[1] - a[1])).map(([ch]) => ch);
  const byType = new Map(stackTypes.map((ch) => [ch, costByDay(ofType(all30, ch))]));
  const chart = {
    stacks: stackTypes.map((ch) => ({ key: ch, ...channelInfo(ch) })),
    days: d30.map((day) => ({
      day,
      /** Cost per stack, in the order of `stacks`. */
      costs: stackTypes.map((ch) => byType.get(ch)!.get(day) ?? 0),
      leads: leads30 ? leads30.filter((l) => l.created.slice(0, 10) === day).length : 0,
    })),
    markers: allMarkers.filter((m) => m.day >= d30[0] && inScope(m.campaign)),
    /** Changes in Change_Log_30d for the campaigns in view: distinct (campaign, date-time), as one edit logs a row per field. Also the History tab's number. */
    changeCount: new Set(changes.filter((r) => inScope(str(r, "Campaign")) && stampOf(r["Changed at"]).slice(0, 10) >= d30[0]).map((r) => `${str(r, "Campaign")}|${stampOf(r["Changed at"])}`)).size,
    leadsKnown: leads30 != null,
    lastLead,
    foot: {
      spend: sum(scoped(all30).map((r) => num(r, "Cost (AED)"))),
      leads: leads30?.length ?? null,
      lastLeadDays: lastLead ? daysAgo(today, lastLead) : null,
    },
  };

  /* ----- 6. Budget to redirect (7 days) ----- */
  const camps7 = campaignRows(inPeriod(perfAll, p7.from, p7.to), setup);
  const leads7 = qualOk ? erpIn(erp, p7.from, p7.to) : null;
  const sources = leads7
    ? camps7.filter((c) => inScope(c.name) && (c.t.cost ?? 0) >= T.noLeadsCostAed && erpFor(leads7, c.name).filter((l) => l.qualified).length === 0).sort((a, b) => (b.t.cost ?? 0) - (a.t.cost ?? 0))
    : [];
  const sinceCost = (name: string) => totals(inPeriod(perfAll, REPORT_START, today, name)).cost;
  const targets = qualOk
    ? camps7
        .filter((c) => c.channel === "SEARCH" && !c.inactive && (lostBudget(c.t) ?? 0) >= T.redirectLostIs)
        .map((c) => ({ c, cpl: div(sinceCost(c.name), erpFor(erp, c.name).filter((l) => l.qualified).length || null) }))
        .filter((x): x is { c: CampaignRow; cpl: number } => x.cpl != null)
        .sort((a, b) => a.cpl - b.cpl)
    : [];
  const src = sources.find((s) => s.name !== targets[0]?.c.name);
  const redirect =
    src && targets[0]
      ? { from: src.name, to: targets[0].c.name, aed: src.t.cost ?? 0, cpl: targets[0].cpl, more: Math.round((src.t.cost ?? 0) / targets[0].cpl), lost: lostBudget(targets[0].c.t) }
      : null;

  /* ----- 5. Needs attention ----- */
  const campsP = campaignRows(inPeriod(perfAll, period.from, period.to), setup).filter((c) => inScope(c.name) && (c.t.cost != null || c.t.clicks != null));
  const alerts = alertsOf(d.tabs.Alerts);
  const attn: Attention[] = attention({
    campaigns: campsP,
    // With Google conversions only, the checks word it as such ("0 Google conversions").
    erp: lsrc === "google" ? null : erpIn(erp, period.from, period.to),
    erpAll: erp,
    changes: changes.filter((r) => inScope(str(r, "Campaign"))),
    from: period.from,
    to: period.to,
    alerts,
    periodWords: span(period.from, period.to),
    trackingSuspect: banner != null,
    redirect: redirect != null,
    hidden: new Set([...chOf.keys()].filter((n) => !inScope(n))),
  });

  /* ----- 7. Spend by channel ----- */
  const parts = channels
    .filter((c) => channel === "all" || c.key === channel)
    .map((c) => {
      const t = totals(ofType(cur, c.key));
      return { ch: c.key, label: c.label, color: c.color, cost: t.cost ?? 0, clicks: t.clicks ?? 0, leads: leadsCur ? erpCh(leadsCur, c.key).length : null };
    })
    .filter((p) => p.cost > 0);
  const spendTotal = sum(parts.map((p) => p.cost));
  const spend = { total: spendTotal, parts: parts.map((p) => ({ ...p, share: spendTotal ? p.cost / spendTotal : 0 })) };

  /* ----- 8. Lead quality, since start ----- */
  const quality = qualOk
    ? (() => {
        const total = erpScoped.length, qualified = erpScoped.filter((l) => l.qualified).length, won = erpScoped.filter((l) => l.won).length;
        const byCamp = new Map<string, number>();
        for (const l of erpScoped) byCamp.set(l.campaign || "(no campaign)", (byCamp.get(l.campaign || "(no campaign)") ?? 0) + 1);
        const top = [...byCamp].sort((a, b) => b[1] - a[1])[0] ?? null;
        return { total, qualified, won, notQualified: total - qualified, share: total ? qualified / total : null, top: top ? { name: top[0], n: top[1] } : null };
      })()
    : null;

  /* ----- 9. Funnel ----- */
  // The funnel is Search's (keywords → clicks → landing pages → form), whatever the filter.
  const fCh: Channel = "SEARCH";
  const ft = totals(ofType(inPeriod(perfAll, period.from, period.to), fCh));
  const clipped = period.from < COUNT_START;
  const winFrom = clipped ? COUNT_START : period.from;
  const winOk = winFrom <= period.to;
  const landed = winOk ? landOf((e) => pageChannel(e.path) === fCh) : null;
  const winClicks = winOk ? totals(ofType(inPeriod(perfAll, winFrom, period.to), fCh)).clicks : null;
  const fLeads = leadsIn(period.from, period.to, fCh);
  const winLeads = winOk ? leadsIn(winFrom, period.to, fCh) : null;
  const funnel = {
    channel: fCh,
    seen: ft.impr,
    clicked: ft.clicks,
    landed,
    leads: fLeads?.length ?? null,
    ctr: div(ft.clicks, ft.impr),
    landedRate: landed == null ? null : div(landed, winClicks),
    formRate: landed == null || !winLeads ? null : div(winLeads.length, landed),
    /** The counter covers only part of the period (it started 16 Nov), or nothing. */
    note: i.landings == null ? "Landing counter not connected here." : !winOk ? `The landing counter started ${dayMonth(COUNT_START)}: no landings for this period.` : clipped ? `The landing counter started ${dayMonth(COUNT_START)}: Landed, Landed % and Form % cover ${span(winFrom, period.to)}.` : "",
  };

  /* ----- 10. Cost per qualified lead by campaign, since start ----- */
  const cplRows = qualOk
    ? campaignRows(inPeriod(perfAll, REPORT_START, today), setup)
        .filter((c) => inScope(c.name) && (c.t.cost ?? 0) > 0)
        .map((c) => {
          const n = erpFor(erp, c.name).filter((l) => l.qualified).length;
          return { name: c.name, cost: c.t.cost ?? 0, qualified: n, cpl: n ? (c.t.cost ?? 0) / n : null };
        })
        .sort((a, b) => (a.cpl ?? Infinity) - (b.cpl ?? Infinity) || b.cost - a.cost)
    : null;

  /* ----- 11. Leads per day, 6 weeks (Sunday first) ----- */
  const sunday = addDays(today, -new Date(`${today}T00:00:00Z`).getUTCDay());
  const heatStart = addDays(sunday, -35);
  const heat = erpScoped
    ? Array.from({ length: 6 }, (_, w) =>
        datesBetween(addDays(heatStart, w * 7), addDays(heatStart, w * 7 + 6)).map((day) => ({
          day,
          n: day > today || day < REPORT_START ? null : erpScoped.filter((l) => l.created.slice(0, 10) === day).length,
        })),
      )
    : null;

  /* ----- 12, 13. Devices and cities, 30 days (with qualified leads per device / city when the click join ran) ----- */
  const segCh: Channel = channel === "all" ? "SEARCH" : channel;
  const joinLeads = i.joinReady && qualOk ? erpIn(erpCh(erp, segCh), p30.from, p30.to).filter((l) => l.qualified && l.click) : null;
  const devRows = scoped(inPeriod(rowsOf(d.tabs.Perf_Devices_Daily), p30.from, p30.to), segCh);
  const devCost = new Map<string, number>();
  for (const r of devRows) devCost.set(deviceName(str(r, "Device")), (devCost.get(deviceName(str(r, "Device"))) ?? 0) + (num(r, "Cost (AED)") ?? 0));
  const devTotal = sum([...devCost.values()]);
  const devices = [...devCost]
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, cost]) => {
      const n = joinLeads ? joinLeads.filter((l) => deviceName(l.click!.device) === name).length : null;
      return { name, cost, share: devTotal ? cost / devTotal : 0, qualified: n, cpl: n ? cost / n : null };
    });
  const locRows = rowsOf(d.tabs.Perf_Locations_30d).filter((r) => inScope(str(r, "Campaign")));
  const cityCost = new Map<string, number>();
  for (const r of locRows) cityCost.set(cityName(str(r, "City")), (cityCost.get(cityName(str(r, "City"))) ?? 0) + (num(r, "Cost (AED)") ?? 0));
  const cityLeads = i.joinReady && qualOk ? erpIn(erpCh(erp), p30.from, p30.to).filter((l) => l.qualified && l.click) : null;
  const cities = [...cityCost]
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, cost]) => ({ name, cost, qualified: cityLeads ? cityLeads.filter((l) => cityName(l.click!.city) === name).length : null }));

  /* ----- 14. Landing pages (landings only: the ERP has no landing page field) ----- */
  const pageMap = new Map<string, number>();
  for (const e of i.landings ?? []) {
    if (e.metric !== "land" || (channel !== "all" && pageChannel(e.path) !== channel)) continue;
    pageMap.set(e.path, (pageMap.get(e.path) ?? 0) + e.n);
  }
  const pages = i.landings == null ? null : [...pageMap].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([path, n]) => ({ path, n, label: campaignLabel(path) }));

  /* ----- 15. Search terms, 30 days ----- */
  const termRows = scoped(inPeriod(rowsOf(d.tabs.Perf_SearchTerms_Daily), p30.from, p30.to));
  const byTerm = new Map<string, { term: string; cost: number; conv: number; excluded: boolean }>();
  for (const r of termRows) {
    const k = kwKey(str(r, "Search term"));
    if (!k) continue;
    const t = byTerm.get(k) ?? { term: str(r, "Search term").trim(), cost: 0, conv: 0, excluded: false };
    t.cost += num(r, "Cost (AED)") ?? 0;
    t.conv += num(r, "Conversions") ?? 0;
    t.excluded ||= /excluded|added/i.test(str(r, "Added / excluded"));
    byTerm.set(k, t);
  }
  const erpKw = new Set((erp ?? []).map((l) => kwKey(l.keyword)).filter(Boolean));
  const wasted = [...byTerm]
    .filter(([k, t]) => t.cost >= T.searchTermCostAed && t.conv === 0 && !t.excluded && !erpKw.has(k))
    .map(([, t]) => t)
    .sort((a, b) => b.cost - a.cost);
  const winning = [...byTerm.values()].filter((t) => t.conv > 0).sort((a, b) => b.conv - a.conv || b.cost - a.cost);
  const kwCount = new Map<string, { keyword: string; n: number }>();
  for (const l of erpScoped ? erpIn(erpScoped, p30.from, p30.to) : []) {
    const k = kwKey(l.keyword);
    if (k) kwCount.set(k, { keyword: l.keyword.trim(), n: (kwCount.get(k)?.n ?? 0) + 1 });
  }
  const terms = {
    winning,
    wasted,
    erpKeywords: erpScoped ? [...kwCount.values()].sort((a, b) => b.n - a.n).slice(0, 3) : null,
    copy: wasted.map((t) => `"${t.term}"`).join("\n"),
    searchOnly: channel !== "all" && channel !== "SEARCH",
  };

  /* ----- 16. Campaigns ----- */
  const scopeSetup = setup.filter((r) => inScope(str(r, "Campaign")));
  const campCards = campsP.length || scopeSetup.length ? campaignRows(inPeriod(perfAll, period.from, period.to), setup).filter((c) => inScope(c.name) && !c.inactive) : [];
  const topSearch = campaignRows(inPeriod(perfAll, period.from, period.to), setup).filter((c) => c.channel === "SEARCH")[0] ?? null;
  // Avg CPC since the last bidding change vs the same number of days before it.
  const bidChange = lastBid
    ? (() => {
        const end = period.to < today ? period.to : addDays(today, -1);
        if (end < lastBid.day) return null;
        const n = daysIn(lastBid.day, end);
        const after = cpc(totals(inPeriod(perfAll, lastBid.day, end, lastBid.campaign)));
        const before = cpc(totals(inPeriod(perfAll, addDays(lastBid.day, -n), addDays(lastBid.day, -1), lastBid.campaign)));
        return { day: lastBid.day, campaign: lastBid.campaign, cpc: after, ch: change(after, before) };
      })()
    : null;
  const campaigns = {
    cards: campCards.map((c) => ({ c, leads: leadsCur ? erpFor(leadsCur, c.name).length : null })),
    all: scopeSetup.length || campsP.length,
    lost: topSearch ? { name: topSearch.name, share: lostBudget(topSearch.t) } : null,
    bidChange,
    paused: scopeSetup.filter((r) => /paused/i.test(str(r, "Campaign status"))).length,
  };

  return {
    channel,
    /** The filter's buttons after "All": types with spend in the period, highest first. */
    channels,
    period,
    p30,
    banner,
    kpis,
    chart,
    attn,
    redirect,
    spend,
    quality,
    funnel,
    cplRows,
    heat,
    heatStart,
    devices,
    deviceChannel: segCh,
    joinReady: i.joinReady && qualOk,
    /** "erp", "sheet" (lead log, no status) or "google" (Google conversions). */
    leadSource: lsrc,
    cities,
    pages,
    pagesNote: i.landings == null ? "Landing counter not connected here." : channel !== "all" && channel !== "SEARCH" && channel !== "DEMAND_GEN" ? `Landings are mapped to Search and Demand Gen pages only; ${channelInfo(channel).label} pages aren't.` : period.from < COUNT_START ? `Counter started ${dayMonth(COUNT_START)}: ${span(period.from < COUNT_START ? COUNT_START : period.from, period.to)} only.` : "",
    terms,
    campaigns,
    alertsCheckedAt: alerts.checkedAt,
    erpReason,
    lastLead,
    /** The channel switch, for the detail tables. */
    inScope,
  };
}

export type Blocks = ReturnType<typeof blocks>;
