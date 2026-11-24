// Strict Google Ads compliance scan. Per route, after load with JS (tag hosts blocked, no consent given): ALL text in the
// DOM, visible or hidden, plus alt/aria-label/title/placeholder, <title> and meta content, JSON-LD and decoded wa.me
// message texts. [data-legal] (disclaimers) and [data-review-quote] (real Google review quotes) are exempt, except on
// /xservicesx (reviews scanned, exempting only "stress-free" and the brand name "best solution"; the verified rating,
// approved 24 Nov 2026 after checking Google Maps, exempt from the 4.8 rule).
// Rules: banned words (rule 7), strict words (also run-together text), claim phrases, prices. Allowed: the corporate tax
// threshold "AED 375,000" everywhere, and on /corporate-tax any AED amount as a tax fact unless fee(s), price, pricing,
// cost, package, "from AED" or "starting at" is within about 6 words. /privacy and /terms are reported as "pending legal" and not counted while LEGAL_V2 is false
// (src/content/legal.ts). Exit 1 on any failure. Usage: node scripts/qa/strict-scan.mjs [base]
import { readFileSync } from "node:fs";
import { BASE, ROUTES, blockTags, launch, wait } from "./common.mjs";

const BANNED = /\b(set[- ]?up|setups|startups?|start(s|ed|ing)?|open(s|ed|ing)?|register(s|ed|ing)?|registrations?|licen[cs]e[sd]?|licensing|visas?|permits?|approvals?|approved|documents?|formation|fast(er|est)?|instant(ly)?|quick(ly|er)?|guarantee[sd]?|cheapest|lowest|launch(es|ed|ing)?|transparent|renew(s|ed|al|als)?|non-residents?)\b|100 ?%|no hidden fees/gi;
const STRICT = /residen\w*|4\.8|\d+\s*\+?\s*countries|2014|emirates id|visa\w*|licen[cs]\w*|set ?ups?|registr\w*|®/gi;
const CLAIMS = /emirati[- ]owned|owned by uae nationals|\best\.? 20\d\d|★|\b28 (free )?zones|\b(7|seven) emirates|\b1 (dedicated )?advisor|save about|\d+% less/gi;
const PRICE = /\bAED\b|\bdhs?\b|\bdirhams?\b|د\.إ/gi;
/** Allowed facts, removed before the price rule runs: the corporate tax threshold. */
const ALLOWED = /AED ?375,000/g;
/** On /corporate-tax, AED amounts are tax facts unless one of these sits within about 6 words (then it reads as a price). */
const TAX_FACT_PAGE = "/corporate-tax";
const PRICE_WORDS = /\b(fees?|pric(e|es|ing)|costs?|packages?|starting at)\b/i;
const nearPriceWord = (text, index, len) => {
  const before = text.slice(0, index).split(/\s+/).slice(-7).join(" "); // the 6 words before, plus the one AED touches
  const after = text.slice(index + len).split(/\s+/).slice(0, 7).join(" ");
  return PRICE_WORDS.test(before) || PRICE_WORDS.test(after) || /\bfrom\s*$/i.test(before);
};

const legalV2 = /export const LEGAL_V2 = true/.test(readFileSync(new URL("../../src/content/legal.ts", import.meta.url), "utf8"));
const PENDING_LEGAL = legalV2 ? [] : ["/privacy", "/terms"];

const b = await launch();
let failures = 0;
const pending = [];
for (const r of ROUTES) {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  await blockTags(p);
  const res = await p.goto(BASE + r, { waitUntil: "networkidle2", timeout: 180000 });
  await wait(1000);
  // /xservicesx: its reviews are scanned (only "stress-free" and "THE BEST SOLUTIONS" exempt) and its verified Google
  // rating ([data-google-rating], set in XS_CONFIG) is exempt from the 4.8 rule.
  const xs = r === "/xservicesx";
  const exempt = xs ? "[data-legal],[data-google-rating]" : "[data-legal],[data-review-quote]";
  const raw = await p.evaluate((exempt) => {
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll(`script, style, noscript, ${exempt}`).forEach((e) => e.remove());
    const attrs = [...document.querySelectorAll("[alt],[aria-label],[title],[placeholder]")]
      .filter((e) => !e.closest(exempt))
      .flatMap((e) => ["alt", "aria-label", "title", "placeholder"].map((a) => e.getAttribute(a) || ""));
    const meta = [document.title, ...[...document.querySelectorAll("meta[content]")].map((m) => m.getAttribute("content"))];
    const schema = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent);
    const wa = [...document.querySelectorAll('a[href*="wa.me"]')].map((a) => {
      try {
        return new URL(a.href).searchParams.get("text") || "";
      } catch {
        return "";
      }
    });
    return [clone.textContent, attrs.join(" | "), meta.join(" | "), schema.join(" | "), wa.join(" | ")].join(" || ").replace(/\s+/g, " ");
  }, exempt);
  const d = xs ? raw.replace(/stress-free|best solution/gi, " ") : raw;
  await ctx.close();
  const issues = [];
  const hit = (name, re, text = d, keep = () => true) => {
    const m = [...text.matchAll(re)].filter((x) => keep(text, x)).map((x) => `"${x[0]}" in ...${text.slice(Math.max(0, x.index - 40), x.index + 40).trim()}...`);
    if (m.length) issues.push(`${name} (${m.length}): ${[...new Set(m)].slice(0, 4).join(" ;; ")}`);
  };
  hit("rule 7 banned word", BANNED);
  hit("strict word", STRICT);
  hit("claim phrase", CLAIMS);
  hit("price", PRICE, d.replace(ALLOWED, ""), r === TAX_FACT_PAGE ? (t, x) => nearPriceWord(t, x.index, x[0].length) : undefined);
  if (PENDING_LEGAL.includes(r)) {
    pending.push(`${r} (HTTP ${res.status()}): ${issues.length} rule hits${issues.length ? ": " + issues.map((i) => i.split(":")[0]).join(", ") : ""}`);
    continue;
  }
  failures += issues.length;
  console.log(`=== ${r}  HTTP ${res.status()}  ${issues.length ? issues.length + " FAIL" : "PASS"}`);
  issues.forEach((i) => console.log("  FAIL " + i));
}
await b.close();
if (pending.length) console.log(`\nPENDING LEGAL (not counted while LEGAL_V2 is false):\n  ${pending.join("\n  ")}`);
console.log(failures ? `\nFAILED: ${failures} rule failures` : "\nALL PASS");
process.exit(failures ? 1 : 0);
