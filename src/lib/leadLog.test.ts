import { describe, expect, it } from "vitest";
import { leadLogLine, leadResult } from "./leadLog";

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
    expect(leadResult(200, { ...req, website: "x" }, { ok: true })).toBe("honeypot");
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
