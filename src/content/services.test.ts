import { describe, expect, it } from "vitest";
import { HUB_FAQS, JOURNEY, MAINLAND_HREF, SERVICES, SHOW_TEAM, SITE_MENU } from "./services";

describe("services content", () => {
  it("links every service and step to a page on this site", () => {
    const hrefs = [...SERVICES.map((s) => s.href), ...JOURNEY.map((j) => j.href)];
    for (const h of hrefs) expect(h).toMatch(/^\/(freezone|mainland|offshore|accounting|corporate-tax|spv|cost-calculator)?(#[a-z-]+)?$/);
  });

  it("has one tile for each of the seven services, each on its own page", () => {
    expect(SERVICES.map((s) => s.href)).toEqual(["/freezone", "/mainland", "/offshore", "/spv", "/corporate-tax", "/accounting", "/cost-calculator"]);
  });

  it("menu lists Services first, then every service page", () => {
    expect(SITE_MENU.map((m) => m.label)).toEqual(["Services", "Free zone", "Mainland", "Offshore", "Plan your budget", "SPV", "Corporate tax", "Accounting"]);
    expect(SITE_MENU[0].href).toBe("/services");
  });

  it("mainland advice goes through the one MAINLAND_HREF", () => {
    expect(SERVICES.find((s) => s.id === "setup")!.href).toBe(MAINLAND_HREF);
  });

  it("offers advice only: no prices, timings or government services in the copy", () => {
    const copy = [...SERVICES.flatMap((s) => [s.name, s.line]), ...JOURNEY.flatMap((j) => [j.title, j.body]), ...HUB_FAQS.flatMap((f) => [f.q, f.a]), ...SITE_MENU.flatMap((m) => [m.label, m.line])].join(" ");
    expect(copy).not.toMatch(/AED|\d+ (to \d+ )?(working )?days|licen[cs]e|visa|residen|registration|emirates id|government visit|formation|set ?up|\bfree\b(?! zone)/i);
  });

  it("keeps the team block off until photo consent is confirmed", () => {
    expect(SHOW_TEAM).toBe(false);
  });
});
