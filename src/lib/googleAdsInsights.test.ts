import { describe, expect, it } from "vitest";
import { THRESHOLDS, attention, erpFor, erpIn, negativeCandidate, noLeadKeyword, pausedSince, statusChanges, type ErpLead } from "./googleAdsInsights";
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
  attention({ campaigns: camps, erp: erp && erpIn(erp, FROM, TO), keywords: KW, terms: TERMS, changes: CHANGES, from: FROM, to: TO, alerts: SHEET_ALERTS, approvalData: "NOT available", ...extra });

describe("ERP join", () => {
  it("matches the campaign name without case, in the period (Dubai dates)", () => {
    expect(erpFor(erpIn(LEADS, FROM, TO), "fz_search_061026")).toHaveLength(3);
    expect(erpIn(LEADS, "2026-11-01", "2026-11-01")).toHaveLength(1);
  });
});

describe("Needs attention", () => {
  const items = run(LEADS);
  const texts = items.map((i) => `${i.level}: ${i.text}`);

  it("red: Demand Gen spent with 0 leads and 0 conversions; the clicks look accidental (CPC under AED 0.20, 500+ clicks)", () => {
    expect(texts[0]).toBe("red: BS_DemandGen_Competitor_061126 spent AED 216 for 3,140 clicks and 0 leads. Clicks look accidental (AED 0.07 each): check placements or pause.");
    expect(items[0].link).toEqual({ section: "campaigns", campaign: "BS_DemandGen_Competitor_061126" });
  });
  it("orange: ERP leads above Google conversions by 2 or more is a tracking gap", () => {
    expect(texts).toContain("orange: ERP got 3 leads from fz_search_061026, Google Ads counted 0: tracking gap.");
  });
  it("orange: 50%+ lost to budget on a campaign with ERP leads", () => {
    expect(texts).toContain("orange: fz_search_061026 misses 66% of possible impressions because of budget.");
  });
  it("orange: campaign status changes in the period, not ad group ones or older ones", () => {
    expect(texts).toContain("orange: BS_DemandGen_Competitor_061126 was turned on/off 2 times on 16 Nov.");
    expect([...statusChanges(CHANGES, FROM, TO).keys()]).toEqual(["BS_DemandGen_Competitor_061126"]);
  });
  it("yellow: keywords with spend and no conversions and no ERP lead (a keyword with an ERP lead is not flagged)", () => {
    expect(texts).toContain("yellow: 1 keyword spent AED 70 with no leads.");
    expect(KW.filter((k) => noLeadKeyword(k, LEADS)).map((k) => k.keyword)).toEqual(["cheapest free zone"]);
    // Without the ERP, only Google conversions count.
    expect(KW.filter((k) => noLeadKeyword(k, null)).map((k) => k.keyword)).toEqual(["cheapest free zone", "free zone license"]);
  });
  it("yellow: search terms AED 20+ with no conversions, not already excluded or added", () => {
    expect(TERMS.filter(negativeCandidate).map((t) => t.term)).toEqual(["free zone jobs"]);
    expect(texts).toContain("yellow: 1 search term is a negative-keyword candidate (AED 25, no conversions).");
  });
  it("yellow: low Quality Score with impressions", () => {
    expect(texts).toContain(`yellow: 1 keyword has a low Quality Score (${THRESHOLDS.lowQualityScore} or less).`);
  });
  it("info: ad approval data not available", () => {
    expect(items.at(-1)).toMatchObject({ level: "info", text: "Headline approvals can't be read by the script; check the asset report weekly." });
  });
  it("the Sheet's alerts are kept, except a 'No leads' on a campaign a check already covers", () => {
    const sheet = items.filter((i) => i.source === "sheet").map((i) => i.text);
    expect(sheet).toEqual([
      "CPC change · fz_search_061026: Avg CPC AED 1.36 yesterday vs AED 3.49 the 7 days before",
      "Tracking check · All campaigns: 1421 clicks and 0 conversions in the last 3 days: check the lead form tracking",
    ]);
  });
  it("ranked: red, orange, yellow, info; then by money", () => {
    const order = { red: 0, orange: 1, yellow: 2, info: 3 };
    expect(items.every((x, i) => !i || order[items[i - 1].level] <= order[x.level])).toBe(true);
  });
  it("without the ERP: fz_search (spent, 0 conversions) is red and says the ERP isn't connected; no tracking-gap check", () => {
    const off = run(null).map((i) => i.text);
    expect(off).toContain("fz_search_061026 spent AED 258 for 97 clicks and 0 leads (Google conversions; the ERP isn't connected here).");
    expect(off.some((t) => t.includes("tracking gap"))).toBe(false);
  });
  it("nothing found: an empty list", () => {
    expect(attention({ campaigns: [], erp: [], keywords: [], terms: [], changes: [], from: FROM, to: TO, alerts: { checkedAt: "", items: [] }, approvalData: "available" })).toEqual([]);
  });
});

describe("paused since", () => {
  it("from Setup_History when the change log has nothing: the first record of the latest paused run", () => {
    const hist = rowsOf([
      ["Recorded at", "Type", "ID", "Name", "Campaign", "Settings (JSON)"],
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
