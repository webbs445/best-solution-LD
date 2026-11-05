import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Only the outside world is replaced: the ERP request and the email domain lookup.
vi.mock("next/server", () => ({ after: () => {} }));
const emailIsReal = vi.hoisted(() => vi.fn(async (e: string) => /^[^@\s]+@[^@\s]+\.\w+$/.test(e)));
vi.mock("@/lib/emailCheck", () => ({ emailIsReal }));

const { POST } = await import("./route");

let sent: Record<string, unknown>[] = [];
const post = (body: Record<string, unknown>) =>
  POST(new Request("http://localhost/api/callback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));

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

describe("POST /api/callback", () => {
  it("accepts a UAE number typed the local way and stores it with +971", async () => {
    const res = await post({ lead_name: "Test", mobile_no: "050 000 0000", email_id: "test.lead@example.com", interest: "freezone" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, created: true });
    expect(String(sent[0].mobile_no).replace(/\s/g, "")).toBe("+971500000000");
  });

  it("notes the visitor's cookie choice on the lead, and only a known one", async () => {
    await post({ lead_name: "Test", mobile_no: "050 000 0000", email_id: "test.lead@example.com", consent: "Rejected all" });
    expect(String(sent[0].custom_client_profile_and_requirement)).toContain("Cookie choice: Rejected all");
    await post({ lead_name: "Test", mobile_no: "050 000 0000", email_id: "test.lead@example.com", consent: "<b>yes</b>" });
    expect(String(sent[1].custom_client_profile_and_requirement)).toContain("Cookie choice: Unknown");
  });

  it("files /services hub leads under LP Services Hub, and every other form as Callback Request", async () => {
    await post({ lead_name: "Test", mobile_no: "050 000 0000", email_id: "test.lead@example.com", form: "services" });
    expect(sent[0].custom_form_name).toBe("LP Services Hub");
    await post({ lead_name: "Test", mobile_no: "050 000 0000", email_id: "test.lead@example.com", form: "anything else" });
    expect(sent[1].custom_form_name).toBe("Callback Request");
  });

  describe("on a Vercel preview deployment", () => {
    afterEach(() => vi.unstubAllEnvs());

    it("returns a PREVIEW lead and makes no outbound call: no ERP, no sheet, no email DNS check", async () => {
      vi.stubEnv("VERCEL_ENV", "preview");
      emailIsReal.mockClear();
      const res = await post({ lead_name: "Test", mobile_no: "050 000 0000", email_id: "test.lead@example.com", form: "services", utm_source: "google", gclid: "TEST" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({ ok: true, created: true, preview: true });
      expect(body.lead_id).toMatch(/^PREVIEW-\d+$/);
      expect(fetch).not.toHaveBeenCalled();
      expect(sent).toHaveLength(0);
      expect(emailIsReal).not.toHaveBeenCalled();
    });

    it("still refuses invalid fields", async () => {
      vi.stubEnv("VERCEL_ENV", "preview");
      const res = await post({ lead_name: "Test", mobile_no: "12", email_id: "not-an-email" });
      expect(res.status).toBe(422);
      expect((await res.json()).fields).toEqual(["mobile_no", "email_id"]);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("in production still checks the email and creates the ERP lead", async () => {
      vi.stubEnv("VERCEL_ENV", "production");
      emailIsReal.mockClear();
      const res = await post({ lead_name: "Test", mobile_no: "050 000 0000", email_id: "test.lead@example.com" });
      expect(await res.json()).toEqual({ ok: true, created: true });
      expect(emailIsReal).toHaveBeenCalledTimes(1);
      expect(sent).toHaveLength(1);
    });
  });

  it("still refuses a number that is not one", async () => {
    const res = await post({ lead_name: "Test", mobile_no: "12", email_id: "test.lead@example.com" });
    expect(res.status).toBe(422);
    expect(sent).toHaveLength(0);
  });
});
