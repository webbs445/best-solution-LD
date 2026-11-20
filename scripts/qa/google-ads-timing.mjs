// How long the Google Ads view takes: time to first byte, full page, and the Server-Timing header, per load.
// Against a local server only (README "Google Ads view"); no browser, so no tag or outside host is ever requested.
//   node scripts/qa/google-ads-timing.mjs [base URL] [loads, default 3]
// Uses ADS_EXPORT_USER / ADS_EXPORT_PASSWORD (the local server's values) to sign in. Prints timings only.
const BASE = process.argv[2] || "http://localhost:3010";
const LOADS = Number(process.argv[3]) || 3;
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) throw new Error("Local servers only.");
const { ADS_EXPORT_USER: user, ADS_EXPORT_PASSWORD: pass } = process.env;
if (!user || !pass) throw new Error("Set ADS_EXPORT_USER and ADS_EXPORT_PASSWORD to the values the local server runs with.");

const signIn = await fetch(`${BASE}/ads-report`, { method: "POST", body: new URLSearchParams({ user, pass }), redirect: "manual" });
const cookie = (signIn.headers.get("set-cookie") ?? "").split(";")[0];
if (!cookie) throw new Error(`Sign-in failed (HTTP ${signIn.status}).`);

for (let i = 1; i <= LOADS; i++) {
  const t0 = performance.now();
  const res = await fetch(`${BASE}/ads-report?view=google-ads`, { headers: { cookie } });
  const reader = res.body.getReader();
  let first = 0, text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    first ||= performance.now() - t0;
    text += Buffer.from(value).toString("utf8");
  }
  const total = performance.now() - t0;
  const ms = (v) => `${Math.round(v)} ms`.padStart(8);
  console.log(`load ${i}: HTTP ${res.status}  first byte ${ms(first)}  whole page ${ms(total)}  ${text.includes('id="gx-skel"') ? "streamed" : "whole"}  Server-Timing: ${res.headers.get("server-timing") ?? "none"}`);
}
