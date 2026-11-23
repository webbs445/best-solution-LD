// /xservicesx browser checks. Every outside host is blocked and /api/services-plan is answered inside the browser
// (success or error, as each check needs), so nothing reaches the ERP or the lead sheet. Test data only.
// Checks: no sideways scroll at 320 to 1920; page state reaches the plan (hero topic, worries); every plan button
// scrolls to #plan and focuses the first empty field; field errors; a mocked success (stamp, thank-you, exactly one
// generate_lead with the right parameters and no name, number or email); a mocked error (message, no success);
// the sticky bar (hidden in the hero, shown mid-page, hidden at the form); every FAQ answer in the server HTML; the
// copy policy on the rendered page; axe (WCAG 2.1 AA) with zero violations at 390 and 1440.
// Usage: node scripts/qa/xservicesx.mjs [base] [fixture]. Fixture runs need a local build made with
// NEXT_PUBLIC_XS_FIXTURE=reviews3 (still row) or full (1 advisor, 8 reviews: S6 and the moving wall). Exit 1 on any failure.
import { readFileSync } from "node:fs";
import { BASE, blockTags, launch, wait } from "./common.mjs";

const PATH = "/xservicesx";
const NAME = "TEST AUDIT - DELETE", PHONE = "500000000", EMAIL = "test-audit@xerebo.com";
const AXE = readFileSync(new URL("../../node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
const b = await launch();
let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);
};

/** A fresh page at this width. api: "ok" | "error"; lead bodies are collected in page.leads. */
async function open(width, api = "ok", { accept = true } = {}) {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width, height: width < 768 ? 844 : 900, isMobile: width < 768, hasTouch: width < 768 });
  p.leads = [];
  await blockTags(p, (r) => {
    if (!r.url().startsWith(BASE) && !/^(data|blob):/.test(r.url())) return r.abort(), true;
    if (r.url().includes("/api/ad-landing")) return r.respond({ status: 204 }), true;
    if (r.method() === "POST" && r.url().includes("/api/services-plan")) {
      p.leads.push(JSON.parse(r.postData() || "{}"));
      return r.respond(api === "ok" ? { status: 200, contentType: "application/json", body: '{"ok":true,"created":true}' } : { status: 502, contentType: "application/json", body: '{"error":"upstream_failed"}' }), true;
    }
    return false;
  });
  await p.goto(`${BASE}${PATH}?utm_source=google&utm_campaign=TEST-AUDIT-DELETE`, { waitUntil: "networkidle2", timeout: 180000 });
  if (accept) await p.$$eval("button", (bs) => bs.find((x) => x.innerText.trim() === "Accept all")?.click());
  await wait(500);
  p.done = () => ctx.close();
  return p;
}
const events = (p, name) => p.evaluate((n) => (window.dataLayer || []).filter((d) => d && d.event === n), name);
const fill = async (p) => {
  for (const [id, v] of [["#xs-name", NAME], ["#xs-phone", PHONE], ["#xs-email", EMAIL]]) {
    await p.click(id, { clickCount: 3 });
    await p.type(id, v);
  }
};
const submit = (p) => p.evaluate(() => document.querySelector("#plan form button[type=submit]").click());

// Fixture builds (NEXT_PUBLIC_XS_FIXTURE=reviews3 or full, local only): node scripts/qa/xservicesx.mjs <base> <fixture>.
const FIX = process.argv[3] || "live";
if (FIX !== "live") {
  if (FIX === "reviews3") {
    const p = await open(1440);
    const r = await p.evaluate(() => ({ still: document.querySelectorAll(".xs-still .xs-rcard").length, wall: !!document.getElementById("xs-wall"), toggle: !!document.querySelector(".xs-wall-toggle") }));
    check("3 reviews: one still row of 3 cards, no moving wall, no pause button", r.still === 3 && !r.wall && !r.toggle, JSON.stringify(r));
    const cols = await p.evaluate(() => ({ cols: getComputedStyle(document.querySelector(".xs-still")).gridTemplateColumns.split(" ").length, clamped: [...document.querySelectorAll(".xs-still .xs-rtext")].some((t) => t.scrollHeight > t.clientHeight + 1) }));
    check("3 reviews: 3 equal columns, no text clamped", cols.cols === 3 && !cols.clamped, JSON.stringify(cols));
    await p.done();
  }
  if (FIX === "full") {
    const p = await open(1440);
    const s = await p.evaluate(() => ({ s6: !!document.getElementById("advisors"), office: !!document.querySelector(".xs-trustsec .xs-office-card"), rows: document.querySelectorAll("#xs-wall .xs-wall-row").length, cards: [...document.querySelectorAll("#xs-wall .xs-wall-row")].map((r) => r.querySelectorAll(".xs-wall-track > .xs-rcard").length), copies: [...document.querySelectorAll("#xs-wall .xs-wall-copy")].every((c) => c.getAttribute("aria-hidden") === "true") }));
    check("1 advisor: S6 returns and Trust drops its office card", s.s6 && !s.office, JSON.stringify(s));
    check("8 reviews: two-row wall, reviews split 4 and 4, loop copies aria-hidden", s.rows === 2 && s.cards.join() === "4,4" && s.copies, JSON.stringify(s));
    check("plan button row visible under the wall", await p.evaluate(() => !!document.querySelector('[data-xs-cta="trust_plan"]')?.offsetParent && document.querySelector(".xs-trust-cta").innerText.includes("Join them.")));
    const state = () => p.evaluate(() => [...document.querySelectorAll(".xs-wall-track")].map((t) => getComputedStyle(t).animationPlayState + ":" + getComputedStyle(t).animationName).join(" "));
    await p.evaluate(() => document.getElementById("xs-wall").scrollIntoView({ behavior: "instant", block: "center" }));
    await p.mouse.move(5, 5);
    await wait(300);
    const run1 = await state();
    const x1 = await p.evaluate(() => document.querySelector(".xs-wall-track").getBoundingClientRect().x);
    await wait(1200);
    const x2 = await p.evaluate(() => document.querySelector(".xs-wall-track").getBoundingClientRect().x);
    check("wall moves: row 1 left, row 2 right", run1 === "running:xsMarqL running:xsMarqR" && x2 < x1, `${run1} ${x1}->${x2}`);
    const box = await p.evaluate(() => { const r = document.getElementById("xs-wall").getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + 40 }; });
    await p.mouse.move(box.x, box.y);
    await wait(300);
    check("wall pauses on hover", (await state()).startsWith("paused") && !(await state()).includes("running"));
    await p.mouse.move(5, 5);
    await p.evaluate(() => document.querySelector("#xs-wall .xs-rcard").focus());
    await wait(300);
    check("wall pauses with focus inside", !(await state()).includes("running"));
    await p.evaluate(() => document.activeElement.blur());
    await p.click(".xs-wall-toggle");
    await wait(300);
    const lab = await p.$eval(".xs-wall-toggle", (b) => b.getAttribute("aria-label"));
    check("pause button stops the wall and offers Play", !(await state()).includes("running") && lab === "Play reviews", lab);
    await p.click(".xs-wall-toggle");
    await wait(300);
    check("play button starts it again", (await state()) === "running:xsMarqL running:xsMarqR");
    await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await wait(300);
    const rm = await p.evaluate(() => [...document.querySelectorAll(".xs-wall-row")].map((r) => getComputedStyle(r.querySelector(".xs-wall-track")).animationName + "/" + getComputedStyle(r).overflowX + "/" + getComputedStyle(r.querySelector(".xs-wall-copy")).display).join(" "));
    check("reduced motion: no animation, rows scroll by hand, no loop copy", rm === "none/auto/none none/auto/none", rm);
    await p.evaluate(AXE);
    await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    const v = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } })).violations.map((x) => `${x.id}: ${x.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`));
    check("axe with the wall and S6: zero violations", !v.length, v.join(" ;; "));
    await p.done();
    for (const w of [320, 390, 768, 1024, 1280, 1440, 1920]) {
      const q = await open(w);
      const over = await q.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`wall build: no sideways scroll at ${w}px`, over <= 0, `${over}px`);
      await q.done();
    }
  }
  await b.close();
  console.log(failed ? `\n${failed} FAIL` : "\nALL PASS");
  process.exit(failed ? 1 : 0);
}

// Live config: "Request a call back" with no topic picked files it as Not sure yet.
{
  const p = await open(390);
  await p.evaluate(() => document.querySelector('[data-xs-cta="callback"]').click());
  await wait(1600);
  check("call-back with no topic: Not sure yet, Call me", await p.evaluate(() => document.querySelector(".xs-about strong")?.textContent === "Not sure yet" && document.querySelectorAll(".xs-seg-form button")[1].getAttribute("aria-pressed") === "true"));
  await p.done();
}


// Live config (2 reviews): a still row of 2 equal columns across the full content width, every review in full;
// the plan button row under the office card at 1024 and 1440.
for (const w of [1024, 1440]) {
  const p = await open(w);
  const r = await p.evaluate(() => {
    const row = document.querySelector(".xs-still"), wrap = row.parentElement, cs = getComputedStyle(wrap);
    const inner = wrap.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const cards = [...row.querySelectorAll(".xs-rcard")].map((c) => Math.round(c.getBoundingClientRect().width));
    const clamped = [...row.querySelectorAll(".xs-rtext")].some((t) => t.scrollHeight > t.clientHeight + 1 || getComputedStyle(t).webkitLineClamp !== "none");
    const cta = document.querySelector('[data-xs-cta="trust_plan"]'), note = cta?.nextElementSibling;
    return { rowW: Math.round(row.getBoundingClientRect().width), inner: Math.round(inner), cards, clamped, cta: !!cta?.offsetParent, note: note?.offsetParent ? note.textContent : "" };
  });
  check(`2 reviews at ${w}px: 2 equal columns across the full width`, r.cards.length === 2 && Math.abs(r.rowW - r.inner) <= 1 && Math.abs(r.cards[0] - r.cards[1]) <= 1 && r.cards[0] > r.inner / 2 - 20, JSON.stringify(r));
  check(`2 reviews at ${w}px: no text clamped`, !r.clamped);
  check(`plan button row visible at ${w}px`, r.cta && r.note === "Join them. 2 minutes · no obligation", r.note);
  await p.done();
}

// S2: six worries, the beginner one first.
{
  const p = await open(390);
  const w = await p.$$eval(".xs-worry", (b) => b.map((x) => x.innerText.trim()));
  check("S2 has 6 worries, the beginner one first", w.length === 6 && w[0] === "I've never done this before. Where do I begin?", w[0]);
  await p.done();
}

// S3 "What's the difference?": opens and closes by click and keyboard; no other card moves; no sideways scroll.
for (const width of [390, 1440]) {
  const p = await open(width);
  const btn = ".xs-explain-btn";
  await p.evaluate((s) => document.querySelector(s).scrollIntoView({ behavior: "instant", block: "center" }), btn);
  await wait(200);
  const rects = () => p.evaluate(() => [...document.querySelectorAll(".xs-bento > article, .xs-notsure")].filter((c) => !c.querySelector(".xs-explain")).map((c) => { const r = c.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)].join(","); }).join(" "));
  const before = await rects();
  await p.click(btn);
  await wait(200);
  const open1 = await p.evaluate((s) => ({ exp: document.querySelector(s).getAttribute("aria-expanded"), shown: !document.querySelector(".xs-explain-panel").hidden, over: document.documentElement.scrollWidth - document.documentElement.clientWidth, text: document.querySelector(".xs-explain-panel").innerText }), btn);
  const after = await rects();
  check(`S3 explainer opens by click at ${width}px with no layout jump or sideways scroll`, open1.exp === "true" && open1.shown && open1.over <= 0 && before === after && open1.text.includes("We'll tell you in writing."), JSON.stringify({ ...open1, text: undefined, moved: before !== after }));
  await p.click(btn);
  await wait(150);
  check(`S3 explainer closes by click at ${width}px`, (await p.$eval(btn, (b) => b.getAttribute("aria-expanded"))) === "false");
  await p.focus(btn);
  await p.keyboard.press("Enter");
  await wait(150);
  const kOpen = await p.$eval(btn, (b) => b.getAttribute("aria-expanded"));
  await p.keyboard.press("Escape");
  await wait(150);
  const k = await p.evaluate((s) => ({ exp: document.querySelector(s).getAttribute("aria-expanded"), focus: document.activeElement === document.querySelector(s) }), btn);
  check(`S3 explainer by keyboard at ${width}px: Enter opens, Escape closes and returns focus`, kOpen === "true" && k.exp === "false" && k.focus);
  const ev = (await events(p, "xs_cta_click")).filter((e) => e.cta_id === "fz_explainer" && e.location === "s3");
  check(`S3 explainer fires xs_cta_click fz_explainer once per open at ${width}px`, ev.length === 2, String(ev.length));
  await p.done();
}

// Trust swipe row: the first card starts at the page gutter and the last card ends with it.
for (const [width, gut] of [[390, 20], [768, 32]]) {
  const p = await open(width);
  const r = await p.evaluate(async () => {
    const rail = document.querySelector(".xs-swipe");
    rail.scrollIntoView({ behavior: "instant", block: "center" });
    const cards = rail.querySelectorAll(".xs-rcard");
    const first = Math.round(cards[0].getBoundingClientRect().left);
    rail.scrollTo({ left: rail.scrollWidth, behavior: "instant" });
    await new Promise((res) => setTimeout(res, 300));
    const last = Math.round(document.documentElement.clientWidth - cards[cards.length - 1].getBoundingClientRect().right);
    return { first, last };
  });
  check(`Trust swipe row at ${width}px starts and ends at the ${gut}px gutter`, Math.abs(r.first - gut) <= 1 && Math.abs(r.last - gut) <= 1, JSON.stringify(r));
  await p.done();
}

// Nothing covers section headings, eyebrows or ledes on phones (sticky bar, skip link, header, banner).
for (const width of [320, 375, 390, 430]) {
  const p = await open(width);
  const hits = await p.evaluate(async () => {
    const out = [];
    for (const el of document.querySelectorAll("main h2, main .xs-eyebrow, main .xs-lede, main .xs-head p, main .xs-trust-head p")) {
      if (!el.offsetParent) continue;
      const y = el.getBoundingClientRect().top + scrollY;
      window.scrollTo({ top: y - 160, behavior: "instant" });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const b = el.getBoundingClientRect();
      for (const [x, yy] of [[b.left + 4, b.top + b.height / 2], [b.left + b.width / 2, b.top + b.height / 2], [b.right - 4, b.top + b.height / 2]]) {
        const top = document.elementFromPoint(x, yy);
        if (top && !el.contains(top) && !top.contains(el)) out.push(`${el.textContent.trim().slice(0, 30)} under ${top.className || top.tagName}`);
      }
    }
    return [...new Set(out)];
  });
  check(`nothing covers section headings at ${width}px`, !hits.length, hits.slice(0, 4).join("; "));
  await p.done();
}
// 1. No sideways scroll.
for (const w of [320, 375, 390, 414, 768, 1024, 1280, 1440, 1920]) {
  const p = await open(w);
  const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(`no sideways scroll at ${w}px`, over <= 0, `${over}px`);
  await p.done();
}

// 2. Page state reaches the plan: hero topic, S2 worries, advisor choice, reply method.
{
  const p = await open(1440);
  await p.select(".xs-hcard select", "corporate_tax");
  await p.evaluate(() => [...document.querySelectorAll(".xs-worry")].filter((x) => x.offsetParent).slice(0, 2).forEach((x) => x.click()));
  await wait(300);
  const about = await p.$eval(".xs-about strong", (e) => e.textContent);
  const qs = await p.$$eval(".xs-qtags span", (s) => s.map((x) => x.textContent));
  check("hero select shows in the plan's ABOUT row", about === "Corporate Tax", about);
  check("S2 picks show in YOUR QUESTIONS", JSON.stringify(qs) === JSON.stringify(["Where do I begin?", "Which price is right?"]), qs.join(", "));
  const topicEv = await events(p, "xs_topic_select");
  check("xs_topic_select {topic, source: hero}", topicEv.some((e) => e.topic === "corporate_tax" && e.source === "hero"));
  const worryEv = await events(p, "xs_worry_toggle");
  check("xs_worry_toggle {worry_id, on, count}", worryEv.length === 2 && worryEv[1].count === 2 && worryEv[1].on === true);
  // The state survives a reload (sessionStorage).
  await p.reload({ waitUntil: "networkidle2" });
  await wait(400);
  check("page state survives a reload", (await p.$eval(".xs-about strong", (e) => e.textContent)) === "Corporate Tax");
  // No advisors yet: S6 is left out, Trust shows with its office card, and the plan names the first available advisor.
  check("live config: Trust shown, S6 and S7 gone", await p.evaluate(() => !!document.querySelector("#reviews.xs-trustsec .xs-office-card") && !document.getElementById("advisors") && !document.querySelector(".xs-s7")));
  check("plan names the first available advisor", await p.evaluate(() => /YOUR ADVISOR\s*First available advisor/.test(document.querySelector(".xs-paper").innerText)));
  // "Request a call back": reply by phone, keeps a picked topic, to the form.
  await p.evaluate(() => document.querySelector('[data-xs-cta="callback"]').click());
  await wait(1600);
  const cb = await p.evaluate(() => ({ call: document.querySelectorAll(".xs-seg-form button")[1].getAttribute("aria-pressed"), about: document.querySelector(".xs-about strong")?.textContent, focus: document.activeElement?.id, top: Math.round(document.getElementById("plan").getBoundingClientRect().top) }));
  check("call-back button: Call me, topic kept, scrolled to #plan, name focused", cb.call === "true" && cb.about === "Corporate Tax" && cb.focus === "xs-name" && Math.abs(cb.top) <= 4, JSON.stringify(cb));
  check("xs_cta_click {cta_id: callback, location: trust}", (await events(p, "xs_cta_click")).some((e) => e.cta_id === "callback" && e.location === "trust"));
  await p.done();
}

// 3. Every plan button scrolls to #plan and focuses the first empty field (then the next empty one).
for (const w of [390, 1440]) {
  const p = await open(w);
  const ids = await p.$$eval("[data-xs-cta]", (bs) => bs.filter((x) => x.offsetParent && !x.closest(".xs-sticky")).map((x) => x.getAttribute("data-xs-cta")));
  const bad = [];
  for (const id of ids) {
    await p.evaluate(() => window.scrollTo(0, 0));
    await wait(150);
    await p.evaluate((id) => [...document.querySelectorAll(`[data-xs-cta="${id}"]`)].filter((x) => x.offsetParent)[0]?.click(), id);
    await wait(1600);
    const r = await p.evaluate(() => ({ focus: document.activeElement?.id, top: Math.round(document.getElementById("plan").getBoundingClientRect().top) }));
    if (r.focus !== "xs-name" || Math.abs(r.top) > 4) bad.push(`${id}: focus ${r.focus}, #plan top ${r.top}`);
  }
  check(`${ids.length} plan buttons at ${w}px scroll to #plan and focus the name field`, ids.length > 8 && !bad.length, bad.join("; "));
  await p.type("#xs-name", NAME);
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.evaluate(() => document.querySelector("[data-xs-cta=hero_primary]").click());
  await wait(1600);
  check(`at ${w}px a filled name moves focus to the next empty field`, (await p.evaluate(() => document.activeElement?.id)) === "xs-phone");
  const cta = await events(p, "xs_cta_click");
  check(`xs_cta_click {cta_id, location} at ${w}px`, cta.length === ids.length + 1 && cta.every((e) => e.cta_id && e.location));
  await p.done();
}

// 4. Field errors.
{
  const p = await open(390);
  await submit(p);
  await wait(300);
  const errs = await p.$$eval(".xs-err", (e) => e.map((x) => x.textContent));
  check("empty submit: name, number and email errors", JSON.stringify(errs) === JSON.stringify(["Please add your name.", "Please add your WhatsApp number.", "Please add your email."]), errs.join(" | "));
  check("errors linked with aria-describedby", await p.evaluate(() => ["xs-name", "xs-phone", "xs-email"].every((id) => document.getElementById(id).getAttribute("aria-describedby") === `${id}-err`)));
  for (const [id, v] of [["#xs-name", "T"], ["#xs-phone", "12"], ["#xs-email", "nope"]]) await p.type(id, v);
  await submit(p);
  await wait(300);
  const errs2 = await p.$$eval(".xs-err", (e) => e.map((x) => x.textContent));
  check("invalid name, number and email errors, typed values kept", errs2.length === 3 && errs2[1].includes("United Arab Emirates") && (await p.$eval("#xs-name", (e) => e.value)) === "T", errs2.join(" | "));
  check("no lead sent while fields are wrong", p.leads.length === 0);
  const fe = await events(p, "xs_form_error");
  check("xs_form_error {field} per bad field", fe.length === 6 && fe.every((e) => ["name", "phone", "email"].includes(e.field)));
  check("xs_form_start once", (await events(p, "xs_form_start")).length === 1);
  await p.done();
}

// 5. Mocked success: stamp, thank-you, one generate_lead with the right parameters and no personal data.
{
  const p = await open(1440);
  await p.evaluate(() => [...document.querySelectorAll('[data-xs-cta="s3_bookkeeping"]')].find((x) => x.offsetParent).click());
  await wait(900);
  await p.evaluate(() => document.querySelectorAll(".xs-seg-form button")[1].click());
  await fill(p);
  await submit(p);
  await wait(1200);
  const body = p.leads[0] || {};
  check("one lead sent with topic, contact_pref, form_location, page, UTMs", p.leads.length === 1 && body.topic === "bookkeeping" && body.contact_pref === "call" && body.form_location === "s9" && body.page === "/xservicesx" && body.utm_campaign === "TEST-AUDIT-DELETE" && body.mobile_no === "+971500000000" && body.email_id === EMAIL && body.bs_hp === "", JSON.stringify({ topic: body.topic, contact: body.contact_pref }));
  check("REQUEST SENT stamp and thank-you", await p.evaluate(() => !!document.querySelector(".xs-stamp") && /Thanks, TEST\./.test(document.querySelector(".xs-thanks")?.textContent || "") && /An advisor will call you/.test(document.querySelector(".xs-thanks").textContent)));
  check("progress ring at 100% and green", await p.evaluate(() => document.querySelector(".xs-ring b").textContent === "100%" && document.querySelectorAll(".xs-ring circle")[1].getAttribute("stroke") === "#1F6B45"));
  await submit(p).catch(() => {});
  await wait(500);
  const gl = await events(p, "generate_lead");
  check("generate_lead exactly once", gl.length === 1, String(gl.length));
  check("generate_lead {topic, contact_pref, form_location: s9, page: /xservicesx}", gl[0]?.topic === "bookkeeping" && gl[0]?.contact_pref === "call" && gl[0]?.form_location === "s9" && gl[0]?.page === "/xservicesx");
  const dl = JSON.stringify(await p.evaluate(() => window.dataLayer));
  check("no name, number or email anywhere in the dataLayer", !dl.includes("TEST AUDIT") && !dl.includes(EMAIL) && !dl.includes("500000000"));
  check("one form_submit with lead_conversion_eligible and the evt_ id sent to the ERP", (await events(p, "form_submit")).filter((e) => e.form_data?.lead_conversion_eligible && e.event_id === body.event_id).length === 1);
  await p.done();
}

// 6. Mocked server error: the message, never the success state.
{
  const p = await open(390, "error");
  await fill(p);
  await submit(p);
  await wait(1200);
  check("server error shows the message and a WhatsApp link", await p.evaluate(() => /Something went wrong\. Please try again, or message us on WhatsApp/.test(document.querySelector(".xs-err-send")?.textContent || "") && !!document.querySelector('.xs-err-send a[href*="wa.me"]')));
  check("server error: no stamp, no thank-you, no generate_lead", (await p.evaluate(() => !document.querySelector(".xs-stamp, .xs-thanks"))) && (await events(p, "generate_lead")).length === 0);
  check("server error keeps what was typed", (await p.$eval("#xs-email", (e) => e.value)) === EMAIL);
  await p.done();
}

// 7. Sticky bar: hidden in the hero, shown mid-page, hidden at the form. Above the cookie banner while it shows.
for (const w of [390, 768]) {
  const p = await open(w);
  const shown = () => p.evaluate(() => document.querySelector(".xs-sticky").classList.contains("is-on"));
  const at = async (sel) => (await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "start" }), sel), wait(700));
  const hero = await shown();
  await at(".xs-s4");
  const mid = await shown();
  await at("#plan");
  const form = await shown();
  check(`sticky bar at ${w}px: hidden in hero, shown mid-page, hidden at the form`, !hero && mid && !form, `${hero}/${mid}/${form}`);
  await p.done();
}
{
  const p = await open(390, "ok", { accept: false });
  await p.evaluate(() => document.querySelector(".xs-s4").scrollIntoView());
  await wait(900);
  const r = await p.evaluate(() => ({ bar: document.querySelector(".xs-sticky").getBoundingClientRect().bottom, banner: document.querySelector('[aria-labelledby="consent-title"]')?.getBoundingClientRect().top }));
  check("sticky bar sits above the cookie banner", r.banner && r.bar <= r.banner + 1, JSON.stringify(r));
  await p.done();
}
{
  const p = await open(1440);
  check("no sticky bar on laptop and desktop", await p.evaluate(() => getComputedStyle(document.querySelector(".xs-sticky")).display === "none"));
  await p.done();
}

// 8. Every FAQ answer in the server HTML (no JavaScript), plus FAQPage JSON-LD.
{
  const html = (await (await fetch(BASE + PATH)).text()).replace(/&#x27;|&#39;/g, "'");
  const answers = [...html.matchAll(/<dd>([^<]+)<\/dd>/g)].map((m) => m[1]);
  check("all six FAQ answers in the server HTML and FAQPage JSON-LD", answers.length >= 6 && html.includes('"@type":"FAQPage"') && answers.every((a) => html.includes(JSON.stringify(a).slice(1, 20))), `${answers.length} answers`);
}

// 9. Copy policy on the rendered page (both widths' wording is in the DOM).
{
  const p = await open(1440);
  const t = await p.evaluate(() => {
    const c = document.body.cloneNode(true);
    c.querySelectorAll("script,style,noscript,[data-review-quote]").forEach((e) => e.remove());
    const attrs = [...document.querySelectorAll("[alt],[aria-label],[placeholder],[title]")].flatMap((e) => ["alt", "aria-label", "placeholder", "title"].map((a) => e.getAttribute(a) || ""));
    const wa = [...document.querySelectorAll('a[href*="wa.me"]')].map((a) => new URL(a.href).searchParams.get("text") || "");
    return [c.textContent, ...attrs, ...wa, document.title, document.querySelector('meta[name="description"]').content].join(" | ");
  });
  const allowed = t.replace(/best solution|best-solution\.ae/gi, " ").replace(/free zones?/gi, " ").replace(/We use cookies[^|]*/g, " ");
  const re = /\b(set[\s-]?up|startups?|start|starting|open|register|registration|licen[cs]e|visas?|permits?|approval|approved|documents?|formation|fast|faster|instant|quick|guarantee[sd]?|best|cheapest|lowest|launch|transparent|free|renew|renewal|official|trade name|incorporation)\b|100\s?%|no hidden fees|®|#1\b|\b(DED|PRO)\b|[[\]]|—/gi;
  const hits = [...allowed.matchAll(re)].map((m) => `"${m[0]}" ...${allowed.slice(Math.max(0, m.index - 30), m.index + 30)}...`);
  check("copy policy on the rendered page (banned words, brackets, em dashes)", !hits.length, hits.slice(0, 5).join(" ;; "));
  await p.done();
}

// 10. axe, WCAG 2.1 A and AA, at 390 and 1440 (plus the success state at 390).
for (const w of [390, 1440]) {
  const p = await open(w);
  await p.evaluate(() => document.querySelector(".xs-s5").scrollIntoView());
  await wait(600);
  await p.evaluate(AXE);
  const run = () => p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } })).violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`));
  const v = await run();
  check(`axe at ${w}px: zero violations`, !v.length, v.join(" ;; "));
  if (w === 390) {
    await fill(p);
    await submit(p);
    await wait(1200);
    const v2 = await run();
    check("axe after a successful send: zero violations", !v2.length, v2.join(" ;; "));
  }
  await p.done();
}

await b.close();
console.log(failed ? `\n${failed} FAIL` : "\nALL PASS");
process.exit(failed ? 1 : 0);
