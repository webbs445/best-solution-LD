// The Google Ads view's loading shell, in a real browser: with a slow bridge (3 s, the mock) and no stored copy, the
// header, view switch, period links and card placeholders show at once, then the view replaces them: placeholders
// gone, the header badge updated, no script errors. Same local setup as google-ads-view.mjs (README "Google Ads
// view"), on a server started after the mock's store is empty (a new run); blocks every outside host.
//   node scripts/qa/google-ads-stream.mjs [base URL] [screenshot folder]
// Exit 1 when any check fails. Screenshots: stream-shell.png, stream-done.png.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { BASE, blockTags, launch } from "./common.mjs";
import { startMock } from "./google-ads-mock.mjs";

const OUT = process.argv[3] || "qa-out";
mkdirSync(OUT, { recursive: true });
const USER = process.env.ADS_EXPORT_USER, PASS = process.env.ADS_EXPORT_PASSWORD;
if (!USER || !PASS) throw new Error("Set ADS_EXPORT_USER and ADS_EXPORT_PASSWORD to the values the local server runs with.");
process.env.MOCK_BRIDGE_MS ||= "3000";

const server = await startMock();
const browser = await launch();
const outside = new Set();
const errors = [];
const results = [];
const check = (name, ok, detail) => results.push({ name, ok, detail });
try {
  const p = await browser.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  p.on("pageerror", (e) => errors.push(e.message.slice(0, 120)));
  await blockTags(p, (q) => {
    const u = new URL(q.url());
    if (u.origin === new URL(BASE).origin || /^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname) || u.protocol === "data:") return false;
    outside.add(u.hostname);
    q.abort();
    return true;
  });
  await p.goto(`${BASE}/ads-report?view=erp`, { waitUntil: "networkidle0" });
  if (await p.$('input[name="user"]')) {
    await p.type('input[name="user"]', USER);
    await p.type('input[name="pass"]', PASS);
    await Promise.all([p.waitForNavigation({ waitUntil: "networkidle0" }), p.click('button[type="submit"]')]);
  }
  const t0 = Date.now();
  const nav = p.goto(`${BASE}/ads-report?view=google-ads&range=30d`, { waitUntil: "load", timeout: 30000 });
  const shown = await p.waitForSelector("#gx-skel", { visible: true, timeout: 2500 }).then(() => Date.now() - t0, () => null);
  check("Shell shows before the data", shown != null, shown != null ? `${shown} ms` : "not shown");
  if (shown != null) {
    const s = await p.evaluate(() => ({ badge: document.querySelector(".lr-fresh__tone")?.textContent, period: document.querySelector('#gx-skel [aria-current="page"]')?.textContent, view: !!document.querySelector("main.gx > .gx-kpis") }));
    check("Shell: loading badge, period links, no view yet", s.badge === "Loading Google Ads data" && s.period === "30D" && !s.view, JSON.stringify(s));
    await p.screenshot({ path: join(OUT, "stream-shell.png") });
  }
  await p.waitForSelector("main.gx > .gx-kpis", { visible: true, timeout: 20000 });
  check("View arrives after the bridge", true, `${Date.now() - t0} ms`);
  await nav;
  const d = await p.evaluate(() => ({ skeleton: !!document.getElementById("gx-skel"), headers: document.querySelectorAll("header.lr-topbar").length, badge: document.querySelector(".lr-fresh__tone")?.textContent ?? "", custom: !!document.querySelector(".gx-custom-btn") }));
  check("Then: placeholders gone, one header with the data's badge, Custom period button", !d.skeleton && d.headers === 1 && /^Updated|late|not updating/.test(d.badge) && d.custom, JSON.stringify(d));
  await p.screenshot({ path: join(OUT, "stream-done.png") });
  check("No script errors", !errors.length, errors.join(" | ") || "none");
  check("Requests outside the site and Google Fonts (all aborted)", !outside.size, [...outside].join(", ") || "none");
} finally {
  await browser.close();
  server.close();
}
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}: ${r.detail}`);
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
