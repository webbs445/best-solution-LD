import { describe, expect, it } from "vitest";
import { rateLimit } from "./rateLimit";

describe("rateLimit", () => {
  it("allows 5 calls per hour per key, then blocks until the window passes", () => {
    const t = 1_000_000;
    for (let i = 0; i < 5; i++) expect(rateLimit("ip-a", 5, 3_600_000, t + i)).toBe(true);
    expect(rateLimit("ip-a", 5, 3_600_000, t + 10)).toBe(false);
    expect(rateLimit("ip-b", 5, 3_600_000, t + 10)).toBe(true);
    expect(rateLimit("ip-a", 5, 3_600_000, t + 3_600_001)).toBe(true);
  });
});
