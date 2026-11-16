import { describe, expect, it } from "vitest";
import { TEST_NOTES } from "./adLandingsNotes";
import { pageLabel } from "./adLandingsPage";
import {
  byClickType,
  byPath,
  countChange,
  dailyRows,
  excludeTests,
  parseDay,
  pickRange,
  rateChange,
  rates,
  toCsv,
  totals,
  yTicks,
} from "./adLandingsReport";

const TODAY = "2026-11-16";
const q = (s: string) => new URLSearchParams(s);

// A realistic day: production after the QA visits (3 on /services with gbraid), plus real traffic.
const FLAT = [
  "/services|gbraid|land", "5", "/services|gbraid|shown", "5", "/services|gbraid|accept_all", "2", "/services|gbraid|reject_all", "1",
  "/freezone|gclid|land", "10", "/freezone|gclid|shown", "8", "/freezone|gclid|accept_all", "5", "/freezone|gclid|manage", "1",
  "/services|*", "15", // daily-cap counter: never a metric
];

describe("parseDay and totals", () => {
  it("reads metrics, skips the cap field, and derives no choice", () => {
    const e = parseDay(TODAY, FLAT);
    expect(e).toHaveLength(8);
    expect(totals(e)).toEqual({ land: 15, shown: 13, accept_all: 7, reject_all: 1, manage: 1, none: 4 });
    expect(parseDay(TODAY, null)).toEqual([]);
  });
});

describe("rates", () => {
  it("divides by banners shown", () => {
    const r = rates({ land: 15, shown: 13, accept_all: 7, reject_all: 1, manage: 1, none: 4 });
    expect(r.accept).toBeCloseTo(7 / 13);
    expect(r.reject).toBeCloseTo(1 / 13);
    expect(r.none).toBeCloseTo(4 / 13);
  });
  it("is null, not 0 or NaN, when no banner was shown", () => {
    expect(rates({ land: 4, shown: 0, accept_all: 0, reject_all: 0, manage: 0, none: 0 })).toEqual({ accept: null, reject: null, manage: null, none: null });
  });
});

describe("test-visit exclusion", () => {
  it("takes the seeded QA visits off 16 Nov, /services, gbraid only", () => {
    const e = excludeTests(parseDay(TODAY, FLAT), TEST_NOTES);
    expect(totals(e)).toEqual({ land: 12, shown: 10, accept_all: 6, reject_all: 0, manage: 1, none: 3 });
    const services = byPath(e).find((r) => r.key === "/services")!;
    expect([services.land, services.shown, services.accept_all, services.reject_all]).toEqual([2, 2, 1, 0]);
  });
  it("never goes below zero and leaves other days alone", () => {
    const e = excludeTests(parseDay(TODAY, ["/services|gbraid|land", "1"]), TEST_NOTES);
    expect(totals(e).land).toBe(0);
    expect(totals(excludeTests(parseDay("2026-11-17", FLAT), TEST_NOTES)).land).toBe(15);
  });
});

describe("period comparison", () => {
  it("defaults to the last 7 days and compares with the 7 days before", () => {
    expect(pickRange(q(""), TODAY)).toMatchObject({ key: "7d", from: "2026-11-10", to: TODAY, prevFrom: "2026-11-03", prevTo: "2026-11-09" });
    expect(pickRange(q("range=today"), TODAY)).toMatchObject({ from: TODAY, prevFrom: "2026-11-15", prevTo: "2026-11-15" });
    expect(pickRange(q("range=30d"), TODAY)).toMatchObject({ from: "2026-10-18", prevFrom: "2026-09-18", prevTo: "2026-10-17" });
  });
  it("accepts a valid custom range and refuses a bad one with a reason", () => {
    expect(pickRange(q("from=2026-11-01&to=2026-11-10"), TODAY)).toMatchObject({ key: "custom", prevFrom: "2026-10-22", prevTo: "2026-10-31", error: "" });
    expect(pickRange(q("from=2026-11-10&to=2026-11-01"), TODAY)).toMatchObject({ key: "7d", error: "The end date must be on or after the start date." });
    expect(pickRange(q("from=2026-11-10&to=2026-11-30"), TODAY).error).toMatch(/future/);
    expect(pickRange(q("from=2024-01-01&to=2026-11-10"), TODAY).error).toMatch(/400 days/);
  });
  it("'From start' runs from the counter's first day, with no comparison", () => {
    expect(pickRange(q("range=since"), "2026-11-20")).toMatchObject({ key: "since", from: "2026-11-16", to: "2026-11-20", prevFrom: null });
  });
  it("has no previous period when it would reach past the 400 days kept", () => {
    expect(pickRange(q("from=2025-12-01&to=2026-11-16"), TODAY)).toMatchObject({ key: "custom", prevFrom: null, prevTo: null });
  });
  it("shows a count change only with at least 5 on both sides", () => {
    expect(countChange(15, 10)).toBe(50);
    expect(countChange(4, 10)).toBeNull();
    expect(countChange(10, 4)).toBeNull();
    expect(countChange(10, null)).toBeNull();
  });
  it("gives rate changes in percentage points, with at least 5 banners shown on both sides", () => {
    expect(rateChange(0.6, 0.45, 20, 20)).toBe(15);
    expect(rateChange(0.575, 0.55, 20, 20)).toBe(2.5);
    expect(rateChange(0.6, 0.45, 4, 20)).toBeNull();
    expect(rateChange(null, 0.45, 20, 20)).toBeNull();
  });
});

describe("chart y-axis", () => {
  it("steps by 1, 2 or 5 × 10ⁿ up to a round top at or above the max", () => {
    expect(yTicks(32)).toEqual([0, 10, 20, 30, 40]);
    expect(yTicks(3)).toEqual([0, 1, 2, 3]);
    expect(yTicks(0)).toEqual([0, 1]);
    expect(yTicks(180)).toEqual([0, 50, 100, 150, 200]);
  });
});

describe("readable page names", () => {
  it("names known pages and zone links, and falls back to the path", () => {
    expect(pageLabel("/")).toBe("Home");
    expect(pageLabel("/freezone/dmcc")).toBe("Free zone · DMCC");
    expect(pageLabel("/freezone/meydan")).toBe("Free zone · Meydan");
    expect(pageLabel("/freezone/planner")).toBe("Free zone · Planner");
    expect(pageLabel("/a-new-page")).toBe("/a-new-page");
    expect(pageLabel("/freezone/unknown")).toBe("/freezone/unknown");
  });
});

describe("breakdowns and CSV", () => {
  it("labels gbraid/wbraid as iPhone / iOS clicks and gclid as other clicks", () => {
    const rows = byClickType(parseDay(TODAY, [...FLAT, "/|wbraid|land", "2"]));
    expect(rows.map((r) => [r.label, r.land])).toEqual([["Other clicks", 10], ["iPhone / iOS clicks", 7]]);
  });
  it("fills every day of the range and writes newest first with a total", () => {
    const e = parseDay(TODAY, FLAT);
    const rows = dailyRows(e, "2026-11-14", TODAY);
    expect(rows.map((r) => r.land)).toEqual([0, 0, 15]);
    const csv = toCsv(rows, totals(e)).trim().split("\n");
    expect(csv[0]).toMatch(/^date,ad_landings,banner_shown,accept,reject,manage,no_choice/);
    expect(csv[1]).toBe("2026-11-16,15,13,7,1,1,4,53.8,7.7,30.8");
    expect(csv.at(-1)).toBe("total,15,13,7,1,1,4,53.8,7.7,30.8");
  });
});
