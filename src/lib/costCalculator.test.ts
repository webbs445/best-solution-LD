import { describe, expect, it } from "vitest";
import { ccAnswersFrom, ccEstimate, toAnswers, type CcAnswers } from "./costCalculator";
import { estimate } from "./pricing";

const a = (x: Partial<CcAnswers>): CcAnswers => ({ residency: 0, workspace: "none", bank: false, ...x });

describe("/cost-calculator estimate", () => {
  it("matches the main calculator's total and renewal", () => {
    for (const x of [
      a({ jurisdiction: "mainland", option: "m0", residency: 3, workspace: "flexi", bank: true }),
      a({ jurisdiction: "freezone", option: "f0", residency: 2 }),
      a({ jurisdiction: "freezone", option: "recommend", residency: 1, workspace: "virtual" }),
      a({ jurisdiction: "offshore", option: "o0" }),
      a({ jurisdiction: "undecided", residency: 1 }),
    ]) {
      const ours = ccEstimate(x)!, theirs = estimate(toAnswers(x));
      expect(ours.total).toBe(theirs.total);
      expect(ours.renewal).toBe(theirs.renewal);
    }
  });

  it("prices the design's examples", () => {
    expect(ccEstimate(a({ jurisdiction: "mainland", option: "m0", residency: 3, workspace: "flexi", bank: true }))!.total).toBe(43_000);
    expect(ccEstimate(a({ jurisdiction: "freezone", option: "f0", residency: 2 }))!.total).toBe(24_210);
  });

  it("waits for a setup unless undecided", () => {
    expect(ccEstimate(a({}))).toBeNull();
    expect(ccEstimate(a({ jurisdiction: "freezone" }))).toBeNull();
  });
});

describe("answers from a request", () => {
  it("drops unknown values and clamps residency to the package", () => {
    const r = ccAnswersFrom({ jurisdiction: "freezone", option: "f19", residency: 9, workspace: "palace", bank: "yes", activity: "hacking" })!;
    expect(r).toEqual({ jurisdiction: "freezone", option: "f19", residency: 2, workspace: "none", bank: false, activity: undefined });
  });

  it("falls back to a recommendation for an unknown setup, and offshore has no residency", () => {
    expect(ccAnswersFrom({ jurisdiction: "mainland", option: "f0" })!.option).toBe("recommend");
    expect(ccAnswersFrom({ jurisdiction: "offshore", option: "o0", residency: 4, workspace: "flexi" })).toMatchObject({ residency: 0, workspace: "none" });
    expect(ccAnswersFrom({ jurisdiction: "moon" })).toBeNull();
  });
});
