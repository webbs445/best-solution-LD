// Consent defaults by region, the banner, and enhanced conversions. Every outside host is blocked (GTM, Google, Meta
// never load); lead APIs and /api/geo are answered inside the test browser, so nothing reaches the ERP. The consent
// state is worked out from the page's own gtag('consent', ...) commands the way Google applies them (a region default
// for the visitor's country wins over the general one; updates on top). Meta and Clarity are stand-ins that record
// what the page tells them. Test data only (TEST AUDIT - DELETE).
// Usage: node scripts/qa/consent.mjs [base] [screenshot dir]
import { BASE, blockTags, launch, wait } from "./common.mjs";

const SHOTS = process.argv[3] || "";
const NAME = "TEST AUDIT - DELETE", PHONE = "+971500000000", EMAIL = "test-audit@xerebo.com";
const KEYS = ["ad_storage", "analytics_storage", "ad_user_data", "ad_personalization"];
const TEXT_ON = "We use cookies with Google and Meta to measure visits and our ads. If you continue without choosing, they stay on. You can reject them now, or any time in Cookie Settings.";
const TEXT_OPT_IN = "We use cookies with Google and Meta to measure visits and our ads. Choose Accept all or Reject all.";
const GEO = { AE: { eu: false, country: "AE" }, DE: { eu: true, country: "DE" } };
const b = await launch();
let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);
};

/** A page for a visitor from `country`, in a context that keeps cookies across reloads. */
async function visit(ctx, country, path, width = 1440) {
  const p = await ctx.newPage();
  await p.setViewport({ width, height: 900, isMobile: width < 768, hasTouch: width < 768 });
  p.api = [];
  await blockTags(p, (r) => {
    const url = r.url();
    if (!url.startsWith(BASE) && !/^(data|blob):/.test(url)) return r.abort(), true;
    if (url.includes("/api/geo")) return r.respond({ status: 200, contentType: "application/json", body: JSON.stringify(GEO[country]) }), true;
    if (url.includes("/api/ad-landing")) return r.respond({ status: 204 }), true;
    if (r.method() === "POST" && /\/api\//.test(url)) {
      p.api.push(JSON.parse(r.postData() || "{}"));
      return r.respond({ status: 200, contentType: "application/json", body: '{"ok":true,"created":true}' }), true;
    }
    return false;
  });
  // Meta's pixel never loads here: a stand-in records the consent calls the page makes.
  await p.evaluateOnNewDocument(() => {
    window.__fbq = [];
    window.fbq = (...a) => window.__fbq.push(a);
  });
  await p.goto(BASE + path + "?utm_source=google&utm_campaign=TEST-AUDIT-DELETE", { waitUntil: "networkidle2", timeout: 180000 });
  await wait(800);
  return p;
}

/** Consent as Google resolves it for this country, from the dataLayer's gtag commands. */
const consentState = (p, country) =>
  p.evaluate((c) => {
    const cmds = (window.dataLayer || []).filter((e) => e && typeof e === "object" && "length" in e && e[0] === "consent").map((e) => [...e]);
    const defaults = cmds.filter((x) => x[1] === "default").map((x) => x[2]);
    const regional = defaults.find((d) => Array.isArray(d.region) && d.region.includes(c));
    const general = defaults.find((d) => !d.region);
    const s = { ...general, ...regional };
    cmds.filter((x) => x[1] === "update").forEach((x) => Object.assign(s, x[2]));
    // The first two dataLayer entries must be the two defaults: nothing can be read before them.
    const dl = window.dataLayer;
    const first = [0, 1].every((i) => dl[i] && "length" in dl[i] && dl[i][0] === "consent" && dl[i][1] === "default");
    return { s, first };
  }, country);
const all = (s, v) => KEYS.every((k) => s[k] === v);
const banner = (p) => p.evaluate(() => {
  const t = document.getElementById("consent-title")?.closest("[role=region]");
  if (!t) return null;
  const btn = (l) => [...t.querySelectorAll("button")].find((x) => x.textContent.trim() === l);
  const [a, r] = [btn("Accept all"), btn("Reject all")];
  const box = (e) => { const b = e.getBoundingClientRect(), cs = getComputedStyle(e); return [Math.round(b.width), Math.round(b.height), e.className, cs.backgroundColor, cs.color, cs.fontSize, cs.fontWeight, cs.borderRadius].join("|"); };
  return {
    text: t.querySelector("p")?.textContent.replace(/\s+/g, " ").trim(),
    same: !!a && !!r && box(a) === box(r),
    privacy: !!t.querySelector("a[href='/privacy']"),
    manage: [...t.querySelectorAll("button")].some((x) => x.getAttribute("aria-label") === "Manage preferences"),
  };
});
const click = (p, label) => p.$$eval("button", (bs, l) => bs.find((x) => x.textContent.trim() === l)?.click(), label);
const fbq = (p) => p.evaluate(() => window.__fbq.filter((a) => a[0] === "consent").map((a) => a[1]));
const clarityOn = (p) => p.evaluate(() => !!window.__bsClarityOk);

// Forms (mocked API): the accounting quote form and the /services plan form.
const type = async (p, sel, v) => {
  await p.waitForSelector(sel, { visible: true, timeout: 15000 });
  await p.click(sel, { clickCount: 3 });
  await p.type(sel, v);
};
const FORMS = {
  accounting: {
    path: "/accounting",
    async submit(p) {
      await p.evaluate(() => document.getElementById("contact").scrollIntoView());
      await wait(600);
      await p.click("#leadForm .pane.on .tiles label");
      await wait(1200);
      for (const n of ["volume", "software", "state"]) await p.evaluate((x) => document.querySelector(`#leadForm .pane.on input[name=${x}]`)?.closest("label")?.click(), n);
      await p.click("#leadForm button[type=submit]");
      await wait(1000);
      await type(p, "#f-name", NAME);
      await type(p, "#f-phone", PHONE);
      await type(p, "#f-email", EMAIL);
      await p.evaluate(() => document.querySelector("#leadForm button[type=submit]").click());
    },
  },
  services: {
    path: "/services",
    async submit(p) {
      await type(p, "#xs-name", NAME);
      await type(p, "#xs-phone", "050 000 0000");
      await type(p, "#xs-email", EMAIL);
      await p.evaluate(() => document.querySelector("#plan form button[type=submit]").click());
    },
  },
};
/** form_submit / generate_lead after one submit: user_data as pushed, and the event ids. */
async function conversions(p) {
  await wait(3000);
  return p.evaluate(() => {
    const dl = window.dataLayer || [];
    const fs = dl.filter((e) => e && e.event === "form_submit"), gl = dl.filter((e) => e && e.event === "generate_lead");
    return {
      n: fs.length,
      eligible: fs[0]?.form_data?.lead_conversion_eligible === true,
      eventId: fs[0]?.event_id,
      fsUser: fs[0] && "user_data" in fs[0] ? fs[0].user_data : null,
      glUser: gl[0] && "user_data" in gl[0] ? gl[0].user_data : null,
      raw: JSON.stringify(dl),
    };
  });
}

// ── 1. Head order: the consent default is the first script that runs in <head>, before the page-context push.
{
  const html = await (await fetch(BASE + "/services")).text();
  const head = html.slice(0, html.indexOf("</head>"));
  const inline = [...head.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/g)].map((m) => (m[0].match(/id="([^"]+)"/) || [])[1] || "(inline)");
  check("head: consent-init is the first inline script, before page-context-init", inline[0] === "consent-init" && inline.indexOf("page-context-init") > 0, inline.join(", "));
  check("head: no tag loader (GTM) script in <head>", !/googletagmanager|marktmen|gtm\.js/.test(head));
}

for (const [country, label] of [["AE", "UAE"], ["DE", "Europe"]]) {
  for (const width of [390, 1440]) {
    const ctx = await b.createBrowserContext();
    const p = await visit(ctx, country, "/services", width);
    const st = await consentState(p, country);
    const bn = await banner(p);
    if (width === 1440) {
      check(`${label}, no choice: defaults set before anything else in the dataLayer`, st.first);
      check(`${label}, no choice: ${country === "AE" ? "all four Granted" : "all four Denied"}`, all(st.s, country === "AE" ? "granted" : "denied"), KEYS.map((k) => `${k}=${st.s[k]}`).join(" "));
      check(`${label}, no choice: functionality/personalization denied, security granted, wait_for_update 500`, st.s.functionality_storage === "denied" && st.s.personalization_storage === "denied" && st.s.security_storage === "granted" && st.s.wait_for_update === 500);
      check(`${label}, no choice: Meta ${country === "AE" ? "granted" : "left off"}, Clarity ${country === "AE" ? "released" : "held"}`, JSON.stringify(await fbq(p)) === (country === "AE" ? '["grant"]' : "[]") && (await clarityOn(p)) === (country === "AE"));
    }
    check(`${label} ${width}: banner wording exact`, bn?.text?.startsWith(country === "AE" ? TEXT_ON : TEXT_OPT_IN), bn?.text);
    check(`${label} ${width}: Accept all and Reject all same size and style; Privacy Policy and Manage preferences present`, bn?.same && bn?.privacy && bn?.manage, JSON.stringify(bn));
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/banner-${country}-${width}.png` });
    await ctx.close();
  }
}

// ── 2. Choices, persistence and enhanced conversions on both forms.
for (const form of ["accounting", "services"]) {
  const F = FORMS[form];
  // UAE, no choice: Granted, conversions carry the email and E.164 phone.
  {
    const ctx = await b.createBrowserContext();
    const p = await visit(ctx, "AE", F.path);
    await F.submit(p);
    const c = await conversions(p);
    check(`${form} UAE no choice: one form_submit, lead-eligible, evt_ id = the API's`, c.n === 1 && c.eligible && c.eventId === p.api[0]?.event_id && p.api.length === 1, `${c.n} / ${c.eventId}`);
    check(`${form} UAE no choice: form_submit user_data has the email and +971 phone`, c.fsUser?.email === EMAIL && c.fsUser?.phone === PHONE, JSON.stringify(c.fsUser ? Object.keys(c.fsUser) : null));
    if (form === "accounting") check(`${form} UAE no choice: generate_lead user_data too`, c.glUser?.email === EMAIL && c.glUser?.phone_number === PHONE);
    await ctx.close();
  }
  // Europe: Accept all grants everything and sends user_data; Reject all denies and sends none, also after a reload.
  for (const choice of ["Accept all", "Reject all"]) {
    for (const country of ["DE", "AE"]) {
      const ctx = await b.createBrowserContext();
      let p = await visit(ctx, country, F.path);
      await click(p, choice);
      await wait(500);
      const granted = choice === "Accept all";
      let st = await consentState(p, country);
      const meta = await fbq(p);
      check(`${form} ${country} ${choice}: ${granted ? "all Granted" : "all Denied at once"}; Meta ${granted ? "grant" : "revoke"}`, all(st.s, granted ? "granted" : "denied") && meta.at(-1) === (granted ? "grant" : "revoke"), `${KEYS.map((k) => st.s[k]).join(",")} meta=${meta}`);
      await p.close();
      // Later visit: the saved choice is restored by the bootstrap before anything else, and the banner stays away.
      p = await visit(ctx, country, F.path);
      st = await consentState(p, country);
      check(`${form} ${country} ${choice}: still ${granted ? "Granted" : "Denied"} after a reload, banner gone`, all(st.s, granted ? "granted" : "denied") && st.first && !(await banner(p)));
      await F.submit(p);
      const c = await conversions(p);
      if (granted) check(`${form} ${country} Accept all: user_data sent (email, +971 phone)`, c.fsUser?.email === EMAIL && c.fsUser?.phone === PHONE);
      else check(`${form} ${country} Reject all: form_submit still counted, with no user_data and no personal data anywhere in the dataLayer`, c.n === 1 && c.fsUser === null && c.glUser === null && !c.raw.includes(EMAIL) && !c.raw.includes("500000000"), `${c.n} form_submit`);
      if (SHOTS && form === "services" && country === "AE") await p.screenshot({ path: `${SHOTS}/after-${granted ? "accept" : "reject"}-services.png` });
      await ctx.close();
    }
  }
}

// ── 3. Cookie Settings in the footer reopens the choice; switching from Reject to Accept takes effect.
{
  const ctx = await b.createBrowserContext();
  let p = await visit(ctx, "AE", "/services");
  await click(p, "Reject all");
  await wait(300);
  await p.close();
  p = await visit(ctx, "AE", "/services");
  await click(p, "Cookie Settings");
  await wait(400);
  const reopened = !!(await banner(p));
  await click(p, "Accept all");
  await wait(300);
  const st = await consentState(p, "AE");
  check("Cookie Settings reopens the banner; Accept all then grants everything", reopened && all(st.s, "granted"));
  await ctx.close();
}

await b.close();
console.log(failed ? `${failed} FAILED` : "ALL PASS");
process.exit(failed ? 1 : 0);
