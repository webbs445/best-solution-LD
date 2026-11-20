// Local stand-ins for the Google Ads view's three sources, serving the fixture (fixtures/googleAdsFixture.mjs):
//   POST /bridge                 the Apps Script bridge (filters the click tabs to the click ids sent, like the real one)
//   GET  /api/resource/Lead      the ERP's lead list
//   POST /kv/pipeline            the KV store (Upstash REST pipeline): the ad landing counter (HGETALL adl:<date>) and
//                                the Sheet cache (GET / SET gads:sheet:v1), kept in memory for this run
// MOCK_BRIDGE_MS / MOCK_ERP_MS: answer that much later, like the real bridge and ERP (default 0).
// Start the site against it (see README "Google Ads view") so no test ever reaches the real bridge, ERP or store.
// Logs request sizes and counts only: never a token or a click id.
import http from "node:http";
import { gunzipSync } from "node:zlib";
import { bridgeAnswer, erpLeads, kvDays } from "./fixtures/googleAdsFixture.mjs";

export const MOCK_PORT = 4799;
export const MOCK_TOKEN = "qa-bridge-token";
export const stats = { bridgeCalls: 0, bridgeBytes: 0, clickIdsSent: 0, erpCalls: 0, kvCalls: 0, cacheSets: 0, cacheBytes: 0, cacheRawBytes: 0, clickTabsStored: 0 };
const wait = (name) => new Promise((ok) => setTimeout(ok, Number(process.env[name]) || 0));

const read = (req) => new Promise((ok) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => ok(b)); });
const json = (res, v) => { const s = JSON.stringify(v); res.writeHead(200, { "Content-Type": "application/json" }); res.end(s); return s.length; };

export function startMock(port = MOCK_PORT) {
  const kv = kvDays();
  const strings = new Map();
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://x");
    if (req.method === "POST" && url.pathname === "/bridge") {
      const body = JSON.parse((await read(req)) || "{}");
      if (body.token !== MOCK_TOKEN) return json(res, { ok: false, error: "unauthorized" });
      stats.bridgeCalls++;
      stats.clickIdsSent = Array.isArray(body.clickIds) ? body.clickIds.length : 0;
      await wait("MOCK_BRIDGE_MS");
      stats.bridgeBytes = json(res, bridgeAnswer(body));
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/resource/Lead") {
      stats.erpCalls++;
      await wait("MOCK_ERP_MS");
      const since = (JSON.parse(url.searchParams.get("filters") || "[]").find((f) => f[0] === "creation") || [])[2] || "";
      return json(res, { data: erpLeads().filter((l) => l.creation >= since) });
    }
    // The Google Ads lead log (Apps Script web app): every Google lead's tracking fields, no status.
    if (req.method === "GET" && url.pathname === "/leadlog") {
      return json(res, { ok: true, leads: erpLeads().filter((l) => l.custom_platform === "google").map((l) => Object.fromEntries(Object.entries(l).filter(([k]) => k !== "status"))) });
    }
    if (req.method === "POST" && url.pathname === "/kv/pipeline") {
      stats.kvCalls++;
      const cmds = JSON.parse((await read(req)) || "[]");
      return json(res, cmds.map(([cmd, key, value]) => {
        if (cmd === "HGETALL") return { result: kv[String(key).replace(/^adl(-preview)?:/, "")] ?? [] };
        if (cmd === "GET") return { result: strings.get(key) ?? null };
        if (cmd === "SET") {
          strings.set(key, value);
          const raw = gunzipSync(Buffer.from(value, "base64")).toString("utf8");
          stats.cacheSets++;
          stats.cacheBytes = value.length;
          stats.cacheRawBytes = raw.length;
          if (/Clicks_History|Perf_Clicks|GCLID/.test(raw)) stats.clickTabsStored++;
          return { result: "OK" };
        }
        return { result: 1 };
      }));
    }
    res.writeHead(404).end();
  });
  return new Promise((ok) => server.listen(port, "127.0.0.1", () => ok(server)));
}

// Run on its own: node scripts/qa/google-ads-mock.mjs
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}` || import.meta.url === `file://${process.argv[1]}`) {
  await startMock();
  console.log(`Google Ads mock on http://127.0.0.1:${MOCK_PORT} (bridge, ERP, counter)`);
}
