import { describe, expect, it } from "vitest";
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
