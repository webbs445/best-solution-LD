// Cloaking check: the same text for a normal browser, Googlebot and AdsBot-Google on every route. 1) Raw server HTML
// text (scripts and styles removed, tags stripped); 2) rendered text after load with JS (tag hosts blocked). Rotating
// bits (hero demo pairs, counters) are removed before comparing. Exit 1 on any difference.
// Usage: node scripts/qa/cloak.mjs [base]
import crypto from "node:crypto";
import { BASE, ROUTES, blockTags, launch, wait } from "./common.mjs";

const UAS = {
  browser: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  googlebot: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  adsbot: "AdsBot-Google (+http://www.google.com/adsbot.html)",
};
const hash = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 10);
const text = (html) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();

const b = await launch();
let bad = 0;
for (const r of ROUTES) {
  const raw = {}, rendered = {};
  for (const [k, ua] of Object.entries(UAS)) {
    raw[k] = text(await (await fetch(BASE + r, { headers: { "User-Agent": ua } })).text());
    const ctx = await b.createBrowserContext();
    const p = await ctx.newPage();
    await blockTags(p);
    await p.setUserAgent(ua);
    await p.setViewport({ width: 1280, height: 900 });
    await p.goto(BASE + r, { waitUntil: "networkidle2", timeout: 180000 });
    await wait(800);
    rendered[k] = await p.evaluate(() => {
      // #closePct: the /accounting hero's animated "N of 3 reports" counter.
      document.querySelectorAll(".hx-swap, .hx-match-row, [aria-live], .mk-co, #mkL, #mkTot, .rot, [data-rotate], #closePct").forEach((e) => e.remove());
      return document.body.innerText.replace(/\s+/g, " ").trim();
    });
    await ctx.close();
  }
  const rawSame = new Set(Object.values(raw).map(hash)).size === 1;
  const renSame = new Set(Object.values(rendered).map(hash)).size === 1;
  if (!rawSame || !renSame) bad++;
  console.log(`${rawSame && renSame ? "PASS" : "FAIL"} ${r}: raw HTML ${rawSame ? "identical" : "DIFFERS"} | rendered ${renSame ? "identical" : "DIFFERS"}`);
  if (!renSame) {
    const [a, c] = [rendered.browser, rendered.googlebot !== rendered.browser ? rendered.googlebot : rendered.adsbot];
    let i = 0;
    while (i < a.length && a[i] === c[i]) i++;
    console.log(`   first difference at ${i}: browser "${a.slice(i, i + 80)}" vs bot "${c.slice(i, i + 80)}"`);
  }
}
await b.close();
console.log(bad ? `${bad} FAIL` : "ALL PASS");
process.exit(bad ? 1 : 0);
