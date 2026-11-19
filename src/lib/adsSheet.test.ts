import { afterEach, describe, expect, it, vi } from "vitest";

// Outside Next, the 5-minute cache is a plain call.
vi.mock("next/cache", () => ({ unstable_cache: (fn: () => unknown) => fn }));
import { readAdsSheet, recordAdsLead } from "@/lib/adsSheet";

const URL_ = "https://script.example.com/exec";
const lead = { name: "BSL-1", creation: "2026-11-19 10:00:00", custom_campaign: "fz_search", custom_ad_set_name: "", custom_ad_name: "", custom_form_name: "", custom_platform: "google", source: "", custom_clid: "Cj0KCQtest" };
const ok = () => vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(() => Promise.resolve(Response.json({ ok: true, leads: [] })));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Lead log: read with the read-only secret, write only with the write secret", () => {
  it("reads with ADS_SHEET_READ_SECRET when it is set", async () => {
    vi.stubEnv("ADS_SHEET_URL", URL_);
    vi.stubEnv("ADS_SHEET_SECRET", "write-secret");
    vi.stubEnv("ADS_SHEET_READ_SECRET", "read-secret");
    const f = ok();
    vi.stubGlobal("fetch", f);
    expect(await readAdsSheet()).toEqual([]);
    expect(f.mock.calls[0][0]).toBe(`${URL_}?secret=read-secret`);
  });

  it("reads with ADS_SHEET_SECRET when there is no read secret (production as today)", async () => {
    vi.stubEnv("ADS_SHEET_URL", URL_);
    vi.stubEnv("ADS_SHEET_SECRET", "write-secret");
    vi.stubEnv("ADS_SHEET_READ_SECRET", "");
    const f = ok();
    vi.stubGlobal("fetch", f);
    await readAdsSheet();
    expect(f.mock.calls[0][0]).toBe(`${URL_}?secret=write-secret`);
  });

  it("Preview's setup (URL + read secret only) reads, and has no way to write: no request at all", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("ADS_SHEET_URL", URL_);
    vi.stubEnv("ADS_SHEET_SECRET", "");
    vi.stubEnv("ADS_SHEET_READ_SECRET", "read-secret");
    const f = ok();
    vi.stubGlobal("fetch", f);
    await recordAdsLead(lead);
    expect(f).not.toHaveBeenCalled();
    await readAdsSheet();
    expect(f).toHaveBeenCalledTimes(1);
    expect(f.mock.calls[0][1]?.method ?? "GET").toBe("GET");
  });

  it("the read secret alone never writes, even outside a preview", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("ADS_SHEET_URL", URL_);
    vi.stubEnv("ADS_SHEET_SECRET", "");
    vi.stubEnv("ADS_SHEET_READ_SECRET", "read-secret");
    const f = ok();
    vi.stubGlobal("fetch", f);
    await recordAdsLead(lead);
    expect(f).not.toHaveBeenCalled();
  });

  it("a preview never writes, even if it had the write secret", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("ADS_SHEET_URL", URL_);
    vi.stubEnv("ADS_SHEET_SECRET", "write-secret");
    const f = ok();
    vi.stubGlobal("fetch", f);
    await recordAdsLead(lead);
    expect(f).not.toHaveBeenCalled();
  });

  it("production with the write secret still writes (POST, write secret in the body)", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("ADS_SHEET_URL", URL_);
    vi.stubEnv("ADS_SHEET_SECRET", "write-secret");
    vi.stubEnv("ADS_SHEET_READ_SECRET", "read-secret");
    const f = ok();
    vi.stubGlobal("fetch", f);
    await recordAdsLead(lead);
    expect(f).toHaveBeenCalledTimes(1);
    expect(f.mock.calls[0][1]?.method).toBe("POST");
    expect(JSON.parse(String(f.mock.calls[0][1]?.body)).secret).toBe("write-secret");
  });
});
