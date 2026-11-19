import { describe, expect, it } from "vitest";
import {
  channelInfo,
  channelOf,
  channelParam,
  alertsOf,
  campaignRows,
  change,
  cpa,
  cpc,
  ctr,
  dateOf,
  fmtShare,
  freshness,
  historySteps,
  inPeriod,
  keywordRows,
  lostBudget,
  nextRun,
  imprShare,
  num,
  pickPeriod,
  rowsOf,
  searchTermRows,
  spendNoConv,
  stampMs,
  stampOf,
  totals,
} from "./googleAdsReport";

// Fixture: headers copied from the Sheet spec, fake numbers. Columns are in a different order than the spec on purpose.
const CAMPAIGNS_DAILY = [
  ["Campaign", "Date", "Campaign ID", "Impr.", "Clicks", "Cost (AED)", "Conversions", "All conv.", "CTR", "Avg CPC (AED)", "Search impr. share", "Lost IS (budget)", "Lost IS (rank)", "Campaign status", "Campaign type"],
  ["Search · Free Zone", "2026-11-17", "111", 1000, 50, 100, 2, 3, 0.05, 2, 0.5, 0.2, 0.3, "ENABLED", "SEARCH"],
  ["Search · Free Zone", "2026-11-16", "111", 1000, 30, 60, 0, 0, 0.03, 2, 0.25, 0.4, 0.35, "ENABLED", "SEARCH"],
  ["Demand Gen · Competitor", "2026-11-17", "222", 400, 10, 30, 1, 1, 0.025, 3, "", "", "", "ENABLED", "DEMAND_GEN"],
  ["Old campaign", "2026-11-10", "333", 100, 5, 20, 0, 0, 0.05, 4, 0.0999, 0.9001, 0, "ENABLED", "SEARCH"],
];
const SETUP_CAMPAIGNS = [
  ["Campaign ID", "Campaign", "Campaign status", "Campaign type", "Daily budget (AED)", "Bidding", "Max CPC cap (AED)", "Target CPA (AED)"],
  ["111", "Search · Free Zone", "ENABLED", "SEARCH", 150, "Maximize clicks", 6, ""],
  ["222", "Demand Gen · Competitor", "PAUSED", "DEMAND_GEN", 80, "Maximize conversions", "", ""],
  ["333", "Old campaign", "REMOVED", "SEARCH", 50, "Manual CPC", "", ""],
  ["444", "New campaign", "ENABLED", "SEARCH", 40, "Maximize clicks", "", ""],
];
const TODAY = "2026-11-18";
const q = (s: string) => new URLSearchParams(s);

describe("rowsOf: columns by header name", () => {
  const rows = rowsOf(CAMPAIGNS_DAILY);
  it("reads each value under its own header, whatever the column order", () => {
    expect(rows).toHaveLength(4);
    expect(rows[0].Campaign).toBe("Search · Free Zone");
    expect(num(rows[0], "Cost (AED)")).toBe(100);
    expect(dateOf(rows[0].Date)).toBe("2026-11-17");
  });
  it("missing columns are null, not 0, and don't throw", () => {
    const noConv = rowsOf([["Date", "Campaign", "Cost (AED)"], ["2026-11-17", "A", 70]]);
    const t = totals(noConv);
    expect(t.cost).toBe(70);
    expect(t.conv).toBeNull();
    expect(cpa(t)).toBeNull();
    expect(ctr(t)).toBeNull();
    expect(spendNoConv(t)).toBe(false); // unknown conversions: no flag
    expect(rowsOf(undefined)).toEqual([]);
    expect(num(noConv[0], "Not a column")).toBeNull();
  });
  it("drops blank rows and short rows get empty cells", () => {
    const r = rowsOf([["A", "B"], [], ["", ""], ["x"]]);
    expect(r).toEqual([{ A: "x", B: "" }]);
  });
  it("reads Sheets serial dates", () => {
    expect(dateOf(46343)).toBe("2026-11-17");
    expect(stampOf(46343.5)).toBe("2026-11-17 12:00");
    expect(stampOf("2026-11-18 13:00:12")).toBe("2026-11-18 13:00");
  });
});

describe("percent columns", () => {
  it("are fractions; Google's <10% and >90% show as such", () => {
    expect(fmtShare(0.07)).toBe("7.0%");
    expect(fmtShare(0.0999)).toBe("<10%");
    expect(fmtShare(0.9001)).toBe(">90%");
    expect(fmtShare(null)).toBe("–");
    expect(num({ v: "< 10%" }, "v")).toBe(0.0999);
    expect(num({ v: "12.5%" }, "v")).toBe(0.125);
    expect(num({ v: "--" }, "v")).toBeNull();
  });
  it("impression share over days is weighted by eligible impressions", () => {
    const t = totals(inPeriod(rowsOf(CAMPAIGNS_DAILY), "2026-11-16", "2026-11-17", "Search · Free Zone"));
    // 2000 impressions of 2000 + 4000 eligible
    expect(imprShare(t)).toBeCloseTo(2000 / 6000);
    expect(lostBudget(t)).toBeCloseTo((0.2 * 2000 + 0.4 * 4000) / 6000);
    const old = totals(inPeriod(rowsOf(CAMPAIGNS_DAILY), "2026-11-10", "2026-11-10"));
    expect(fmtShare(imprShare(old))).toBe("<10%");
    expect(fmtShare(lostBudget(old))).toBe(">90%");
  });
});

describe("pickPeriod", () => {
  it("last 7 days end yesterday; the comparison is the 7 days before", () => {
    expect(pickPeriod(q("range=7d"), TODAY)).toMatchObject({ key: "7d", from: "2026-11-11", to: "2026-11-17", prevFrom: "2026-11-04", prevTo: "2026-11-10" });
    expect(pickPeriod(q(""), TODAY).key).toBe("7d");
    // Periods that are no longer offered fall back to 7 days.
    expect(pickPeriod(q("range=lastmonth"), TODAY).key).toBe("7d");
  });
  it("last 30 days and month to date (vs the same days of last month)", () => {
    expect(pickPeriod(q("range=30d"), TODAY)).toMatchObject({ from: "2026-10-19", to: "2026-11-17", prevFrom: "2026-09-19", prevTo: "2026-10-18" });
    expect(pickPeriod(q("range=month"), TODAY)).toMatchObject({ from: "2026-11-01", to: "2026-11-18", prevFrom: "2026-10-01", prevTo: "2026-10-18" });
    // Month to date on 31 Mar: 1-28 Feb (February is shorter), never into March.
    expect(pickPeriod(q("range=month"), "2026-03-31")).toMatchObject({ prevFrom: "2026-02-01", prevTo: "2026-02-28" });
  });
  it("today and custom", () => {
    expect(pickPeriod(q("range=today"), TODAY)).toMatchObject({ from: TODAY, to: TODAY, prevFrom: "2026-11-17" });
    expect(pickPeriod(q("from=2026-11-01&to=2026-11-10"), TODAY)).toMatchObject({ key: "custom", prevFrom: "2026-10-22", prevTo: "2026-10-31" });
    expect(pickPeriod(q("from=2026-11-10&to=2026-11-01"), TODAY)).toMatchObject({ key: "7d", error: "The end date must be on or after the start date." });
    expect(pickPeriod(q("from=2026-11-10&to=2026-12-01"), TODAY).error).toBe("The end date can't be in the future.");
  });
  it("change vs the previous period", () => {
    expect(change(120, 100)).toBeCloseTo(0.2);
    expect(change(5, 0)).toBeNull();
    expect(change(null, 3)).toBeNull();
  });
});

describe("campaign table: status now from Setup_Campaigns", () => {
  const perf = inPeriod(rowsOf(CAMPAIGNS_DAILY), "2026-11-10", "2026-11-17");
  const rows = campaignRows(perf, rowsOf(SETUP_CAMPAIGNS));
  it("joins by Campaign ID: status, budget, bidding and Max CPC cap come from Setup", () => {
    const fz = rows.find((r) => r.id === "111")!;
    expect(fz).toMatchObject({ status: "ENABLED", budget: 150, bidding: "Maximize clicks", maxCpc: 6, inactive: false });
    expect(fz.t.cost).toBe(160);
    expect(cpc(fz.t)).toBeCloseTo(160 / 80);
  });
  it("paused now but spent in the period: shown, greyed (the daily row said ENABLED)", () => {
    expect(rows.find((r) => r.id === "222")).toMatchObject({ status: "PAUSED", inactive: true, maxCpc: null });
  });
  it("enabled campaigns without spend are listed; cost high to low", () => {
    expect(rows.map((r) => r.id)).toEqual(["111", "222", "333", "444"]);
    expect(rows[3].t.cost).toBeNull();
  });
  it("campaign filter keeps one campaign", () => {
    const one = campaignRows(inPeriod(rowsOf(CAMPAIGNS_DAILY), "2026-11-10", "2026-11-17", "New campaign"), rowsOf(SETUP_CAMPAIGNS), "New campaign");
    expect(one.map((r) => r.id)).toEqual(["444"]);
  });
  it("A2 every campaign in Setup_Campaigns is listed, paused or removed and without spend too, with its channel", () => {
    const rows = campaignRows([], rowsOf(SETUP_CAMPAIGNS));
    // No spend anywhere: name order.
    expect(rows.map((r) => [r.id, r.status, r.inactive, r.channel, r.t.cost])).toEqual([
      ["222", "PAUSED", true, "DEMAND_GEN", null],
      ["444", "ENABLED", false, "SEARCH", null],
      ["333", "REMOVED", true, "SEARCH", null],
      ["111", "ENABLED", false, "SEARCH", null],
    ]);
  });
  it("campaign types: normalised keys, the CHANNELS config, unknown types title-cased in grey", () => {
    expect(channelOf("Demand Gen")).toBe("DEMAND_GEN");
    expect(channelOf(" performance max ")).toBe("PERFORMANCE_MAX");
    expect(channelOf("")).toBe("UNKNOWN");
    expect(channelInfo("VIDEO")).toEqual({ label: "YouTube", color: "#E0457B", tag: "YT" });
    expect(channelInfo("LOCAL_SERVICES")).toEqual({ label: "Local Services", color: "#7A7F8C", tag: "LS" });
    expect([channelParam("search"), channelParam("demandgen"), channelParam("demand_gen"), channelParam("all"), channelParam(null)]).toEqual(["SEARCH", "DEMAND_GEN", "DEMAND_GEN", "", ""]);
  });
});

describe("Spend, no conv. flag and keyword join", () => {
  const perf = rowsOf([
    ["Date", "Campaign", "Ad group", "Criterion ID", "Keyword", "Match type", "Impr.", "Clicks", "Cost (AED)", "Conversions", "Avg CPC (AED)", "Search impr. share"],
    ["2026-11-16", "C", "AG", "1", "free zone dubai", "EXACT", 100, 10, 30, 0, 3, 0.4],
    ["2026-11-17", "C", "AG", "1", "free zone dubai", "EXACT", 100, 10, 25, 0, 2.5, 0.4],
    ["2026-11-17", "C", "AG", "2", "company setup", "PHRASE", 100, 10, 49.99, 0, 5, 0.4],
    ["2026-11-17", "C", "AG", "3", "trade license", "BROAD", 100, 10, 80, 1, 8, 0.4],
  ]);
  const setup = rowsOf([
    ["Campaign", "Ad group", "Keyword", "Match type", "Negative", "Status", "Keyword final URL", "Quality Score", "Expected CTR", "Ad relevance", "Landing page experience"],
    ["C", "AG", "[free zone dubai]", "Exact match", "FALSE", "ENABLED", "", 7, "Above average", "Average", "Above average"],
    ["C", "AG", "company setup", "PHRASE", true, "ENABLED", "", 3, "Below average", "", ""],
  ]);
  const rows = keywordRows(perf, setup);
  it("flags cost ≥ AED 50 with 0 conversions, summed over the period", () => {
    expect(spendNoConv(totals(perf.slice(0, 2)))).toBe(true);
    expect(rows.find((r) => r.keyword === "free zone dubai")!.flag).toBe(true);
    expect(rows.find((r) => r.keyword === "company setup")!.flag).toBe(false); // AED 49.99
    expect(rows.find((r) => r.keyword === "trade license")!.flag).toBe(false); // has a conversion
  });
  it("joins Quality Score by campaign + ad group + keyword + match type, ignoring negatives", () => {
    expect(rows.find((r) => r.keyword === "free zone dubai")).toMatchObject({ qs: 7, expCtr: "Above average", adRelevance: "Average", landingPage: "Above average" });
    expect(rows.find((r) => r.keyword === "company setup")!.qs).toBeNull();
  });
  it("search terms group over the period with the same flag", () => {
    const terms = searchTermRows(
      rowsOf([
        ["Date", "Campaign", "Ad group", "Search term", "Added / excluded", "Matched keyword", "Impr.", "Clicks", "Cost (AED)", "Conversions"],
        ["2026-11-16", "C", "AG", "dubai free zone cost", "None", "free zone dubai", 5, 2, 30, 0],
        ["2026-11-17", "C", "AG", "Dubai free zone cost", "Excluded", "free zone dubai", 5, 2, 30, 0],
      ]),
    );
    expect(terms).toHaveLength(1);
    expect(terms[0]).toMatchObject({ added: "Excluded", flag: true });
    expect(terms[0].t.cost).toBe(60);
  });
});

describe("status, alerts, freshness, history", () => {
  it("A1 alerts: the real Alerts tab (timestamp in header col A, Type/Where/Detail in cols B-D), no header leak", () => {
    const a = alertsOf([
      ["Checked at 2026-11-18 13:20", "Type", "Where", "Detail"],
      ["", "No leads", "fz_search_061026", "AED 257.89 spent, 97 clicks, 0 conversions in the last 7 days"],
      ["", "No leads", "BS_DemandGen_Competitor_061126", "AED 215.99 spent, 3140 clicks, 0 conversions in the last 7 days"],
      ["", "CPC change", "fz_search_061026", "Avg CPC AED 1.36 yesterday vs AED 3.49 the 7 days before"],
      ["", "Tracking check", "All campaigns", "1421 clicks and 0 conversions in the last 3 days: check the lead form tracking"],
    ]);
    expect(a.checkedAt).toBe("2026-11-18 13:20");
    expect(a.items).toEqual([
      { type: "No leads", where: "fz_search_061026", detail: "AED 257.89 spent, 97 clicks, 0 conversions in the last 7 days" },
      { type: "No leads", where: "BS_DemandGen_Competitor_061126", detail: "AED 215.99 spent, 3140 clicks, 0 conversions in the last 7 days" },
      { type: "CPC change", where: "fz_search_061026", detail: "Avg CPC AED 1.36 yesterday vs AED 3.49 the 7 days before" },
      { type: "Tracking check", where: "All campaigns", detail: "1421 clicks and 0 conversions in the last 3 days: check the lead form tracking" },
    ]);
    expect(JSON.stringify(a)).not.toContain("Type");
  });
  it("A1 alerts: the script's 'All clear' row is not an alert", () => {
    expect(alertsOf([["Checked at 2026-11-18 06:00", "Type", "Where", "Detail"], ["", "All clear", "", "No problems found"]])).toEqual({ checkedAt: "2026-11-18 06:00", items: [] });
    expect(alertsOf(undefined)).toEqual({ checkedAt: "", items: [] });
  });
  it("next run after an update (06:00, 13:00, 20:00 Dubai)", () => {
    expect(nextRun("2026-11-18 13:20")).toBe("20:00");
    expect(nextRun("2026-11-18 06:05")).toBe("13:00");
    expect(nextRun("2026-11-18 20:10")).toBe("06:00");
    expect(nextRun("not a time")).toBe("");
  });
  it("freshness: under 9 h good, 9-24 h warn, over 24 h bad", () => {
    const now = stampMs("2026-11-18 20:00")!;
    expect(freshness(stampMs("2026-11-18 13:00"), now)).toBe("good");
    expect(freshness(stampMs("2026-11-18 06:00"), now)).toBe("warn");
    expect(freshness(stampMs("2026-11-17 13:00"), now)).toBe("bad");
    expect(freshness(null, now)).toBe("unknown");
  });
  it("settings history: newest first, changed keys marked", () => {
    const rows = rowsOf([
      ["Recorded at", "Type", "ID", "Name", "Campaign", "Settings (JSON)"],
      ["2026-11-10 06:00", "Campaign", "111", "FZ", "FZ", '{"budget":100,"bidding":{"type":"MAX_CLICKS"}}'],
      ["2026-11-12 06:00", "Campaign", "111", "FZ", "FZ", '{"budget":150,"bidding":{"type":"MAX_CLICKS"}}'],
      ["2026-11-12 06:00", "Campaign", "222", "DG", "DG", "not json"],
    ]);
    const steps = historySteps(rows, "111");
    expect(steps.map((s) => s.at)).toEqual(["2026-11-12 06:00", "2026-11-10 06:00"]);
    expect(steps[0].lines).toEqual([["budget", "150", true], ["bidding.type", "MAX_CLICKS", false]]);
    expect(steps[1].lines.every(([, , c]) => !c)).toBe(true);
    expect(historySteps(rows, "222")[0].lines).toEqual([["Settings", "not json", false]]);
  });
});

