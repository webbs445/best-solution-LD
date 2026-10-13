import { describe, expect, it } from "vitest";
import { computeTax, latePenalty, nextDueYear, yearEnd } from "./corporateTax";

const base = { rev: 0, np: 0, ent: 0, fin: 0, ex: 0, loss: 0, nqi: 0, nqr: 0 };

describe("UAE Corporate Tax rules", () => {
  it("taxes only profit above AED 375,000, at 9%", () => {
    expect(computeTax({ ...base, rev: 5_000_000, np: 375_000 }, false, false).tax).toBe(0);
    expect(computeTax({ ...base, rev: 5_000_000, np: 1_375_000 }, false, false).tax).toBe(90_000);
  });

  it("adds back half of entertainment and all fines, and takes out exempt income", () => {
    const r = computeTax({ ...base, rev: 6_000_000, np: 1_000_000, ent: 60_000, fin: 8000, ex: 100_000 }, false, false);
    expect(r.adj).toBe(1_000_000 + 30_000 + 8000 - 100_000);
    expect(r.tax).toBe(Math.round((938_000 - 375_000) * 0.09));
  });

  it("lets losses cut at most 75% of adjusted profit", () => {
    const r = computeTax({ ...base, rev: 6_000_000, np: 1_000_000, loss: 2_000_000 }, false, false);
    expect([r.used, r.ti]).toEqual([750_000, 250_000]);
  });

  it("offers Small Business Relief only up to AED 3M revenue, and not with the free zone rate", () => {
    expect(computeTax({ ...base, rev: 3_000_000, np: 900_000 }, false, true)).toMatchObject({ sbr: true, tax: 0 });
    expect(computeTax({ ...base, rev: 3_000_001, np: 900_000 }, false, true)).toMatchObject({ sbr: false, tax: 47_250 });
    expect(computeTax({ ...base, rev: 2_000_000, np: 900_000, nqi: 0 }, true, true).sbr).toBe(false);
  });

  it("taxes a Qualifying Free Zone Person only on non-qualifying income, within the de minimis limit", () => {
    const pass = computeTax({ ...base, rev: 12_000_000, np: 2_500_000, nqi: 120_000, nqr: 400_000 }, true, false);
    expect(pass).toMatchObject({ qPass: true, b9: 120_000, tax: 10_800 });
    // Limit: 5% of revenue (600,000) or AED 5M, whichever is lower. 700,000 is over it: standard rates apply.
    const fail = computeTax({ ...base, rev: 12_000_000, np: 2_500_000, nqi: 120_000, nqr: 700_000 }, true, false);
    expect(fail).toMatchObject({ qPass: false, qFail: true, tax: Math.round((2_500_000 - 375_000) * 0.09) });
  });

  it("dates the return 9 months after the year end", () => {
    const today = new Date(2026, 9, 13);
    const dec = yearEnd(11, 2026, today);
    expect([dec.start.toDateString(), dec.end.toDateString(), dec.due.toDateString()]).toEqual([
      new Date(2026, 0, 1).toDateString(), new Date(2026, 11, 31).toDateString(), new Date(2027, 8, 30).toDateString(),
    ]);
    expect(yearEnd(5, 2026, today).due.toDateString()).toBe(new Date(2027, 2, 31).toDateString()); // June year end: 31 March
    expect(yearEnd(11, 2025, today).days).toBe(-13); // 30 Sep 2026 has passed
  });

  it("charges AED 500 a month for a late return, then AED 1,000 from month 13", () => {
    expect([latePenalty(3), latePenalty(12), latePenalty(13), latePenalty(24)]).toEqual([1500, 6000, 7000, 18_000]);
  });

  it("opens on the next return due: last year's until 30 September, then this year's", () => {
    expect(nextDueYear(new Date(2027, 2, 15))).toBe(2026); // March 2027: Dec 2026 return, due 30 Sep 2027
    expect(nextDueYear(new Date(2027, 8, 30))).toBe(2026); // due today
    expect(nextDueYear(new Date(2027, 9, 1))).toBe(2027);
    expect(nextDueYear(new Date(2026, 9, 13))).toBe(2026);
  });
});
