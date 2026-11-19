// Local stand-ins for the Google Ads view's three sources, serving the fixture (fixtures/googleAdsFixture.mjs):
//   POST /bridge                 the Apps Script bridge (filters the click tabs to the click ids sent, like the real one)
//   GET  /api/resource/Lead      the ERP's lead list
//   POST /kv/pipeline            the ad landing counter (Upstash REST pipeline: HGETALL adl:<date>)
// Start the site against it (see README "Google Ads view") so no test ever reaches the real bridge, ERP or store.
// Logs request sizes and counts only: never a token or a click id.
import http from "node:http";
import { bridgeAnswer, erpLeads, kvDays } from "./fixtures/googleAdsFixture.mjs";

export const MOCK_PORT = 4799;
export const MOCK_TOKEN = "qa-bridge-token";
export const stats = { bridgeCalls: 0, bridgeBytes: 0, clickIdsSent: 0, erpCalls: 0, kvCalls: 0 };

const read = (req) => new Promise((ok) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => ok(b)); });
const json = (res, v) => { const s = JSON.stringify(v); res.writeHead(200, { "Content-Type": "application/json" }); res.end(s); return s.length; };

export function startMock(port = MOCK_PORT) {
  const kv = kvDays();
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://x");
    if (req.method === "POST" && url.pathname === "/bridge") {
      const body = JSON.parse((await read(req)) || "{}");
      if (body.token !== MOCK_TOKEN) return json(res, { ok: false, error: "unauthorized" });
      stats.bridgeCalls++;
      stats.clickIdsSent = Array.isArray(body.clickIds) ? body.clickIds.length : 0;
      stats.bridgeBytes = json(res, bridgeAnswer(body));
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/resource/Lead") {
      stats.erpCalls++;
      const since = (JSON.parse(url.searchParams.get("filters") || "[]").find((f) => f[0] === "creation") || [])[2] || "";
      return json(res, { data: erpLeads().filter((l) => l.creation >= since) });
    }
    if (req.method === "POST" && url.pathname === "/kv/pipeline") {
      stats.kvCalls++;
      const cmds = JSON.parse((await read(req)) || "[]");
      return json(res, cmds.map(([cmd, key]) => ({ result: cmd === "HGETALL" ? kv[String(key).replace(/^adl(-preview)?:/, "")] ?? [] : 1 })));
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
