import { beforeEach, describe, expect, it, vi } from "vitest";

// Only the outside world is replaced: the ERP request and the email domain lookup.
vi.mock("next/server", () => ({ after: () => {} }));
vi.mock("@/lib/emailCheck", () => ({ emailIsReal: async (e: string) => /^[^@\s]+@[^@\s]+\.\w+$/.test(e) }));

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

  it("still refuses a number that is not one", async () => {
    const res = await post({ lead_name: "Test", mobile_no: "12", email_id: "test.lead@example.com" });
    expect(res.status).toBe(422);
    expect(sent).toHaveLength(0);
  });
});
