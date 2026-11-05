import { describe, expect, it } from "vitest";
import { HUB_FAQS, HUB_PRICES, HUB_TIMING, JOURNEY, MAINLAND_HREF, SERVICES, SHOW_TEAM } from "./services";

describe("services content", () => {
  it("links every service, tool and journey stage to a page on this site", () => {
    const hrefs = [...SERVICES.flatMap((s) => [s.href, s.tool.href]), ...JOURNEY.map((j) => j.href)];
    for (const h of hrefs) expect(h).toMatch(/^\/(freezone|accounting|corporate-tax|spv|cost-calculator)?(#[a-z-]+)?$/);
  });

  it("company setup goes through the one MAINLAND_HREF", () => {
    expect(SERVICES.find((s) => s.id === "setup")!.href).toBe(MAINLAND_HREF);
  });

  it("takes every price and timing from the one hub price list", () => {
    const by = Object.fromEntries(SERVICES.map((s) => [s.id, s]));
    expect(by.setup.from).toBe(HUB_PRICES.setup);
    expect(by.freezone.from).toBe(HUB_PRICES.freezone);
    expect(by.accounting.from).toBe(HUB_PRICES.accounting);
    expect([by.setup.timing, by.freezone.timing]).toEqual([HUB_TIMING.setup, HUB_TIMING.freezone]);
    for (const s of SERVICES) expect(s.from !== null || !!s.priceNote).toBe(true);
  });

  it("states the published timings and no same-day promise", () => {
    expect(HUB_TIMING).toEqual({ setup: "3 to 10 working days", freezone: "3 to 7 working days" });
    const timing = HUB_FAQS.find((f) => f.q === "How long does company formation take?")!.a;
    expect(timing).toContain("3 to 10 working days");
    expect(timing).toContain("3 to 7 working days");
    expect(timing).not.toMatch(/same day|same-day|2 to 5/i);
  });

  it("keeps the team block off until photo consent is confirmed", () => {
    expect(SHOW_TEAM).toBe(false);
  });
});
