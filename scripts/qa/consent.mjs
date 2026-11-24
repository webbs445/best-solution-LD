// Cookie banner QA (local production build; tag hosts blocked, nothing sent anywhere): node scripts/qa/consent.mjs [base]
// Placement (clear of the /xservicesx hero heading and buttons at 390, 768, 1440; plan card too on desktop), the ~1 s
// delay, Reject and Accept each set the right Consent Mode state and fire no tag before a choice, the choice survives a
// reload, the footer reopens it, keyboard use, and axe (WCAG 2.1 AA) on the banner on every route.
import { readFileSync } from "node:fs";
import { BASE, ROUTES, TAG_HOSTS, blockTags, launch, wait } from "./common.mjs";

const AXE = readFileSync(new URL("../../node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
const CARD = '[aria-labelledby="consent-title"]';
let fails = 0;
const check = (name, ok, detail = "") => {
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);
};
const b = await launch();

async function open(path, w, h = w < 768 ? 844 : w < 1024 ? 1024 : 900) {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: w, height: h, isMobile: w < 768, hasTouch: w < 768 });
  p.tags = [];
  await blockTags(p, (r) => {
    if (r.method() !== "GET") return r.abort(), true; // nothing is ever posted
    if (!r.url().startsWith(BASE) && !/^(data|blob):/.test(r.url())) return r.abort(), true;
    return false;
  });
  p.on("request", (r) => TAG_HOSTS.test(r.url()) && p.tags.push(r.url()));
  await p.goto(`${BASE}${path}`, { waitUntil: "networkidle2", timeout: 180000 });
  p.done = () => ctx.close();
  return p;
}
const button = (p, text) => p.evaluateHandle((t) => [...document.querySelectorAll(`[aria-labelledby="consent-title"] button`)].find((x) => x.innerText.trim() === t), text);
const consentState = (p) =>
  p.evaluate(() => {
    const ups = (window.dataLayer || []).filter((d) => d && d[0] === "consent" && d[1] === "update").map((d) => d[2]);
    const def = (window.dataLayer || []).find((d) => d && d[0] === "consent" && d[1] === "default")?.[2];
    return { def, last: ups.at(-1) ?? null, updates: ups.length, clarity: !!window.__bsClarityOk };
  });
const SIGNALS = ["ad_storage", "analytics_storage", "ad_user_data", "ad_personalization"];

// 1. Placement and timing on /xservicesx.
for (const w of [390, 768, 1440]) {
  const p = await open("/xservicesx", w);
  const early = await p.$(CARD);
  await wait(1300);
  const r = await p.evaluate((sel) => {
    const box = (e) => e && e.getBoundingClientRect();
    const hit = (a, c) => !!a && !!c && a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom;
    const card = box(document.querySelector(sel));
    const avoid = { h1: "#xsTitle", ctas: "#xs-hero-ctas", ...(innerWidth >= 1024 ? { plan: ".xs-hcard" } : {}) };
    const btns = [...document.querySelectorAll(`${sel} button`)].filter((x) => ["Reject", "Accept"].includes(x.innerText.trim())).map((x) => x.getBoundingClientRect());
    return {
      card: card && { left: Math.round(card.left), top: Math.round(card.top), width: Math.round(card.width), bottom: Math.round(card.bottom) },
      overlaps: Object.entries(avoid).filter(([, s]) => hit(card, box(document.querySelector(s)))).map(([k]) => k),
      sameRow: btns.length === 2 && Math.abs(btns[0].top - btns[1].top) < 1 && Math.abs(btns[0].width - btns[1].width) < 1 && Math.abs(btns[0].height - btns[1].height) < 1,
      title: document.getElementById("consent-title")?.textContent,
    };
  }, CARD);
  check(`${w}px: banner waits about 1 s, then shows`, !early && !!r.card, JSON.stringify(r.card));
  check(`${w}px: banner clear of the hero heading and buttons${w >= 1024 ? " and plan card" : ""}`, !r.overlaps.length, r.overlaps.join(", "));
  check(`${w}px: Reject and Accept same size, same row`, r.sameRow);
  check(`${w}px: ${w < 768 ? "bottom sheet on the bottom edge" : "card bottom left, at most 400 px"}`, w < 768 ? r.card.bottom === 844 && r.card.left === 0 : r.card.left === 24 && r.card.width <= 400, JSON.stringify(r.card));
  check(`${w}px: title "Help us improve this page"`, r.title === "Help us improve this page");
  await p.done();
}

// 2. No tag before a choice; Reject and Accept set the right state; the choice survives a reload; 180 days.
for (const [label, want] of [["Reject", "denied"], ["Accept", "granted"]]) {
  const p = await open("/xservicesx", 1440);
  await wait(1300);
  const before = await consentState(p);
  check(`before a choice: defaults denied, no update, no tag request, Clarity held`, SIGNALS.every((k) => before.def?.[k] === "denied") && !before.updates && !p.tags.length && !before.clarity, JSON.stringify({ ...before, tags: p.tags.length }));
  await (await button(p, label)).click();
  await wait(300);
  const after = await consentState(p);
  const cookie = (await p.cookies()).find((c) => c.name === "bs_consent");
  const days = cookie ? Math.round((cookie.expires * 1000 - Date.now()) / 864e5) : 0;
  check(`${label}: all four signals ${want}, banner closed, cookie kept 180 days`, SIGNALS.every((k) => after.last?.[k] === want) && !(await p.$(CARD)) && days === 180, JSON.stringify({ last: after.last, days }));
  check(`${label}: Clarity ${want === "granted" ? "released" : "still held"}`, after.clarity === (want === "granted"));
  await p.reload({ waitUntil: "networkidle2" });
  await wait(1500);
  const again = await consentState(p);
  check(`${label}: after a reload no banner, saved choice restored before tags`, !(await p.$(CARD)) && SIGNALS.every((k) => again.last?.[k] === want), JSON.stringify(again.last));
  // The footer reopens it, nothing pre-ticked after a reject.
  await p.evaluate(() => [...document.querySelectorAll("button")].find((x) => x.innerText.trim() === "Cookie Settings")?.click());
  await wait(300);
  const sw = await p.$$eval(`${CARD} [role=switch]`, (s) => s.map((x) => x.getAttribute("aria-checked")));
  check(`${label}: footer Cookie Settings reopens with the saved choices`, sw.length === 2 && sw.every((v) => v === (want === "granted" ? "true" : "false")), sw.join(","));
  await p.done();
}

// 3. Keyboard: "Choose what to allow" opens the categories (both off), Space turns one on, Save keeps only that one.
{
  const p = await open("/xservicesx", 390);
  await wait(1300);
  await p.evaluate(() => [...document.querySelectorAll('[aria-labelledby="consent-title"] button')].find((x) => x.innerText.trim() === "Choose what to allow").focus());
  await p.keyboard.press("Enter");
  await wait(200);
  const sw = await p.$$eval(`${CARD} [role=switch]`, (s) => s.map((x) => x.getAttribute("aria-checked")));
  check("keyboard: Enter opens the categories, none pre-ticked", sw.length === 2 && sw.every((v) => v === "false"), sw.join(","));
  await p.focus(`${CARD} [role=switch]`);
  await p.keyboard.press("Space");
  await p.keyboard.press("Tab");
  await p.keyboard.press("Tab");
  const focused = await p.evaluate(() => document.activeElement?.innerText.trim());
  await p.keyboard.press("Enter");
  await wait(300);
  const s = await consentState(p);
  check("keyboard: Space toggles Analytics, Tab reaches Save, Enter saves analytics only", focused === "Save preferences" && s.last?.analytics_storage === "granted" && s.last?.ad_storage === "denied", JSON.stringify({ focused, last: s.last }));
  await p.done();
}

// 4. axe on the banner, closed and with the categories open, on every route (390 and 1440).
for (const w of [390, 1440]) {
  const bad = [];
  for (const path of ROUTES) {
    const p = await open(path, w);
    await wait(1300);
    if (!(await p.$(CARD))) {
      bad.push(`${path}: no banner`);
      await p.done();
      continue;
    }
    await p.evaluate(AXE);
    const run = () => p.evaluate(async (sel) => (await window.axe.run({ include: [sel] }, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } })).violations.map((v) => v.id), CARD);
    const v1 = await run();
    await p.evaluate(() => [...document.querySelectorAll('[aria-labelledby="consent-title"] button')].find((x) => x.innerText.trim() === "Choose what to allow")?.click());
    await wait(200);
    const v2 = await run();
    if (v1.length || v2.length) bad.push(`${path}: ${[...v1, ...v2].join(",")}`);
    await p.done();
  }
  check(`axe on the banner (closed and open) on all ${ROUTES.length} routes at ${w}px`, !bad.length, bad.slice(0, 5).join("; "));
}

await b.close();
console.log(fails ? `${fails} FAIL` : "ALL PASS");
process.exit(fails ? 1 : 0);
