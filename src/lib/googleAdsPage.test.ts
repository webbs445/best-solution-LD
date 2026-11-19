import { describe, expect, it } from "vitest";
// @ts-expect-error plain JS test data, shared with the browser QA run
import { TODAY, bridgeAnswer, clidOf, erpLeads, kvDays } from "../../scripts/qa/fixtures/googleAdsFixture.mjs";
import { parseDay } from "@/lib/adLandingsReport";
import { googleAdsHtml } from "@/lib/googleAdsPage";
import { CLICK_TABS, TABS, callBridge, type SheetData } from "@/lib/googleAdsSheet";
import { joinClicks, toErpLeads } from "@/lib/googleAdsView";

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
