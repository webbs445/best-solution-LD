import { describe, expect, it } from "vitest";
import { recommend } from "./services";
import { GOALS, HUB_FAQS, HUB_PRICES, HUB_TIMING, JOURNEY, MAINLAND_HREF, SERVICES, SETUP_OPTIONS, SHOW_TEAM } from "@/content/services";

describe("services helper", () => {
  it("waits for all three answers", () => {
    expect(recommend({})).toBeNull();
    expect(recommend({ stage: "new", focus: "uae" })).toBeNull();
  });

  it("points a new business at Start a company with the route that fits", () => {
    expect(recommend({ stage: "new", focus: "uae", assets: "no" })).toEqual({ goal: "setup", option: "mainland" });
    expect(recommend({ stage: "new", focus: "international", assets: "no" })).toEqual({ goal: "setup", option: "freezone" });
  });

  it("points a running company at books or tax, and anyone holding assets at structuring", () => {
    expect(recommend({ stage: "running", focus: "books", assets: "no" })).toEqual({ goal: "accounting" });
    expect(recommend({ stage: "running", focus: "tax", assets: "no" })).toEqual({ goal: "tax" });
    expect(recommend({ stage: "running", focus: "books", assets: "yes" })).toEqual({ goal: "spv" });
    expect(recommend({ stage: "new", focus: "international", assets: "yes" })).toEqual({ goal: "spv" });
  });

  it("only recommends goals the picker offers", () => {
    const goals = GOALS.map((g) => g.id as string);
    for (const stage of ["new", "running"] as const)
      for (const focus of ["uae", "international", "books", "tax"] as const)
        for (const assets of ["yes", "no"] as const) expect(goals).toContain(recommend({ stage, focus, assets })!.goal);
  });
});

describe("services content", () => {
  it("has the picker goals in the visitor's words, with Free zone inside Start a company", () => {
    expect(GOALS.map((g) => g.label)).toEqual(["Start a company", "Keep my books", "Sort out corporate tax and VAT", "Protect my assets", "I'm not sure yet"]);
    expect(SETUP_OPTIONS.map((o) => [o.label, o.service.href])).toEqual([
      ["Mainland", MAINLAND_HREF],
      ["Free zone", "/freezone"],
    ]);
  });

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
