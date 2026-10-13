import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adsAuthFailure, adsSessionState, adsSignIn } from "./adsAuth";

const req = (headers: Record<string, string> = {}) => new Request("https://example.com/ads-report", { headers });
const basic = (u: string, p: string) => ({ authorization: `Basic ${Buffer.from(`${u}:${p}`).toString("base64")}` });

describe("ads dashboard sign-in", () => {
  beforeEach(() => {
    vi.stubEnv("ADS_EXPORT_USER", "ads");
    vi.stubEnv("ADS_EXPORT_PASSWORD", "s3cret");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("signs in with the right password only, and the cookie then opens the dashboard and the CSV", () => {
    expect(adsSignIn("ads", "wrong")).toBeNull();
    expect(adsSignIn("other", "s3cret")).toBeNull();
    const set = adsSignIn("ads", "s3cret")!;
    expect(set).toMatch(/HttpOnly; Secure; SameSite=Lax/);
    const cookie = set.split(";")[0];
    expect(adsSessionState(req({ cookie: `other=1; ${cookie}` }))).toBe("in");
    expect(adsAuthFailure(req({ cookie }))).toBeNull();
    expect(adsSessionState(req({ cookie: "bs_ads_session=abc123" }))).toBe("out");
  });

  it("keeps basic auth for Google and signs everyone out when the password changes", () => {
    expect(adsAuthFailure(req(basic("ads", "s3cret")))).toBeNull();
    expect(adsAuthFailure(req())?.status).toBe(401);
    const cookie = adsSignIn("ads", "s3cret")!.split(";")[0];
    vi.stubEnv("ADS_EXPORT_PASSWORD", "new-pass");
    expect(adsSessionState(req({ cookie }))).toBe("out");
  });

  it("is off without credentials", () => {
    vi.stubEnv("ADS_EXPORT_PASSWORD", "");
    expect(adsSessionState(req())).toBe("off");
    expect(adsAuthFailure(req())?.status).toBe(404);
  });
});
