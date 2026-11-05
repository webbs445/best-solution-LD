import { describe, expect, it } from "vitest";
import { recommend } from "./services";
import { GOALS, JOURNEY, MAINLAND_HREF, SERVICES, TOOLS } from "@/content/services";

describe("services helper", () => {
  it("waits for all three answers", () => {
    expect(recommend({})).toBeNull();
    expect(recommend({ stage: "new", focus: "uae" })).toBeNull();
  });

  it("recommends by focus, and structuring when assets are held", () => {
    expect(recommend({ stage: "new", focus: "uae", assets: "no" })).toBe("setup");
    expect(recommend({ stage: "new", focus: "international", assets: "no" })).toBe("freezone");
    expect(recommend({ stage: "running", focus: "books", assets: "no" })).toBe("accounting");
    expect(recommend({ stage: "running", focus: "tax", assets: "no" })).toBe("tax");
    expect(recommend({ stage: "running", focus: "books", assets: "yes" })).toBe("spv");
  });
});

describe("services content", () => {
  it("links every service, tool and journey stage to a page on this site", () => {
    const hrefs = [...SERVICES.flatMap((s) => [s.href, s.tool.href]), ...TOOLS.map((t) => t.href), ...JOURNEY.map((j) => j.href)];
    for (const h of hrefs) expect(h).toMatch(/^\/(freezone|accounting|corporate-tax|spv|cost-calculator)?(#[a-z-]+)?$/);
  });

  it("company setup goes through the one MAINLAND_HREF", () => {
    expect(SERVICES.find((s) => s.id === "setup")!.href).toBe(MAINLAND_HREF);
  });

  it("every picker goal except Not sure is a service", () => {
    const ids = SERVICES.map((s) => s.id as string);
    for (const g of GOALS) if (g.id !== "unsure") expect(ids).toContain(g.id);
  });

  it("shows a price or a note on every tile", () => {
    for (const s of SERVICES) expect(s.from !== null || !!s.priceNote).toBe(true);
  });
});
