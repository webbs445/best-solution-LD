import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
  A form sent on a Vercel preview must reach nothing outside: not the ERP (create or update), not the lead log sheet or
  its Fallback tab (so no alert email either), not the KV counters, not even a DNS lookup. Real modules throughout, with
  every key set as on a real preview; any fetch or DNS call fails the test.
*/
const dns = vi.hoisted(() => ({ resolveMx: vi.fn(), resolve4: vi.fn() }));
vi.mock("node:dns/promises", () => dns);

import { TRAP_FIELD } from "@/lib/lead";
import { recordAdsLead, saveFallbackLead } from "@/lib/adsSheet";
import { countGuard } from "@/lib/leadLog";
import { POST as leadPost } from "./lead/route";
import { POST as costCalculatorPost } from "./cost-calculator/route";
import { POST as callbackPost } from "./callback/route";
import { POST as consultPost } from "./consult/route";
import { POST as accountingPost } from "./accounting/route";
import { POST as corporateTaxPost } from "./corporate-tax/route";
import { POST as spvPost } from "./spv/route";

const routes = [
  ["lead", leadPost],
  ["cost-calculator", costCalculatorPost],
  ["callback", callbackPost],
  ["consult", consultPost],
  ["accounting", accountingPost],
  ["corporate-tax", corporateTaxPost],
  ["spv", spvPost],
] as const;

// A Google Ads lead (gclid, google / cpc): on the live site this is also the one that goes to the lead log sheet.
const lead = (n: number) => ({
  lead_name: "Test",
  email_id: "test.lead@example.com",
  mobile_no: `050 000 000${n}`,
  country: "AE",
  topic: "Office options",
  gclid: "TEST123",
  utm_source: "google",
  utm_medium: "cpc",
  utm_campaign: "TEST-AUDIT-DELETE",
  landing_page: "https://example.com/freezone?gclid=TEST123",
  [TRAP_FIELD]: "",
});

const post = (path: string, handler: (r: Request) => Promise<Response>, body: Record<string, unknown>) =>
  handler(new Request(`http://localhost/api/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));

let fetchSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  for (const [k, v] of Object.entries({
    VERCEL_ENV: "preview",
    ERPNEXT_URL: "https://erp.invalid",
    ERPNEXT_API_KEY: "k",
    ERPNEXT_API_SECRET: "s",
    ADS_SHEET_URL: "https://sheet.invalid/exec",
    ADS_SHEET_SECRET: "s",
    KV_REST_API_URL: "https://kv.invalid",
    KV_REST_API_TOKEN: "t",
  }))
    vi.stubEnv(k, v);
  fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("outside call on a preview"));
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("a preview deployment", () => {
  it("answers every lead route with a mock lead and calls nothing outside", async () => {
    let n = 0;
    for (const [path, handler] of routes) {
      const res = await post(path, handler, lead(++n));
      expect(res.status, path).toBe(200);
      expect(await res.json(), path).toMatchObject({ ok: true, created: true });
    }
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(dns.resolveMx).not.toHaveBeenCalled();
    expect(dns.resolve4).not.toHaveBeenCalled();
  });

  it("does not update the ERP when /api/lead is sent again with its reference", async () => {
    const first = await (await post("lead", leadPost, lead(8))).json();
    expect(first.ref).toBeTruthy();
    const again = await post("lead", leadPost, { ...lead(8), ref: first.ref });
    expect(again.status).toBe(200);
    expect(await again.json()).toMatchObject({ ok: true, created: false }); // the update path, not a second create
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("writes nothing to the lead log, the Fallback tab or the KV counters, even when called directly", async () => {
    expect(await saveFallbackLead({ lead_name: "Test" } as Parameters<typeof saveFallbackLead>[0])).toBe(false);
    await recordAdsLead({ name: "PREVIEW-1" } as Parameters<typeof recordAdsLead>[0]);
    countGuard("fallback", "lead");
    countGuard("honeypot", "lead");
    await new Promise((r) => setTimeout(r, 0));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
