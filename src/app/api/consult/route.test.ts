import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Only the outside world is replaced: the ERP request and the email domain lookup.
vi.mock("next/server", () => ({ after: () => {} }));
const emailIsReal = vi.hoisted(() => vi.fn(async (e: string) => /^[^@\s]+@[^@\s]+\.\w+$/.test(e)));
vi.mock("@/lib/emailCheck", () => ({ emailIsReal }));

const { POST } = await import("./route");

let sent: Record<string, unknown>[] = [];
const post = (body: Record<string, unknown>) =>
  POST(new Request("http://localhost/api/consult", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
const valid = { lead_name: "Test", mobile_no: "050 000 0000", email_id: "test.lead@example.com", topic: "Office options" };

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
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/consult", () => {
  it("creates an Advice Consultation lead with the topic, message, source page, consent and click id", async () => {
    const res = await post({ ...valid, message: "Two partners, one from abroad", consent: "Accepted all", gclid: "TEST123", click_id: "TEST123", event_id: "evt_1_abc" });
    expect(await res.json()).toEqual({ ok: true, created: true });
    expect(sent[0]).toMatchObject({ custom_form_name: "Advice Consultation", custom_button_name: "Book a Consultation", custom_clid: "TEST123" });
    expect(String(sent[0].mobile_no).replace(/\s/g, "")).toBe("+971500000000");
    const notes = String(sent[0].custom_client_profile_and_requirement);
    for (const text of ["Advice on: Office options", "Message: Two partners, one from abroad", "Source page: /consult", "Cookie choice: Accepted all", "Event ID: evt_1_abc", "gclid: TEST123"])
      expect(notes).toContain(text);
  });

  it("files bookkeeping questions under the ERP's accounting service", async () => {
    await post({ ...valid, topic: "Bookkeeping and accounts" });
    expect(sent[0].custom_service_enquired).toBe("Accounting & Bookkeeping Services");
  });

  it("refuses a missing or unknown topic and a bad phone number, and sends nothing", async () => {
    const res = await post({ ...valid, topic: "Get me a licence", mobile_no: "12" });
    expect(res.status).toBe(422);
    expect((await res.json()).fields).toEqual(["mobile_no", "topic"]);
    expect(sent).toHaveLength(0);
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

  it("pretends success to bots that fill the honeypot", async () => {
    expect(await (await post({ ...valid, website: "x" })).json()).toEqual({ ok: true, created: false });
    expect(sent).toHaveLength(0);
  });
});
