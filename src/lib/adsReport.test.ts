import { describe, expect, it } from "vitest";
import type { ReportLead } from "./erp";
import { adsLoginHtml, adsReportData, adsReportHtml, isGoogleAdsLead, reportRange } from "./adsReport";

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
    expect(isGoogleAdsLead(lead({ custom_platform: "Google", custom_ad_set_name: "free zone dubai" }))).toBe(true);
    expect(isGoogleAdsLead(lead({ custom_platform: "Google" }))).toBe(false);
    expect(isGoogleAdsLead(lead({ custom_clid: "Cj0Kjunk", status: "Junk" }))).toBe(true);
    expect(isGoogleAdsLead(lead({ custom_clid: "IwAR3xFacebook", custom_platform: "fb" }))).toBe(false);
    expect(isGoogleAdsLead(lead({ custom_platform: "ig", source: "Meta Ads" }))).toBe(false);
  });

  it("shows only new Google leads, and ERP text can't close the data script", () => {
    const html = adsReportHtml(
      [
        lead({ name: "BSL-NEW", custom_clid: "Cj0KCQabc", custom_campaign: "Freezone </script><b>", custom_ad_name: "ifza-license_6123", custom_ad_set_name: "ifza cost" }),
        lead({ name: "BSL-OLD", creation: "2026-10-01 10:00:00.000000", custom_clid: "Cj0KCQold" }),
        lead({ name: "BSL-META", custom_platform: "fb", custom_campaign: "Meta campaign" }),
      ],
      null,
      new URLSearchParams(),
      "2026-10-13 12:00:00",
    );
    const data = JSON.parse(html.match(/id="lr-data">(.*?)<\/script>/)![1]);
    expect(data.erp.leads).toHaveLength(1);
    expect(data.erp.leads[0]).toMatchObject({ leadNo: "BSL-NEW", campaign: "Freezone </script><b>", adGroup: "ifza-license", keyword: "ifza cost", hasGoogleClickId: true });
    expect(html).not.toContain("BSL-OLD");
    expect(html).not.toContain("Meta campaign");
  });

  it("says when the ERP is down instead of failing", () => {
    const data = adsReportData(null, null, new URLSearchParams(), "2026-10-13 12:00:00");
    expect(data.erp).toMatchObject({ available: false, leads: [] });
  });

  it("reads the date range and only compares against periods after counting began", () => {
    const today = "2026-10-20";
    expect(reportRange(new URLSearchParams("range=today"), today)).toEqual({ key: "today", from: today, to: today, prevFrom: "2026-10-19", prevTo: "2026-10-19" });
    expect(reportRange(new URLSearchParams("range=7d"), "2026-10-25")).toMatchObject({ from: "2026-10-19", prevFrom: "2026-10-12", prevTo: "2026-10-18" });
    expect(reportRange(new URLSearchParams("range=7d"), today)).toMatchObject({ from: "2026-10-14", prevFrom: null });
    expect(reportRange(new URLSearchParams("from=2026-10-14&to=2026-10-18"), today)).toMatchObject({ key: "custom", from: "2026-10-14", to: "2026-10-18" });
    for (const bad of ["from=2026-10-01&to=2026-10-18", "from=2026-10-18&to=2026-10-14", "from=2026-10-14&to=2026-10-30", "from=x&to=y", "range=junk"])
      expect(reportRange(new URLSearchParams(bad), today)).toMatchObject({ key: "since", from: "2026-10-12", prevFrom: null });
  });

  it("counts the previous period for the change arrows", () => {
    const d = adsReportData(
      [
        lead({ name: "A", creation: "2026-10-19 09:00:00", custom_clid: "Cj0a", status: "Converted" }),
        lead({ name: "B", creation: "2026-10-18 09:00:00", custom_clid: "Cj0b", status: "Junk" }),
        lead({ name: "C", creation: "2026-10-17 09:00:00", custom_clid: "Cj0c", status: "Deal Won" }),
        lead({ name: "D", creation: "2026-10-16 09:00:00", custom_clid: "Cj0d", status: "Unqualified" }),
      ],
      [],
      new URLSearchParams("range=today"),
      "2026-10-20 12:00:00",
    );
    expect(d.erp.leads).toHaveLength(0);
    expect([d.erp.prevLeadCount, d.erp.prevQualifiedCount, d.erp.prevWonCount]).toEqual([1, 1, 1]);
    // The page re-filters other ranges itself, newest first.
    expect(d.erp.all.map((l) => l.leadNo)).toEqual(["A", "B", "C", "D"]);
  });

  it("keeps leads the ERP hides, from the lead log sheet, without double counting", () => {
    const erp = [lead({ name: "BSL-A", custom_clid: "Cj0a", status: "Lead" })];
    // The sheet has no status column.
    const sheet = [lead({ name: "BSL-A", custom_clid: "Cj0a" }), lead({ name: "BSL-B", custom_clid: "Cj0b", custom_campaign: "bs_accounting" })];
    const d = adsReportData(erp, sheet, new URLSearchParams(), "2026-10-13 18:00:00");
    expect(d.erp.leads.map((l) => [l.leadNo, l.status, l.hasGoogleClickId])).toEqual([
      ["BSL-A", "Lead", true],
      ["BSL-B", "Contacted by sales", false],
    ]);
    // ERP down: the page shows the outage, not a half list.
    expect(adsReportData(null, sheet, new URLSearchParams(), "2026-10-13 18:00:00").erp.leads).toEqual([]);
  });

  it("serves the sign-in page with its error", () => {
    expect(adsLoginHtml("Too many tries.")).toContain('{"signin":true,"error":"Too many tries."}');
  });
});
