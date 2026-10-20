import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createErpLead, type LeadInput } from "./erp";
import { estimate } from "./pricing";

const answers = { profile: "first_time", jurisdiction: "mainland", option: "m0", residency: 1, workspace: "flexi", bank: "yes" } as const;

const input: LeadInput = {
  lead_name: "Sara Al Mansoori",
  email_id: "sara@example.com",
  mobile_no: "+971 50 000 0000",
  utm_source: "google",
  utm_medium: "cpc",
  utm_campaign: "setup",
  utm_content: "ad-1",
  utm_term: "adset-1",
  click_id: "gclid-123",
  landing_page: "https://example.com/",
  form_id: "LP Cost Calculator",
  submission_timestamp: "2026-09-30T10:00:00.000Z",
  answers,
  estimate: estimate(answers),
};

describe("createErpLead", () => {
  beforeEach(() => {
    vi.stubEnv("ERPNEXT_URL", "https://erp.example.com/");
    vi.stubEnv("ERPNEXT_API_KEY", "key");
    vi.stubEnv("ERPNEXT_API_SECRET", "secret");
    vi.stubEnv("ERPNEXT_LEAD_SOURCE", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reports not_configured when credentials are missing", async () => {
    vi.stubEnv("ERPNEXT_API_SECRET", "");
    expect(await createErpLead(input)).toEqual({ ok: false, reason: "not_configured" });
  });

  it("posts a Lead with token auth, mapped to the Best Solution Lead doctype", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ data: { name: "BS-LEAD-2600001" } }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await createErpLead(input)).toEqual({ ok: true, name: "BS-LEAD-2600001" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://erp.example.com/api/resource/Lead");
    expect(init.headers.Authorization).toBe("token key:secret");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      first_name: "Sara",
      last_name: "Al Mansoori",
      lead_name: "Sara Al Mansoori",
      email_id: "sara@example.com",
      mobile_no: "+971 50 000 0000",
      whatsapp_no: "+971 50 000 0000",
      source: "Website",
      custom_service_enquired: "Business Setup",
      custom_preferred_contact_method: "Whatsapp",
      custom_platform: "google",
      custom_campaign: "setup",
      custom_ad_set_name: "adset-1",
      custom_ad_name: "ad-1",
      custom_clid: "gclid-123",
      custom_form_name: "Setup Cost Calculator",
    });
    expect(body.custom_remarks).toContain("Dubai Mainland, LLC (DET)");
    expect(body.custom_client_profile_and_requirement).toContain("First-time entrepreneur");
    expect(body.custom_client_profile_and_requirement).toContain("First-year estimate");
  });

  it("uses the Service Enquired option a form passes, e.g. accounting", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ data: {} }));
    vi.stubGlobal("fetch", fetchMock);
    await createErpLead({ ...input, service_enquired: "Accounting & Bookkeeping Services" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).custom_service_enquired).toBe("Accounting & Bookkeeping Services");
  });

  it.each([
    ["missing record name", Response.json({ data: {} })],
    ["malformed JSON", new Response("not-json", { status: 200 })],
  ])("does not provide a record identifier for HTTP success with %s", async (_description, response) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
    expect(await createErpLead(input)).toEqual({ ok: true, name: undefined });
  });

  it("escapes visitor-supplied text in the HTML summary", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ data: {} }));
    vi.stubGlobal("fetch", fetchMock);
    await createErpLead({ ...input, answers: { ...answers, profile: "<script>x</script>" } });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.custom_client_profile_and_requirement).not.toContain("<script>");
  });

  it("reports upstream_failed when the ERP rejects the Lead", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 417 })));
    expect(await createErpLead(input)).toEqual({ ok: false, reason: "upstream_failed" });
  });

  it("reports upstream_unreachable on network errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    expect(await createErpLead(input)).toEqual({ ok: false, reason: "upstream_unreachable" });
  });

  it("adds Google Ads leads to the lead log sheet with tracking only, and skips other leads", async () => {
    vi.stubEnv("ADS_SHEET_URL", "https://script.example.com/exec");
    vi.stubEnv("ADS_SHEET_SECRET", "s3cret");
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(url.startsWith("https://erp") ? Response.json({ data: { name: "BSL-1" } }) : Response.json({ ok: true })),
    );
    vi.stubGlobal("fetch", fetchMock);
    const test = { ...input, lead_name: "Test", mobile_no: "050 000 0000", email_id: "test.lead@example.com" };

    await createErpLead({ ...test, click_id: "Cj0KCQtest", utm_campaign: "fz_search", utm_term: "ajman free zone" });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [url, init] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(url).toBe("https://script.example.com/exec");
    const sent = JSON.parse(String(init.body));
    expect(sent.secret).toBe("s3cret");
    expect(sent.lead).toMatchObject({ name: "BSL-1", custom_clid: "Cj0KCQtest", custom_campaign: "fz_search", custom_ad_set_name: "ajman free zone" });
    expect(JSON.stringify(sent)).not.toMatch(/Test"|050 000 0000|test\.lead/);

    fetchMock.mockClear();
    await createErpLead({ ...test, utm_source: "fb", click_id: "IwAR3meta", utm_campaign: "meta" });
    await new Promise((r) => setTimeout(r, 10));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
