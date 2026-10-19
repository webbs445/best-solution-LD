import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Only the outside world is replaced: the ERP request, the email domain lookup and the Ads sheet log.
vi.mock("next/server", () => ({ after: () => {} }));
vi.mock("@/lib/emailCheck", () => ({ emailIsReal: async (e: string) => /^[^@\s]+@[^@\s]+\.\w+$/.test(e) }));

const { POST } = await import("./route");

let sent: Record<string, unknown>[] = [];
const post = (body: Record<string, unknown>, ip = "203.0.113.7") =>
  POST(new Request("http://localhost/api/cost-calculator", { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": ip }, body: JSON.stringify(body) }));
const lead = { lead_name: "Test", mobile_no: "050 000 0000", country: "AE", email_id: "Test.Lead@Example.com", event_id: "ev-1", landing_page: "https://business.best-solution.ae/cost-calculator", gclid: "Cj0KCQ-test" };

beforeEach(() => {
  sent = [];
  process.env.ERPNEXT_URL = "https://erp.example";
  process.env.ERPNEXT_API_KEY = "k";
  process.env.ERPNEXT_API_SECRET = "s";
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
    sent.push(JSON.parse(String(init.body)));
    return new Response(JSON.stringify({ data: { name: "CRM-LEAD-0001" } }), { status: 200 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe("POST /api/cost-calculator", () => {
  it("creates the price pop-up lead with the setup and its estimate", async () => {
    const res = await post({ ...lead, source: "price", language: "ar", whatsapp_optin: true, answers: { jurisdiction: "freezone", option: "f0", residency: 2, workspace: "none", bank: false, activity: "tech" } }, "203.0.113.1");
    expect(res.status).toBe(200);
    const erp = sent[0];
    expect(erp).toMatchObject({
      lead_name: "Test",
      email_id: "test.lead@example.com",
      mobile_no: "+971500000000",
      source: "Website",
      custom_service_enquired: "Business Setup",
      custom_form_name: "Cost Calculator Price",
      custom_button_name: "Show my price",
      custom_remarks: "Cost Calculator Price: IFZA (Dubai), first year AED 24,210",
    });
    const notes = String(erp.custom_client_profile_and_requirement);
    for (const s of ["Jurisdiction: Free zone", "Setup: IFZA (Dubai)", "People needing residency: 2", "Business activity: Technology and IT", "Page language: Arabic", "WhatsApp: Send the breakdown on WhatsApp", "gclid: Cj0KCQ-test", "First-year estimate: <strong>AED 24,210</strong>", "Event ID: ev-1"]) {
      expect(notes).toContain(s);
    }
  });

  it("creates the quote lead even before a setup is chosen", async () => {
    const res = await post({ ...lead, source: "quote" }, "203.0.113.2");
    expect(res.status).toBe(200);
    expect(sent[0]).toMatchObject({ custom_form_name: "Cost Calculator Quote", custom_button_name: "Send me my written quote", custom_remarks: "Cost Calculator Quote: callback requested" });
  });

  it("re-checks the setup against the rate card", async () => {
    await post({ ...lead, source: "price", answers: { jurisdiction: "mainland", option: "f0", residency: 99, workspace: "flexi", bank: true } }, "203.0.113.3");
    expect(String(sent[0].custom_remarks)).toBe("Cost Calculator Price: To be recommended by your consultant, first year from AED 59,500");
  });

  it("refuses bad details and never reaches the ERP", async () => {
    const res = await post({ lead_name: "T", mobile_no: "12", country: "AE", email_id: "nope", source: "price" }, "203.0.113.4");
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "invalid_fields", fields: ["lead_name", "email_id", "mobile_no"] });
    expect(sent).toHaveLength(0);
  });

  it("drops a filled spam trap without a lead", async () => {
    const res = await post({ ...lead, website: "https://spam.example" }, "203.0.113.5");
    expect(res.status).toBe(200);
    expect(sent).toHaveLength(0);
  });
});
