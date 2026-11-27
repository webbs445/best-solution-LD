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
const WIDTHS = [360, 390, 1024, 1440, 1920];
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
async function open(width, { api = "ok", reduced = false, consent = true } = {}) {
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
  // Accept cookies: wait for the banner (it renders after hydration, later in WebKit), then retry until it is gone.
  if (consent) await p.waitForSelector("#consent-title", { timeout: 8000 }).catch(() => {});
  for (let i = 0; consent && i < 20 && (await p.$("#consent-title")); i++) {
    await p.$$eval("button", (bs) => bs.find((x) => x.innerText.trim() === "Accept all")?.click());
    await wait(250);
  }
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
    return { fs: dlx.find((e) => e?.event === "form_submit")?.user_data, gl: dlx.find((e) => e?.event === "generate_lead")?.user_data, svc: dlx.find((e) => e?.event === "generate_lead")?.service, need: dlx.find((e) => e?.event === "acc_quote_submit")?.need };
  });
  check(
    `${w}: form_submit carries user_data (email, E.164 phone, names)`,
    ud.fs?.email === EMAIL && ud.fs?.phone === "+971500000000" && ud.fs?.first_name === "TEST" && ud.fs?.last_name === "AUDIT - DELETE",
    JSON.stringify(ud.fs ? Object.keys(ud.fs) : null),
  );
  check(`${w}: generate_lead carries user_data (email, phone)`, ud.gl?.email === EMAIL && ud.gl?.phone_number === "+971500000000");
  check(`${w}: generate_lead service is the mapped CRM key; the need label is on acc_quote_submit`, ud.svc === "bookkeeping" && ud.need === "Catch up on past months", `${ud.svc} / ${ud.need}`);
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
  const rows = await p.$$eval("#services .s1b-row", (rs) => rs.map((r) => [r.querySelector(".s1b-pick").textContent.trim(), getComputedStyle(r).opacity]));
  check(`${w}: services rows hidden before view, all 7 shown after`, /^0+$/.test(before) && rows.length === 7 && rows.every(([, o]) => o === "1"), `${before} -> ${rows.map((r) => r[1]).join("")}`);
  if (SHOTS) await (await p.$("#services")).screenshot({ path: `${SHOTS}/services-${w}.png` });
  const hl = await p.evaluate(() => {
    const h = document.querySelector("#s1b-h"), r = document.createRange();
    r.selectNodeContents(h.querySelector("b"));
    const bLines = new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size;
    // Words per line across the whole heading, to catch a word left alone.
    const lines = {};
    const walk = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
    for (let n; (n = walk.nextNode()); )
      for (const m of n.textContent.matchAll(/\S+/g)) {
        const wr = document.createRange();
        wr.setStart(n, m.index);
        wr.setEnd(n, m.index + m[0].length);
        const t = Math.round(wr.getBoundingClientRect().top);
        lines[t] = (lines[t] || 0) + 1;
      }
    return { bLines, alone: Object.values(lines).filter((c) => c === 1).length, fs: getComputedStyle(h).fontSize };
  });
  if (w >= 1024) check(`${w}: "or let us run it all." on one line`, hl.bLines === 1, `${hl.bLines} lines at ${hl.fs}`);
  check(`${w}: What we do headline leaves no word alone on a line`, hl.alone === 0, `${hl.alone} at ${hl.fs}`);
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
  // The pop-up's code loads on the first click: wait for it before closing.
  await p.waitForSelector("dialog.an-dlg[open]", { timeout: 15000 }).catch(() => {});
  await p.keyboard.press("Escape");
  await wait(400);
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

// 4c. Section 6: example boxes, the step 1 link, and month tags on one line inside their tiles; the services top line.
for (const w of [360, 390, 1024, 1440, 1920]) {
  const p = await open(w);
  await p.$eval("#how", (e) => e.scrollIntoView({ block: "start", behavior: "instant" }));
  await wait(400);
  const s6 = await p.evaluate(() => {
    const tags = [...document.querySelectorAll("#how .s6-tag")].map((t) => {
      const r = t.getBoundingClientRect(), tile = t.closest(".s6-m").getBoundingClientRect();
      return { one: t.getClientRects().length === 1 && r.height < parseFloat(getComputedStyle(t).fontSize) * 2, inside: r.left >= tile.left && r.right <= tile.right + 0.5, size: getComputedStyle(t).fontSize };
    });
    const scenes = [...document.querySelectorAll("#how .s6-scene")];
    return {
      tags,
      labels: scenes.filter((s) => s.querySelector(".s6-ex")?.textContent === "Example").length,
      plain: scenes.filter((s) => !s.classList.contains("s6-live")).every((s) => getComputedStyle(s).cursor === "default" && getComputedStyle(s).borderTopStyle === "dashed"),
      live: document.querySelectorAll("#how .s6-scene.s6-live").length,
      tileH: Math.round(document.querySelector("#how .s6-m").getBoundingClientRect().height),
      link: document.querySelector("#how .s6-link")?.getAttribute("href"),
      linkText: document.querySelector("#how .s6-link")?.textContent.trim(),
      line: getComputedStyle(document.querySelector("#services")).borderTop,
      tagText: [...document.querySelectorAll("#how .s6-tag")].map((t) => t.textContent).join(),
      key: document.querySelector("#how .s6-key")?.textContent,
      keyStyle: [document.querySelector("#how .s6-key"), document.querySelector("#how .s6-exy")].map((e) => e && getComputedStyle(e).color + " " + getComputedStyle(e).fontSize),
      cols: getComputedStyle(document.querySelector("#how .s6-months")).gridTemplateColumns.split(" ").length,
      // Empty navy under the key line (the card stretches to the steps' height when side by side).
      blank: Math.round(document.querySelector("#how .s6-four").getBoundingClientRect().bottom - document.querySelector("#how .s6-key").getBoundingClientRect().bottom - parseFloat(getComputedStyle(document.querySelector("#how .s6-four")).paddingBottom)),
      // Side by side (1240 and up): how far the navy card's bottom is from the steps' bottom; -1 when stacked.
      gap: (() => {
        const f = document.querySelector("#how .s6-four").getBoundingClientRect(), st = document.querySelector("#how .s6-st").getBoundingClientRect();
        return st.top < f.bottom && f.top < st.bottom ? Math.round(Math.abs(f.bottom - st.bottom)) : -1;
      })(),
    };
  });
  check(`${w}: section 6 tags 11px, one line, inside their tiles`, s6.tags.length === 5 && s6.tags.every((t) => t.one && t.inside && t.size === "11px"), JSON.stringify(s6.tags.filter((t) => !(t.one && t.inside))));
  check(`${w}: section 6: step 2 stays a dashed "Example"; steps 1 and 3 are real`, s6.labels === 1 && s6.plain && s6.live === 2, JSON.stringify({ labels: s6.labels, live: s6.live }));
  check(`${w}: tags read VAT and CT`, s6.tagText === "VAT,VAT,VAT,CT,VAT", s6.tagText);
  check(`${w}: key line under the grid, same muted style as "Example year"`, s6.key === "VAT: VAT return filed · CT: Corporate Tax return filed" && s6.keyStyle[0] === s6.keyStyle[1], s6.keyStyle.join(" / "));
  check(`${w}: ${w < 900 ? 4 : 6} months a row`, s6.cols === (w < 900 ? 4 : 6), String(s6.cols));
  if (s6.gap >= 0) check(`${w}: navy card ends level with steps 1 to 3`, s6.gap <= 24, `${s6.gap}px`);
  if (s6.gap >= 0) check(`${w}: no big empty space inside the navy card`, s6.blank <= 48, `${s6.blank}px`);
  const spill = await p.$$eval("#how .s6-m > *", (cs) => cs.filter((c) => c.scrollWidth > c.clientWidth + 1 || c.getBoundingClientRect().right > c.parentElement.getBoundingClientRect().right + 0.5).length);
  check(`${w}: nothing spills out of a month tile`, spill === 0, String(spill));
  check(`${w}: month tiles taller (70px+)`, s6.tileH >= 70, `${s6.tileH}px`);
  check(`${w}: services top line 1px #E9DFD5`, s6.line.startsWith("1px solid rgb(233, 223, 213)"), s6.line);
  await p.$eval("#how .s6-link", (a) => {
    a.addEventListener("click", (e) => e.preventDefault(), { once: true });
    a.click();
  });
  const cta = await p.evaluate(() => (window.dataLayer || []).filter((e) => e?.event === "acc_cta_click").at(-1));
  check(`${w}: "Tell us about your books →" goes to #quote with acc_cta_click section 6`, s6.link === "#quote" && s6.linkText === "Tell us about your books →" && cta?.section === 6);
  // The pop-up's code loads on the first click: wait for it before closing.
  await p.waitForSelector("dialog.an-dlg[open]", { timeout: 15000 }).catch(() => {});
  await p.keyboard.press("Escape");
  await wait(400);
  if (SHOTS && [390, 1024, 1440].includes(w)) {
    // Let the year fill in (steps, then twelve months) so the tags show.
    await p.$eval("#how .s6-four", (e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
    await wait(10000);
    await (await p.$("#how")).screenshot({ path: `${SHOTS}/s6-${w}.png` });
    const dec = await p.$eval("#how .s6-m:last-child", (m) => m.className);
    check(`${w}: December settles to the finished-month look`, dec === "s6-m done", dec);
  }
  if (SHOTS && [390, 1440].includes(w)) {
    // The hero-to-services join: the bottom of the hero band and the top of the services section.
    const y = await p.$eval("#services", (e) => e.getBoundingClientRect().top + window.scrollY);
    await p.evaluate((top) => window.scrollTo(0, top - 260), y);
    await wait(400);
    await p.screenshot({ path: `${SHOTS}/join-${w}.png` });
  }
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
  await p.$eval("#s5-tab-1", (x) => x.click());
  await wait(300);
  const bank = await p.$$eval("#s5-panel-1 .s5-ln", (ls) => ls.map((l) => [...l.children].map((c) => c.textContent.trim()).join(": ")).join(" | "));
  check(`${w}: bank page shows its 4 rows`, bank === "Bank accounts: 3 | Bank lines this month: 142 | Matched to a record: 142 | Closing difference: 0.00", bank);
  if (SHOTS && (w === 390 || w === 1440)) await (await p.$("#reports")).screenshot({ path: `${SHOTS}/s5-bank-${w}.png` });
  await p.$eval("#reviews", (e) => e.scrollIntoView({ block: "start", behavior: "instant" }));
  await wait(1500);
  const s7 = await p.evaluate(() => {
    const el = (s) => document.querySelector(s), R = (s) => el(s).getBoundingClientRect();
    const cs = getComputedStyle(el("#reviews .s7-hq")), hq = R("#reviews .s7-hq");
    return {
      above: Math.round(R("#reviews .s7-mark").top - hq.top - parseFloat(cs.paddingTop)),
      below: Math.round(R("#reviews .s7-cap").top - R("#reviews .s7-qt").bottom - parseFloat(cs.rowGap)),
      h: Math.round(hq.height),
      side: Math.round(R("#reviews .s7-side").height),
    };
  });
  if (w >= 900) check(`${w}: Hadi card as tall as the right column, quote centred above the name row`, s7.h === s7.side && Math.abs(s7.above - s7.below) <= 4, JSON.stringify(s7));
  if (SHOTS && (w === 390 || w === 1440)) await (await p.$("#reviews")).screenshot({ path: `${SHOTS}/s7-${w}.png` });
  await close(p);
}

// 4d. Header (the /services style: sticky, floating once scrolled) and the phone bottom bar: the bar shows after the
// hero and hides over the quote section, while the cookie banner shows and while a field has focus; the header button
// hides over the quote section; no layout shift; menu links land below the header.
const to = (p, top) => p.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), top);
const sticky = (p) =>
  p.evaluate(() => {
    const h = document.querySelector(".an-hd"), hb = document.querySelector(".an-hd-bar"), btn = document.querySelector(".an-hd-cta"), bar = document.querySelector(".an-bar");
    const br = bar.getBoundingClientRect();
    return {
      floating: h.classList.contains("is-scrolled") && Math.round(hb.getBoundingClientRect().top) <= 12 && getComputedStyle(h).position === "sticky",
      btn: getComputedStyle(btn).display !== "none" && getComputedStyle(btn).visibility === "visible",
      btnH: Math.round(btn.getBoundingClientRect().height),
      bar: getComputedStyle(bar).display !== "none" && getComputedStyle(bar).visibility === "visible" && br.bottom <= innerHeight + 0.5 && br.top < innerHeight,
      heroTop: document.querySelector(".an section.s1").getBoundingClientRect().top + window.scrollY,
      logo: !!document.querySelector(".an-hd-logo img[alt='Best Solution']"),
      sw: document.documentElement.scrollWidth - innerWidth,
    };
  });
const lastCta = (p) => p.evaluate(() => (window.dataLayer || []).filter((e) => e?.event === "acc_cta_click").at(-1)?.section);
const dlgOpen = (p) => p.evaluate(() => !!document.querySelector("dialog.an-dlg")?.open);
const escape = async (p) => {
  // The pop-up's code loads on the first click: wait for it before closing.
  await p.waitForSelector("dialog.an-dlg[open]", { timeout: 15000 }).catch(() => {});
  await p.keyboard.press("Escape");
  await wait(400);
};
const clickNoNav = (p, sel) =>
  p.$eval(sel, (a) => {
    a.addEventListener("click", (e) => e.preventDefault(), { once: true });
    a.click();
  });
for (const w of [360, 390, 1024, 1440, 1920]) {
  const desk = w >= 900;
  const p = await open(w);
  const top = await sticky(p);
  const heroBottom = await p.$eval(".an section.s1", (e) => e.getBoundingClientRect().bottom + window.scrollY);
  const how = await p.$eval("#how", (e) => e.getBoundingClientRect().top + window.scrollY);
  check(`${w}: at the top, header on the hero (not floating), logo image, no bottom bar`, !top.floating && top.logo && !top.bar);
  if (desk) check(`${w}: header quote button shown (44px+)`, top.btn && top.btnH >= 44, `${top.btnH}px`);
  await to(p, heroBottom + 200);
  await wait(500);
  const past = await sticky(p);
  check(`${w}: after scrolling, the header floats at the top`, past.floating);
  if (desk) {
    check(`${w}: after the hero, header quote button shown`, past.btn);
    check(`${w}: no bottom bar from 900px`, !past.bar);
  } else {
    check(`${w}: after the hero, bottom bar shown`, past.bar);
    const parts = await p.evaluate(() => {
      const q = document.querySelector(".an-bar-q"), wa = document.querySelector(".an-bar-w"), r = wa.getBoundingClientRect();
      return { qHref: q.getAttribute("href"), qText: q.textContent.trim(), wa: [Math.round(r.width), Math.round(r.height)].join("x"), label: wa.getAttribute("aria-label"), waHref: wa.getAttribute("href"), qLeft: q.getBoundingClientRect().right <= r.left };
    });
    check(`${w}: bar = "Get my quote" left, 52px WhatsApp square right`, parts.qHref === "#quote" && parts.qText === "Get my quote" && parts.wa === "52x52" && parts.label === "WhatsApp" && /^https:\/\/wa\.me\//.test(parts.waHref) && parts.qLeft, JSON.stringify({ ...parts, waHref: parts.waHref?.slice(0, 16) }));
    const foot = await p.$eval(".an-foot", (e) => parseFloat(getComputedStyle(e).paddingBottom));
    check(`${w}: footer bottom padding clears the bar`, foot >= 32 + 72, `${foot}px`);
  }
  check(`${w}: no layout shift when the header floats or the bar appears (hero stays put)`, Math.abs(past.heroTop - top.heroTop) < 0.5, `${top.heroTop} -> ${past.heroTop}`);
  check(`${w}: no sideways scroll with the header/bar showing`, past.sw <= 0, `${past.sw}px`);
  if (!PW) {
    const cls = await p.evaluate(() => window.__cls);
    check(`${w}: CLS after scrolling past the hero under 0.05`, cls < 0.05, cls.toFixed(4));
  }
  // Tracking: fixed values only. These buttons open the quote pop-up; Escape closes it again.
  if (desk) {
    await clickNoNav(p, ".an-hd-cta");
    await wait(600);
    check(`${w}: header button opens the pop-up and sends acc_cta_click "header"`, (await lastCta(p)) === "header" && (await dlgOpen(p)));
    await escape(p);
  } else {
    await clickNoNav(p, ".an-bar-q");
    await wait(600);
    const a = await lastCta(p);
    const opened = await dlgOpen(p);
    await escape(p);
    await clickNoNav(p, ".an-bar-w");
    check(`${w}: bar opens the pop-up; sends "sticky_quote" and "sticky_whatsapp"`, opened && a === "sticky_quote" && (await lastCta(p)) === "sticky_whatsapp");
  }
  // A field with focus hides the bar. The quote fields sit inside the quote section (which hides the bar
  // anyway), so a stand-in field outside it tests the focus rule on its own.
  if (!desk) {
    await to(p, how);
    await wait(400);
    await p.evaluate(() => {
      const i = Object.assign(document.createElement("input"), { id: "qa-field" });
      i.setAttribute("aria-label", "QA");
      document.querySelector("#how").append(i);
      i.focus({ preventScroll: true });
    });
    await wait(400);
    check(`${w}: bar hidden while a field has focus`, !(await sticky(p)).bar);
    await p.evaluate(() => document.getElementById("qa-field").remove());
    await wait(400);
    check(`${w}: bar back after the field loses focus`, (await sticky(p)).bar);
  }
  // Over the quote section.
  await toQuote(p);
  await wait(400);
  const q = await sticky(p);
  if (desk) check(`${w}: header button hidden while the quote section is on screen`, !q.btn && q.floating);
  else check(`${w}: bar hidden while the quote section is on screen`, !q.bar);
  await to(p, how);
  await wait(400);
  check(`${w}: shown again after leaving the quote section`, desk ? (await sticky(p)).btn : (await sticky(p)).bar);
  if (SHOTS && (w === 390 || w === 1440)) {
    await to(p, how - 40);
    await wait(2000);
    await p.screenshot({ path: `${SHOTS}/sticky-${w}.png` });
    await to(p, 0);
    await wait(600);
    await p.screenshot({ path: `${SHOTS}/header-top-${w}.png`, clip: { x: 0, y: 0, width: w, height: 120 } });
  }
  // Menu links: each heading lands below the header.
  const land = [];
  for (const id of ["services", "how", "reports", "reviews", "questions"]) {
    await to(p, 0);
    await wait(200);
    if (await p.$eval(".an-hd-menu", (e) => getComputedStyle(e).display !== "none")) {
      await p.$eval(".an-hd-menu", (d) => d.setAttribute("open", ""));
      await p.$eval(`.an-hd-panel a[href="#${id}"]`, (a) => a.click());
    } else await p.$eval(`.an-hd-nav a[href="#${id}"]`, (a) => a.click());
    await wait(1800);
    land.push(
      await p.evaluate((i) => {
        const h = document.querySelector(`#${i} h2`).getBoundingClientRect();
        const cover = document.querySelector(".an-hd-bar").getBoundingClientRect().bottom;
        return { i, ok: h.top >= cover - 1 && h.top < innerHeight / 2, top: Math.round(h.top), cover: Math.round(cover) };
      }, id),
    );
  }
  check(`${w}: menu links land each heading below the header`, land.every((l) => l.ok), JSON.stringify(land.filter((l) => !l.ok)));
  await close(p);

  // The cookie banner hides the bar while it shows.
  if (!desk) {
    const c = await open(w, { consent: false });
    const hb = await c.$eval(".an section.s1", (e) => e.getBoundingClientRect().bottom + window.scrollY);
    await to(c, hb + 200);
    await wait(500);
    const shown = await c.evaluate(() => !!document.getElementById("consent-title"));
    check(`${w}: bar hidden while the cookie banner shows`, shown && !(await sticky(c)).bar, `banner ${shown}`);
    await c.$$eval("button", (bs) => bs.find((x) => x.innerText.trim() === "Accept all")?.click());
    await wait(500);
    check(`${w}: bar shown once the banner is closed`, (await sticky(c)).bar);
    await close(c);
  }
}

// 4e. The quote pop-up: opened only by a click, its code loaded on first open, filled with what each section's
// answers prove, starting at the first open question; phone sheet behaviour; one conversion per lead.
const dlg = (p) =>
  p.evaluate(() => {
    const d = document.querySelector("dialog.an-dlg");
    if (!d?.open) return { open: false };
    const r = d.getBoundingClientRect();
    return {
      open: true,
      head: d.querySelector(".s9-lab")?.textContent.trim(),
      step: d.querySelector(".s9-sl b")?.textContent,
      focusIn: d.contains(document.activeElement),
      focus: document.activeElement?.textContent?.trim().slice(0, 40),
      picked: [...d.querySelectorAll(".s9-c[aria-pressed='true'], .s9-c[aria-checked='true']")].map((b) => b.textContent.trim()),
      svc: d.querySelector(".an-dlg-svc")?.textContent.trim() || "",
      title: d.querySelector("#an-d-title")?.textContent.replace(/\s+/g, " ").trim(),
      full: Math.abs(r.width - innerWidth) < 1 && Math.abs(r.height - (window.visualViewport?.height ?? innerHeight)) < 2,
      locked: getComputedStyle(document.documentElement).overflow === "hidden",
    };
  });
const openFrom = async (p, sel, scroll = sel) => {
  await p.$eval(scroll, (e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
  await wait(300);
  await p.$eval(sel, (e) => e.click());
  await p.waitForSelector("dialog.an-dlg[open]", { timeout: 15000 }).catch(() => {});
  await wait(500);
  return dlg(p);
};
for (const w of [360, 390, 1024, 1440, 1920]) {
  const shots = SHOTS && (w === 390 || w === 1440);
  const p = await open(w);
  // Never on its own: walk the whole page and wait; no pop-up, and its code is not loaded.
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 80));
    }
  });
  await p.mouse.move(w / 2, 5);
  await wait(3000);
  const early = await p.evaluate(() => ({ dlg: !!document.querySelector("dialog.an-dlg"), css: [...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => r.selectorText?.includes(".an-dlg")); } catch { return false; } }) }));
  check(`${w}: no pop-up and no pop-up code before a click (scroll, wait, mouse to the top)`, !early.dlg && !early.css, JSON.stringify(early));

  // Hero: step 1, focus on its heading; Escape closes and focus returns to the button.
  let d = await openFrom(p, ".s1-btn1");
  check(`${w}: hero opens the pop-up at step 1 with focus on its heading`, d.title === "Next month, know your numbers." && d.open && d.head === "What do you need most?" && d.focus === "What do you need most?", JSON.stringify(d));
  if (w < 900) check(`${w}: phone pop-up is a full-screen sheet and locks the page scroll`, d.full && d.locked, JSON.stringify({ full: d.full, locked: d.locked }));
  // Focus stays inside.
  let inside = true;
  for (let i = 0; i < 25; i++) {
    await p.keyboard.press("Tab");
    inside = inside && (await p.evaluate(() => document.querySelector("dialog.an-dlg").contains(document.activeElement)));
  }
  check(`${w}: Tab stays inside the pop-up`, inside);
  if (shots) await p.screenshot({ path: `${SHOTS}/pop-hero-${w}.png` });
  await escape(p);
  check(`${w}: Escape closes it and focus returns to the hero button`, !(await dlgOpen(p)) && (await p.evaluate(() => document.activeElement?.classList.contains("s1-btn1"))) && !(await p.evaluate(() => getComputedStyle(document.documentElement).overflow === "hidden")));
  const opens = await p.evaluate(() => (window.dataLayer || []).filter((e) => e?.event === "acc_quote_open").map((e) => e.source));
  check(`${w}: acc_quote_open source "1"`, opens.join() === "1", opens.join());

  // What we do: VAT returns + Corporate Tax return settle the need, so it starts at step 2 and lists them.
  await p.$eval("#services .s1b-sheet", (e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
  await wait(1500);
  for (const s of ["VAT returns", "Corporate Tax return"]) await p.$$eval("#services .s1b-pick", (bs, l) => bs.find((b) => b.textContent.trim() === l).click(), s);
  await wait(200);
  const ticks = await p.$$eval("#services .s1b-pick[aria-pressed='true']", (bs) => bs.map((b) => b.textContent.trim()).join());
  check(`${w}: services rows tick (aria-pressed)`, ticks === "VAT returns,Corporate Tax return", ticks);
  d = await openFrom(p, "#services .s1b-btn");
  check(`${w}: What we do opens at step 2 with the need settled and the services listed`, d.step === "2" && d.svc === "VAT returns · Corporate Tax return" && d.title === "Your quote for these 2 services.", JSON.stringify(d));
  if (shots) await p.screenshot({ path: `${SHOTS}/pop-services-${w}.png` });
  await p.$eval("dialog.an-dlg .s9-back", (b) => b.click());
  await wait(300);
  check(`${w}: Back shows the need it settled`, (await dlg(p)).picked.join() === "File my VAT or Corporate Tax", (await dlg(p)).picked.join());
  await escape(p);
  // Close and reopen keeps the answers and the step.
  d = await openFrom(p, "#services .s1b-btn");
  check(`${w}: reopening keeps the answers`, d.picked.join() === "File my VAT or Corporate Tax" || d.step === "2", JSON.stringify(d));
  await escape(p);
  await close(p);

  // Books check: "updated every month: Yes" fills "Up to date" only; "No" fills nothing.
  for (const first of ["Yes", "No"]) {
    const c = await open(w);
    await c.$eval("#check", (e) => e.scrollIntoView({ block: "start", behavior: "instant" }));
    await wait(600);
    // Answer lines 01 to 05 one at a time (each click re-renders): the first as given, the rest No.
    for (let k = 0; k < 5; k++) {
      await c.$$eval("#check .s3-bx", (bs, a) => bs.filter((x) => x.getAttribute("aria-label").endsWith(": " + a.v))[a.k].click(), { k, v: k === 0 ? first : "No" });
      await wait(120);
    }
    await wait(500);
    const has = await c.$("#check .s3-btn1");
    d = has ? await openFrom(c, "#check .s3-btn1") : { open: false };
    if (first === "Yes") {
      check(`${w}: books check Yes opens at step 1 (need unknown), header shows the result`, d.title === "Your result: At risk." && d.open && d.step === "1", JSON.stringify(d));
      await c.$$eval("dialog.an-dlg .s9-c", (bs) => bs.find((b) => b.textContent.trim() === "Not sure yet").click());
      await c.$eval("dialog.an-dlg .s9-next", (b) => b.click());
      await wait(400);
      const p2 = await dlg(c);
      check(`${w}: ...and step 2 shows "Up to date" picked, nothing else`, p2.step === "2" && p2.picked.join() === "Up to date", p2.picked.join());
      if (shots) await c.screenshot({ path: `${SHOTS}/pop-check-${w}.png` });
    } else {
      await c.$$eval("dialog.an-dlg .s9-c", (bs) => bs.find((b) => b.textContent.trim() === "Not sure yet").click());
      await c.$eval("dialog.an-dlg .s9-next", (b) => b.click());
      await wait(400);
      const p2 = await dlg(c);
      check(`${w}: books check No fills nothing (step 2 asks every row)`, d.open && p2.step === "2" && p2.picked.length === 0, JSON.stringify({ d: d.step, picked: p2.picked }));
    }
    await close(c);
  }

  // Section 6: the step 1 pickers, then the link opens at step 1; after the need it goes straight to the details.
  const s = await open(w);
  await s.$eval("#how", (e) => e.scrollIntoView({ block: "start", behavior: "instant" }));
  await wait(600);
  const opts = await s.$$eval("#how .s6-pick select", (ss) => ss.map((x) => [...x.options].slice(1).map((o) => o.value)));
  check(
    `${w}: section 6 pickers use the quote form's exact options`,
    JSON.stringify(opts) === JSON.stringify([["Under 50", "50 to 200", "200 to 500", "500+", "Not sure"], ["Up to date", "1 to 3 months behind", "3+ months behind", "No books yet", "Not sure"], ["Zoho Books", "QuickBooks", "Tally", "Excel", "None yet", "Not sure"]]),
    JSON.stringify(opts),
  );
  const sel = (i, v) => s.evaluate(({ i, v }) => {
    const x = document.querySelectorAll("#how .s6-pick select")[i];
    x.value = v;
    x.dispatchEvent(new Event("change", { bubbles: true }));
  }, { i, v });
  await sel(0, "50 to 200");
  await sel(1, "1 to 3 months behind");
  await sel(2, "Zoho Books");
  await wait(200);
  d = await openFrom(s, "#how .s6-link");
  check(`${w}: section 6 link opens at step 1 (the need is still open)`, d.title === "Tell us about your books." && d.step === "1", JSON.stringify(d));
  await s.$$eval("dialog.an-dlg .s9-c", (bs) => bs.find((b) => b.textContent.trim() === "Keep my books every month").click());
  await s.$eval("dialog.an-dlg .s9-next", (b) => b.click());
  await wait(400);
  check(`${w}: ...then straight to the contact step (book rows already answered)`, (await dlg(s)).step === "3");
  if (shots) await s.screenshot({ path: `${SHOTS}/pop-s6-${w}.png` });
  await escape(s);
  d = await openFrom(s, "#how .s6-opt[data-need='Catch up on past months']");
  check(`${w}: section 6 "A catch-up on past months" fills that need and opens at the contact step`, d.title === "We take over: a catch-up on past months." && d.step === "3", JSON.stringify(d));
  await s.$eval("dialog.an-dlg .s9-back", (b) => b.click());
  await wait(300);
  await s.$eval("dialog.an-dlg .s9-back", (b) => b.click());
  await wait(300);
  check(`${w}: ...and its need is "Catch up on past months"`, (await dlg(s)).picked.join() === "Catch up on past months", (await dlg(s)).picked.join());
  // Phone: the back gesture closes the sheet and stays on the page.
  if (w < 900) {
    await (PW ? s.goBack({ waitUntil: "commit" }).catch(() => {}) : s.goBack({ timeout: 3000 }).catch(() => {}));
    await wait(600);
    check(`${w}: back gesture closes the sheet, not the page`, !(await dlgOpen(s)) && s.url().includes("/accounting-new"), s.url());
  }
  await close(s);

  // Conversions: open from two places, submit once (double-click), one lead, one form_submit, one generate_lead,
  // form_submit's event_id = the lead's event_id; the source only on the acc_* events.
  const c = await open(w);
  await openFrom(c, ".s1-btn1");
  await escape(c);
  await openFrom(c, "#services .s1b-btn");
  await c.$$eval("dialog.an-dlg .s9-c", (bs) => bs.find((b) => b.textContent.trim() === "Catch up on past months")?.click());
  await c.$eval("dialog.an-dlg .s9-next", (b) => b.click());
  await wait(300);
  for (const [row, label] of [[0, "50 to 200"], [1, "Excel"], [2, "1 to 3 months behind"]])
    await c.$$eval("dialog.an-dlg .s9-chips.s", (rows, a) => [...rows[a.row].querySelectorAll("button")].find((x) => x.textContent.trim() === a.label).click(), { row, label });
  await c.$eval("dialog.an-dlg .s9-next", (b) => b.click());
  await wait(300);
  await c.type("#an-d-name", NAME);
  await c.type("#an-d-phone", PHONE);
  await c.type("#an-d-email", EMAIL);
  await c.$eval("dialog.an-dlg .s9-next", (b) => {
    b.click();
    b.click();
  });
  await c.waitForSelector("dialog.an-dlg .s9-done", { timeout: 10000 }).catch(() => {});
  await wait(800);
  const conv = await c.evaluate(() => {
    const dl = window.dataLayer || [];
    const fsx = dl.filter((e) => e?.event === "form_submit"), gl = dl.filter((e) => e?.event === "generate_lead"), sub = dl.filter((e) => e?.event === "acc_quote_submit");
    return { fs: fsx.length, gl: gl.length, eid: fsx[0]?.event_id, sub: sub.map((e) => e.source).join(), srcOnConv: [...fsx, ...gl].some((e) => "source" in e) };
  });
  const lead = c.leads[0] || {};
  check(`${w}: CONVERSION opened from 2 places, submitted once: 1 lead, 1 form_submit, 1 generate_lead`, c.leads.length === 1 && conv.fs === 1 && conv.gl === 1, JSON.stringify({ leads: c.leads.length, ...conv }));
  check(`${w}: CONVERSION form_submit event_id = the ERP lead's event_id`, !!conv.eid && conv.eid === lead.event_id);
  check(`${w}: CONVERSION source only on acc_quote_submit ("services"), not on the conversions`, conv.sub === "services" && !conv.srcOnConv, JSON.stringify(conv));
  // The quote section shows the same sent state: no second lead from there.
  check(`${w}: the quote section shows "Request received." too (one shared lead)`, (await c.$eval("#quote", (e) => e.textContent)).includes("Request received."));
  if (w === 390 || w === 1440) {
    await c.addScriptTag({ content: AXE });
    await escape(c);
    await openFrom(c, ".s1-btn1");
    const v = await c.evaluate(async () => (await window.axe.run(document.querySelector("dialog.an-dlg"), { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] })).violations.map((x) => `${x.id} x${x.nodes.length}: ${x.nodes[0]?.target}`));
    check(`${w}: axe on the open pop-up`, v.length === 0, v.join(" | "));
  }
  await close(c);
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
