import { describe, expect, it } from "vitest";
import { THRESHOLDS, attention, erpFor, erpIn, lowQualityScore, negativeCandidate, noLeadKeyword, pausedSince, statusChanges, type ErpLead } from "./googleAdsInsights";
import { alertsOf, campaignRows, inPeriod, keywordRows, rowsOf, searchTermRows } from "./googleAdsReport";

// Real-shaped fixture: the account's campaigns and the Sheet's headers, fake numbers.
const D = (d: string) => d;
const PERF = rowsOf([
  ["Date", "Campaign ID", "Campaign", "Campaign status", "Campaign type", "Impr.", "Clicks", "Cost (AED)", "Conversions", "Search impr. share", "Lost IS (budget)"],
  [D("2026-11-16"), "1", "fz_search_061026", "ENABLED", "SEARCH", 900, 50, 130, 0, 0.3, 0.7],
  [D("2026-11-17"), "1", "fz_search_061026", "ENABLED", "SEARCH", 800, 47, 127.89, 0, 0.3, 0.62],
  [D("2026-11-16"), "2", "BS_DemandGen_Competitor_061126", "ENABLED", "DEMAND_GEN", 40000, 1600, 110, 0, "", ""],
  [D("2026-11-17"), "2", "BS_DemandGen_Competitor_061126", "ENABLED", "DEMAND_GEN", 39000, 1540, 105.99, 0, "", ""],
]);
const SETUP = rowsOf([
  ["Campaign ID", "Campaign", "Campaign status", "Campaign type", "Daily budget (AED)", "Bidding", "Max CPC cap (AED)"],
  ["1", "fz_search_061026", "ENABLED", "SEARCH", 35, "TARGET_SPEND", 8],
  ["2", "BS_DemandGen_Competitor_061126", "ENABLED", "DEMAND_GEN", 30, "MAXIMIZE_CONVERSIONS", ""],
  ["3", "bs_accounting_081026", "PAUSED", "SEARCH", 20, "MAXIMIZE_CLICKS", ""],
]);
const lead = (created: string, campaign: string, keyword = "", qualified = true): ErpLead => ({ created, campaign, keyword, qualified });
const LEADS = [lead("2026-11-16 10:00", "fz_search_061026", "free zone license"), lead("2026-11-17 09:00", "FZ_Search_061026"), lead("2026-11-17 12:00", "fz_search_061026", "", false), lead("2026-11-01 12:00", "fz_search_061026")];
const KW = keywordRows(
  rowsOf([
    ["Date", "Campaign", "Ad group", "Keyword", "Match type", "Impr.", "Clicks", "Cost (AED)", "Conversions"],
    ["2026-11-17", "fz_search_061026", "Free zone", "free zone license", "PHRASE", 100, 20, 60, 0],
    ["2026-11-17", "fz_search_061026", "Free zone", "cheapest free zone", "BROAD", 100, 20, 70, 0],
    ["2026-11-17", "fz_search_061026", "Free zone", "free zone dubai", "EXACT", 100, 5, 10, 0],
  ]),
  rowsOf([
    ["Campaign", "Ad group", "Keyword", "Match type", "Negative", "Quality Score"],
    ["fz_search_061026", "Free zone", "free zone dubai", "EXACT", "FALSE", 3],
  ]),
);
const TERMS = searchTermRows(
  rowsOf([
    ["Date", "Campaign", "Ad group", "Search term", "Added / excluded", "Cost (AED)", "Conversions"],
    ["2026-11-17", "fz_search_061026", "Free zone", "free zone jobs", "None", 25, 0],
    ["2026-11-17", "fz_search_061026", "Free zone", "free visa dubai", "Excluded", 30, 0],
    ["2026-11-17", "fz_search_061026", "Free zone", "free zone cost", "None", 12, 0],
    ["2026-11-17", "fz_search_061026", "Free zone", "free zone visa cost", "Added", 40, 0],
  ]),
);
const CHANGES = rowsOf([
  ["Changed at", "Changed by", "Changed from", "What changed", "Action", "Fields changed", "Campaign", "Ad group"],
  ["2026-11-16 09:10", "bibin@example.com", "Google Ads web", "CAMPAIGN", "UPDATE", "status", "BS_DemandGen_Competitor_061126", ""],
  ["2026-11-16 17:40", "bibin@example.com", "Google Ads web", "CAMPAIGN", "UPDATE", "status", "BS_DemandGen_Competitor_061126", ""],
  ["2026-11-02 11:00", "owner@example.com", "Google Ads web", "CAMPAIGN", "UPDATE", "status", "bs_accounting_081026", ""],
  ["2026-11-16 12:00", "bibin@example.com", "Google Ads web", "AD_GROUP", "UPDATE", "status", "fz_search_061026", "Free zone"],
]);
const SHEET_ALERTS = alertsOf([
  ["Checked at 2026-11-18 13:20", "Type", "Where", "Detail"],
  ["", "No leads", "fz_search_061026", "AED 257.89 spent, 97 clicks, 0 conversions in the last 7 days"],
  ["", "No leads", "BS_DemandGen_Competitor_061126", "AED 215.99 spent, 3140 clicks, 0 conversions in the last 7 days"],
  ["", "CPC change", "fz_search_061026", "Avg CPC AED 1.36 yesterday vs AED 3.49 the 7 days before"],
  ["", "Tracking check", "All campaigns", "1421 clicks and 0 conversions in the last 3 days: check the lead form tracking"],
]);
const FROM = "2026-11-11", TO = "2026-11-17";
const camps = campaignRows(inPeriod(PERF, FROM, TO), SETUP);
const run = (erp: ErpLead[] | null, extra: Partial<Parameters<typeof attention>[0]> = {}) =>
  attention({ campaigns: camps, erp: erp && erpIn(erp, FROM, TO), erpAll: erp, changes: CHANGES, from: FROM, to: TO, alerts: SHEET_ALERTS, periodWords: "11–17 Nov", trackingSuspect: false, redirect: true, hidden: new Set(), ...extra });

describe("ERP join", () => {
  it("matches the campaign name without case, in the period (Dubai dates)", () => {
    expect(erpFor(erpIn(LEADS, FROM, TO), "fz_search_061026")).toHaveLength(3);
    expect(erpIn(LEADS, "2026-11-01", "2026-11-01")).toHaveLength(1);
  });
});

describe("Needs attention", () => {
  const NO_LEADS = [lead("2026-11-01 12:00", "fz_search_061026")];
  const items = run(NO_LEADS);
  const titles = items.map((i) => `${i.level}: ${i.title}`);

  it("red: Demand Gen with cheap clicks in bulk (CPC under AED 0.20, 500+ clicks) and 0 leads looks accidental", () => {
    const dg = items.find((i) => i.title.startsWith("Demand Gen Competitor"))!;
    expect(dg).toMatchObject({ level: "red", title: "Demand Gen Competitor: 3,140 clicks, 0 leads", why: "AED 0.07 a click looks like accidental taps", aed: 215.99 });
  });
  it("red: a campaign that spent AED 50+ with 0 ERP leads in the period; with the tracking banner up, Search points to the form test", () => {
    expect(titles).toContain("red: Free Zone Search: 0 leads in 11–17 Nov");
    expect(items.find((i) => i.title.startsWith("Free Zone Search"))!.action.target).toBe("d-campaigns");
    expect(run(NO_LEADS, { trackingSuspect: true }).find((i) => i.title.startsWith("Free Zone Search"))!.action).toEqual({ label: "Run form test", target: "form-test" });
    // With an ERP lead in the period there's nothing to flag.
    expect(run(LEADS).some((i) => i.title.startsWith("Free Zone Search: 0 leads"))).toBe(false);
  });
  it("amber: 50%+ lost to budget on a campaign with ERP leads since start, linked to the budget move", () => {
    expect(items.find((i) => /lost to budget/.test(i.title))).toMatchObject({ level: "amber", title: "66% of impressions lost to budget", action: { target: "redirect" } });
    expect(run(NO_LEADS, { erpAll: [] }).some((i) => /lost to budget/.test(i.title))).toBe(false);
  });
  it("amber: campaign status changes in the period, not ad group ones or older ones", () => {
    expect(titles).toContain("amber: Demand Gen Competitor: status changed 2 times");
    expect([...statusChanges(CHANGES, FROM, TO).keys()]).toEqual(["BS_DemandGen_Competitor_061126"]);
  });
  it("the Sheet's alerts are kept, except a 'No leads' on a campaign a check already covers, or one the channel switch hides", () => {
    expect(items.filter((i) => i.source === "sheet").map((i) => i.title)).toEqual(["CPC change · Free Zone Search", "Tracking check · All campaigns"]);
    expect(run(NO_LEADS, { hidden: new Set(["fz_search_061026"]) }).some((i) => i.title === "CPC change · Free Zone Search")).toBe(false);
  });
  it("ranked: red, then amber; then by money", () => {
    const order = { red: 0, amber: 1 };
    expect(items.every((x, i) => !i || order[items[i - 1].level] <= order[x.level])).toBe(true);
    expect(items[0].title).toBe("Free Zone Search: 0 leads in 11–17 Nov");
  });
  it("without the ERP: Google conversions stand in", () => {
    expect(run(null).map((i) => i.title)).toContain("Free Zone Search: 0 Google conversions in 11–17 Nov");
  });
  it("nothing found: an empty list", () => {
    expect(attention({ campaigns: [], erp: [], erpAll: [], changes: [], from: FROM, to: TO, alerts: { checkedAt: "", items: [] }, periodWords: "", trackingSuspect: false, redirect: false, hidden: new Set() })).toEqual([]);
  });
});

describe("Row flags in the detail tables", () => {
  it("keywords with spend, no conversions and no ERP lead (a keyword with an ERP lead is not flagged)", () => {
    expect(KW.filter((k) => noLeadKeyword(k, LEADS)).map((k) => k.keyword)).toEqual(["cheapest free zone"]);
    // Without the ERP, only Google conversions count.
    expect(KW.filter((k) => noLeadKeyword(k, null)).map((k) => k.keyword)).toEqual(["cheapest free zone", "free zone license"]);
  });
  it("search terms AED 20+ with no conversions, not already excluded or added", () => {
    expect(TERMS.filter(negativeCandidate).map((t) => t.term)).toEqual(["free zone jobs"]);
  });
  it("low Quality Score with impressions", () => {
    expect(KW.filter(lowQualityScore).map((k) => k.keyword)).toEqual(["free zone dubai"]);
    expect(THRESHOLDS.lowQualityScore).toBe(4);
  });
});
describe("paused since", () => {
  it("from Setup_History when the change log has nothing: the first record of the latest paused run", () => {
    const hist = rowsOf([
      ["Recorded at", "Type", "ID", "Name", "Campaign", "Settings"],
      ["2026-10-20 06:00", "Campaign", "3", "bs_accounting_081026", "bs_accounting_081026", '{"status":"ENABLED"}'],
      ["2026-11-02 13:00", "Campaign", "3", "bs_accounting_081026", "bs_accounting_081026", '{"status":"PAUSED"}'],
      ["2026-11-03 13:00", "Campaign", "3", "bs_accounting_081026", "bs_accounting_081026", '{"status":"PAUSED","budget":20}'],
    ]);
    expect(pausedSince({ id: "3", name: "bs_accounting_081026" }, hist, [])).toBe("2026-11-02");
    // The change log, when it has the change, gives the exact day.
    expect(pausedSince({ id: "3", name: "bs_accounting_081026" }, hist, [CHANGES[2]])).toBe("2026-11-02");
  });
  it("from the latest campaign status change in the change log; unknown when neither has it", () => {
    expect(pausedSince({ id: "3", name: "bs_accounting_081026" }, [], CHANGES)).toBe("2026-11-02");
    expect(pausedSince({ id: "9", name: "Holding_Offshore_091026" }, [], CHANGES)).toBe("");
  });
});
