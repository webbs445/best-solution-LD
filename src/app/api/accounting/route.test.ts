import { beforeEach, describe, expect, it, vi } from "vitest";

// Only the outside world is replaced: the ERP request and the email domain lookup.
vi.mock("next/server", () => ({ after: () => {} }));
vi.mock("@/lib/emailCheck", () => ({ emailIsReal: async (e: string) => /^[^@\s]+@[^@\s]+\.\w+$/.test(e) }));

const { POST } = await import("./route");

let sent: Record<string, unknown>[] = [];
let ip = 0;
const post = (body: Record<string, unknown>, from = `203.0.113.${++ip}`) =>
  POST(new Request("http://localhost/api/accounting", { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": from }, body: JSON.stringify(body) }));
const contact = { lead_name: "TEST AUDIT - DELETE", mobile_no: "+971500000000", country: "AE", email_id: "test-audit@xerebo.com" };
const notes = () => String(sent[0].custom_client_profile_and_requirement);

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

describe("POST /api/accounting", () => {
  it("files an /accounting-new lead with its need, step 2 answers (including Not sure) and button name", async () => {
    const res = await post({ ...contact, need: "Catch up on past months", volume: "50 to 200", software: "Not sure", books_state: "Not sure" });
    expect(await res.json()).toMatchObject({ ok: true, created: true });
    expect(sent[0]).toMatchObject({ custom_form_name: "Accounting Quote", custom_button_name: "Get my quote today", custom_service_enquired: "Accounting & Bookkeeping Services" });
    for (const line of ["Need: Catch up on past months", "Transactions per month: 50 to 200", "Current software: Not sure", "Books today: Not sure"]) expect(notes()).toContain(line);
    expect(notes()).not.toContain("Service:");
  });

  it("keeps the old /accounting payload exactly as before", async () => {
    await post({ ...contact, service: "bookkeeping", volume: "Under 50", software: "Zoho Books", books_state: "Up to date" });
    expect(sent[0].custom_button_name).toBe("Send my quote request");
    expect(notes()).toContain("Service: Monthly bookkeeping");
    expect(notes()).not.toContain("Need:");
  });

  it("drops a need or choice that the form does not offer", async () => {
    await post({ ...contact, need: "<b>anything</b>", software: "Sage" });
    expect(sent[0].custom_button_name).toBe("Send my quote request");
    expect(notes()).toContain("Service: Advice on the right service");
    expect(notes()).not.toContain("anything");
    expect(notes()).not.toContain("Sage");
  });

  it("stops a sixth lead from one IP within the hour, and sends nothing for it", async () => {
    const lead = { ...contact, need: "Not sure yet" };
    for (let i = 0; i < 5; i++) expect((await post(lead, "198.51.100.9")).status).toBe(200);
    const res = await post(lead, "198.51.100.9");
    expect(res.status).toBe(429);
    expect(sent).toHaveLength(5);
    expect((await post(lead, "198.51.100.10")).status).toBe(200);
  });

  it("refuses a bad name, number and email, and sends nothing", async () => {
    const res = await post({ lead_name: "T", mobile_no: "12", country: "AE", email_id: "nope", need: "Not sure yet" });
    expect(res.status).toBe(422);
    expect((await res.json()).fields).toEqual(["lead_name", "email_id", "mobile_no"]);
    expect(sent).toHaveLength(0);
  });
});
