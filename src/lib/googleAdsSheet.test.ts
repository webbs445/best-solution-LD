import * as zlib from "node:zlib";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BridgeError, TABS, callBridge, type FetchLike } from "./googleAdsSheet";
import { rowsOf } from "./googleAdsReport";

// A mock bridge: these tests never call the real one (fetch to script.google.com throws in tests, see vitest.setup.mjs).
const URL_ = "https://bridge.test/exec";
const TOKEN = "secret-token-123";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const allTabs = (except: string[] = []) =>
  Object.fromEntries(TABS.filter((t) => !except.includes(t)).map((t) => [t, { headers: ["Date", "Campaign", "Cost (AED)"], rows: [["2026-11-17", "Search · Free Zone", 12.5]] }]));
const good = (except: string[] = []) => ({ ok: true, generatedAt: "2026-11-18 13:00", timeZone: "Asia/Dubai", tabs: allTabs(except), missing: except });

/** Calls the bridge with a fake fetch; also records what was sent. */
async function call(answer: FetchLike) {
  const sent: { url: string; init: RequestInit }[] = [];
  const fetchImpl: FetchLike = (url, init) => (sent.push({ url, init }), answer(url, init));
  try {
    return { result: await callBridge(URL_, TOKEN, fetchImpl), error: null, sent };
  } catch (e) {
    return { result: null, error: e as BridgeError, sent };
  }
}
const failed = (e: BridgeError | null) => e?.checks.find((c) => c.ok === false);

describe("callBridge with a mock bridge", () => {
  it("good response: one POST with the token and the tab list, following the redirect; tabs come back as rows", async () => {
    const { result, sent } = await call(async () => json(good()));
    expect(sent).toHaveLength(1);
    expect(sent[0].init).toMatchObject({ method: "POST", redirect: "follow", headers: { "Content-Type": "application/json" } });
    expect(JSON.parse(String(sent[0].init.body))).toEqual({ token: TOKEN, tabs: [...TABS] });
    expect(sent[0].init.signal).toBeInstanceOf(AbortSignal);
    const rows = rowsOf(result!.data.tabs.Perf_Campaigns_Daily);
    expect(rows[0]).toEqual({ Date: "2026-11-17", Campaign: "Search · Free Zone", "Cost (AED)": 12.5 });
    expect(result!.checks.map((c) => c.ok)).toEqual([true, true, true]);
    expect(result!.checks[2].detail).toBe(`${TABS.length} of ${TABS.length} received`);
  });

  it("never asks for the click ID tab and drops it if the bridge sends it anyway", async () => {
    const { result, sent } = await call(async () => json({ ...good(), tabs: { ...allTabs(), Perf_Clicks_Last7Days: { headers: ["GCLID"], rows: [["x"]] } } }));
    expect(JSON.parse(String(sent[0].init.body)).tabs).not.toContain("Perf_Clicks_Last7Days");
    expect(Object.keys(result!.data.tabs)).not.toContain("Perf_Clicks_Last7Days");
  });

  it("unauthorized: reachable, password refused, tabs not reached", async () => {
    const { error } = await call(async () => json({ ok: false, error: "unauthorized" }));
    expect(error).toBeInstanceOf(BridgeError);
    expect(error!.checks.map((c) => c.ok)).toEqual([true, false, null]);
    expect(failed(error)!.detail).toBe("No: unauthorized (the token doesn't match)");
  });

  it("timeout: not reachable, and says so", async () => {
    const { error } = await call(async () => {
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
    });
    expect(error!.checks.map((c) => c.ok)).toEqual([false, null, null]);
    expect(failed(error)!.detail).toBe("No answer within 30 s");
  });

  it("missing tab: still works, and lists what's missing", async () => {
    const { result } = await call(async () => json(good(["Setup_History", "Perf_Ads_Daily"])));
    expect(result!.data.tabs.Setup_History).toBeUndefined();
    expect(result!.checks[2]).toMatchObject({ ok: true, detail: `${TABS.length - 2} of ${TABS.length} received; missing: Perf_Ads_Daily, Setup_History` });
  });

  it("no tabs at all is a failure", async () => {
    const { error } = await call(async () => json({ ok: true, tabs: {}, missing: [...TABS] }));
    expect(error!.checks.map((c) => c.ok)).toEqual([true, true, false]);
  });

  it("HTML error page instead of JSON (HTTP 200): not reachable as a bridge", async () => {
    const { error } = await call(async () => new Response("<!DOCTYPE html><html><body>Script function not found: doPost</body></html>", { status: 200, headers: { "Content-Type": "text/html" } }));
    expect(error!.checks.map((c) => c.ok)).toEqual([false, null, null]);
    expect(failed(error)!.detail).toMatch(/^HTTP 200, but not JSON/);
  });

  it("HTTP error: the status, nothing else", async () => {
    const { error } = await call(async () => new Response("<html>Not Found</html>", { status: 404 }));
    expect(failed(error)!.detail).toBe("HTTP 404");
  });

  it("never puts the token in any check, even if the bridge echoes it", async () => {
    const { error } = await call(async () => json({ ok: false, error: `bad token ${TOKEN}` }));
    expect(JSON.stringify(error!.checks)).not.toContain(TOKEN);
    expect(error!.message).not.toContain(TOKEN);
  });
});

it("unit tests can't reach the real bridge", async () => {
  await expect(fetch("https://script.google.com/macros/s/x/exec")).rejects.toThrow("Blocked in tests: script.google.com");
  await expect(fetch("https://script.googleusercontent.com/macros/echo")).rejects.toThrow("Blocked in tests");
});

describe("Redis copy of the bridge read (fake store and bridge)", () => {
  // 2026-11-18 in Dubai (UTC+4): 06:15 Dubai = 02:15 UTC.
  const dubai = (hhmm: string, day = "2026-11-18") => Date.parse(`${day}T${hhmm}:00+04:00`);

  it("lastScheduledRun: the latest of 06:15, 13:15, 20:15 Dubai at or before now", async () => {
    const { lastScheduledRun } = await import("./googleAdsSheet");
    expect(lastScheduledRun(dubai("06:14"))).toBe(dubai("20:15", "2026-11-17"));
    expect(lastScheduledRun(dubai("06:15"))).toBe(dubai("06:15"));
    expect(lastScheduledRun(dubai("13:14"))).toBe(dubai("06:15"));
    expect(lastScheduledRun(dubai("19:00"))).toBe(dubai("13:15"));
    expect(lastScheduledRun(dubai("23:59"))).toBe(dubai("20:15"));
    expect(lastScheduledRun(dubai("00:30"))).toBe(dubai("20:15", "2026-11-17"));
  });

  it("the stored copy holds the tabs and the read time only, never click rows", async () => {
    const { packCopy, unpackCopy } = await import("./googleAdsSheet");
    const tabs = { Alerts: [["h"], ["r"]], Clicks_History: [["GCLID"], ["abc"]] } as never;
    const back = unpackCopy(packCopy({ tabs, fetchedAt: 5 }))!;
    expect(back).toEqual({ tabs: { Alerts: [["h"], ["r"]] }, clicks: null, fetchedAt: 5 });
  });

  /** A fresh module with a fake KV store and bridge; returns the counters and the read function. */
  async function setup(opts: { stored?: number; kvDown?: boolean } = {}) {
    vi.resetModules();
    vi.stubEnv("ADS_SHEET_BRIDGE_URL", URL_);
    vi.stubEnv("ADS_SHEET_BRIDGE_TOKEN", TOKEN);
    vi.stubEnv("KV_REST_API_URL", "https://kv.test");
    vi.stubEnv("KV_REST_API_TOKEN", "kv-token");
    const mod = await import("./googleAdsSheet");
    const store = new Map<string, string>();
    if (opts.stored != null) store.set(mod.cacheKey(), mod.packCopy({ tabs: { Alerts: [["Alert"], ["old"]] }, fetchedAt: opts.stored }));
    const n = { bridge: 0, sets: 0, setValues: [] as string[] };
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      if (url.startsWith("https://kv.test")) {
        if (opts.kvDown) return new Response("down", { status: 500 });
        const cmds = JSON.parse(String(init.body)) as string[][];
        return json(cmds.map(([cmd, key, value]) => (cmd === "GET" ? { result: store.get(key) ?? null } : (n.sets++, n.setValues.push(value), store.set(key, value), { result: "OK" }))));
      }
      n.bridge++;
      return json({ ...good(), tabs: { ...allTabs(), Clicks_History: { headers: ["GCLID", "Device"], rows: [["id-1", "Mobile"]] } } });
    });
    const tasks: (() => Promise<unknown>)[] = [];
    const read = (force = false) => mod.readGoogleAdsSheet(force, (t) => tasks.push(t), ["id-1"]);
    return { mod, n, tasks, read, store };
  }
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("fresh copy (read after the latest run): served from the store, no bridge call now; one background read for the click rows", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(dubai("10:00"));
    const { n, tasks, read } = await setup({ stored: dubai("06:20") });
    const r = await read();
    expect(r).toMatchObject({ kind: "ok", via: "redis", due: false });
    expect("data" in r && r.data.tabs.Alerts).toEqual([["Alert"], ["old"]]);
    expect(n.bridge).toBe(0);
    // No click rows on this instance yet: one background read, after which the copy is fresh and complete.
    expect(tasks).toHaveLength(1);
    await tasks[0]();
    const again = await read();
    expect("data" in again && again.data.clicks).toEqual([["GCLID", "Device"], ["id-1", "Mobile"]]);
    expect(tasks).toHaveLength(1);
  });

  it("due copy (read before the latest run + 15 min): served at once, refreshed in the background, stored without click rows", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(dubai("13:30"));
    const { n, tasks, read, mod } = await setup({ stored: dubai("06:20") });
    const r = await read();
    expect(r).toMatchObject({ kind: "ok", via: "redis", due: true });
    expect(n.bridge).toBe(0);
    await tasks[0]();
    expect(n.bridge).toBe(1);
    expect(n.sets).toBe(1);
    const stored = mod.unpackCopy(n.setValues[0])!;
    expect(stored.fetchedAt).toBe(dubai("13:30"));
    expect(Object.keys(stored.tabs)).toEqual([...TABS]);
    expect(zlib.gunzipSync(Buffer.from(n.setValues[0], "base64")).toString()).not.toMatch(/Clicks_History|Perf_Clicks|GCLID|id-1/);
  });

  it("missing copy: waits for the bridge and stores the read", async () => {
    const { n, tasks, read } = await setup();
    expect(await read()).toMatchObject({ kind: "ok", via: "bridge" });
    expect([n.bridge, n.sets, tasks.length]).toEqual([1, 1, 0]);
  });

  it("store down: falls back to the bridge as before, then to this instance's memory copy", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { n, read } = await setup({ kvDown: true });
    expect(await read()).toMatchObject({ kind: "ok", via: "bridge" });
    expect(await read()).toMatchObject({ kind: "ok", via: "memory" });
    expect(n.bridge).toBe(1);
    // Logged without the store's address or token.
    expect(err.mock.calls.flat().join(" ")).not.toMatch(/kv\.test|kv-token|secret-token/);
    err.mockRestore();
  });

  it("Refresh (force) reads the bridge even with a fresh copy, and replaces the stored one", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(dubai("10:00"));
    const { n, read } = await setup({ stored: dubai("06:20") });
    expect(await read(true)).toMatchObject({ kind: "ok", via: "bridge" });
    expect([n.bridge, n.sets]).toEqual([1, 1]);
  });
});