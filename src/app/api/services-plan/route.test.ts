import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Only the outside world is replaced: the ERP request and the email domain lookup.
vi.mock("next/server", () => ({ after: () => {} }));
const emailIsReal = vi.hoisted(() => vi.fn(async (e: string) => /^[^@\s]+@[^@\s]+\.\w+$/.test(e)));
vi.mock("@/lib/emailCheck", () => ({ emailIsReal }));

const { POST } = await import("./route");

let sent: Record<string, unknown>[] = [];
let ip = 0;
const post = (body: Record<string, unknown>) =>
  POST(
    new Request("http://localhost/api/services-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": `203.0.113.${++ip}` },
      body: JSON.stringify(body),
    }),
  );
const valid = { lead_name: "Test", mobile_no: "+971500000000", country: "AE", email_id: "test.lead@example.com", topic: "corporate_tax" };

beforeEach(() => {
  sent = [];
  process.env.ERPNEXT_URL = "https://erp.example";
  process.env.ERPNEXT_API_KEY = "k";
  process.env.ERPNEXT_API_SECRET = "s";
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      sent.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ data: { name: "CRM-LEAD-0001" } }), { status: 200 });
    }),
  );
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/services-plan", () => {
  it("creates a Services Plan lead from /services with the page choices as labelled lines, UTMs, click id and landing page", async () => {
    const res = await post({
      ...valid,
      worries: [4, 2],
      advisor_pref: "any",
      contact_pref: "whatsapp",
      consult_mode: "video",
      form_location: "s9",
      utm_source: "google",
      utm_campaign: "TEST-AUDIT-DELETE",
      gclid: "TEST123",
      click_id: "TEST123",
      event_id: "evt_1_abc",
      landing_page: "https://business.best-solution.ae/services?gclid=TEST123",
    });
    expect(await res.json()).toEqual({ ok: true, created: true });
    expect(sent[0]).toMatchObject({
      custom_form_name: "Services Plan",
      custom_button_name: "Send me my plan",
      custom_service_enquired: "VAT & Tax Services",
      custom_platform: "google",
      custom_campaign: "TEST-AUDIT-DELETE",
      custom_clid: "TEST123",
      mobile_no: "+971500000000",
      email_id: "test.lead@example.com",
    });
    const notes = String(sent[0].custom_client_profile_and_requirement);
    for (const text of [
      "Topic: Corporate Tax",
      "Questions: What will year two cost?; Free zone or mainland?",
      "Advisor: Any",
      "Reply by: WhatsApp",
      "Meeting: Video call",
      "Form location: s9",
      "Source page: /services",
      "Landing page: https://business.best-solution.ae/services?gclid=TEST123",
      "Event ID: evt_1_abc",
      "gclid: TEST123",
    ])
      expect(notes).toContain(text);
  });

  it("files a hero plan card lead with its Service Enquired and the one-line plan note", async () => {
    const cases: [Record<string, string>, string, string][] = [
      [{ situation: "new", base: "free_zone", timing: "this_month" }, "Business Setup", "Situation: I'm planning a new company · Base: Free zone · Timing: This month"],
      [{ situation: "existing", need: "books", timing: "exploring" }, "Accounting & Bookkeeping Services", "Situation: I already have a company · Need: Monthly books · Timing: Just exploring"],
      [{ situation: "existing", need: "both", timing: "one_to_three" }, "VAT & Tax Services", "Situation: I already have a company · Need: Books and tax together · Timing: In 1 to 3 months"],
      [{ situation: "existing", need: "changes", timing: "this_month" }, "Other Services", "Situation: I already have a company · Need: Changes to my company · Timing: This month"],
      [{ situation: "several", based: "abroad", timing: "exploring" }, "Other Services", "Situation: Several companies or property · Based: Outside the UAE · Timing: Just exploring"],
      [{ situation: "not_sure", timing: "this_month" }, "Business Setup", "Situation: Not sure yet · Timing: This month"],
    ];
    for (const [plan, service, note] of cases) {
      sent = [];
      await post({ ...valid, topic: "not_sure", form_location: "hero", plan });
      expect(sent[0]).toMatchObject({ custom_form_name: "Services Plan", custom_button_name: "Get my written plan", custom_service_enquired: service });
      // The field is HTML, so the apostrophe in "I'm" is escaped there.
      const notes = String(sent[0].custom_client_profile_and_requirement).replace(/&#39;/g, "'");
      expect(notes).toContain(note);
      expect(notes).toContain("Form location: hero card");
      expect(notes).toContain("Source page: /services");
      expect(notes).not.toContain("Topic:");
    }
  });

  it("ignores plan answers that are not on a real path, and plan answers sent from another form", async () => {
    await post({ ...valid, form_location: "hero", plan: { situation: "<b>x</b>" } });
    expect(String(sent[0].custom_client_profile_and_requirement)).toContain("Topic: Corporate Tax");
    sent = [];
    await post({ ...valid, form_location: "s9", plan: { situation: "existing", need: "books" } });
    expect(sent[0].custom_service_enquired).toBe("VAT & Tax Services");
    expect(String(sent[0].custom_client_profile_and_requirement)).not.toContain("Situation:");
  });

  it("writes the beginner worry as \"Where do I begin?\" in the ERP notes", async () => {
    await post({ ...valid, worries: [0, 1] });
    expect(String(sent[0].custom_client_profile_and_requirement)).toContain("Questions: Where do I begin?; Which price is right?");
  });

  it("files a lead without a topic as Not sure yet, under Business Setup", async () => {
    await post({ ...valid, topic: undefined });
    expect(sent[0].custom_service_enquired).toBe("Business Setup");
    expect(String(sent[0].custom_client_profile_and_requirement)).toContain("Topic: Not sure yet");
  });

  it("refuses a bad name, bad number and missing email, and sends nothing", async () => {
    const res = await post({ lead_name: "T", mobile_no: "12", country: "AE", email_id: "" });
    expect(res.status).toBe(422);
    expect((await res.json()).fields).toEqual(["lead_name", "mobile_no", "email_id"]);
    expect(sent).toHaveLength(0);
  });

  it("pretends success to bots that fill the honeypot", async () => {
    expect(await (await post({ ...valid, bs_hp: "x" })).json()).toEqual({ ok: true, created: false });
    expect(sent).toHaveLength(0);
  });

  it("stops a sixth lead from one IP within the hour", async () => {
    const req = () =>
      POST(new Request("http://localhost/api/services-plan", { method: "POST", headers: { "x-forwarded-for": "198.51.100.7" }, body: JSON.stringify(valid) }));
    for (let i = 0; i < 5; i++) expect((await req()).status).toBe(200);
    expect((await req()).status).toBe(429);
  });

  it("on a Vercel preview returns a PREVIEW lead and makes no outbound call", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    emailIsReal.mockClear();
    const body = await (await post(valid)).json();
    expect(body).toMatchObject({ ok: true, created: true, preview: true });
    expect(body.lead_id).toMatch(/^PREVIEW-\d+$/);
    expect(fetch).not.toHaveBeenCalled();
    expect(emailIsReal).not.toHaveBeenCalled();
  });
});
