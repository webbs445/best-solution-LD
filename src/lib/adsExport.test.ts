import { describe, expect, it } from "vitest";
import { adsConversionCsv } from "./adsExport";

describe("Google Ads conversion CSV", () => {
  it("lists real click-id leads in UAE time and skips junk and duplicates", () => {
    const csv = adsConversionCsv([
      { name: "BSL-1", creation: "2026-10-12 12:04:04.123456", custom_clid: " Cj0KCQabc ", status: "Lead" },
      { name: "BSL-2", creation: "2026-10-12 13:00:00.000000", custom_clid: "Cj0Kjunk", status: "Junk" },
      { name: "BSL-3", creation: "2026-10-12 14:00:00.000000", custom_clid: "Cj0Kdup", status: "Duplicate Lead" },
      { name: "BSL-4", creation: "2026-10-12 15:00:00.000000", custom_clid: "", status: "Lead" },
      { name: "BSL-5", creation: "2026-10-12 16:00:00.000000", custom_clid: "IwAR3xFacebook", status: "Lead" },
      { name: "BSL-6", creation: "2026-10-12 17:00:00.000000", custom_clid: "0AAAAAgbraid", status: "Lead" },
      { name: "BSL-7", creation: "2026-10-12 18:00:00.000000", custom_clid: "5a1f7b2c-1d3e-4f5a-8b9c-0d1e2f3a4b5c", status: "Lead" },
    ]);
    expect(csv).toBe(
      "Google Click ID,Conversion Name,Conversion Time,Order ID\nCj0KCQabc,Website lead (ERP),2026-10-12 12:04:04+04:00,BSL-1\n",
    );
  });

  it("shows one marked sample row only while there are no real leads", () => {
    const lines = adsConversionCsv([]).trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toMatch(/^SAMPLE-not-a-real-click,Website lead \(ERP\),\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\+04:00,SAMPLE$/);
  });
});
