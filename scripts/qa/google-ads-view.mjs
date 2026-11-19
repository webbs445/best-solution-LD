// The Google Ads view as real users would use it, on the fixture (scripts/qa/fixtures/googleAdsFixture.mjs), against a
// local build started with the mock sources (scripts/qa/google-ads-mock.mjs; README "Google Ads view"):
//   node scripts/qa/google-ads-view.mjs [base URL] [screenshot folder]
// Every request leaves only for the site itself and Google Fonts; tag hosts, Google APIs and the Apps Script bridge are
// blocked by name, anything else is aborted and reported. Tasks: pass/fail, clicks, screenshot. Number checks: every
// KPI, donut share, funnel step and cost per lead recomputed from the raw fixture rows and compared with the page.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BASE, blockTags, launch, wait } from "./common.mjs";
import { TODAY, bridgeResponse, erpLeads } from "./fixtures/googleAdsFixture.mjs";
import { startMock, stats } from "./google-ads-mock.mjs";

const OUT = process.argv[3] || "qa-out";
mkdirSync(OUT, { recursive: true });
const USER = process.env.ADS_EXPORT_USER, PASS = process.env.ADS_EXPORT_PASSWORD;
if (!USER || !PASS) throw new Error("Set ADS_EXPORT_USER and ADS_EXPORT_PASSWORD to the values the local server runs with.");

/* ---------- Expected numbers, straight from the fixture rows ---------- */
const T = bridgeResponse().tabs;
const perf = T.Perf_Campaigns_Daily.rows; // [Date, ID, Campaign, Type, Status, Impr, Clicks, Cost, Conv, AllConv, IS, LostIS]
const isS = (r) => r[3] === "SEARCH", isD = (r) => r[3] === "DEMAND_GEN";
const rows = (from, to, f = () => true) => perf.filter((r) => r[0] >= from && r[0] <= to && f(r));
const sum = (rs, i) => rs.reduce((s, r) => s + Number(r[i]), 0);
const aed0 = (v) => `AED ${Math.round(v).toLocaleString("en-US")}`;
const google = erpLeads().filter((l) => l.custom_platform === "google");
const W = ["2026-11-12", "2026-11-18"];
const searchW = rows(...W, isS), dgW = rows(...W, isD), allW = rows(...W);
const landSearch = 3 * (8 + 2 + 2 + 1 + 1); // /freezone* landings 16–18 Nov
const since = (name) => sum(rows("2026-10-12", TODAY, (r) => r[2] === name), 7);
const qualified = (name) => google.filter((l) => l.custom_campaign === name && !/junk|duplicate|lost|unqualified|do not contact/i.test(l.status)).length;
const d30 = new Date(Date.parse(`${TODAY}T00:00:00Z`) - 29 * 86_400_000).toISOString().slice(0, 10);
const expected = {
  spend: aed0(sum(allW, 7)),
  clicks: sum(allW, 6).toLocaleString("en-US"),
  cpc: `AED ${(sum(searchW, 7) / sum(searchW, 6)).toFixed(2)}`,
  leads: "0",
  cpl: "No leads",
  cplSub: "no qualified lead in 12–18 Nov",
  cplGauge: `AED ${Math.round(sum(rows("2026-10-12", "2026-11-18"), 7) / 18).toLocaleString("en-US")}`,
  spendTotal: aed0(sum(allW, 7)),
  shareSearch: `${((sum(searchW, 7) / sum(allW, 7)) * 100).toFixed(0)}%`,
  shareDg: `${((sum(dgW, 7) / sum(allW, 7)) * 100).toFixed(0)}%`,
  quality: `${((18 / 19) * 100).toFixed(0)}%`,
  qualityRows: ["18", "1", "0"],
  seen: sum(searchW, 5).toLocaleString("en-US"),
  clicked: sum(searchW, 6).toLocaleString("en-US"),
  landed: String(landSearch),
  fLeads: "0",
  ctr: `CTR ${((sum(searchW, 6) / sum(searchW, 5)) * 100).toFixed(1)}%`,
  landedRate: `Landed ${((landSearch / sum(rows("2026-11-16", "2026-11-18", isS), 6)) * 100).toFixed(0)}%`,
  formRate: "Form 0.0%",
  cplRows: {
    fz_search_061026: `${aed0(since("fz_search_061026") / qualified("fz_search_061026"))} · ${since("fz_search_061026") / qualified("fz_search_061026") > 80 ? "over" : "under"} target`,
    bs_accounting_081026: `${aed0(since("bs_accounting_081026") / qualified("bs_accounting_081026"))} · ${since("bs_accounting_081026") / qualified("bs_accounting_081026") > 80 ? "over" : "under"} target`,
    bs_mainland_search_101026: `${aed0(since("bs_mainland_search_101026") / qualified("bs_mainland_search_101026"))} · ${since("bs_mainland_search_101026") > 80 ? "over" : "under"} target`,
    BS_DemandGen_Competitor_061126: "No qualified lead",
  },
  spend30: aed0(sum(rows(d30, TODAY), 7)),
  leads30: String(google.filter((l) => l.creation.slice(0, 10) >= d30).length),
  lastLead: "14 days ago",
  searchSpend: aed0(sum(searchW, 7)),
  negatives: '"free zone jobs dubai"\n"freezone visa price list"\n"meydan racecourse"',
};

/* ---------- Browser ---------- */
const server = await startMock();
const browser = await launch();
const ctx = browser.defaultBrowserContext();
await ctx.overridePermissions(BASE, ["clipboard-read", "clipboard-write", "clipboard-sanitized-write"]);
const outside = new Set();
async function newPage(width, height, mobile = false) {
  const p = await browser.newPage();
  await p.setViewport({ width, height, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  await blockTags(p, (q) => {
    const u = new URL(q.url());
    if (u.origin === new URL(BASE).origin || /^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname) || ["data:", "blob:", "file:"].includes(u.protocol)) return false;
    outside.add(u.hostname);
    q.abort();
    return true;
  });
  return p;
}
const signIn = async (p) => {
  await p.goto(`${BASE}/ads-report?view=google-ads`, { waitUntil: "networkidle0" });
  if (await p.$('input[name="user"]')) {
    await p.type('input[name="user"]', USER);
    await p.type('input[name="pass"]', PASS);
    await Promise.all([p.waitForNavigation({ waitUntil: "networkidle0" }), p.click('button[type="submit"]')]);
  }
};
const text = (p, sel) => p.$eval(sel, (e) => e.innerText.replace(/\s+/g, " ").trim()).catch(() => null);
const kpi = (p, label) => text(p, `.gx-kpi[aria-label="${label}"] .gx-kpi__v`);
const results = [], checks = [];
const task = (n, who, what, pass, clicks, shot, note = "") => results.push({ n, who, what, pass, clicks, shot, note });
const check = (what, got, want) => checks.push({ what, got, want, pass: got === want });
const bad = async (p, where) => {
  const t = await p.evaluate(() => document.body.innerText);
  const m = t.match(/NaN|undefined|Infinity|\[object /g);
  checks.push({ what: `No NaN / undefined / Infinity (${where})`, got: m ? m.join(",") : "none", want: "none", pass: !m });
};

/* ----- Manager on a phone ----- */
const phone = await newPage(375, 812, true);
await signIn(phone);
const t0 = Date.now();
await phone.goto(`${BASE}/ads-report?view=google-ads`, { waitUntil: "domcontentloaded" });
const visibleAt = Date.now() - t0;
await phone.screenshot({ path: join(OUT, "phone-first-screen.png") });
const bannerText = await text(phone, ".gx-banner p");
const firstAttn = await phone.$$eval(".gx-attn__i:not([hidden])", (li) => li.map((x) => x.innerText.replace(/\s+/g, " ").trim()));
task(1, "Manager · phone", "In 10 s: is something wrong, and what does it cost?", !!bannerText && firstAttn.length === 3 && firstAttn.every((a) => /AED|%/.test(a)), 0, "phone-first-screen.png", `Page shown in ${visibleAt} ms. Banner: "${bannerText}". Top items: ${firstAttn.map((a) => a.split(" See")[0].slice(0, 70)).join(" | ")}`);
await bad(phone, "phone, 7D All");
const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
checks.push({ what: "Phone: no sideways page scroll (scrollWidth − 375)", got: String(overflow), want: "0", pass: overflow <= 0 });
const small = await phone.evaluate(() =>
  [...document.querySelectorAll("main a, main button, main summary, main input, main select, header a, header button")]
    .filter((e) => e.offsetParent && !e.closest("details:not([open])") && !e.closest("table") && !e.closest("p, li .cap"))
    .map((e) => ({ t: (e.innerText || e.getAttribute("aria-label") || e.tagName).trim().slice(0, 40), h: Math.round(e.getBoundingClientRect().height), w: Math.round(e.getBoundingClientRect().width) }))
    .filter((r) => r.h < 44 || r.w < 44),
);
checks.push({ what: "Phone: tap targets ≥ 44 px (outside running text and tables)", got: small.length ? small.map((s) => `${s.t} ${s.w}×${s.h}`).join("; ") : "all ≥ 44", want: "all ≥ 44", pass: !small.length });
await phone.screenshot({ path: join(OUT, "phone-full.png"), fullPage: true });

// (2) Search spend this week and real leads: one tap on Channel › Search.
await Promise.all([phone.waitForNavigation({ waitUntil: "networkidle0" }), phone.click('nav[aria-label="Channel"] a[href*="channel=search"]')]);
const s2 = { spend: await kpi(phone, "Spend"), leads: await kpi(phone, "Tracked leads") };
await phone.screenshot({ path: join(OUT, "task2-phone-search.png") });
task(2, "Manager · phone", "Search spend this week and real leads", s2.spend === expected.searchSpend && s2.leads === "0", 1, "task2-phone-search.png", `Spend ${s2.spend} (expected ${expected.searchSpend}), tracked leads ${s2.leads}`);
await bad(phone, "phone, Search");

// (3) Is Demand Gen worth it? One tap on Demand Gen.
await Promise.all([phone.waitForNavigation({ waitUntil: "networkidle0" }), phone.click('nav[aria-label="Channel"] a[href*="channel=demand_gen"]')]);
const s3 = { spend: await kpi(phone, "Spend"), leads: await kpi(phone, "Tracked leads"), cpl: await kpi(phone, "Cost / qualified"), attn: await text(phone, ".gx-attn__i"), cplRow: await text(phone, "#gx-cpl .gx-cpl li") };
await phone.screenshot({ path: join(OUT, "task3-phone-demandgen.png"), fullPage: false });
task(3, "Manager · phone", "Is Demand Gen worth it?", s3.leads === "0" && /No qualified lead/.test(s3.cplRow ?? "") && /accidental/.test(s3.attn ?? ""), 1, "task3-phone-demandgen.png", `Spend ${s3.spend}, 0 leads, cost per qualified lead "${s3.cpl}"; ${(s3.attn ?? "").slice(0, 110)}; ${s3.cplRow}`);
await bad(phone, "phone, Demand Gen");

// Performance: a phone on a fast 4G link with a 4× slower CPU, warm server copy.
await phone.emulateCPUThrottling(4);
const cdp = await phone.createCDPSession();
await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (1.5 * 1024 * 1024) / 8 });
await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
await phone.goto(`${BASE}/ads-report?view=google-ads`, { waitUntil: "load" });
const perfT = await phone.evaluate(() => { const n = performance.getEntriesByType("navigation")[0]; return { ttfb: Math.round(n.responseStart), dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), bytes: n.transferSize }; });
checks.push({ what: "Phone, fast 4G + 4× CPU: page interactive (DOMContentLoaded) < 2000 ms", got: `${perfT.dcl} ms (first byte ${perfT.ttfb} ms, load ${perfT.load} ms, HTML ${Math.round(perfT.bytes / 1024)} KB)`, want: "< 2000 ms", pass: perfT.dcl < 2000 });
await phone.emulateCPUThrottling(1);
await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });

/* ----- Bibin on a desktop ----- */
const desk = await newPage(1440, 900);
await signIn(desk);
await desk.goto(`${BASE}/ads-report?view=google-ads`, { waitUntil: "networkidle0" });
await desk.screenshot({ path: join(OUT, "desktop-full.png"), fullPage: true });
await bad(desk, "desktop, 7D All");

// Number checks on the default view (7 days to yesterday, All).
check("KPI Spend", await kpi(desk, "Spend"), expected.spend);
check("KPI Clicks", await kpi(desk, "Clicks"), expected.clicks);
check("KPI Avg CPC · Search", await kpi(desk, "Avg CPC · Search"), expected.cpc);
check("KPI Tracked leads", await kpi(desk, "Tracked leads"), expected.leads);
check("KPI Cost / qualified", await kpi(desk, "Cost / qualified"), expected.cpl);
check("KPI Cost / qualified, sub line", (await desk.$$eval('.gx-kpi[aria-label="Cost / qualified"] .cap', (c) => c.at(-1).innerText.trim())), expected.cplSub);
check("KPI Cost / qualified, since-start gauge", await text(desk, '.gx-kpi[aria-label="Cost / qualified"] .gx-gauge__top b'), expected.cplGauge);
check("Spend donut centre", await text(desk, "#gx-spend .gx-dn__v"), expected.spendTotal);
// Legend rows are ordered by spend: read each share by its label.
const shares = Object.fromEntries(await desk.$$eval("#gx-spend .gx-dn__l li", (li) => li.map((x) => [x.querySelector(".leg").innerText.trim(), x.querySelector(".gx-dn__n .cap").innerText.trim()])));
check("Spend donut Search %", shares.Search, expected.shareSearch);
check("Spend donut Demand Gen %", shares["Demand Gen"], expected.shareDg);
check("Lead quality centre", await text(desk, "#gx-quality .gx-dn__v"), expected.quality);
check("Lead quality rows (qualified, not, won)", (await desk.$$eval("#gx-quality li b", (b) => b.map((x) => x.innerText))).join(","), expected.qualityRows.join(","));
const fn = await desk.$$eval("#gx-funnel .gx-fn b", (b) => b.map((x) => x.innerText));
check("Funnel Seen", fn[0], expected.seen);
check("Funnel Clicked", fn[1], expected.clicked);
check("Funnel Landed", fn[2], expected.landed);
check("Funnel Leads", fn[3], expected.fLeads);
const fchips = await desk.$$eval("#gx-funnel .gx-chips .chip", (c) => c.map((x) => x.innerText.trim()));
check("Funnel CTR", fchips[0], expected.ctr);
check("Funnel Landed %", fchips[1], expected.landedRate);
check("Funnel Form %", fchips[2], expected.formRate);
check("Chart: 30-day spend", (await desk.$$eval(".gx-foot4 .num", (n) => n.map((x) => x.innerText)))[0], expected.spend30);
check("Chart: leads (ERP), 30 days", (await desk.$$eval(".gx-foot4 .num", (n) => n.map((x) => x.innerText)))[1], expected.leads30);
check("Chart: last lead", (await desk.$$eval(".gx-foot4 .num", (n) => n.map((x) => x.innerText)))[3], expected.lastLead);

// (4) Which terms wasted money → copy negatives.
await desk.$eval("#gx-terms", (e) => e.scrollIntoView({ block: "center" }));
await desk.click('#gx-terms [data-copy]');
await wait(300);
// Windows' clipboard stores line breaks as CRLF.
const clip = (await desk.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n");
const copied = await text(desk, "#gx-terms .gx-copied");
await desk.screenshot({ path: join(OUT, "task4-terms.png"), clip: await desk.$eval("#gx-terms", (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height }; }) });
task(4, "Bibin · desktop", "Which terms wasted money → copy negatives", clip === expected.negatives, 1, "task4-terms.png", `${copied}; clipboard: ${JSON.stringify(clip)}`);

// (5) Cost per qualified lead by campaign vs target.
const cplRows = await desk.$$eval("#gx-cpl .gx-cpl li", (li) => li.map((x) => [x.querySelector(".gx-cpl__n").title, x.querySelector(".gx-cpl__v").innerText]));
for (const [name, v] of cplRows) if (expected.cplRows[name]) check(`Cost per qualified lead: ${name}`, v, expected.cplRows[name]);
await desk.screenshot({ path: join(OUT, "task5-cpl.png"), clip: await desk.$eval("#gx-cpl", (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height }; }) });
task(5, "Bibin · desktop", "Cost per qualified lead by campaign vs target", cplRows.length === 4 && cplRows.every(([n, v]) => v === expected.cplRows[n]), 0, "task5-cpl.png", cplRows.map(([n, v]) => `${n}: ${v}`).join("; ") + ` · ${await text(desk, "#gx-cpl .gx-take")}`);

// (6) When did leads stop: heatmap takeaway + the chart's last lead.
const heatTake = await text(desk, "#gx-heat .gx-take");
await desk.screenshot({ path: join(OUT, "task6-heatmap-chart.png"), clip: await desk.$eval(".g84", (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height }; }) });
const lastCell = await desk.$$eval("#gx-heat .gx-heat__c[title]", (c) => c.filter((x) => /· [1-9]/.test(x.title)).at(-1)?.title);
task(6, "Bibin · desktop", "When did leads stop (heatmap + chart)", /5 Nov/.test(heatTake ?? "") && /5 Nov/.test(lastCell ?? ""), 0, "task6-heatmap-chart.png", `Heatmap: "${heatTake}" (last filled cell: ${lastCell}); chart: last lead ${expected.lastLead}`);

// (7) Paused campaigns and when they were paused: "All 6 incl. paused →", then Status › Paused.
// "All 6 incl. paused →" opens All details on the Campaigns tab; then the "Paused" chip.
await Promise.all([desk.waitForNavigation({ waitUntil: "networkidle0" }), desk.click('#gx-camps .ct__x a')]);
await desk.click('[data-chip="t-campaigns"][data-val="paused"]');
const paused = await desk.$$eval("#t-campaigns tbody tr:not([hidden])", (tr) => tr.map((r) => `${r.cells[0].innerText.trim()} · ${r.cells[1].innerText.replace(/\s+/g, " ").trim()}`));
await desk.$eval("#details", (e) => e.scrollIntoView({ block: "start" }));
await desk.screenshot({ path: join(OUT, "task7-paused.png") });
task(7, "Bibin · desktop", "See paused campaigns and when they were paused", paused.length === 3 && paused.some((p) => /accounting.*since 2 Nov/.test(p)) && paused.some((p) => /mainland.*since 25 Oct/.test(p)), 2, "task7-paused.png", paused.join("; "));

// (8) Who changed Demand Gen on 16 Nov: the History tab, then search it.
await Promise.all([desk.waitForNavigation({ waitUntil: "networkidle0" }), desk.click('.gx-tabs a[href*="details=history"]')]);
await desk.type('input[data-search="t-changes"]', "DemandGen");
const changes = await desk.$$eval("#t-changes tbody tr:not([hidden])", (tr) => tr.map((r) => [...r.cells].map((c) => c.innerText.replace(/\s+/g, " ").trim()).join(" | ")).filter((s) => s.startsWith("2026-11-16")));
await desk.$eval("#details", (e) => e.scrollIntoView({ block: "start" }));
await desk.screenshot({ path: join(OUT, "task8-who.png") });
task(8, "Bibin · desktop", "Who changed Demand Gen on 16 Nov", changes.length === 2 && changes.every((c) => c.includes("bibin@example.com")), 3, "task8-who.png", `${changes.length} changes on 16 Nov, by ${[...new Set(changes.map((c) => c.split(" | ")[1]))].join(", ")} (History tab, search "DemandGen")`);

// (9) Channel › Search: does every block change?
const BLOCKS = [["KPIs", ".gx-kpis"], ["Spend and leads", "#gx-chart"], ["Needs attention", ".gx-attn"], ["Spend by channel", "#gx-spend"], ["Lead quality", "#gx-quality"], ["Funnel", "#gx-funnel"], ["Cost per qualified lead", "#gx-cpl"], ["Leads per day", "#gx-heat"], ["Devices", "#gx-dev"], ["Top cities", "#gx-cities"], ["Landing pages", "#gx-pages"], ["Search terms", "#gx-terms"], ["Campaigns", "#gx-camps"], ["All details", "#details"]];
const snap = async () => Object.fromEntries(await Promise.all(BLOCKS.map(async ([n, s]) => [n, await desk.$eval(s, (e) => e.textContent.replace(/\s+/g, " ").trim()).catch(() => "")])));
await desk.goto(`${BASE}/ads-report?view=google-ads`, { waitUntil: "networkidle0" });
const before = await snap();
await Promise.all([desk.waitForNavigation({ waitUntil: "networkidle0" }), desk.click('nav[aria-label="Channel"] a[href*="channel=search"]')]);
const after = await snap();
await desk.screenshot({ path: join(OUT, "task9-search-full.png"), fullPage: true });
const SAME_OK = {
  "Lead quality": "all 19 Google leads are from Search campaigns, so Search = All",
  Funnel: "the funnel is the Search funnel in All too",
  "Leads per day": "all leads are from Search campaigns",
  Devices: "the device card shows Search in All too",
  "Search terms": "search terms exist for Search only",
};
const changed = BLOCKS.map(([n]) => [n, before[n] !== after[n]]);
const unexplained = changed.filter(([n, c]) => !c && !SAME_OK[n]).map(([n]) => n);
task(9, "Bibin · desktop", "Channel → Search: every block follows", !unexplained.length, 1, "task9-search-full.png", `Changed: ${changed.filter(([, c]) => c).map(([n]) => n).join(", ")}. Same, as they should be: ${changed.filter(([n, c]) => !c && SAME_OK[n]).map(([n]) => `${n} (${SAME_OK[n]})`).join("; ") || "none"}${unexplained.length ? `. UNEXPLAINED: ${unexplained.join(", ")}` : ""}`);
await bad(desk, "desktop, Search");
for (const qs of ["range=today", "range=30d", "range=month", "from=2026-10-12&to=2026-10-20", "channel=demandgen&range=30d"]) {
  await desk.goto(`${BASE}/ads-report?view=google-ads&${qs}`, { waitUntil: "networkidle0" });
  await bad(desk, `desktop, ${qs}`);
}

// Keyboard: nav, filters, Refresh, Copy negatives and the details toggle are reachable, with a visible focus ring.
await desk.goto(`${BASE}/ads-report?view=google-ads`, { waitUntil: "networkidle0" });
const want = { "nav Dashboards": false, Period: false, Channel: false, Refresh: false, "Copy negatives": false, "All details": false };
for (let i = 0; i < 160 && Object.values(want).some((v) => !v); i++) {
  await desk.keyboard.press("Tab");
  const f = await desk.evaluate(() => {
    const e = document.activeElement, cs = getComputedStyle(e);
    return { nav: e.closest("nav")?.getAttribute("aria-label") ?? "", label: (e.getAttribute("aria-label") || e.innerText || "").trim().slice(0, 30), tag: e.tagName, ring: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2 };
  });
  if (!f.ring) continue;
  if (f.nav === "Dashboards") want["nav Dashboards"] = true;
  if (f.nav === "Period") want.Period = true;
  if (f.nav === "Channel") want.Channel = true;
  if (/^Refresh/.test(f.label)) want.Refresh = true;
  if (f.label === "Copy negatives") want["Copy negatives"] = true;
  if (f.tag === "SUMMARY") want["All details"] = true;
}
checks.push({ what: "Keyboard: reachable with a visible focus ring", got: Object.entries(want).map(([k, v]) => `${k} ${v ? "✓" : "✗"}`).join(", "), want: "all ✓", pass: Object.values(want).every(Boolean) });

/* ----- The other two views with the shared top bar ----- */
for (const [view, name] of [["erp", "erp-status"], ["landings", "ad-landings"]]) {
  await desk.goto(`${BASE}/ads-report?view=${view}`, { waitUntil: "networkidle0" });
  await desk.screenshot({ path: join(OUT, `${name}-desktop.png`) });
  await phone.goto(`${BASE}/ads-report?view=${view}`, { waitUntil: "networkidle0" });
  await phone.screenshot({ path: join(OUT, `${name}-phone.png`) });
  const o = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  checks.push({ what: `${name}: shared top bar present, no sideways scroll on phone`, got: `${(await desk.$(".lr-topbar")) ? "bar" : "no bar"}, overflow ${o}`, want: "bar, overflow 0", pass: !!(await desk.$(".lr-topbar")) && o <= 0 });
}

/* ----- Contrast (axe, WCAG AA colour contrast) on every view, laptop and phone ----- */
const AXE = join(process.cwd(), "node_modules", "axe-core", "axe.min.js");
for (const [p, dev] of [[desk, "desktop"], [phone, "phone"]]) {
  for (const qs of ["view=google-ads", "view=google-ads&range=30d&details=keywords", "view=google-ads&details=campaigns", "view=erp", "view=landings"]) {
    await p.goto(`${BASE}/ads-report?${qs}`, { waitUntil: "networkidle0" });
    await p.addScriptTag({ path: AXE });
    const r = await p.evaluate(async () => {
      const out = await window.axe.run(document, { runOnly: { type: "rule", values: ["color-contrast"] } });
      return { bad: out.violations.flatMap((v) => v.nodes.map((n) => `${n.target.join(" ")} (${(n.any[0]?.data?.contrastRatio ?? "?")}:1)`)), unsure: out.incomplete.reduce((s, v) => s + v.nodes.length, 0) };
    });
    checks.push({ what: `Contrast AA (axe) · ${dev} · ${qs}`, got: r.bad.length ? r.bad.slice(0, 8).join("; ") : `no failures (${r.unsure} over images or glass, not measurable)`, want: "no failures", pass: !r.bad.length });
  }
}

/* ----- The reference, for the side-by-side ----- */
if (process.env.REFERENCE_HTML) {
  const ref = await newPage(1440, 900);
  await ref.goto(`file:///${process.env.REFERENCE_HTML.replace(/\\/g, "/")}`, { waitUntil: "networkidle0" });
  await ref.screenshot({ path: join(OUT, "reference-desktop.png"), fullPage: true });
  await ref.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await ref.screenshot({ path: join(OUT, "reference-phone.png"), fullPage: true });
}

checks.push({ what: "Requests outside the site and Google Fonts (all aborted)", got: [...outside].join(", ") || "none", want: "none", pass: true });
checks.push({ what: "Bridge: calls · click ids sent · payload bytes", got: `${stats.bridgeCalls} · ${stats.clickIdsSent} · ${stats.bridgeBytes}`, want: "—", pass: true });

await browser.close();
server.close();
writeFileSync(join(OUT, "results.json"), JSON.stringify({ tasks: results, checks }, null, 2));
console.log("\nTASKS");
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}. ${r.who} · ${r.what} · ${r.clicks} clicks · ${r.shot}\n      ${r.note}`);
console.log("\nCHECKS");
for (const c of checks) console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.what}: ${c.got}${c.pass ? "" : `  (expected ${c.want})`}`);
process.exit(results.every((r) => r.pass) && checks.every((c) => c.pass) ? 0 : 1);
