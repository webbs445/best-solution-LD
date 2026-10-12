import { describe, expect, it } from "vitest";
import { adsConversionCsv } from "./adsExport";

describe("Google Ads conversion CSV", () => {
  it("lists real click-id leads in UAE time and skips junk and duplicates", () => {
    const csv = adsConversionCsv([
      { name: "BSL-1", creation: "2026-10-12 12:04:04.123456", custom_clid: " Cj0KCQabc ", status: "Lead" },
      { name: "BSL-2", creation: "2026-10-12 13:00:00.000000", custom_clid: "Cj0Kjunk", status: "Junk" },
      { name: "BSL-3", creation: "2026-10-12 14:00:00.000000", custom_clid: "Cj0Kdup", status: "Duplicate Lead" },
      { name: "BSL-4", creation: "2026-10-12 15:00:00.000000", custom_clid: "", status: "Lead" },
    ]);
    expect(csv).toBe(
      "Parameters:TimeZone=+0400\nGoogle Click ID,Conversion Name,Conversion Time\nCj0KCQabc,Website lead (ERP),2026-10-12 12:04:04\n",
    );
  });
});
