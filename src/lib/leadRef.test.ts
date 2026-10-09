import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LEAD_REF_TTL_MS, phoneHash, signLeadRef, verifyLeadRef } from "./leadRef";

describe("signed lead reference", () => {
  beforeEach(() => vi.stubEnv("ERPNEXT_API_SECRET", "test-secret"));
  afterEach(() => vi.unstubAllEnvs());

  it("round-trips the lead and a hash of the number, never the number itself", () => {
    const ref = signLeadRef("BSL-1", "+971501234567")!;
    expect(ref).not.toContain("971501234567");
    expect(verifyLeadRef(ref)).toEqual({ lead: "BSL-1", phone: phoneHash("+971501234567") });
  });

  it("rejects an expired reference (2 hours)", () => {
    const now = Date.now();
    const ref = signLeadRef("BSL-1", "+971501234567", now)!;
    expect(verifyLeadRef(ref, now + LEAD_REF_TTL_MS - 1000)).not.toBeNull();
    expect(verifyLeadRef(ref, now + LEAD_REF_TTL_MS + 1000)).toBeNull();
  });

  it("rejects a tampered or foreign reference", () => {
    const ref = signLeadRef("BSL-1", "+971501234567")!;
    const [data, sig] = ref.split(".");
    const forged = Buffer.from(JSON.stringify({ l: "BSL-2", p: "x", e: Date.now() + 1e6 })).toString("base64url");
    expect(verifyLeadRef(`${forged}.${sig}`)).toBeNull();
    expect(verifyLeadRef(`${data}.AAAA`)).toBeNull();
    vi.stubEnv("ERPNEXT_API_SECRET", "other-secret");
    expect(verifyLeadRef(ref)).toBeNull();
  });
});
