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
async function open(width, api = "ok", { accept = true, warm = true } = {}) {
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
  // Like a visitor, scroll through once: below-the-fold sections hydrate when near the screen (LazySection).
  if (warm) {
    await p.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await wait(300);
  }
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
    check("plan button row visible under the wall", await p.evaluate(() => !!document.querySelector('[data-xs-cta="trust_plan"]')?.offsetParent && document.querySelector(".xs-trust-cta").textContent.includes("Join them.")));
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


// Live config (13 reviews): the moving wall at 1024 and 1440, 7 and 6 cards per row (plus the hidden copy), labels without a
// year, Michael's first; the plan button row under it.
for (const w of [1024, 1440]) {
  const p = await open(w);
  const r = await p.evaluate(() => {
    const rows = [...document.querySelectorAll("#xs-wall .xs-wall-row")].map((row) => row.querySelectorAll(".xs-wall-track > .xs-rcard").length);
    const labels = [...document.querySelectorAll("#xs-wall .xs-rby small")].map((s) => s.textContent);
    const cta = document.querySelector('[data-xs-cta="trust_plan"]'), note = cta?.nextElementSibling;
    return { rows, years: labels.filter((l) => /\d{4}/.test(l)).length, first: document.querySelector("#xs-wall .xs-rby b")?.textContent, cta: !!cta?.offsetParent, note: note?.offsetParent ? note.textContent : "" };
  });
  check(`13 reviews at ${w}px: the wall, 7 and 6 per row, no years, Michael first`, JSON.stringify(r.rows) === "[7,6]" && !r.years && r.first === "Michael D.", JSON.stringify(r));
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

// S3 "What's the difference?": inline in the card from 768 px (chip and link stay visible and clickable), a full row on
// phones; Escape closes it wherever focus is (also after a mouse open) and returns focus to the button.
for (const width of [390, 768, 1440]) {
  const p = await open(width);
  const btn = "#xs-explain-btn";
  await p.evaluate((s) => document.querySelector(s).scrollIntoView({ behavior: "instant", block: "start" }), btn);
  await wait(200);
  const below = () => p.evaluate(() => Math.round(document.querySelector(".xs-notsure").getBoundingClientRect().top));
  const y0 = await below();
  await p.click(btn);
  await wait(250);
  const r = await p.evaluate(() => {
    const card = document.querySelector("#xs-explain-btn").closest("article");
    const panel = [...document.querySelectorAll(".xs-explain-panel")].find((x) => x.offsetParent);
    const hit = (el) => { if (!el || !el.offsetParent) return "hidden"; el.scrollIntoView({ behavior: "instant", block: "center" }); const b = el.getBoundingClientRect(); const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return el.contains(top) ? "ok" : `covered by ${top?.className}`; };
    const chip = [...card.querySelectorAll("[data-xs-cta]")].find((x) => x.offsetParent);
    const link = [...card.querySelectorAll("a.xs-link")].find((x) => x.offsetParent);
    const grid = document.querySelector(".xs-bento").getBoundingClientRect();
    return { panel: panel?.className, inCard: card.contains(panel), panelW: Math.round(panel?.getBoundingClientRect().width ?? 0), gridW: Math.round(grid.width), chip: hit(chip), link: link ? hit(link) : "none", desc: [...card.querySelectorAll("p.d-only")].some((x) => x.offsetParent), over: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  const y1 = await below();
  const placed = width < 768 ? r.panel?.includes("is-row") && !r.inCard && Math.abs(r.panelW - r.gridW) <= 1 : r.panel?.includes("is-card") && r.inCard && !r.desc;
  check(`S3 explainer at ${width}px: ${width < 768 ? "full row under the tiles" : "inside the card, in place of the description"}, nothing covered`, placed && r.chip === "ok" && (width < 1024 || r.link === "ok") && r.over <= 0 && y1 > y0, JSON.stringify({ ...r, pushedDown: y1 - y0 }));
  await p.evaluate(() => document.activeElement?.blur());
  await p.keyboard.press("Escape");
  await wait(200);
  const k = await p.evaluate(() => ({ exp: document.getElementById("xs-explain-btn").getAttribute("aria-expanded"), focus: document.activeElement?.id, panels: [...document.querySelectorAll(".xs-explain-panel")].length }));
  check(`S3 explainer at ${width}px: Escape after a mouse open closes it and returns focus`, k.exp === "false" && k.focus === "xs-explain-btn" && k.panels === 0, JSON.stringify(k));
  await p.focus(btn);
  await p.keyboard.press("Enter");
  await wait(150);
  const kOpen = await p.$eval(btn, (b) => b.getAttribute("aria-expanded"));
  await p.keyboard.press("Escape");
  await wait(150);
  check(`S3 explainer at ${width}px: Enter opens, Escape closes`, kOpen === "true" && (await p.$eval(btn, (b) => b.getAttribute("aria-expanded"))) === "false");
  const ev = (await events(p, "xs_explainer_open")).filter((e) => e.location === "s3");
  check(`S3 explainer at ${width}px fires xs_explainer_open once per open`, ev.length === 2, String(ev.length));
  await p.done();
}

// S2: with 1 and 2 worries picked the answer card fits its content, and every answer row ends at opacity 1.
for (const width of [390, 1440]) {
  const p = await open(width);
  for (const n of [1, 2]) {
    await p.evaluate((n) => { const ws = [...document.querySelectorAll(".xs-worry")].filter((x) => x.offsetParent); ws.forEach((w) => w.getAttribute("aria-pressed") === "true" && w.click()); ws.slice(0, n).forEach((w) => w.click()); }, n);
    await wait(1900);
    const r = await p.evaluate(() => {
      const card = document.querySelector(".xs-answer"), lis = [...card.querySelectorAll("li")], foot = card.querySelector(".xs-answer-foot");
      return { rows: lis.length, gap: Math.round(foot.getBoundingClientRect().top - lis[lis.length - 1].getBoundingClientRect().bottom), opacity: lis.map((l) => getComputedStyle(l).opacity), bg: lis.map((l) => getComputedStyle(l).backgroundColor) };
    });
    check(`S2 with ${n} worr${n > 1 ? "ies" : "y"} at ${width}px: no empty gap, rows at full opacity after the glow`, r.rows === n && r.gap <= 48 && r.opacity.every((o) => o === "1") && r.bg.every((b) => b === "rgba(0, 0, 0, 0)" || b.endsWith(", 0)")), JSON.stringify(r));
  }
  await p.done();
}

// S9 intro: "Pick your topic…" with no earlier picks, "We've kept what you picked…" after one.
{
  const p = await open(390);
  const intro = () => p.$eval(".xs-s9-intro", (e) => e.textContent);
  const before = await intro();
  await p.evaluate(() => [...document.querySelectorAll(".xs-worry")].find((x) => x.offsetParent).click());
  await wait(200);
  const after = await intro();
  check("S9 intro switches with earlier picks", before === "Add your details. An advisor calls you, then sends your written plan." && after === "We've kept what you picked. Add your details. An advisor calls you, then sends your written plan.", `${before.slice(0, 25)} / ${after.slice(0, 25)}`);
  await p.done();
}


// S3 big card: the written-plan preview fills the spare height (24 to 48 px above the buttons) at 1024 and 1440; not on phones or tablets.
for (const width of [390, 768, 1024, 1440]) {
  const p = await open(width);
  const r = await p.evaluate(() => {
    const inset = document.querySelector(".xs-big-inset"), actions = document.querySelector(".xs-big-actions");
    const shown = !!inset?.offsetParent && getComputedStyle(inset).display !== "none";
    return { shown, gap: shown ? Math.round(actions.getBoundingClientRect().top - inset.getBoundingClientRect().bottom) : null, sheet: shown ? Math.round(document.querySelector(".xs-big-sheet").getBoundingClientRect().height) : null, over: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  const ok = width < 768 ? !r.shown : width < 1024 ? r.shown : r.shown && r.gap >= 24 && r.gap <= 48;
  check(`S3 plan preview at ${width}px: ${width < 768 ? "not shown" : width < 1024 ? "shown at a fixed height" : "fills the space, 24 to 48 px above the buttons"}`, ok && r.over <= 0, JSON.stringify(r));
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
  const qs = await p.$eval(".xs-qline", (e) => e.textContent);
  check("hero select shows in the plan's ABOUT row", about === "Corporate Tax", about);
  check("S2 picks show in YOUR QUESTIONS", qs === "Where do I begin? · Which price is right?", qs);
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
  check("plan names the first available advisor", await p.evaluate(() => /YOUR ADVISOR\s*(ADVISOR)?\s*First available advisor/.test(document.querySelector(".xs-paper").textContent)));
  // "Request a call back": reply by phone, keeps a picked topic, opens the plan pop-up.
  // After the reload, scroll to it like a visitor (Trust hydrates when near the screen).
  await p.evaluate(() => document.querySelector('[data-xs-cta="callback"]').scrollIntoView({ block: "center" }));
  await wait(500);
  await p.evaluate(() => document.querySelector('[data-xs-cta="callback"]').click());
  await wait(400);
  const cb =await p.evaluate(() => ({ call: document.querySelector("#xs-plan-dialog .xs-seg-form button:nth-child(2)").getAttribute("aria-pressed"), about: document.querySelector(".xs-about strong")?.textContent, picked: document.querySelector("#xsd-topic")?.selectedOptions[0]?.textContent, open: document.getElementById("xs-plan-dialog").open, focus: document.activeElement?.id }));
  check("call-back button: Call me, topic kept, pop-up open, name focused", cb.call === "true" && cb.about === "Corporate Tax" && cb.picked === "Corporate Tax" && cb.open && cb.focus === "xsd-name", JSON.stringify(cb));
  check("consultation_cta_click {cta_location: callback}", (await events(p, "consultation_cta_click")).some((e) => e.cta_location === "callback"));
  await p.done();
}

// 3. Every plan button opens the plan pop-up with the cursor in its first empty field; Escape closes it and focus goes
// back to the button. A name typed in the pop-up is also in the section 9 form (one shared form).
for (const w of [390, 1440]) {
  const p = await open(w);
  const ids = await p.$$eval("[data-xs-cta]", (bs) => bs.filter((x) => x.offsetParent && !x.closest(".xs-sticky") && !x.closest("dialog")).map((x) => x.getAttribute("data-xs-cta")));
  const bad = [];
  for (const id of ids) {
    const h = await p.evaluateHandle((id) => [...document.querySelectorAll(`[data-xs-cta="${id}"]`)].filter((x) => x.offsetParent && !x.closest("dialog"))[0], id);
    await h.evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "center" }));
    await h.focus();
    await h.evaluate((el) => el.click());
    await wait(350);
    const r = await p.evaluate(() => ({ open: document.getElementById("xs-plan-dialog").open, focus: document.activeElement?.id }));
    await p.keyboard.press("Escape");
    await wait(250);
    const back = await p.evaluate(() => ({ closed: !document.getElementById("xs-plan-dialog").open, focus: document.activeElement?.getAttribute("data-xs-cta") }));
    if (!r.open || r.focus !== "xsd-name" || !back.closed || back.focus !== id) bad.push(`${id}: ${JSON.stringify({ ...r, ...back })}`);
  }
  check(`${ids.length} plan buttons at ${w}px open the pop-up, focus the name field, Escape returns focus`, ids.length > 8 && !bad.length, bad.slice(0, 3).join("; "));
  await p.evaluate(() => document.querySelector("[data-xs-cta=hero_primary]").click());
  await wait(300);
  await p.type("#xsd-name", NAME);
  await p.keyboard.press("Escape");
  await p.evaluate(() => document.querySelector("[data-xs-cta=hero_primary]").click());
  await wait(300);
  const r2 = await p.evaluate(() => ({ focus: document.activeElement?.id, s9: document.getElementById("xs-name").value }));
  check(`at ${w}px a filled name moves focus to the next empty field, and shows in section 9 too`, r2.focus === "xsd-email" && r2.s9 === "TEST AUDIT - DELETE", JSON.stringify(r2));
  await p.mouse.click(5, 5);
  await wait(250);
  check(`at ${w}px a tap outside closes the pop-up`, await p.evaluate(() => !document.getElementById("xs-plan-dialog").open));
  const cta = await events(p, "consultation_cta_click");
  check(`consultation_cta_click {cta_location} at ${w}px, no xs_cta_click`, cta.length === ids.length + 2 && cta.every((e) => e.cta_location) && !(await events(p, "xs_cta_click")).length, String(cta.length));
  await p.done();
}

// Pop-up send (mocked): thank-you in the pop-up and in section 9, one generate_lead with form_location "popup".
{
  const p = await open(390);
  await p.evaluate(() => document.querySelector("[data-xs-cta=hero_primary]").click());
  await wait(300);
  for (const [id, v] of [["#xsd-name", NAME], ["#xsd-phone", PHONE], ["#xsd-email", EMAIL]]) await p.type(id, v);
  await p.evaluate(() => document.querySelector("#xs-plan-dialog form button[type=submit]").click());
  await wait(1200);
  const r = await p.evaluate(() => ({ dlg: /Thanks, TEST\./.test(document.getElementById("xsd-thanks")?.textContent || ""), s9: !!document.getElementById("xs-thanks"), stamp: !!document.querySelector(".xs-stamp") }));
  const gl = await events(p, "generate_lead");
  check("pop-up send: thank-you in the pop-up and section 9, stamp on the plan", r.dlg && r.s9 && r.stamp, JSON.stringify(r));
  check("pop-up send: one lead with form_location popup, one generate_lead", p.leads.length === 1 && p.leads[0].form_location === "popup" && gl.length === 1 && gl[0].form_location === "popup", JSON.stringify({ leads: p.leads.length, gl: gl.length }));
  await p.evaluate(AXE);
  const v = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } })).violations.map((x) => `${x.id}: ${x.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`));
  check("axe with the pop-up open (after a send): zero violations", !v.length, v.join(" ;; "));
  await p.done();
}
for (const w of [390, 1440]) {
  const p = await open(w);
  await p.evaluate(() => document.querySelector("[data-xs-cta=hero_primary]").click());
  await wait(400);
  await p.evaluate(AXE);
  const v = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } })).violations.map((x) => `${x.id}: ${x.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`));
  const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(`pop-up open at ${w}px: axe zero violations, no sideways scroll`, !v.length && over <= 0, v.join(" ;; "));
  await p.done();
}

// The pop-up's topic is the page topic (last set wins; with nothing picked, the hero card's default), and the lead sends it.
for (const [label, w, before, cta, want] of [
  ["hero, default value", 1440, null, "hero_primary", "new_company"],
  ["hero, changed value", 1440, (p) => p.select("#xs-hero-topic", "holding"), "hero_primary", "holding"],
  ["an S3 card", 1440, null, "s3_bookkeeping", "bookkeeping"],
  ["the sticky bar after an S5 pick", 390, (p) => p.evaluate(() => [...document.querySelectorAll(".xs-s5 .xs-tchip")].find((b) => b.textContent.trim() === "Corporate Tax").click()), "sticky_plan", "corporate_tax"],
]) {
  const p = await open(w);
  if (before) await before(p);
  await wait(200);
  await p.evaluate((id) => document.querySelector(`[data-xs-cta=${id}]`).click(), cta);
  await wait(400);
  const sel = await p.evaluate(() => {
    const s = document.getElementById("xsd-topic");
    return { value: s.value, text: s.selectedOptions[0]?.textContent, pick: [...s.options].some((o) => o.textContent === "Pick a topic") };
  });
  for (const [id, v] of [["#xsd-name", NAME], ["#xsd-email", EMAIL], ["#xsd-phone", PHONE]]) await p.type(id, v);
  await p.evaluate(() => document.querySelector("#xs-plan-dialog button[type=submit]").click());
  await wait(900);
  const sent = p.leads[0]?.topic;
  check(`pop-up from ${label}: shows ${want}, no "Pick a topic", the lead sends the same topic`, sel.value === want && !sel.pick && sent === want && p.leads.length === 1, JSON.stringify({ ...sel, sent }));
  await p.done();
}

// S9 is light and the footer navy (clearly apart); the country code shows "+971 UAE" in full.
for (const w of [320, 390, 768, 1440]) {
  const p = await open(w);
  const r = await p.evaluate(() => {
    const lum = (c) => {
      const [r, g, b] = c.match(/\d+(\.\d+)?/g).slice(0, 3).map((v) => +v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const s9 = getComputedStyle(document.getElementById("plan")).backgroundImage.match(/rgba?\([^)]+\)/g).at(-1);
    const foot = getComputedStyle(document.querySelector(".xs-footer")).backgroundColor;
    const sel = document.querySelector("#plan .xs-tel select");
    const cs = getComputedStyle(sel);
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const text = sel.selectedOptions[0].textContent;
    const room = sel.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    return { s9: lum(s9), foot: lum(foot), text, need: Math.ceil(ctx.measureText(text).width), room };
  });
  if (w !== 320) check(`S9 light and footer navy at ${w}px`, r.s9 > 0.8 && r.foot < 0.05, JSON.stringify(r));
  check(`country code "${r.text}" fits in full at ${w}px`, r.text === "+971 UAE" && r.need <= r.room, JSON.stringify(r));
  await p.done();
}

// The pop-up fits the screen with no scrolling inside it (a topic and three questions picked).
for (const [w, h] of [[375, 667], [390, 844], [768, 1024], [1024, 768], [1440, 900]]) {
  const p = await open(w);
  await p.setViewport({ width: w, height: h, isMobile: w < 768, hasTouch: w < 768 });
  await p.evaluate(() => sessionStorage.setItem("bsx_xs_state", JSON.stringify({ topic: "corporate_tax", worries: [0, 1, 2], advisor: null, contactPref: "whatsapp", consultMode: null })));
  await p.reload({ waitUntil: "load" });
  await wait(400);
  await p.evaluate(() => document.querySelector("[data-xs-cta=hero_primary]").click());
  await wait(500);
  const r = await p.evaluate(() => {
    const d = document.getElementById("xs-plan-dialog");
    return { sh: d.scrollHeight, ch: d.clientHeight, vh: innerHeight, bottom: Math.round(d.getBoundingClientRect().bottom) };
  });
  check(`pop-up at ${w}×${h} fits with no inner scroll`, r.sh <= r.ch + 1 && r.bottom <= r.vh + 1, JSON.stringify(r));
  await p.done();
}

// 4. Field errors.
{
  const p = await open(390);
  await submit(p);
  await wait(300);
  const errs = await p.$$eval("#plan .xs-err", (e) => e.map((x) => x.textContent));
  check("empty submit: name, number and email errors", JSON.stringify(errs) === JSON.stringify(["Please add your name.", "Please add your email.", "Please add your WhatsApp number."]), errs.join(" | "));
  check("errors linked with aria-describedby", await p.evaluate(() => ["xs-name", "xs-phone", "xs-email"].every((id) => document.getElementById(id).getAttribute("aria-describedby") === `${id}-err`)));
  for (const [id, v] of [["#xs-name", "T"], ["#xs-phone", "12"], ["#xs-email", "nope"]]) await p.type(id, v);
  await submit(p);
  await wait(300);
  const errs2 = await p.$$eval("#plan .xs-err", (e) => e.map((x) => x.textContent));
  check("invalid name, number and email errors, typed values kept", errs2.length === 3 && errs2[2].includes("United Arab Emirates") && (await p.$eval("#xs-name", (e) => e.value)) === "T", errs2.join(" | "));
  check("no lead sent while fields are wrong", p.leads.length === 0);
  // Site-wide names (AnalyticsInit, data-track): form_error per blocked submit with the field names, form_start once.
  const fe = await events(p, "form_error");
  check("form_error {form_id, error_fields} per blocked submit once the form is started", fe.length >= 1 && fe.every((e) => e.form_data?.form_id === "LP Services Plan" && /lead_name|mobile_no|email_id/.test(e.form_data?.error_fields || "")), JSON.stringify(fe.map((e) => e.form_data)));
  check("form_start once", (await events(p, "form_start")).length === 1);
  check("no xs_form_start / xs_form_error duplicates", !(await events(p, "xs_form_start")).length && !(await events(p, "xs_form_error")).length);
  await p.done();
}

// 5. Mocked success: stamp, thank-you, one generate_lead with the right parameters and no personal data.
{
  const p = await open(1440);
  await p.evaluate(() => [...document.querySelectorAll('[data-xs-cta="s3_bookkeeping"]')].find((x) => x.offsetParent).click());
  await wait(400);
  await p.keyboard.press("Escape"); // the button opened the pop-up; this test sends from the section 9 form
  await p.evaluate(() => document.querySelectorAll(".xs-seg-form button")[1].click());
  await fill(p);
  await submit(p);
  await wait(1200);
  const body = p.leads[0] || {};
  check("one lead sent with topic, contact_pref, form_location, page, UTMs", p.leads.length === 1 && body.topic === "bookkeeping" && body.contact_pref === "call" && body.form_location === "s9" && body.page === "/xservicesx" && body.utm_campaign === "TEST-AUDIT-DELETE" && body.mobile_no === "+971500000000" && body.email_id === EMAIL && body.bs_hp === "", JSON.stringify({ topic: body.topic, contact: body.contact_pref }));
  check("REQUEST SENT stamp and thank-you", await p.evaluate(() => !!document.querySelector(".xs-stamp") && /Thanks, TEST\./.test(document.querySelector(".xs-thanks")?.textContent || "") && /An advisor will call you/.test(document.querySelector(".xs-thanks").textContent)));
  const prep = await p.evaluate(() => ({ title: document.querySelector("#plan .xs-prep > span")?.textContent, items: [...document.querySelectorAll("#plan .xs-prep li")].map((l) => l.textContent), body: document.querySelector("#plan .xs-thanks p")?.textContent, wa: !!document.querySelector("#plan .xs-thanks-wa") }));
  check("thank-you: same-day line, the 3-item checklist, and WhatsApp us", prep.title === "Before your call, have these ready:" && JSON.stringify(prep.items) === JSON.stringify(["What you'll sell or offer", "Who your customers are, and where", "How many people will work with you"]) && /call you the same day, in office hours/.test(prep.body || "") && prep.wa, JSON.stringify(prep));
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

// 7. Sticky bar: walk the page in steps. It must never show while an in-page primary or dark button ([data-cta]) or the
// form is on screen; it must show somewhere mid-page; hidden in the hero and at the form. Above the cookie banner.
const sweep = async (p) =>
  p.evaluate(async () => {
    const bar = document.querySelector(".xs-sticky"), H = innerHeight, steps = [];
    const ctaOnScreen = () => [...document.querySelectorAll("[data-cta]")].filter((el) => !el.closest(".xs-sticky") && el.offsetParent).some((el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < H; });
    const planOnScreen = () => { const r = document.getElementById("plan").getBoundingClientRect(); return r.bottom > 0 && r.top < H; };
    for (let y = 0; y < document.documentElement.scrollHeight; y += Math.round(H / 3)) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 160));
      steps.push({ y, on: bar.classList.contains("is-on"), cta: ctaOnScreen(), plan: planOnScreen() });
    }
    return steps;
  });
for (const w of [390, 768]) {
  const p = await open(w);
  const steps = await sweep(p);
  const clash = steps.filter((s) => s.on && (s.cta || s.plan));
  const shownMid = steps.some((s) => s.on);
  check(`sticky bar at ${w}px: never with an in-page CTA or the form on screen, shown mid-page, hidden in the hero`, !clash.length && shownMid && !steps[0].on, `${clash.length} clashes at ${clash.map((s) => s.y).slice(0, 4)}; shown at ${steps.filter((s) => s.on).length} of ${steps.length} steps`);
  await p.done();
}
{
  const p = await open(390, "ok", { accept: false });
  const steps = await sweep(p);
  const y = steps.find((s) => s.on)?.y;
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
  await wait(900);
  const r = await p.evaluate(() => ({ on: document.querySelector(".xs-sticky").classList.contains("is-on"), bar: document.querySelector(".xs-sticky").getBoundingClientRect().bottom, banner: document.querySelector('[aria-labelledby="consent-title"]')?.getBoundingClientRect().top }));
  check("sticky bar sits above the cookie banner", r.on && r.banner && r.bar <= r.banner + 1, JSON.stringify(r));
  await p.done();
}
{
  const p = await open(1440);
  check("no sticky bar on laptop and desktop", await p.evaluate(() => getComputedStyle(document.querySelector(".xs-sticky")).display === "none"));
  await p.done();
}
// S4 document: hidden on phones, shown from 768. One disclaimer at the end of the page (the footer), none under the form.
for (const w of [390, 768, 1440]) {
  const p = await open(w);
  const r = await p.evaluate(() => ({ doc: !!document.querySelector(".xs-s4-stage")?.offsetParent, s9: (document.getElementById("plan").textContent.match(/not a government office/g) || []).length, foot: (document.querySelector("footer").textContent.match(/Not a government office/g) || []).length, hero: (document.querySelector(".xs-hero").textContent.match(/not a government office/g) || []).length }));
  check(`S4 document ${w < 768 ? "hidden" : "shown"} at ${w}px; disclaimer in hero and footer only`, r.doc === w >= 768 && r.s9 === 0 && r.foot === 1 && r.hero === 1, JSON.stringify(r));
  await p.done();
}

// 8. Every FAQ answer in the server HTML (no JavaScript), plus FAQPage JSON-LD.
{
  const html = (await (await fetch(BASE + PATH)).text()).replace(/&#x27;|&#39;/g, "'");
  const answers = [...html.matchAll(/<dd>([^<]+)<\/dd>/g)].map((m) => m[1]);
  check("all FAQ answers in the server HTML and FAQPage JSON-LD", answers.length >= 9 && html.includes('"@type":"FAQPage"') && answers.every((a) => html.includes(JSON.stringify(a).slice(1, 20))), `${answers.length} answers`);
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]).find((x) => x["@type"] === "FAQPage");
  const names = ld.mainEntity.map((q) => q.name);
  const added = ["What decides my cost?", "Can I do this from outside the UAE?", "What happens after I send the form?"];
  check("the new questions are in the server HTML and the JSON-LD; the languages one stays hidden", added.every((q) => names.includes(q) && html.includes(q)) && !html.includes("Which languages do you speak?"), names.join(" | "));
}

// S8 ask bar: the typed question opens wa.me with only that text (no name, number or email), whatsapp_click without the text.
{
  const p = await open(390);
  await p.evaluate(() => (window.open = (u) => ((window.__opened = window.__opened || []).push(u), null)));
  await p.evaluate(() => document.getElementById("xs-ask").scrollIntoView({ block: "center" }));
  await wait(400);
  await p.type("#xs-name", "TEST AUDIT - DELETE").catch(() => {});
  await p.type("#xs-ask", "How long for a holding? Reach me at test-audit@xerebo.com or +971 50 000 0000");
  await p.click(".xs-askbar .xs-send");
  await wait(200);
  await p.click("#xs-ask", { clickCount: 3 });
  await p.keyboard.press("Backspace");
  await p.click(".xs-askbar .xs-send");
  await wait(200);
  const opened = await p.evaluate(() => window.__opened || []);
  const text = opened[0] ? new URL(opened[0]).searchParams.get("text") : "";
  check("S8: send opens wa.me with \"Hi, my question: \" and the typed text, personal data dropped", opened[0]?.startsWith("https://wa.me/97145531546?text=") && text === "Hi, my question: How long for a holding? Reach me at or" && !/xerebo|0000|TEST AUDIT/.test(opened[0]), JSON.stringify(text));
  check("S8: empty send opens the topic message", opened[1]?.startsWith("https://wa.me/97145531546") && !/my question/.test(decodeURIComponent(opened[1] || "")), opened[1]);
  const wa = (await events(p, "whatsapp_click")).filter((e) => e.cta_location === "s8_ask");
  check("S8: whatsapp_click {cta_location: s8_ask, has_text} with no text content", wa.length === 2 && wa[0].has_text === true && wa[1].has_text === false && !JSON.stringify(wa).includes("holding"), JSON.stringify(wa.map((e) => e.has_text)));
  check("S8: the field takes at most 300 characters", (await p.$eval("#xs-ask", (e) => e.maxLength)) === 300);
  await p.done();
}

// No blue tick anywhere: the chat badge and the read ticks are copper (markup and every stylesheet).
{
  const p = await open(1440);
  const css = (await Promise.all((await p.$$eval('link[rel="stylesheet"]', (l) => l.map((x) => x.href))).map((h) => fetch(h).then((r) => r.text())))).join("");
  const html = await p.content();
  check("no blue tick anywhere (markup and CSS)", !/1D9BF0|34B7F1|1877F2|0095F6/i.test(css + html));
  await p.done();
}

// Page height at 390 (as laid out, content-visibility off): at least 20% under main's 9,395 px.
{
  const p = await open(390, "ok", { warm: false });
  const h = await p.evaluate(async () => {
    document.head.insertAdjacentHTML("beforeend", "<style>.xs *{content-visibility:visible!important}</style>");
    await new Promise((r) => setTimeout(r, 300));
    return document.documentElement.scrollHeight;
  });
  check("page height at 390 is 20% or more under main (9,395 px)", h <= 9395 * 0.8, `${h} px`);
  await p.done();
}

// 9. Copy policy on the rendered page (both widths' wording is in the DOM).
{
  const p = await open(1440);
  const t = await p.evaluate(() => {
    const c = document.body.cloneNode(true);
    c.querySelectorAll("script,style,noscript").forEach((e) => e.remove());
    const attrs = [...document.querySelectorAll("[alt],[aria-label],[placeholder],[title]")].flatMap((e) => ["alt", "aria-label", "placeholder", "title"].map((a) => e.getAttribute(a) || ""));
    const wa = [...document.querySelectorAll('a[href*="wa.me"]')].map((a) => new URL(a.href).searchParams.get("text") || "");
    return [c.textContent, ...attrs, ...wa, document.title, document.querySelector('meta[name="description"]').content].join(" | ");
  });
  // Reviews are scanned too: only "stress-free" (Hadi) and the brand name "best solution" are exempt.
  const allowed = t.replace(/stress-free/g, " ").replace(/best solution|best-solution\.ae/gi, " ").replace(/free zones?/gi, " ").replace(/We use cookies[^|]*/g, " ");
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
