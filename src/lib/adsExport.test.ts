import { describe, expect, it } from "vitest";
import { adsConversionCsv, uploadLeads } from "./adsExport";

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

  it("uploads only the sheet's leads whose visitor accepted Marketing, with the ERP's status where it has one", () => {
    const sheetLead = (name: string, creation: string, custom_clid: string, consent?: string) => ({ name, creation, custom_clid, consent, source: "Website", custom_platform: "google", custom_campaign: "", custom_ad_set_name: "", custom_ad_name: "", custom_form_name: "" });
    const leads = uploadLeads(
      [
        { name: "BSL-2", creation: "2026-10-12 13:00:00.000000", custom_clid: "Cj0Kjunk", status: "Junk" },
        { name: "BSL-9", creation: "2026-10-14 09:00:00.000000", custom_clid: "Cj0KmainSite", status: "Lead" }, // www lead: not in the sheet
      ],
      [
        sheetLead("BSL-1", "2026-10-12 12:04:04", "Cj0KCQall", "Accepted all"), // the ERP hides it now: still uploads
        sheetLead("BSL-4", "2026-10-12 15:00:00", "Cj0KCQmkt", "Marketing only"),
        sheetLead("BSL-2", "2026-10-12 13:00:00", "Cj0Kjunk", "Accepted all"), // the ERP shows it as Junk: stays out
        sheetLead("BSL-5", "2026-10-12 16:00:00", "Cj0KCQrej", "Rejected all"),
        sheetLead("BSL-6", "2026-10-12 17:00:00", "Cj0KCQana", "Analytics only"),
        sheetLead("BSL-7", "2026-10-12 18:00:00", "Cj0KCQnone", "No choice yet"),
        sheetLead("BSL-8", "2026-10-12 19:00:00", "Cj0KCQold"), // from before the consent column: blank
        sheetLead("BSL-3", "2026-10-12 14:00:00", "", "Accepted all"), // no click id
        sheetLead("BSL-0", "2026-07-01 10:00:00", "Cj0Kold", "Accepted all"), // before Google's 90-day window
      ],
      "2026-07-29",
    );
    expect(leads.map((l) => l.name)).toEqual(["BSL-1", "BSL-2", "BSL-4"]);
    expect(adsConversionCsv(leads).trim().split("\n").slice(1)).toEqual([
      "Cj0KCQall,Website lead (ERP),2026-10-12 12:04:04+04:00,BSL-1",
      "Cj0KCQmkt,Website lead (ERP),2026-10-12 15:00:00+04:00,BSL-4",
    ]);
    expect(uploadLeads([], null, "2026-07-29")).toEqual([]); // sheet unreachable: nothing has a recorded choice
  });

  it("shows one marked sample row only while there are no real leads", () => {
    const lines = adsConversionCsv([]).trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toMatch(/^SAMPLE-not-a-real-click,Website lead \(ERP\),\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\+04:00,SAMPLE$/);
  });
});
