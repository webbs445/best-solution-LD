import { describe, expect, it } from "vitest";
import type { ReportLead } from "./erp";
import { adsReportHtml, isGoogleAdsLead } from "./adsReport";

const lead = (o: Partial<ReportLead>): ReportLead => ({
  name: "BSL-1",
  creation: "2026-10-13 10:00:00.000000",
  custom_clid: "",
  status: "Lead",
  source: "Website",
  custom_platform: "",
  custom_campaign: "",
  custom_ad_set_name: "",
  custom_ad_name: "",
  custom_form_name: "",
  ...o,
});

describe("Google Ads lead dashboard", () => {
  it("counts Google click IDs and google UTM sources, not Meta clicks", () => {
    expect(isGoogleAdsLead(lead({ custom_clid: "Cj0KCQabc" }))).toBe(true);
    expect(isGoogleAdsLead(lead({ custom_platform: "Google" }))).toBe(true);
    expect(isGoogleAdsLead(lead({ custom_clid: "Cj0Kjunk", status: "Junk" }))).toBe(true);
    expect(isGoogleAdsLead(lead({ custom_clid: "IwAR3xFacebook", custom_platform: "fb" }))).toBe(false);
    expect(isGoogleAdsLead(lead({ custom_platform: "ig", source: "Meta Ads" }))).toBe(false);
  });

  it("shows only new Google leads, by campaign, and escapes ERP text", () => {
    const html = adsReportHtml(
      [
        lead({ name: "BSL-NEW", custom_clid: "Cj0KCQabc", custom_campaign: "Freezone <Search>" }),
        lead({ name: "BSL-OLD", creation: "2026-10-01 10:00:00.000000", custom_clid: "Cj0KCQold" }),
        lead({ name: "BSL-META", custom_platform: "fb", custom_campaign: "Meta campaign" }),
      ],
      "2026-10-13 12:00:00",
    );
    expect(html).toContain("BSL-NEW");
    expect(html).toContain("Freezone &lt;Search&gt;");
    expect(html).not.toContain("BSL-OLD");
    expect(html).not.toContain("BSL-META");
    expect(html).not.toContain("Meta campaign");
  });
});
