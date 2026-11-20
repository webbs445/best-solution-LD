import { describe, expect, it } from "vitest";
// @ts-expect-error plain JS test data, shared with the browser QA run
import { TODAY, bridgeAnswer, clidOf, erpLeads, kvDays } from "../../scripts/qa/fixtures/googleAdsFixture.mjs";
import { parseDay } from "@/lib/adLandingsReport";
import { googleAdsHtml, googleAdsRest, googleAdsShell } from "@/lib/googleAdsPage";
import { CLICK_TABS, TABS, callBridge, type Cell, type SheetData } from "@/lib/googleAdsSheet";
import { Timings, joinClicks, toErpLeads } from "@/lib/googleAdsView";

const leadsRaw = toErpLeads(erpLeads(), null)!;
const ids = leadsRaw.map((l) => l.clid).filter(Boolean);
const kv = kvDays() as Record<string, string[]>;

async function load(clickIds: string[]) {
  const sent: { tabs: string[]; clickIds?: string[] }[] = [];
  const fake = async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    sent.push(body);
    return new Response(JSON.stringify(bridgeAnswer(body)), { status: 200 });
  };
  const { data } = await callBridge("https://bridge.invalid/exec", "test-token", fake, clickIds);
  return { data, sent };
}

/** The page's markup: the body without the inline script (which has its own words, like isNaN). */
const body = (html: string) => html.slice(html.indexOf("<body"), html.lastIndexOf("<script>"));
const page = (data: SheetData, qs: string, landings = true) =>
  googleAdsHtml({
    kind: "ok",
    query: new URLSearchParams(`view=google-ads&${qs}`),
    today: TODAY,
    data,
    stale: false,
    note: "",
    erp: joinClicks(leadsRaw, data.clicks),
    joinReady: data.clicks != null,
    landings: landings ? Object.keys(kv).filter((d) => d < TODAY).flatMap((d) => parseDay(d, kv[d])) : null,
  });

describe("Bridge request", () => {
  it("asks for the click tabs only with click ids, and keeps only the filtered rows (server side)", async () => {
    const withIds = await load(ids);
    expect(withIds.sent[0].tabs).toEqual([...TABS, ...CLICK_TABS]);
    expect(withIds.sent[0].clickIds).toEqual(ids);
    expect(withIds.data.clicks!.length - 1).toBe(ids.length);
    // Click rows are never among the tabs the page renders.
    expect(Object.keys(withIds.data.tabs)).not.toContain("Clicks_History");
    const without = await load([]);
    expect(without.sent[0].tabs).toEqual([...TABS]);
    expect(without.sent[0]).not.toHaveProperty("clickIds");
    expect(without.data.clicks).toBeNull();
  });
});

describe("Google Ads page on the fixture", () => {
  it("no click id, NaN, undefined, Infinity or [object Object] anywhere, for every period and channel", async () => {
    const { data } = await load(ids);
    for (const qs of ["", "channel=search", "channel=demandgen", "channel=demand_gen", "range=today", "range=30d", "range=month", "from=2026-10-12&to=2026-10-20", "from=2026-11-10&to=2026-11-01"]) {
      for (const full of [page(data, qs), page(data, qs, false)]) {
        const html = body(full);
        expect(html).not.toMatch(/NaN|undefined|Infinity|\[object /);
        // The click ids appear nowhere in the whole response, script and styles included.
        for (const id of ids) expect(full).not.toContain(id);
        expect(full).not.toContain("TESTCLID");
      }
    }
    expect(clidOf(0)).toMatch(/^TESTCLID/);
  });
  it("shows the blocks in the design's order, with the tracking banner and the shared top bar", async () => {
    const { data } = await load(ids);
    const html = body(page(data, ""));
    const order = ["lr-topbar", "gx-head", "gx-banner", "gx-kpis", "gx-chart-t", "gx-attn-t", "gx-spend-t", "gx-quality-t", "gx-funnel-t", "gx-cpl-t", "gx-heat-t", "gx-dev-t", "gx-cities-t", "gx-pages-t", "gx-terms-t", "gx-camps-t", 'id="details"', "gx-footer"];
    const at = order.map((k) => html.indexOf(k));
    expect(at.every((i) => i > 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(html).toContain("Lead tracking under test since 5 Nov");
    expect(html).toContain("15 of 19 leads came from Free Zone Search");
    expect(html).not.toContain("Google leads");
  });
  it("no ERP and no lead log: Google conversions, said so once at the top; status blocks give the reason", async () => {
    const { data } = await load([]);
    const html = body(googleAdsHtml({ kind: "ok", query: new URLSearchParams("view=google-ads"), today: TODAY, data, stale: false, note: "", erp: null, joinReady: false, landings: null }));
    expect(html).toContain("ERP and lead log not connected here: lead numbers are Google Ads conversions");
    expect(html).toContain("Conversions per day");
    expect(html).toContain("Needs lead status from the ERP");
    expect(html).not.toMatch(/NaN|undefined|Infinity/);
  });
  it("no ERP but the lead log: leads from the sheet, said so once at the top", async () => {
    const { data } = await load([]);
    const html = body(googleAdsHtml({ kind: "ok", query: new URLSearchParams("view=google-ads"), today: TODAY, data, stale: false, note: "", erp: joinClicks(leadsRaw.map((l) => ({ ...l, qualified: false, won: false })), null), leadSource: "sheet", joinReady: false, landings: null }));
    expect(html).toContain("ERP not connected here: leads come from the lead log sheet");
    expect(html).toContain("Leads (lead log)");
    expect(html).not.toMatch(/NaN|undefined|Infinity/);
  });
});

describe("All details: tabs", () => {
  it("only the active tab is drawn, with row counts on every tab, and the panel opens from the URL", async () => {
    const { data } = await load(ids);
    const closed = body(page(data, ""));
    expect(closed).toMatch(/<details class="lr-card gx-card gx-details" id="details">/);
    const kw = body(page(data, "range=30d&details=keywords"));
    expect(kw).toMatch(/id="details" open/);
    expect(kw).toContain('id="t-keywords"');
    expect(kw).not.toContain('id="t-campaigns"');
    expect(kw).toMatch(/Campaigns <span class="gx-tab__n">6<\/span>/);
    // Quality Score: number + 10-segment bar; the three parts as dots; the tip for the lowest-QS keyword with spend.
    expect(kw).toMatch(/gx-qs" data-tone="bad"><b>4<\/b>/);
    expect(kw).toContain("Its weakest part is <b>expected ctr</b>");
    expect(kw).toContain('data-chip="t-keywords" data-key="flags" data-val="lowqs"');
  });
  it("an empty tab is one short line, not an empty table", async () => {
    const { data } = await load(ids);
    const t = body(page(data, "range=today&details=terms"));
    expect(t).toContain("No search terms in this period.");
    expect(t).not.toContain('id="t-terms"');
  });
  it("campaigns: friendly name + Google's name, status dot and word, total line", async () => {
    const { data } = await load(ids);
    const c = body(page(data, "details=campaigns"));
    expect(c).toContain("<b>Free Zone Search</b><span class=\"gx-raw\"");
    expect(c).toMatch(/gx-st" data-tone="warn"><span class="gx-st__d" aria-hidden="true"><\/span>Paused<\/span><span class="gx-sub">since 2 Nov<\/span>/);
    expect(c).toContain("Open in Google Ads →");
  });
});

describe("Chart change pill", () => {
  // Rows in the report script's (v5.2) layout, no real IDs: a budget change on 18 Nov 10:00, snapshots at 20:00.
  const TARGETING = ["2026-11-18 20:00", "Campaign targeting", "555", "LOCATION", "bs_accounting_081026", JSON.stringify({ location: "Dubai", negative: false, status: "ENABLED" })];
  const campaignRow = (budget: number) => ["2026-11-18 20:00", "Campaign", "23102", "bs_accounting_081026", "", JSON.stringify({ status: "PAUSED", type: "SEARCH", budget, bidding: "MANUAL_CPC" })];
  async function pill(...history: Cell[][]) {
    const { data } = await load(ids);
    const tabs = structuredClone(data.tabs);
    tabs.Change_Log_30d!.push(["2026-11-18 10:00", "owner@example.com", "Google Ads web", "CAMPAIGN_BUDGET", "UPDATE", "amount_micros", "bs_accounting_081026", ""]);
    tabs.Setup_History!.push(...history);
    const m = /<span class="gx-pill"[^>]*>(.*?<\/span>[^<]*)<\/span>/.exec(body(page({ ...data, tabs }, "")));
    return (m?.[1] ?? "").replace(/<[^>]+>/g, "");
  }
  it("a targeting row and the Campaign row with the same stamp: the amount from the Campaign row", async () => {
    expect(await pill(TARGETING, campaignRow(25))).toBe("18 Nov · Accounting Search · budget AED 25");
  });
  it("only a targeting row after the change (no budget there): budget changed", async () => {
    expect(await pill(TARGETING)).toBe("18 Nov · Accounting Search · budget changed");
  });
  it("same amount as the campaign's previous row (a delivery-method edit): budget changed", async () => {
    expect(await pill(TARGETING, campaignRow(20))).toBe("18 Nov · Accounting Search · budget changed");
  });
});
describe("Preview fixes", () => {
  const googleMode = (data: SheetData, qs = "") =>
    body(googleAdsHtml({ kind: "ok", query: new URLSearchParams(`view=google-ads&${qs}`), today: TODAY, data, stale: false, note: "", erp: null, joinReady: false, landings: null }));
  it("Google conversions fallback: the heatmap says Google conversions, never form leads; one compact card for quality and cost", async () => {
    const { data } = await load(ids);
    const g = googleMode(data);
    expect(g).toMatch(/<p class="gx-take gx-take--plain" data-tone="bad">No Google conversions since 5 Nov \(14 days\)\.<\/p>/);
    expect(/id="gx-heat"[\s\S]*?<\/section>/.exec(g)?.[0]).not.toContain("form lead");
    expect(g).toContain("Lead quality and cost per qualified lead need the ERP lead status. Shown on the live site.");
    expect(g).not.toContain('id="gx-quality"');
    expect(g).not.toContain('id="gx-cpl"');
  });
  it("Google conversions fallback: banner, chart, spend, funnel and campaigns say conversions, never leads", async () => {
    const { data } = await load(ids);
    const g = googleMode(data, "range=30d");
    const card = (id: string) => new RegExp(`id="${id}"[\\s\\S]*?</section>`).exec(g)?.[0] ?? "";
    expect(/<div class="gx-banner"[\s\S]*?<\/p>/.exec(googleMode(data))?.[0] ?? "").toMatch(/ · \d+ Google conversions?\. Lead numbers may be missing/);
    expect(card("gx-chart")).toContain("Spend and conversions");
    expect(card("gx-spend")).toMatch(/\d+ clicks? · \d+ conv\./);
    expect(card("gx-funnel")).toMatch(/gx-fn__l">Conversions</);
    expect(card("gx-funnel")).toMatch(/>Conv\. ([\d.]+%|–)</);
    expect(card("gx-camps")).toMatch(/clicks? · \d+ conv\./);
    for (const id of ["gx-chart", "gx-spend", "gx-funnel", "gx-camps", "gx-heat"]) expect(card(id).replace(/Lead Insights|lead status/g, "")).not.toMatch(/\blead/i);
  });  it("with the ERP: form leads wording, both cards as before, no compact card", async () => {
    const { data } = await load(ids);
    const e = body(page(data, ""));
    expect(e).toContain('id="gx-quality"');
    expect(e).toContain('id="gx-cpl"');
    expect(e).not.toContain("gx-needs");
    expect(e).toMatch(/gx-take gx-take--plain[^>]*>(No form leads since|\d+ leads? in 6 weeks)/);
  });
  it("search term counts never break inside: \"1 conv.\" is one unit", async () => {
    const { data } = await load(ids);
    expect(body(page(data, "range=30d"))).toMatch(/<b class="gx-nowrap">\d+ conv\.<\/b>/);
  });
  it("changes in 30 days: one per (campaign, date-time), however many fields; the History tab shows the same number", async () => {
    const { data } = await load(ids);
    const tabs = structuredClone(data.tabs);
    // One edit, three field rows: one change.
    for (const f of ["status", "name", "campaign_budget"]) tabs.Change_Log_30d!.push(["2026-11-17 11:00", "owner@example.com", "Google Ads web", "CAMPAIGN", "UPDATE", f, "fz_search_061026", ""]);
    const h = body(page({ ...data, tabs }, "details=history"));
    const n = Number(/(\d+) changes in 30 days/.exec(h)?.[1]);
    expect(n).toBe(new Set(tabs.Change_Log_30d!.slice(1).filter((r) => String(r[0]) >= "2026-10-20").map((r) => `${r[6]}|${r[0]}`)).size);
    expect(h).toMatch(new RegExp(`History[^<]*<span[^>]*>${n}<`));
  });
});

describe("Loading shell (streamed when the data is slow)", () => {
  it("shell: header, view switch, period links and placeholders, no data; with the rest it's the same view as the whole page", async () => {
    const { data } = await load(ids);
    const q = new URLSearchParams("view=google-ads&range=30d");
    const shell = googleAdsShell(q, TODAY);
    expect(shell).toContain('class="lr-topbar');
    expect(shell).toContain("Loading Google Ads data");
    expect(shell).toMatch(/<nav class="seg" aria-label="Period">.*range=30d[^>]*aria-current="page"/s);
    expect(shell).not.toContain("gx-custom-btn");
    expect(shell).not.toContain("</html>");
    const state = { kind: "ok" as const, query: q, today: TODAY, data, stale: false, note: "", erp: joinClicks(leadsRaw, data.clicks), joinReady: true, landings: null };
    const whole = googleAdsHtml(state);
    const streamed = shell + googleAdsRest(state);
    // The view after the placeholders (which CSS hides once anything follows them), then the real header badge.
    expect(streamed.indexOf('id="gx-skel"')).toBeLessThan(streamed.indexOf('class="gx-kpis"'));
    expect(streamed).toContain('<template id="gx-top"><header class="lr-topbar');
    expect(streamed.endsWith("</html>")).toBe(true);
    const rest = googleAdsRest(state);
    expect(whole).toContain(rest.slice(0, rest.indexOf('\n<template id="gx-top">')));
  });
});

describe("Step timings", () => {
  it("Server-Timing: names and durations only, the copy's source as desc", async () => {
    const t = new Timings();
    await t.step("erp", Promise.resolve(1));
    t.stepSync("render", () => "x");
    t.sheet = "redis due";
    await t.step("bridge", Promise.resolve(2));
    t.total();
    expect(t.header()).toMatch(/^erp;dur=\d+, render;dur=\d+, bridge;dur=\d+;desc="redis due", total;dur=\d+$/);
  });
});