import { afterEach, describe, expect, it, vi } from "vitest";
import { allowedOrigin, countBeacon, DAILY_CAP, dubaiDate, parseBeacon } from "./adLandings";

describe("countBeacon daily cap", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  const run = async (seen: number) => {
    vi.stubEnv("KV_REST_API_URL", "https://kv.test");
    vi.stubEnv("KV_REST_API_TOKEN", "t");
    const calls: unknown[] = [];
    vi.stubGlobal("fetch", async (_u: string, init: { body: string }) => {
      calls.push(JSON.parse(init.body));
      return new Response(JSON.stringify([{ result: seen }, { result: 1 }]));
    });
    const counted = await countBeacon({ path: "/", param: "gclid", metrics: ["land", "shown"] });
    return { counted, calls };
  };
  it("counts up to the cap", async () => {
    const { counted, calls } = await run(DAILY_CAP);
    expect(counted).toBe(true);
    expect(calls[1]).toEqual([["HINCRBY", expect.any(String), "/|gclid|land", 1], ["HINCRBY", expect.any(String), "/|gclid|shown", 1]]);
  });
  it("ignores increments above the cap", async () => {
    const { counted, calls } = await run(DAILY_CAP + 1);
    expect(counted).toBe(false);
    expect(calls).toHaveLength(1);
  });
});

describe("allowedOrigin", () => {
  it("accepts only the site's own origin", () => {
    expect(allowedOrigin("https://business.best-solution.ae")).toBe(true);
    expect(allowedOrigin("https://evil.example")).toBe(false);
    expect(allowedOrigin(null)).toBe(false);
  });
  it("on a preview deployment, also accepts that deployment's own address, never another", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "best-solution-abc.vercel.app");
    expect(allowedOrigin("https://best-solution-abc.vercel.app")).toBe(true);
    expect(allowedOrigin("https://other-abc.vercel.app")).toBe(false);
    vi.stubEnv("VERCEL_ENV", "production");
    expect(allowedOrigin("https://best-solution-abc.vercel.app")).toBe(false);
    vi.unstubAllEnvs();
  });
});

describe("preview keys", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  it("writes preview counts to adl-preview: and live counts to adl:", async () => {
    vi.stubEnv("KV_REST_API_URL", "https://kv.test");
    vi.stubEnv("KV_REST_API_TOKEN", "t");
    const keys: string[] = [];
    vi.stubGlobal("fetch", async (_u: string, init: { body: string }) => {
      keys.push(...(JSON.parse(init.body) as string[][]).map((c) => c[1]));
      return new Response(JSON.stringify([{ result: 1 }, { result: 1 }]));
    });
    vi.stubEnv("VERCEL_ENV", "preview");
    await countBeacon({ path: "/", param: "gbraid", metrics: ["land"] });
    vi.stubEnv("VERCEL_ENV", "production");
    await countBeacon({ path: "/", param: "gbraid", metrics: ["land"] });
    expect(keys.every((k) => /^adl(-preview)?:\d{4}-\d{2}-\d{2}$/.test(k))).toBe(true);
    expect(keys.filter((k) => k.startsWith("adl-preview:"))).toHaveLength(3);
    expect(keys.filter((k) => k.startsWith("adl:"))).toHaveLength(3);
  });
});

describe("parseBeacon", () => {
  it("accepts a landing with the banner shown", () => {
    expect(parseBeacon('{"path":"/freezone/dmcc","param":"gclid","metrics":["land","shown"]}')).toEqual({
      path: "/freezone/dmcc",
      param: "gclid",
      metrics: ["land", "shown"],
    });
  });
  it("rejects anything outside the fixed vocabulary", () => {
    expect(parseBeacon('{"path":"/","param":"fbclid","metrics":["land"]}')).toBeNull();
    expect(parseBeacon('{"path":"/?gclid=abc","param":"gclid","metrics":["land"]}')).toBeNull();
    expect(parseBeacon('{"path":"/x@y.com","param":"gclid","metrics":["land"]}')).toBeNull();
    expect(parseBeacon('{"path":"/","param":"gclid","metrics":["land","email"]}')).toBeNull();
    expect(parseBeacon('{"path":"/","param":"gclid","metrics":[]}')).toBeNull();
    expect(parseBeacon("not json")).toBeNull();
  });
});

describe("dubaiDate", () => {
  it("rolls over at midnight Dubai time (20:00 UTC)", () => {
    expect(dubaiDate(Date.UTC(2026, 10, 16, 19, 59))).toBe("2026-11-16");
    expect(dubaiDate(Date.UTC(2026, 10, 16, 20, 0))).toBe("2026-11-17");
  });
});
