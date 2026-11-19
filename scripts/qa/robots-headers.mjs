// Search engine signals: every report route (dashboard views, sign-in and sign-out, redirects, the CSV, the API) sends
// X-Robots-Tag "noindex, nofollow, noarchive" and its HTML has the robots meta tag; every landing page sends plain
// "noindex" (header and meta), without nofollow or noarchive. robots.txt disallows nothing; /sitemap.xml is 404.
// Plain HTTP requests to the local build only; the build's own outside calls go to the mock (README "Google Ads view"),
// which this script starts, so nothing reaches the real ERP, Sheet bridge, Apps Script or tag hosts.
//   node scripts/qa/robots-headers.mjs [base URL]
import { BASE, ROUTES } from "./common.mjs";
import { startMock } from "./google-ads-mock.mjs";

const USER = process.env.ADS_EXPORT_USER, PASS = process.env.ADS_EXPORT_PASSWORD;
if (!USER || !PASS) throw new Error("Set ADS_EXPORT_USER and ADS_EXPORT_PASSWORD to the values the local server runs with.");
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) throw new Error("Local builds only.");

const REPORT = "noindex, nofollow, noarchive";
const META = /<meta name="robots" content="([^"]*)"/;
const server = await startMock();
const results = [];
const req = (path, init = {}) => fetch(`${BASE}${path}`, { redirect: "manual", ...init });
const formPost = (path, fields, cookie = "") =>
  req(path, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Referer: `${BASE}/ads-report?view=google-ads`, ...(cookie && { Cookie: cookie }) }, body: new URLSearchParams(fields) });

async function report(what, res, wantStatus) {
  const tag = res.headers.get("x-robots-tag");
  const html = (res.headers.get("content-type") ?? "").includes("text/html") ? await res.text() : null;
  const meta = html && META.exec(html)?.[1];
  const ok = tag === REPORT && res.status === wantStatus && (html == null || meta === "noindex, nofollow");
  results.push({ ok, line: `${what} → ${res.status}, header "${tag}"${html ? `, meta "${meta}"` : ""}` });
}

/* ----- Report routes ----- */
await report("GET /ads-report (signed out: sign-in page)", await req("/ads-report"), 401);
await report("POST /ads-report wrong password", await formPost("/ads-report", { user: USER, pass: "wrong" }), 401);
const signIn = await formPost("/ads-report", { user: USER, pass: PASS });
await report("POST /ads-report sign in", signIn, 303);
const cookie = (signIn.headers.get("set-cookie") ?? "").split(";")[0];
const auth = { headers: { Cookie: cookie } };
for (const q of ["", "?view=erp", "?view=landings", "?view=google-ads", "?view=google-ads&range=30d&details=campaigns"])
  await report(`GET /ads-report${q}`, await req(`/ads-report${q}`, auth), 200);
await report("GET /ads-report?view=google (old view, redirect)", await req("/ads-report?view=google", auth), 307);
await report("GET /api/ads-report (real path)", await req("/api/ads-report?view=google-ads", auth), 200);
await report("GET /internal/ad-landings (old link, redirect)", await req("/internal/ad-landings"), 308);
const basic = { headers: { Authorization: `Basic ${Buffer.from(`${USER}:${PASS}`).toString("base64")}` } };
await report("GET /ads-conversions.csv (no password)", await req("/ads-conversions.csv"), 401);
await report("GET /ads-conversions.csv", await req("/ads-conversions.csv", basic), 200);
await report("GET /api/ads-conversions (real path)", await req("/api/ads-conversions", basic), 200);
await report("POST /api/ad-landing (landing counter beacon)", await req("/api/ad-landing", { method: "POST", body: "{}" }), 204);
await report("GET /ads-report?signout", await req("/ads-report?signout", auth), 303);
await report("POST /ads-report sign out", await formPost("/ads-report", { action: "signout" }, cookie), 303);

/* ----- Landing pages: plain noindex, never nofollow or noarchive ----- */
for (const path of ROUTES) {
  const res = await req(path);
  const tag = res.headers.get("x-robots-tag");
  const meta = META.exec(await res.text())?.[1];
  const ok = res.status === 200 && tag === "noindex" && meta === "noindex";
  results.push({ ok, line: `GET ${path} (landing) → ${res.status}, header "${tag}", meta "${meta}"` });
}

/* ----- robots.txt and sitemap ----- */
const robots = await (await req("/robots.txt")).text();
results.push({ ok: /Allow: \//.test(robots) && !/Disallow:\s*\S/.test(robots), line: `robots.txt: ${robots.replace(/\s+/g, " ").trim()}` });
const sitemap = await req("/sitemap.xml");
results.push({ ok: sitemap.status === 404, line: `GET /sitemap.xml → ${sitemap.status}` });

server.close();
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.line}`);
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
