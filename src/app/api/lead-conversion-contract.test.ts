import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const erp = vi.hoisted(() => ({
  createErpLead: vi.fn(),
  updateErpLead: vi.fn(),
  leadEstimateFields: vi.fn(() => ({})),
}));

vi.mock("@/lib/erp", () => erp);
vi.mock("@/lib/emailCheck", () => ({
  emailDomainAcceptsMail: async () => true,
  emailIsReal: async () => true,
}));
vi.mock("@/lib/rateLimit", () => ({
  clientIp: () => "203.0.113.10",
  rateLimit: () => true,
}));

import { POST as leadPost } from "./lead/route";
import { POST as costCalculatorPost } from "./cost-calculator/route";
import { POST as callbackPost } from "./callback/route";
import { POST as accountingPost } from "./accounting/route";
import { POST as corporateTaxPost } from "./corporate-tax/route";
import { POST as spvPost } from "./spv/route";

const routes = [
  ["lead", leadPost],
  ["cost-calculator", costCalculatorPost],
  ["callback", callbackPost],
  ["accounting", accountingPost],
  ["corporate-tax", corporateTaxPost],
  ["spv", spvPost],
] as const;

let serial = 0;
function validLead() {
  serial += 1;
  return {
    lead_name: "Test Lead",
    email_id: "qa.person@example.org",
    mobile_no: `+971501234${String(serial).padStart(3, "0")}`,
    country: "AE",
  };
}

function request(path: string, body: Record<string, unknown>) {
  return new Request(`http://localhost/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("ERPNEXT_API_SECRET", "test-secret");
  erp.createErpLead.mockResolvedValue({ ok: true, name: "ERP-LEAD-1" });
  erp.updateErpLead.mockResolvedValue({ ok: true, name: "ERP-LEAD-1" });
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("lead API conversion response contract", () => {
  it("returns generic honeypot success without creating or confirming a lead on every route", async () => {
    for (const [path, post] of routes) {
      const response = await post(request(path, { ...validLead(), website: "filled-trap" }));
      expect(response.status, path).toBe(200);
      expect(await response.json(), path).toEqual({ ok: true, created: false });
    }
    expect(erp.createErpLead).not.toHaveBeenCalled();
  });

  it("confirms a new ERP lead only when the helper supplies a record name", async () => {
    for (const [path, post] of routes) {
      erp.createErpLead.mockResolvedValueOnce({ ok: true, name: "ERP-LEAD-1" });
      const response = await post(request(path, validLead()));
      expect(response.status, path).toBe(200);
      const body = await response.json();
      expect(body.created, path).toBe(true);
      expect(body.ok, path).toBe(true);
    }
  });

  it("does not confirm a 2xx ERP result with a missing or blank record name", async () => {
    for (const name of [undefined, "", "   "]) {
      for (const [path, post] of routes) {
        erp.createErpLead.mockResolvedValueOnce({ ok: true, name });
        const response = await post(request(path, validLead()));
        expect(response.status, `${path}: ${String(name)}`).toBe(200);
        expect(await response.json(), `${path}: ${String(name)}`).toMatchObject({ ok: true, created: false });
      }
    }
  });

  it("rejects invalid input without creating or confirming a lead on every route", async () => {
    for (const [path, post] of routes) {
      const response = await post(request(path, { ...validLead(), lead_name: "T" }));
      expect(response.status, path).toBe(422);
      expect(await response.json(), path).toMatchObject({ error: "invalid_fields" });
    }
    expect(erp.createErpLead).not.toHaveBeenCalled();
  });

  it("does not confirm ERP failures on any route", async () => {
    for (const [path, post] of routes) {
      erp.createErpLead.mockResolvedValueOnce({ ok: false, reason: "upstream_failed" });
      const response = await post(request(path, validLead()));
      expect(response.status, path).toBe(502);
      expect(await response.json(), path).toMatchObject({ error: "upstream_failed" });
    }
  });

  it("keeps /api/lead update-only submissions uncounted", async () => {
    const body = validLead();
    const first = await leadPost(request("lead", body));
    expect(await first.json()).toMatchObject({ ok: true, created: true });

    const second = await leadPost(request("lead", body));
    expect(second.status).toBe(200);
    expect(await second.json()).toMatchObject({ ok: true, created: false });
    expect(erp.createErpLead).toHaveBeenCalledTimes(1);
    expect(erp.updateErpLead).toHaveBeenCalledTimes(1);
  });

  it("does not save a reference or recent entry when a new ERP record name is missing", async () => {
    const body = validLead();
    erp.createErpLead.mockResolvedValueOnce({ ok: true });
    const unconfirmed = await leadPost(request("lead", body));
    expect(await unconfirmed.json()).toEqual({ ok: true, created: false, ref: null });

    erp.createErpLead.mockResolvedValueOnce({ ok: true, name: "ERP-LEAD-2" });
    const retry = await leadPost(request("lead", body));
    expect(await retry.json()).toMatchObject({ ok: true, created: true });
    expect(erp.createErpLead).toHaveBeenCalledTimes(2);
    expect(erp.updateErpLead).not.toHaveBeenCalled();
  });
});
