import { describe, expect, it } from "vitest";
import { findActs, topMatches } from "./zoneSearch";

describe("zoneSearch (browser-safe, no prices)", () => {
  it("finds activities by name and synonym", () => {
    expect(findActs("software")[0][0]).toBe("Software development");
    expect(findActs("amazon").map((a) => a[0])).toContain("Amazon and marketplace seller");
    expect(findActs("x")).toEqual([]);
  });

  it("ranks four zones, full fits first, and honours the priority", () => {
    const m = topMatches(["tech"], "dubai");
    expect(m).toHaveLength(4);
    expect(m[0].fits).toBe(true);
    expect(m[0].zone.emirate).toBe("Dubai");
    expect(topMatches([], "range")[0].zone.sect.length).toBeGreaterThan(8);
  });

  it("returns zones without any price data", () => {
    for (const { zone } of topMatches(["trading"], "sector")) expect(Object.keys(zone)).not.toContain("price");
  });
});
