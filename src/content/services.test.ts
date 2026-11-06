import { describe, expect, it } from "vitest";
import { HUB_FAQS, JOURNEY, MAINLAND_HREF, SERVICES, SHOW_TEAM } from "./services";

describe("services content", () => {
  it("links every service and step to a page on this site", () => {
    const hrefs = [...SERVICES.map((s) => s.href), ...JOURNEY.map((j) => j.href)];
    for (const h of hrefs) expect(h).toMatch(/^\/(freezone|accounting|corporate-tax|spv|cost-calculator)?(#[a-z-]+)?$/);
  });

  it("mainland advice goes through the one MAINLAND_HREF", () => {
    expect(SERVICES.find((s) => s.id === "setup")!.href).toBe(MAINLAND_HREF);
  });

  it("offers advice only: no prices, timings or government services in the copy", () => {
    const copy = [...SERVICES.flatMap((s) => [s.name, s.line]), ...JOURNEY.flatMap((j) => [j.title, j.body]), ...HUB_FAQS.flatMap((f) => [f.q, f.a])].join(" ");
    expect(copy).not.toMatch(/AED|\d+ (to \d+ )?(working )?days|licen[cs]e|visa|residen|registration|emirates id|government visit|formation|set ?up|\bfree\b(?! zone)/i);
  });

  it("keeps the team block off until photo consent is confirmed", () => {
    expect(SHOW_TEAM).toBe(false);
  });
});
