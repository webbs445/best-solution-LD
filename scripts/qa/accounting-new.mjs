// /accounting-new browser checks. Every outside host is blocked and /api/accounting is answered inside the browser
// (success or a 422), so nothing reaches the ERP. Test data only.
// Checks: no sideways scroll at 360 to 1920; CLS on load; quote form gating, Back keeping answers, focus on the step
// heading, inline errors, a mocked success (stamp, "Request received.", the lead body) and a mocked 422; no name,
// number or email in any acc_* event, and user_data on form_submit / generate_lead (enhanced conversions); the books
// check and the whole form by keyboard; axe (WCAG 2.1 AA) at 390 and 1440; screenshots of every section at 390 and
// 1440 and of the form at each step.
// Usage: node scripts/qa/accounting-new.mjs [base] [shots dir]. Exit 1 on any failure.
// Other engines: QA_ENGINE=webkit|firefox runs the same checks in Playwright (QA_PLAYWRIGHT = path to the playwright
// module, which is not a dependency of this repo). CLS is Chromium-only (no layout-shift entries elsewhere).
import { mkdirSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { BASE, BLOCKED_HOSTS, blockTags, launch, wait } from "./common.mjs";

const PATH = "/accounting-new";
const SHOTS = process.argv[3] || "";
const ENGINE = process.env.QA_ENGINE || "chrome";
const PW = ENGINE !== "chrome";
// The widths the form, section 5, axe and screenshot checks run at.
const WIDTHS = [360, 390, 1440, 1920];
const NAME = "TEST AUDIT - DELETE", PHONE = "500000000", EMAIL = "test-audit@xerebo.com";
const AXE = readFileSync(new URL("../../node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const b = PW ? await (await import(pathToFileURL(process.env.QA_PLAYWRIGHT).href))[ENGINE].launch() : await launch();
console.log(`engine: ${ENGINE}`);
let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);
};

/** A fresh page at this width. api: "ok" | "422"; lead bodies land in page.leads. */
async function open(width, { api = "ok", reduced = false } = {}) {
  const height = width < 768 ? 844 : 900, touch = width < 768;
  const leads = [];
  /** One answer for every request: abort, fake response, or pass through. */
  const decide = (url, method, body) => {
    if (BLOCKED_HOSTS.test(url) || (!url.startsWith(BASE) && !/^(data|blob):/.test(url))) return "abort";
    if (url.includes("/api/ad-landing")) return { status: 204, body: "" };
    if (method === "POST" && url.includes("/api/accounting")) {
      leads.push(JSON.parse(body || "{}"));
      return api === "ok" ? { status: 200, body: '{"ok":true,"created":true}' } : { status: 422, body: '{"error":"invalid_fields","fields":["email_id"]}' };
    }
    return null;
  };
  const clsInit = () => {
    window.__cls = 0;
    try {
      new PerformanceObserver((l) => l.getEntries().forEach((e) => !e.hadRecentInput && (window.__cls += e.value))).observe({ type: "layout-shift", buffered: true });
    } catch {}
  };
  let p;
  if (PW) {
    // Firefox has no isMobile; touch and the viewport are enough there.
    const ctx = await b.newContext({ viewport: { width, height }, hasTouch: touch, ...(ENGINE === "webkit" ? { isMobile: touch } : {}), reducedMotion: reduced ? "reduce" : "no-preference" });
    await ctx.route("**/*", (route) => {
      const q = route.request();
      const d = decide(q.url(), q.method(), q.postData());
      if (d === "abort") return route.abort();
      if (d) return route.fulfill({ ...d, contentType: "application/json" });
      return route.continue();
    });
    p = await ctx.newPage();
    await p.addInitScript(clsInit);
  } else {
    const ctx = await b.createBrowserContext();
    p = await ctx.newPage();
    await p.setViewport({ width, height, isMobile: touch, hasTouch: touch });
    if (reduced) await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await blockTags(p, (r) => {
      const d = decide(r.url(), r.method(), r.postData());
      if (d === "abort") return r.abort(), true;
      if (d) return r.respond({ ...d, contentType: "application/json" }), true;
      return false;
    });
    await p.evaluateOnNewDocument(clsInit);
  }
  p.leads = leads;
  await p.goto(`${BASE}${PATH}?utm_source=google&utm_campaign=TEST-AUDIT-DELETE`, { waitUntil: PW ? "networkidle" : "networkidle2", timeout: 180000 });
  await p.$$eval("button", (bs) => bs.find((x) => x.innerText.trim() === "Accept all")?.click());
  await wait(400);
  return p;
}
const close = (p) => (PW ? p.context() : p.browserContext()).close();
const text = (p, sel) => p.$eval(sel, (e) => e.innerText.trim()).catch(() => "");
const nextOff = (p) => p.$eval(".s9-next", (e) => e.disabled);
const focusedText = (p) => p.evaluate(() => document.activeElement?.innerText?.trim() || document.activeElement?.id || "");
async function toQuote(p) {
  await p.$eval("#quote", (e) => e.scrollIntoView({ block: "start", behavior: "instant" }));
  await wait(300);
}
async function clickRow(p, row, label) {
  // One argument object: Playwright passes a single argument to the page function.
  await p.$$eval(".s9-chips.s", (rows, a) => [...rows[a.row].querySelectorAll("button")].find((x) => x.innerText.trim() === a.label)?.click(), { row, label });
  await wait(60);
}
async function clickChip(p, label) {
  await p.$$eval(".s9-c", (bs, l) => bs.find((x) => x.innerText.trim() === l)?.click(), label);
  await wait(60);
}

// 1. No sideways scroll, and no layout shift on load.
for (const w of [360, 390, 768, 1024, 1440, 1920]) {
  const p = await open(w);
  const r = await p.evaluate(async () => {
    // Walk down the page so every section mounts and starts its animation.
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    return { sw: document.documentElement.scrollWidth, iw: window.innerWidth };
  });
  check(`no sideways scroll at ${w}`, r.sw <= r.iw, `${r.sw} vs ${r.iw}`);
  if (!PW && (w === 390 || w === 1440)) {
    const p2 = await open(w);
    const cls = await p2.evaluate(() => window.__cls);
    check(`CLS on load at ${w} under 0.05`, cls < 0.05, cls.toFixed(4));
    await close(p2);
  }
  await close(p);
}

// 2. The quote form: gating, Back, focus, inline errors, mocked success, no personal data in the dataLayer.
for (const w of WIDTHS) {
  const p = await open(w);
  await toQuote(p);
  const shot = async (name) => SHOTS && (await (await p.$("#quote")).screenshot({ path: `${SHOTS}/s9-${w}-${name}.png` }));
  check(`${w}: Next disabled on an empty step 1`, await nextOff(p));
  await shot("1-step1");
  await clickChip(p, "Catch up on past months");
  check(`${w}: Next enabled after a need`, !(await nextOff(p)));
  check(`${w}: the paper shows the need`, (await text(p, ".s9-paper")).includes("Catch up on past months"));
  await p.click(".s9-next");
  await wait(200);
  check(`${w}: focus on the step 2 heading`, (await focusedText(p)) === "A little about your books.");
  check(`${w}: Next disabled until all three rows`, await nextOff(p));
  await clickRow(p, 0, "50 to 200");
  await clickRow(p, 1, "Not sure");
  check(`${w}: still disabled with one row missing`, await nextOff(p));
  await clickRow(p, 2, "1 to 3 months behind");
  check(`${w}: Next enabled with all three rows`, !(await nextOff(p)));
  check(`${w}: aria-pressed on the picked chips`, (await p.$$eval(".s9-c[aria-pressed='true']", (e) => e.length)) === 3);
  await shot("2-step2");
  await p.click(".s9-next");
  await wait(200);
  check(`${w}: focus on the step 3 heading`, (await focusedText(p)) === "Where should we send your quote?");
  await p.click(".s9-back");
  await wait(200);
  check(`${w}: Back keeps the step 2 answers`, (await p.$$eval(".s9-c[aria-pressed='true']", (e) => e.length)) === 3);
  check(`${w}: focus on the step 2 heading after Back`, (await focusedText(p)) === "A little about your books.");
  await p.click(".s9-back");
  await wait(200);
  check(`${w}: Back keeps the need`, (await p.$$eval(".s9-c[aria-checked='true']", (e) => e.map((x) => x.innerText.trim()))).join() === "Catch up on past months");
  await p.click(".s9-next");
  await wait(150);
  await p.click(".s9-next");
  await wait(150);
  await p.click(".s9-next");
  await wait(200);
  // Empty submit: three inline errors, nothing sent, focus on the first bad field.
  await p.click(".s9-next");
  await wait(200);
  check(`${w}: three inline errors on an empty step 3`, (await p.$$eval(".s9-field .s9-err", (e) => e.length)) === 3);
  check(`${w}: nothing sent on an invalid step 3`, p.leads.length === 0);
  check(`${w}: focus on the first bad field`, (await focusedText(p)) === "an-q-name");
  await shot("3-errors");
  await p.type("#an-q-name", NAME);
  await p.type("#an-q-phone", PHONE);
  await p.type("#an-q-email", EMAIL);
  check(`${w}: errors clear as fields are fixed`, (await p.$$eval(".s9-field .s9-err", (e) => e.length)) === 0);
  await shot("4-step3");
  await p.click(".s9-next");
  await p.waitForSelector(".s9-done", { timeout: 10000 }).catch(() => {});
  await wait(600);
  check(`${w}: "Request received." shown`, (await text(p, ".s9-done")).startsWith("Request received."));
  check(`${w}: QUOTE TODAY stamp on the paper`, (await text(p, ".s9-stamp")) === "QUOTE TODAY");
  check(`${w}: no design reset button`, !(await p.$$eval("button", (bs) => bs.some((x) => /Design preview/.test(x.innerText)))));
  await shot("5-success");
  const lead = p.leads[0] || {};
  check(`${w}: one lead with the answers`, p.leads.length === 1 && lead.need === "Catch up on past months" && lead.volume === "50 to 200" && lead.software === "Not sure" && lead.books_state === "1 to 3 months behind", JSON.stringify({ n: p.leads.length, need: lead.need }));
  check(`${w}: number sent in E.164 and test data only`, lead.mobile_no === "+971500000000" && lead.lead_name === NAME && lead.email_id === EMAIL);
  const dl = await p.evaluate(() => JSON.stringify(window.dataLayer || []));
  check(`${w}: acc_quote_submit and form_submit pushed`, dl.includes('"acc_quote_submit"') && dl.includes('"form_submit"'));
  check(`${w}: acc_quote_step 1, 2 and 3 pushed`, [1, 2, 3].every((n) => dl.includes(`"event":"acc_quote_step","step":${n}`)));
  // The page's own acc_* events never carry contact details.
  const acc = await p.evaluate(() => JSON.stringify((window.dataLayer || []).filter((e) => typeof e?.event === "string" && e.event.startsWith("acc_"))));
  const leaks = [NAME, EMAIL, "500000000", "+971500000000", "TEST AUDIT"].filter((s) => acc.includes(s));
  check(`${w}: no name, number or email in any acc_* event`, leaks.length === 0, leaks.join(", "));
  // Enhanced conversions, as on the old /accounting: form_submit and generate_lead carry user_data.
  const ud = await p.evaluate(() => {
    const dlx = window.dataLayer || [];
    return { fs: dlx.find((e) => e?.event === "form_submit")?.user_data, gl: dlx.find((e) => e?.event === "generate_lead")?.user_data };
  });
  check(
    `${w}: form_submit carries user_data (email, E.164 phone, names)`,
    ud.fs?.email === EMAIL && ud.fs?.phone === "+971500000000" && ud.fs?.first_name === "TEST" && ud.fs?.last_name === "AUDIT - DELETE",
    JSON.stringify(ud.fs ? Object.keys(ud.fs) : null),
  );
  check(`${w}: generate_lead carries user_data (email, phone)`, ud.gl?.email === EMAIL && ud.gl?.phone_number === "+971500000000");
  await close(p);
}

// 3. A 422 from the server: inline error on that field, answers kept, no success.
{
  const p = await open(1440, { api: "422" });
  await toQuote(p);
  await clickChip(p, "Not sure yet");
  await p.click(".s9-next");
  await wait(150);
  await clickRow(p, 0, "Under 50");
  await clickRow(p, 1, "Excel");
  await clickRow(p, 2, "Up to date");
  await p.click(".s9-next");
  await wait(150);
  await p.type("#an-q-name", NAME);
  await p.type("#an-q-phone", PHONE);
  await p.type("#an-q-email", EMAIL);
  await p.click(".s9-next");
  await wait(1500);
  check("422: inline error on the email field", (await p.$$eval("#an-q-email-err", (e) => e.length)) === 1);
  check("422: no success state", !(await p.$(".s9-done")));
  check("422: typed details kept", (await p.$eval("#an-q-name", (e) => e.value)) === NAME);
  check("422: no acc_quote_submit", !(await p.evaluate(() => JSON.stringify(window.dataLayer || []))).includes("acc_quote_submit"));
  await close(p);
}

// 4. Keyboard only: the books check and the whole form.
{
  const p = await open(1440);
  // Books check: Tab from the top until focus is inside #check, then answer with Space.
  await p.focus("body");
  let inCheck = false;
  for (let i = 0; i < 80 && !inCheck; i++) {
    await p.keyboard.press("Tab");
    inCheck = await p.evaluate(() => !!document.activeElement?.closest("#check") && document.activeElement.tagName !== "A");
  }
  check("keyboard: reaches the books check", inCheck);
  const before = await p.$eval("#check", (e) => e.innerText);
  await p.keyboard.press("Space");
  await wait(300);
  check("keyboard: Space answers a check line", (await p.$eval("#check", (e) => e.innerText)) !== before || (await p.$$eval("#check [aria-pressed='true'], #check [aria-checked='true'], #check input:checked", (e) => e.length)) > 0);
  const dl = await p.evaluate(() => JSON.stringify(window.dataLayer || []));
  check("keyboard: acc_check_answer pushed", dl.includes('"acc_check_answer"'));
  // The form: Tab into the radio group, arrows pick, Enter on Next.
  await toQuote(p);
  await p.$eval(".s9-c", (e) => e.focus());
  await p.keyboard.press("ArrowDown");
  await wait(80);
  check("keyboard: arrow picks a need", (await p.$$eval(".s9-c[aria-checked='true']", (e) => e.length)) === 1);
  let onNext = false;
  for (let i = 0; i < 10 && !onNext; i++) {
    await p.keyboard.press("Tab");
    onNext = await p.evaluate(() => document.activeElement?.classList.contains("s9-next"));
  }
  check("keyboard: Tab reaches Next", onNext);
  await p.keyboard.press("Enter");
  await wait(200);
  for (const label of ["Under 50", "QuickBooks", "Up to date"]) {
    let on = false;
    for (let i = 0; i < 20 && !on; i++) {
      await p.keyboard.press("Tab");
      on = await p.evaluate((l) => document.activeElement?.innerText?.trim() === l, label);
    }
    await p.keyboard.press("Enter");
    await wait(60);
  }
  check("keyboard: step 2 answered", (await p.$$eval(".s9-c[aria-pressed='true']", (e) => e.length)) === 3);
  let nx = false;
  for (let i = 0; i < 20 && !nx; i++) {
    await p.keyboard.press("Tab");
    nx = await p.evaluate(() => document.activeElement?.classList.contains("s9-next"));
  }
  await p.keyboard.press("Enter");
  await wait(200);
  await p.keyboard.press("Tab");
  await p.keyboard.type(NAME);
  await p.keyboard.press("Tab");
  await p.keyboard.type(PHONE);
  await p.keyboard.press("Tab");
  await p.keyboard.type(EMAIL);
  await p.keyboard.press("Enter");
  await p.waitForSelector(".s9-done", { timeout: 10000 }).catch(() => {});
  check("keyboard: whole form sent by keyboard", !!(await p.$(".s9-done")) && p.leads.length === 1);
  await close(p);
}

// 4a. "What we do" (#services), the office hours and the footer line; and the section background order.
for (const w of WIDTHS) {
  const p = await open(w);
  const order = await p.$$eval("main > section", (ss) => ss.map((s) => `${s.id || s.className.split(" ")[0]}:${getComputedStyle(s).backgroundColor}`));
  if (w === 1440) console.log(`INFO section order: ${order.join(" > ")}`);
  check(`${w}: services is the second section`, order[1]?.startsWith("services:"));
  check(`${w}: header menu starts with Services`, (await p.$$eval("a[href='#services']", (a) => a.length)) >= 1);
  const before = await p.$$eval("#services .s1b-row", (rs) => rs.map((r) => getComputedStyle(r).opacity).join(""));
  await p.$eval("#services .s1b-sheet", (e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
  await wait(1800);
  const rows = await p.$$eval("#services .s1b-row", (rs) => rs.map((r) => [r.querySelector("b").innerText.trim(), getComputedStyle(r).opacity]));
  check(`${w}: services rows hidden before view, all 7 shown after`, /^0+$/.test(before) && rows.length === 7 && rows.every(([, o]) => o === "1"), `${before} -> ${rows.map((r) => r[1]).join("")}`);
  if (SHOTS) await (await p.$("#services")).screenshot({ path: `${SHOTS}/services-${w}.png` });
  // Phone order: the list, then the facts, then a full-width button.
  const pos = await p.evaluate(() => {
    const y = (s) => document.querySelector(s).getBoundingClientRect().top;
    const btn = document.querySelector("#services .s1b-btn").getBoundingClientRect();
    const wrap = document.querySelector("#services .s1b-wrap").getBoundingClientRect();
    return { sheet: y("#services .s1b-sheet"), facts: y("#services .s1b-facts"), btn: btn.top, full: Math.abs(btn.width - wrap.width) < 2 };
  });
  if (w < 900) check(`${w}: services phone order list, facts, full-width button`, pos.sheet < pos.facts && pos.facts < pos.btn && pos.full);
  await p.$eval("#services .s1b-btn", (a) => {
    a.addEventListener("click", (e) => e.preventDefault(), { once: true });
    a.click();
  });
  const cta = await p.evaluate(() => (window.dataLayer || []).find((e) => e?.event === "acc_cta_click"));
  check(`${w}: services button goes to #quote and sends acc_cta_click section "services"`, (await p.$eval("#services .s1b-btn", (a) => a.getAttribute("href"))) === "#quote" && cta?.section === "services");
  // textContent: the quote section is off screen here, and content-visibility leaves innerText empty for it.
  const foot = await p.$eval("#quote .s9-foot", (e) => e.textContent.replace(/\s+/g, " ").trim());
  check(`${w}: office hours in the quote card`, foot.startsWith("Prefer WhatsApp? Monday to Friday, 9AM to 6PM") && foot.includes("Ask an accountant there"), foot.slice(0, 60));
  // The section clips overflow, so the sideways-scroll check cannot see a link running out of the card.
  await toQuote(p);
  const inCard = await p.evaluate(() => {
    const card = document.querySelector("#quote .s9-card").getBoundingClientRect();
    const a = document.querySelector("#quote .s9-wa").getBoundingClientRect();
    return a.left >= card.left && a.right <= card.right + 0.5;
  });
  check(`${w}: "Ask an accountant there" stays inside the card`, inCard);
  if (w < 900) {
    const hours = await p.evaluate(() => {
      const a = document.querySelector("#quote .s9-foot > span").getClientRects();
      const h = document.querySelector("#quote .s9-hours").getBoundingClientRect();
      const first = document.querySelector("#quote .s9-foot > span").getBoundingClientRect();
      return h.top > first.top + 5 && a.length >= 1;
    });
    check(`${w}: hours on their own line under "Prefer WhatsApp?"`, hours);
  }
  check(`${w}: footer says not affiliated with the Federal Tax Authority`, (await text(p, ".an-foot")).includes("We are not a government entity") && (await text(p, ".an-foot")).includes("We are not affiliated with the Federal Tax Authority."));
  await close(p);
}

// 4b. Section 5: the send items and sort lines pick their report too, not only the tabs.
for (const w of WIDTHS) {
  const p = await open(w);
  await p.$eval("#reports", (e) => e.scrollIntoView({ block: "start", behavior: "instant" }));
  await wait(300);
  const tab = () => p.$eval("#reports [role=tab][aria-selected=true]", (e) => e.innerText.trim());
  const clickIn = (sel, label) => p.$$eval(sel, (bs, l) => bs.find((x) => x.innerText.trim().startsWith(l))?.click(), label);
  await clickIn("#reports button.s5-it", "Supplier bills");
  await wait(200);
  check(`${w}: section 5 "Supplier bills" shows Balance sheet`, (await tab()) === "Balance sheet");
  await clickIn("#reports button.s5-sl", "Every invoice and bill recorded");
  await wait(200);
  const first = await tab();
  await clickIn("#reports button.s5-sl", "Every invoice and bill recorded");
  await wait(200);
  check(`${w}: section 5 shared sort line moves between its two reports`, first === "Profit and loss" && (await tab()) === "Cash flow", `${first} then ${await tab()}`);
  await wait(3200);
  check(`${w}: section 5 auto cycle stays stopped after a click`, (await tab()) === "Cash flow");
  await close(p);
}

// 5. axe at 390 and 1440, and screenshots of every section (reduced motion = final states).
for (const w of WIDTHS) {
  const p = await open(w, { reduced: true });
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await wait(500);
  await p.addScriptTag({ content: AXE });
  const v = await p.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] })).violations.map((x) => `${x.id} x${x.nodes.length}: ${x.nodes[0]?.target}`));
  check(`axe WCAG 2.1 AA at ${w}`, v.length === 0, v.join(" | "));
  if (SHOTS) {
    const secs = await p.$$(".an > header, main > section");
    for (const [i, s] of secs.entries()) await s.screenshot({ path: `${SHOTS}/page-${w}-${String(i).padStart(2, "0")}.png` });
  }
  await close(p);
}

await b.close();
console.log(failed ? `${failed} FAILED` : "ALL PASS");
process.exit(failed ? 1 : 0);
