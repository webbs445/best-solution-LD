// Nothing sticks out of its card on the Google Ads view: at 375, 1024, 1280 and 1440 px wide, every visible element in
// the KPI cards, the header, the chart card and Needs attention must sit inside that card's box, and no KPI number is
// cut short. Same local setup as
// google-ads-view.mjs (README "Google Ads view"); starts the mock itself, blocks every outside host.
//   node scripts/qa/google-ads-boxes.mjs [base URL] [screenshot folder]
// Exit 1 when anything sticks out. Screenshots: kpis-<width>.png (the KPI row).
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { BASE, blockTags, launch } from "./common.mjs";
import { startMock } from "./google-ads-mock.mjs";

const OUT = process.argv[3] || "qa-out";
mkdirSync(OUT, { recursive: true });
const USER = process.env.ADS_EXPORT_USER, PASS = process.env.ADS_EXPORT_PASSWORD;
if (!USER || !PASS) throw new Error("Set ADS_EXPORT_USER and ADS_EXPORT_PASSWORD to the values the local server runs with.");

const WIDTHS = [375, 1024, 1280, 1440];
const PAGES = ["view=google-ads", "view=google-ads&range=30d", "view=google-ads&range=today"];
const CARDS = [".gx-kpi", ".gx-head", "#gx-chart", ".gx-attn"];

const server = await startMock();
const browser = await launch();
const outside = new Set();
const fails = [];
for (const w of WIDTHS) {
  const p = await browser.newPage();
  await p.setViewport({ width: w, height: 900, deviceScaleFactor: 1, isMobile: w < 768, hasTouch: w < 768 });
  await blockTags(p, (q) => {
    const u = new URL(q.url());
    if (u.origin === new URL(BASE).origin || /^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname) || ["data:", "blob:"].includes(u.protocol)) return false;
    outside.add(u.hostname);
    q.abort();
    return true;
  });
  await p.goto(`${BASE}/ads-report?view=google-ads`, { waitUntil: "networkidle0" });
  if (await p.$('input[name="user"]')) {
    await p.type('input[name="user"]', USER);
    await p.type('input[name="pass"]', PASS);
    await Promise.all([p.waitForNavigation({ waitUntil: "networkidle0" }), p.click('button[type="submit"]')]);
  }
  for (const qs of PAGES) {
    await p.goto(`${BASE}/ads-report?${qs}`, { waitUntil: "networkidle0" });
    await p.evaluate(() => document.fonts.ready);
    const out = await p.evaluate((sels) => {
      const bad = [];
      for (const sel of sels)
        document.querySelectorAll(sel).forEach((card, ci) => {
          const c = card.getBoundingClientRect();
          for (const e of card.querySelectorAll("*")) {
            const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
            if (!r.width || !r.height || cs.visibility === "hidden" || e.closest(".sr, [hidden]")) continue;
            // Inside a box that clips or scrolls (a table, an ellipsis), that box is what's checked.
            let clipped = false;
            for (let a = e.parentElement; a && a !== card; a = a.parentElement) if (getComputedStyle(a).overflow !== "visible") clipped = true;
            if (clipped) continue;
            const over = Math.max(c.left - r.left, r.right - c.right, c.top - r.top, r.bottom - c.bottom);
            if (over > 1) bad.push(`${sel}#${ci} ${e.tagName.toLowerCase()}.${String(e.className?.baseVal ?? e.className).split(" ")[0]} "${(e.innerText || "").trim().slice(0, 30)}" by ${Math.round(over)}px`);
          }
        });
      // The KPI numbers are never cut short ("AED 2…") to make room.
      document.querySelectorAll(".gx-kpi__v").forEach((v) => {
        if (v.scrollWidth > v.clientWidth + 1) bad.push(`KPI number cut: "${v.innerText.trim()}" (${v.scrollWidth} > ${v.clientWidth}px)`);
      });
      return bad;
    }, CARDS);
    console.log(`${out.length ? "FAIL" : "PASS"}  ${w}px · ${qs}${out.length ? `\n      ${out.slice(0, 10).join("\n      ")}` : ""}`);
    fails.push(...out);
    if (qs === PAGES[0]) await (await p.$(".gx-kpis")).screenshot({ path: join(OUT, `kpis-${w}.png`) });
  }
  await p.close();
}
console.log(`Requests outside the site and Google Fonts (all aborted): ${[...outside].join(", ") || "none"}`);
await browser.close();
server.close();
process.exit(fails.length ? 1 : 0);
