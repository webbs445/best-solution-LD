import { describe, expect, it } from "vitest";
import { cheapest, DATA, estimate, estimateRange, maxResidents, stepOrder } from "./pricing";
import { LEAD_RULES } from "./lead";

describe("stepOrder", () => {
  it("asks all six questions before a jurisdiction is chosen", () => {
    expect(stepOrder({})).toEqual(["jurisdiction", "option", "residency", "workspace"]);
  });

  it("skips residency and workspace for offshore", () => {
    expect(stepOrder({ jurisdiction: "offshore" })).toEqual(["jurisdiction", "option"]);
  });

  it("skips the setup list when the visitor is undecided", () => {
    expect(stepOrder({ jurisdiction: "undecided" })).toEqual(["jurisdiction", "residency", "workspace"]);
  });

  it("skips workspace when a package price already includes it", () => {
    expect(stepOrder({ jurisdiction: "freezone", option: "f0" })).toEqual(["jurisdiction", "option", "residency"]);
  });
});

describe("estimate", () => {
  it("uses the published package table for a chosen package free zone", () => {
    const r = estimate({ jurisdiction: "freezone", option: "f0", residency: 2, bank: "yes" });
    expect(r.name).toBe("IFZA (Dubai)");
    expect(r.from).toBe(false);
    expect(r.total).toBe(12900 + (24210 - 12900) + 3000);
    expect(r.renewal).toBe(Math.round(0.9 * 12900));
    expect(r.lines.find((l) => l.label === "Workspace")?.text).toBe("Included");
  });

  it("builds a mainland recommendation from the rate card add-ons", () => {
    const r = estimate({ jurisdiction: "mainland", option: "recommend", residency: 2, workspace: "flexi", bank: "no" });
    expect(r.name).toBe("To be recommended by your consultant");
    expect(r.basis).toBe("Based on a Dubai mainland LLC");
    expect(r.from).toBe(true);
    expect(r.total).toBe(13000 + 2500 + 2 * 5500 + 8000);
  });

  it("prices offshore without residency or workspace", () => {
    const r = estimate({ jurisdiction: "offshore", option: "o0", residency: 3, bank: "yes" });
    expect(r.total).toBe(10000 + 3000);
    expect(r.residents).toBe(0);
    expect(r.lines.map((l) => l.text ?? l.amount)).toEqual([10000, "Not applicable", "Not required", 3000]);
  });

  it("bases an undecided visitor on the entry-level free zone package", () => {
    const r = estimate({ jurisdiction: "undecided", residency: 0, workspace: "none", bank: "no" });
    expect(r.total).toBe(cheapest(DATA.freezone).price);
    expect(r.basis).toBe("Based on the entry-level free zone package on our rate card");
  });

  it("caps residency at the largest published package size", () => {
    expect(maxResidents({ jurisdiction: "freezone", option: "f1" })).toBe(2);
    const r = estimate({ jurisdiction: "freezone", option: "f1", residency: 5, bank: "no" });
    expect(r.residents).toBe(2);
    expect(r.total).toBe(30880);
  });
});

describe("lead rules", () => {
  it("requires a country code on the phone number", () => {
    expect(LEAD_RULES.mobile_no("+971 50 000 0000")).toBe(true);
    expect(LEAD_RULES.mobile_no("050 000 0000")).toBe(false);
  });

  it("accepts ordinary emails and rejects malformed ones", () => {
    expect(LEAD_RULES.email_id("name@company.ae")).toBe(true);
    expect(LEAD_RULES.email_id("name@company")).toBe(false);
  });
});

describe("estimateRange", () => {
  it("narrows as answers come in and ends on the estimate itself", () => {
    const open = estimateRange({})!;
    const fz = estimateRange({ jurisdiction: "freezone" })!;
    const zone = estimateRange({ jurisdiction: "freezone", option: "f0" })!;
    const done = estimateRange({ jurisdiction: "freezone", option: "f0", residency: 1 })!;
    expect(open.low).toBeLessThanOrEqual(fz.low);
    expect(fz.high - fz.low).toBeGreaterThanOrEqual(zone.high - zone.low);
    expect(done.low).toBe(done.high);
    expect(done.low).toBe(estimate({ jurisdiction: "freezone", option: "f0", residency: 1 }).total);
  });
});
