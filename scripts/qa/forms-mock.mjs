// Form mocks: /services callback popup, /accounting quote builder, /consult form, the /xservicesx form,
// /freezone budget popup, /freezone callback
// popup and /freezone planner (with planner_start / planner_complete). Lead APIs are
// answered inside the test browser (nothing reaches the ERP or the lead sheet); tag hosts are blocked. Each form must
// send nothing on an empty submit, then exactly one API call and one form_submit with an evt_ id that matches the API
// body, with gclid TEST123 kept from the landing URL. Test data only (TEST AUDIT - DELETE). Exit 1 on any failure.
// Usage: node scripts/qa/forms-mock.mjs [base]
import { BASE, blockTags, launch, wait } from "./common.mjs";

const Q = "?gclid=TEST123&utm_source=google&utm_medium=cpc&utm_campaign=TEST-AUDIT-DELETE";
const NAME = "TEST AUDIT - DELETE", PHONE = "+971500000000", EMAIL = "test-audit@xerebo.com";
const b = await launch();
let failed = 0;

async function run(name, path, { open, toContact, submit, fill, check }) {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  const api = [];
  await blockTags(p, (r) => {
    // Every outside host is blocked, not only the tag hosts: only the site under test and inline data load.
    if (!r.url().startsWith(BASE) && !/^(data|blob):/.test(r.url())) return r.abort(), true;
    // The ad landing counter beacon is not a lead: answered, not counted.
    if (r.url().includes("/api/ad-landing")) return r.respond({ status: 204 }), true;
    if (r.method() === "POST" && /\/api\//.test(r.url())) {
      api.push({ url: new URL(r.url()).pathname, body: JSON.parse(r.postData() || "{}") });
      return r.respond({ status: 200, contentType: "application/json", body: '{"ok":true,"created":true}' }), true;
    }
    return false;
  });
  await p.goto(BASE + path + Q, { waitUntil: "networkidle2", timeout: 180000 });
  { await p.waitForFunction(() => [...document.querySelectorAll("button")].some((x) => x.innerText.trim() === "Accept"), { timeout: 5000 }).catch(() => {}); await p.$$eval("button", (bs) => bs.find((x) => x.innerText.trim() === "Accept")?.click()); }
  await wait(1200);
  const stored = await p.evaluate(() => JSON.parse(sessionStorage.getItem("bs_attribution") || "{}").gclid);
  const subs = () => p.evaluate(() => (window.dataLayer || []).filter((d) => d && d.event === "form_submit").map((d) => ({ id: d.event_id, form: d.form_data?.form_id })));
  if (open) await open(p);
  if (toContact) await toContact(p);
  await submit(p);
  await wait(900);
  const emptySubs = (await subs()).length, emptyApi = api.length;
  await fill(p);
  await submit(p);
  await wait(2800);
  const s = await subs();
  const body = api[0]?.body || {};
  // Every form: the number in E.164 with its country picker value, and the renamed spam trap sent empty (never "website").
  const fields = body.mobile_no === "+971500000000" && body.country === "AE" && body.bs_hp === "" && !("website" in body);
  const extra = check ? await check(p, body) : true;
  const ok =
    emptySubs === 0 && emptyApi === 0 && s.length === 1 && /^evt_\d+_[a-z0-9]+$/.test(s[0].id) && api.length === 1 && body.gclid === "TEST123" && body.event_id === s[0].id && stored === "TEST123" && fields && extra;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name} (${path}): empty -> ${emptySubs} form_submit / ${emptyApi} API; valid -> ${s.length} form_submit "${s[0]?.form}" ${s[0]?.id}; API ${api[0]?.url} gclid=${body.gclid} mobile_no=${body.mobile_no} country=${body.country} trap=${JSON.stringify(body.bs_hp)}${check ? ` extra=${extra}` : ""}`);
  await ctx.close();
}

const type = async (p, sel, v) => {
  await p.waitForSelector(sel, { visible: true, timeout: 15000 });
  await p.click(sel, { clickCount: 3 });
  await p.type(sel, v);
};
const fillIds = (n, ph, em, phone = PHONE) => async (p) => {
  await type(p, n, NAME);
  await type(p, ph, phone);
  await type(p, em, EMAIL);
};
const submitIn = (formSel) => (p) => p.evaluate((sel) => document.querySelector(sel).querySelector("button[type=submit]").click(), formSel);

await run("Services callback popup", "/services", {
  open: async (p) => {
    await p.evaluate(() => [...document.querySelectorAll("[aria-controls=cbModal]")].find((x) => x.offsetParent)?.click());
    await wait(800);
  },
  submit: submitIn("#cbModal form"),
  fill: fillIds("#cb-name", "#cb-phone", "#cb-email"),
});

await run("Accounting quote form", "/accounting", {
  open: async (p) => {
    await p.evaluate(() => document.getElementById("contact").scrollIntoView());
    await wait(600);
  },
  // Three steps: pick a service (moves on by itself), answer the details, continue to the contact step.
  toContact: async (p) => {
    await p.click("#leadForm .pane.on .tiles label");
    await wait(1200);
    for (const n of ["volume", "software", "state"]) await p.evaluate((x) => document.querySelector(`#leadForm .pane.on input[name=${x}]`)?.closest("label")?.click(), n);
    await p.click("#leadForm button[type=submit]");
    await wait(1000);
    if (!(await p.evaluate(() => !!document.querySelector("#leadForm .pane.on #f-name")))) throw new Error("accounting: contact step not reached");
  },
  submit: submitIn("#leadForm"),
  fill: fillIds("#f-name", "#f-phone", "#f-email"),
});

await run("/consult form", "/consult", {
  submit: submitIn("form[data-track]"),
  fill: async (p) => {
    await fillIds("#ad-name", "#ad-phone", "#ad-email")(p);
    await p.select("#ad-topic", "Office options");
  },
});


// /xservicesx: the page's one form (section 9). The page's own checks are in xservicesx.mjs.
await run("Services plan form", "/xservicesx", {
  submit: submitIn("#plan form"),
  fill: fillIds("#xs-name", "#xs-phone", "#xs-email", "050 000 0000"),
  check: async (p, body) => body.form_location === "s9" && body.page === "/xservicesx" && (await p.evaluate(() => !!document.querySelector(".xs-stamp"))),
});

await run("Free zone budget popup", "/freezone/budget", {
  open: async (p) => {
    await wait(1500);
    await p.evaluate(() => document.querySelector('a[data-cta-location="FZ FAQ - Budget Breakdown"]').click());
    await wait(800);
  },
  submit: submitIn("dialog[open] form"),
  fill: fillIds("#fzb-name", "#fzb-phone", "#fzb-email"),
});

// The /freezone "Book a consultation" buttons open the callback pop-up. The number is typed the local way and must reach the
// API in E.164 with the source page path on the landing URL.
await run("Free zone callback popup", "/freezone", {
  open: async (p) => {
    await p.evaluate(() => [...document.querySelectorAll("[aria-controls=cbModal]")].find((x) => x.offsetParent)?.click());
    await wait(800);
  },
  submit: submitIn("#cbModal form"),
  fill: fillIds("#cb-name", "#cb-phone", "#cb-email", "050 000 0000"),
  check: async (_p, body) => new URL(body.landing_page).pathname === "/freezone" && body.utm_campaign === "TEST-AUDIT-DELETE",
});

// The planner: planner_start on the first choice, planner_complete on "See my shortlist", then its advisor form (QuickCapture)
// with a UAE number typed without the 0.
await run("Free zone planner", "/freezone", {
  open: async (p) => {
    await p.evaluate(() => document.getElementById("planner").scrollIntoView());
    await p.click("#planner button[aria-pressed]");
    await wait(600);
    await p.evaluate(() => document.querySelector('[data-cta-location="FZ Planner - See my shortlist"]').click());
    await wait(900);
    await p.evaluate(() => document.querySelector('[data-cta-location="FZ Planner - Send to an advisor"]').click());
    await wait(800);
  },
  submit: submitIn("dialog[open] form"),
  fill: fillIds("dialog[open] input[name=lead_name]", "dialog[open] input[name=mobile_no]", "dialog[open] input[name=email_id]", "50 000 0000"),
  check: async (p, body) => {
    const events = await p.evaluate(() => (window.dataLayer || []).map((d) => d && d.event).filter((e) => e === "planner_start" || e === "planner_complete"));
    return JSON.stringify(events) === '["planner_start","planner_complete"]' && !!body.planner;
  },
});

await b.close();
console.log(failed ? `${failed} FAIL` : "ALL PASS");
process.exit(failed ? 1 : 0);
