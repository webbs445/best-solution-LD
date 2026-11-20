import { afterEach, describe, expect, it, vi } from "vitest";
import { countGuard, leadLogLine, leadResult } from "./leadLog";

const req = {
  lead_name: "Test",
  mobile_no: "+971500000000",
  email_id: "test@example.com",
  message: "Test",
  form_id: "LP Structuring Consultation",
  event_id: "e1",
  utm_source: "google",
  gclid: "abc",
};

describe("lead log", () => {
  it("names the outcome", () => {
    expect(leadResult(200, req, { ok: true, created: true })).toBe("created");
    expect(leadResult(200, req, { ok: true, created: false })).toBe("duplicate");
    expect(leadResult(200, { ...req, bs_hp: "x" }, { ok: true })).toBe("honeypot");
    // The old trap name no longer counts: a password manager filling a "website" field is a real visitor.
    expect(leadResult(200, { ...req, website: "x" }, { ok: true, created: true })).toBe("created");
    expect(leadResult(200, req, { ok: true, created: true, fallback: true })).toBe("fallback");
    expect(leadResult(422, req, null)).toBe("invalid");
    expect(leadResult(429, req, null)).toBe("rate_limited");
    expect(leadResult(502, req, null)).toBe("erp_failed");
    expect(leadResult(500, req, null)).toBe("error_500");
  });

  it("never carries a name, phone, email or message", () => {
    const line = JSON.stringify(leadLogLine("spv", 200, req, { ok: true }, { erp_id: "BSL-1" }, 12));
    expect(line).not.toMatch(/Test|500000000|example\.com/);
    expect(JSON.parse(line)).toMatchObject({ route: "spv", result: "created", erp_id: "BSL-1", form_id: req.form_id, gclid: true, ms: 12 });
  });
});

describe("honeypot and fallback counts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("adds one to today's count for the route in the KV store, with no form data", async () => {
    vi.stubEnv("KV_REST_API_URL", "https://kv.example");
    vi.stubEnv("KV_REST_API_TOKEN", "t");
    const fetchMock = vi.fn(async () => Response.json([{ result: 1 }, { result: 1 }]));
    vi.stubGlobal("fetch", fetchMock);
    countGuard("honeypot", "consult", Date.parse("2026-11-20T10:00:00Z"));
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://kv.example/pipeline");
    expect(JSON.parse(String(init.body))).toEqual([
      ["HINCRBY", "lead-guard:2026-11-20", "honeypot|consult", 1],
      ["EXPIRE", "lead-guard:2026-11-20", 400 * 86_400],
    ]);
  });

  it("counts nothing without the KV store or on a preview deployment", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    countGuard("fallback", "lead");
    vi.stubEnv("KV_REST_API_URL", "https://kv.example");
    vi.stubEnv("KV_REST_API_TOKEN", "t");
    vi.stubEnv("VERCEL_ENV", "preview");
    countGuard("fallback", "lead");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
