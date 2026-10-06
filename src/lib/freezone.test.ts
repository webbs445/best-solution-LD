import { describe, expect, it } from "vitest";
import { cleanPlanner, extras, findActs, plannerEstimate, topMatches, type PlannerInput } from "./freezone";

const plan = (p: Partial<PlannerInput>): PlannerInput => cleanPlanner({ acts: [], pri: "cost", res: 0, sh: 1, na: 1, bank: false, ...p });

describe("plannerEstimate", () => {
  it("uses the published package total for zones with a package table", () => {
    expect(plannerEstimate(plan({ zone: "f0" })).total).toBe(12900);
    expect(plannerEstimate(plan({ zone: "f0", res: 2 })).total).toBe(24210);
  });

  it("prices residency per person, plus the establishment card, for catalogue zones", () => {
    // DMCC: 35,484 + 2,500 card + 2 × 5,500
    expect(plannerEstimate(plan({ zone: "f2", res: 2 })).total).toBe(48984);
  });

  it("adds bank assistance", () => {
    expect(plannerEstimate(plan({ zone: "f0", bank: true })).total).toBe(15900);
  });

  it("charges extra shareholders and activities where the zone prices them", () => {
    // Meydan: 6 shareholders and 7 activities included; AED 2,000 and 1,000 per extra.
    const est = plannerEstimate(plan({ zone: "f1", sh: 8, na: 9 }));
    expect(est.total).toBe(12520 + 2 * 2000 + 2 * 1000);
    expect(est.lines.map((l) => l.label)).toContain("2 extra shareholders");
  });

  it("flags limits the advisor has to quote", () => {
    const est = plannerEstimate(plan({ zone: "f8", sh: 7 }));
    expect(est.lines).toContainEqual({ label: "Package allows up to 6 shareholders", text: "Advisor quotes" });
  });

  it("year-two renewal is 90% of the base package", () => {
    expect(plannerEstimate(plan({ zone: "f0" })).renewal).toBe(11610);
  });
});

describe("extras", () => {
  it("uses the visa-package limit once anyone needs residency", () => {
    // RAKEZ: 50 shareholders without a visa, 2 on visa packages, no per-shareholder fee.
    expect(extras("f22", 0, 3, 1).warn).toEqual([]);
    expect(extras("f22", 1, 3, 1).warn).toEqual(["Package allows up to 2 shareholders"]);
  });
});

describe("cleanPlanner", () => {
  it("rejects unknown zones and activities and clamps counts", () => {
    const p = cleanPlanner({ zone: "nope", acts: ["tech", "bogus" as never], res: 99, sh: -4, na: 50 });
    expect(p.zone).toBe("f0");
    expect(p.acts).toEqual(["tech"]);
    expect(p.res).toBe(4); // IFZA packages cover up to 4 people
    expect(p.sh).toBe(1);
    expect(p.na).toBe(10);
  });
});

describe("topMatches", () => {
  it("returns four zones with bounded match percentages", () => {
    const m = topMatches(plan({ acts: ["tech"] }));
    expect(m).toHaveLength(4);
    m.forEach((x) => {
      expect(x.pct).toBeGreaterThanOrEqual(35);
      expect(x.pct).toBeLessThanOrEqual(98);
    });
    expect(m[0].pct).toBeGreaterThanOrEqual(88);
    expect(m[0].zone.t).toContain("tech");
  });
});

describe("findActs", () => {
  it("finds activities by name and synonym", () => {
    expect(findActs("software")[0][0]).toBe("Software development");
    expect(findActs("bitcoin").map((a) => a[0])).toContain("Virtual asset trading");
    expect(findActs("x")).toEqual([]);
  });
});
