import { describe, expect, it } from "vitest";
// @ts-expect-error plain JS test data, shared with the browser QA run
import { TODAY, bridgeAnswer, clidOf, clickHistory, erpLeads, kvDays, otherClicks, CLICK_HEAD } from "../../scripts/qa/fixtures/googleAdsFixture.mjs";
import { parseDay } from "@/lib/adLandingsReport";
import { blocks, changeDetail, markers } from "@/lib/googleAdsBlocks";
import { googleAdsHtml } from "@/lib/googleAdsPage";
import { filteredClicks, type Cell, type SheetData } from "@/lib/googleAdsSheet";
import { fromLeadLog, joinClicks, toErpLeads } from "@/lib/googleAdsView";

/* The fixture as the view would pass it: the bridge answer (asked with the leads' click ids), the ERP leads, the counter. */
type Raw = { headers: Cell[]; rows: Cell[][] };
const leadsRaw = toErpLeads(erpLeads(), null)!;
const ids = leadsRaw.map((l) => l.clid).filter(Boolean);
const answer = bridgeAnswer({ tabs: ["_Status", "Alerts", "Perf_Campaigns_Daily", "Perf_AdGroups_Daily", "Perf_Ads_Daily", "Perf_Conversions_Daily", "Perf_Devices_Daily", "Perf_Keywords_Daily", "Perf_SearchTerms_Daily", "Perf_Locations_30d", "Perf_CampaignAssets_30d", "Setup_Campaigns", "Setup_Keywords", "Setup_Ads", "Change_Log_30d", "Setup_History", "Clicks_History", "Perf_Clicks_Last7Days"], clickIds: ids }) as { tabs: Record<string, Raw> };
const tabs = Object.fromEntries(Object.entries(answer.tabs).map(([k, v]) => [k, [v.headers, ...v.rows]])) as SheetData["tabs"];
const clicks = filteredClicks(answer.tabs, ids);
const data: SheetData = { tabs, clicks, fetchedAt: 0 };
const erp = joinClicks(leadsRaw, clicks);
const kv = kvDays() as Record<string, string[]>;
const landingsFrom = (from: string, to: string) => Object.keys(kv).filter((d) => d >= from && d <= to).flatMap((d) => parseDay(d, kv[d]));
const run = (qs: string, landFrom = "2026-11-16", landTo = "2026-11-18") =>
  blocks({ data, erp, joinReady: clicks != null, landings: landingsFrom(landFrom, landTo), q: new URLSearchParams(qs), today: TODAY });

/* Independent sums straight from the fixture rows. */
const perf = answer.tabs.Perf_Campaigns_Daily.rows;
const TYPE = new Map(answer.tabs.Setup_Campaigns.rows.map((r) => [r[1], r[3]]));
const isSearch = (name: Cell) => TYPE.get(name) === "SEARCH";
const pick = (from: string, to: string, f: (r: Cell[]) => boolean = () => true) => perf.filter((r) => String(r[0]) >= from && String(r[0]) <= to && f(r));
const total = (rows: Cell[][], col: number) => rows.reduce((s, r) => s + Number(r[col]), 0);
const COST = 7, CLICKS = 6, IMPR = 5;

describe("Google Ads blocks on the fixture (7D, All)", () => {
  const b = run("");
  it("period 12â€“18 Nov vs 5â€“11 Nov", () => {
    expect(b.period).toMatchObject({ from: "2026-11-12", to: "2026-11-18", prevFrom: "2026-11-05", prevTo: "2026-11-11" });
  });
  it("ERP leads: 19 Google leads, 18 qualified, 0 won, 15 from fz_search_061026, last 5 Nov", () => {
    expect(erp).toHaveLength(19);
    expect(b.quality).toMatchObject({ total: 19, qualified: 18, won: 0, notQualified: 1, top: { name: "fz_search_061026", n: 15 } });
    expect(b.quality!.share).toBeCloseTo(18 / 19);
    expect(b.lastLead).toBe("2026-11-05");
  });
  it("KPIs: spend, clicks, Search CPC, tracked leads, cost per qualified lead", () => {
    const cur = pick("2026-11-12", "2026-11-18"), prev = pick("2026-11-05", "2026-11-11");
    const k = Object.fromEntries(b.kpis.map((x) => [x.key, x]));
    expect(k.spend.value).toBeCloseTo(total(cur, COST));
    expect(k.spend.delta!.ch).toBeCloseTo(total(cur, COST) / total(prev, COST) - 1);
    expect(k.clicks.value).toBe(total(cur, CLICKS));
    const s = pick("2026-11-12", "2026-11-18", (r) => isSearch(r[2]));
    expect(k.cpc.value).toBeCloseTo(total(s, COST) / total(s, CLICKS));
    expect(k.cpc.sub).toBe("cap AED 8 since 16 Nov");
    expect(k.leads.value).toBe(0);
    expect(k.leads.sub).toBe("last lead 5 Nov");
    // 0 qualified in the period: "No leads" and the since-start figure (cost 12 Oct â€“ 18 Nov Ã· 18 qualified).
    expect(k.cpl.value).toBeNull();
    expect(k.cpl.text).toBe("No leads");
    expect(k.cpl.sub).toBe("no qualified lead in 12–18 Nov");
    expect(k.cpl.gauge).toEqual({ value: total(pick("2026-10-12", "2026-11-18"), COST) / 18, target: 80 });
    expect(k.cpl.chip).toBeUndefined();
  });
  it("tracking banner: last lead 5 Nov, Search landings 16â€“18 Nov, 0 form leads", () => {
    // /freezone* per full day: 8 + 2 + 2 + 1 + 1 = 14.
    expect(b.banner).toEqual({ since: "2026-11-05", landings: 42, leads: 0 });
  });
  it("spend by channel", () => {
    const cur = pick("2026-11-12", "2026-11-18");
    const s = total(cur.filter((r) => isSearch(r[2])), COST), g = total(cur.filter((r) => !isSearch(r[2])), COST);
    expect(b.spend.total).toBeCloseTo(s + g);
    expect(b.spend.parts.map((p) => p.ch)).toEqual(["DEMAND_GEN", "SEARCH"]);
    expect(b.spend.parts.find((p) => p.ch === "SEARCH")!.share).toBeCloseTo(s / (s + g));
    expect(b.spend.parts.find((p) => p.ch === "DEMAND_GEN")!.clicks).toBe(total(cur.filter((r) => !isSearch(r[2])), CLICKS));
  });
  it("funnel (Search): landed counts from 16 Nov, so Landed % uses 16â€“18 Nov clicks", () => {
    const s = pick("2026-11-12", "2026-11-18", (r) => isSearch(r[2])), w = pick("2026-11-16", "2026-11-18", (r) => isSearch(r[2]));
    expect(b.funnel).toMatchObject({ seen: total(s, IMPR), clicked: total(s, CLICKS), landed: 42, leads: 0, formRate: 0 });
    expect(b.funnel.landedRate).toBeCloseTo(42 / total(w, CLICKS));
    expect(b.funnel.note).toMatch(/started 16 Nov/);
  });
  it("cost per qualified lead by campaign since 12 Oct, against the AED 80 target", () => {
    const since = (name: string) => total(pick("2026-10-12", TODAY, (r) => r[2] === name), COST);
    const row = (name: string) => b.cplRows!.find((r) => r.name === name)!;
    expect(row("fz_search_061026").cpl).toBeCloseTo(since("fz_search_061026") / 15);
    expect(row("bs_accounting_081026")).toMatchObject({ qualified: 2 });
    expect(row("BS_DemandGen_Competitor_061126").cpl).toBeNull();
    expect(b.cplRows!.at(-1)!.name).toBe("BS_DemandGen_Competitor_061126");
  });
  it("budget to redirect: Demand Gen's 7-day spend to fz_search_061026", () => {
    const dg = total(pick("2026-11-12", "2026-11-18", (r) => r[2] === "BS_DemandGen_Competitor_061126"), COST);
    const fzCpl = total(pick("2026-10-12", TODAY, (r) => r[2] === "fz_search_061026"), COST) / 15;
    expect(b.redirect).toMatchObject({ from: "BS_DemandGen_Competitor_061126", to: "fz_search_061026" });
    expect(b.redirect!.aed).toBeCloseTo(dg);
    expect(b.redirect!.more).toBe(Math.round(dg / fzCpl));
  });
  it("needs attention: two reds first (by money), accidental Demand Gen clicks, Search 0 leads points to the form test", () => {
    expect(b.attn.slice(0, 2).map((a) => a.level)).toEqual(["red", "red"]);
    expect(b.attn[0].aed!).toBeGreaterThanOrEqual(b.attn[1].aed!);
    const dg = b.attn.find((a) => /^Demand Gen Competitor: [\d,]+ clicks, 0 leads$/.test(a.title))!;
    expect(dg).toMatchObject({ level: "red", why: "AED 0.07 a click looks like accidental taps" });
    const fz = b.attn.find((a) => a.title.startsWith("Free Zone Search: 0 leads"))!;
    expect(fz.action.target).toBe("form-test");
    expect(b.attn.some((a) => a.title === "Demand Gen Competitor: status changed 2 times")).toBe(true);
    expect(b.attn.some((a) => /lost to budget/.test(a.title) && a.action.target === "redirect")).toBe(true);
    // The Sheet's "No leads" alert on Demand Gen is covered by the check above, not shown twice.
    expect(b.attn.filter((a) => a.source === "sheet" && /No leads/.test(a.title))).toHaveLength(0);
  });
  it("heatmap: 6 weeks from Sunday 12 Oct, last week holds today", () => {
    expect(b.heatStart).toBe("2026-10-11");
    const flat = b.heat!.flat();
    expect(flat).toHaveLength(42);
    expect(flat.reduce((s, c) => s + (c.n ?? 0), 0)).toBe(19);
    expect(flat.find((c) => c.day === "2026-10-14")!.n).toBe(2);
    expect(flat.find((c) => c.day === "2026-11-20")!.n).toBeNull();
  });
  it("search terms: wasted leaves out excluded, under AED 20 and ERP-linked terms", () => {
    expect(b.terms.wasted.map((t) => t.term)).toEqual(["free zone jobs dubai", "freezone visa price list", "meydan racecourse"]);
    expect(b.terms.copy).toBe('"free zone jobs dubai"\n"freezone visa price list"\n"meydan racecourse"');
    expect(b.terms.winning.map((t) => t.term)).toEqual(["free zone setup cost", "cheapest free zone uae", "dmcc company setup"]);
    expect(b.terms.erpKeywords![0]).toEqual({ keyword: "free zone setup cost", n: 4 });
  });
  it("devices and cities: cost share, and qualified leads per device and city from the click join", () => {
    expect(b.joinReady).toBe(true);
    const mob = b.devices.find((x) => x.name === "Mobile")!, desk = b.devices.find((x) => x.name === "Desktop")!;
    expect(mob.share + desk.share).toBeCloseTo(1);
    const q30 = erp.filter((l) => l.qualified && l.click && l.campaign !== "BS_DemandGen_Competitor_061126" && l.created >= "2026-10-20" && l.created < "2026-11-19");
    expect(mob.qualified! + desk.qualified!).toBe(q30.length);
    expect(b.cities[0]).toMatchObject({ name: "Dubai" });
  });
  it("campaigns: 2 enabled cards, 6 in all, 3 paused; CPC change since the 16 Nov bidding change", () => {
    // Highest spend first.
    expect(b.campaigns.cards.map((c) => c.c.name).sort()).toEqual(["BS_DemandGen_Competitor_061126", "fz_search_061026"]);
    expect(b.campaigns.cards[0].c.t.cost!).toBeGreaterThanOrEqual(b.campaigns.cards[1].c.t.cost!);
    expect(b.campaigns).toMatchObject({ all: 6, paused: 3 });
    expect(b.campaigns.bidChange).toMatchObject({ day: "2026-11-16", campaign: "fz_search_061026" });
    expect(b.campaigns.bidChange!.ch!).toBeLessThan(0);
  });
  it("chart markers from the change log", () => {
    expect(markers((tabs.Change_Log_30d ?? []).slice(1).map((r) => Object.fromEntries((tabs.Change_Log_30d![0] as string[]).map((h, i) => [h, r[i]])))).map((m) => `${m.day} ${m.kind}`)).toEqual([
      "2026-10-25 Status", "2026-11-02 Status", "2026-11-06 Status", "2026-11-10 Budget", "2026-11-16 Bidding", "2026-11-16 Status",
    ]);
  });
  it("no NaN or Infinity anywhere", () => {
    const bad: string[] = [];
    const walk = (v: unknown, path: string) => {
      if (typeof v === "number" && !Number.isFinite(v)) bad.push(path);
      else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
    };
    for (const qs of ["", "channel=search", "channel=demandgen", "channel=demand_gen", "range=today", "range=30d", "range=month", "from=2026-10-01&to=2026-10-05"]) walk(run(qs), qs);
    expect(bad).toEqual([]);
  });
});

describe("Channel switch", () => {
  it("Search: every block narrows to Search", () => {
    const a = run(""), s = run("channel=search");
    const k = Object.fromEntries(s.kpis.map((x) => [x.key, x]));
    expect(k.spend.value).toBeCloseTo(total(pick("2026-11-12", "2026-11-18", (r) => isSearch(r[2])), COST));
    expect(s.spend.parts.map((p) => p.ch)).toEqual(["SEARCH"]);
    expect(s.quality!.total).toBe(19);
    expect(s.chart.stacks.map((k) => k.key)).toEqual(["SEARCH"]);
    expect(s.campaigns.cards.map((c) => c.c.name)).toEqual(["fz_search_061026"]);
    expect(s.cplRows!.some((r) => r.name === "BS_DemandGen_Competitor_061126")).toBe(false);
    expect(s.pages!.every((p) => p.path.startsWith("/freezone"))).toBe(true);
    expect(s.attn.some((a2) => a2.title.startsWith("Demand Gen Competitor"))).toBe(false);
    expect(a.kpis[0].value).not.toBe(k.spend.value);
  });
  it("Demand Gen: no lead, no search terms, Demand Gen landings", () => {
    const g = run("channel=demand_gen");
    expect(g.quality!.total).toBe(0);
    expect(g.terms.searchOnly).toBe(true);
    // Search-only blocks stay Search, labelled so.
    expect(g.pages!.map((p) => p.path)).toEqual(["/services"]);
  });
});

describe("ERP or counter not here: leads from the next source", () => {
  it("no ERP and no lead log: Google conversions stand in, labelled; status blocks say why they're empty", () => {
    const b = blocks({ data, erp: null, joinReady: false, landings: null, q: new URLSearchParams("range=30d"), today: TODAY });
    const k = Object.fromEntries(b.kpis.map((x) => [x.key, x]));
    expect(b.leadSource).toBe("google");
    // 30 days to yesterday: 20 Oct – 18 Nov, Google conversions of every campaign.
    expect(k.leads).toMatchObject({ label: "Google conversions", value: total(pick("2026-10-20", "2026-11-18"), 8) });
    expect(k.cpl).toMatchObject({ value: null, reason: "Needs lead status from the ERP" });
    expect(b.heat!.flat().reduce((s, c) => s + (c.n ?? 0), 0)).toBe(total(pick("2026-10-11", TODAY), 8));
    expect(b.quality).toBeNull();
    expect(b.cplRows).toBeNull();
    expect(b.redirect).toBeNull();
    expect(b.erpReason).toBe("ERP and lead log not connected here");
    expect(b.funnel.landed).toBeNull();
    expect(b.pages).toBeNull();
    expect(b.devices.every((d) => d.qualified == null)).toBe(true);
  });
  it("lead log only: counts, campaigns and keywords from the sheet, no status", () => {
    const log = fromLeadLog(erpLeads().map((l: Record<string, string>) => ({ ...l, status: undefined })))!;
    expect(log).toHaveLength(19);
    const b = blocks({ data, erp: log, leadSource: "sheet", joinReady: true, landings: null, q: new URLSearchParams(""), today: TODAY });
    const k = Object.fromEntries(b.kpis.map((x) => [x.key, x]));
    expect(b.leadSource).toBe("sheet");
    expect(k.leads).toMatchObject({ label: "Tracked leads", value: 0, sub: "last lead 5 Nov · lead log" });
    expect(k.cpl.reason).toBe("Needs lead status from the ERP");
    expect(b.quality).toBeNull();
    expect(b.joinReady).toBe(false);
    expect(b.heat!.flat().reduce((s, c) => s + (c.n ?? 0), 0)).toBe(19);
    expect(b.terms.erpKeywords![0]).toEqual({ keyword: "free zone setup cost", n: 4 });
    expect(b.erpReason).toBe("Lead status needs the ERP (not connected here)");
  });
});

describe("Click join", () => {
  it("uses only bridge-filtered click rows; an unfiltered tab turns the join off", () => {
    expect(clicks).not.toBeNull();
    const unfiltered = { Clicks_History: { headers: CLICK_HEAD, rows: [...clickHistory(), ...otherClicks()] } };
    expect(filteredClicks(unfiltered, ids)).toBeNull();
    expect(filteredClicks({}, ids)).toBeNull();
    expect(filteredClicks({ Clicks_History: { headers: CLICK_HEAD, rows: clickHistory() } }, [])).toBeNull();
    // Falls back to Perf_Clicks_Last7Days when there's no Clicks_History.
    expect(filteredClicks({ Perf_Clicks_Last7Days: { headers: CLICK_HEAD, rows: clickHistory().slice(0, 2) } }, ids)).toHaveLength(3);
  });
  it("leads carry device, city and keyword, never the click id", () => {
    const l = erp.find((x) => x.click)!;
    expect(Object.keys(l)).not.toContain("clid");
    expect(JSON.stringify(erp)).not.toContain(clidOf(0));
    expect(l.click!.city).not.toContain(",");
  });
});

describe("Campaign types from the data (Performance Max and more)", () => {
  // The fixture plus a Performance Max campaign with cheap clicks in bulk, and Display, YouTube and an unknown type.
  const extra: [string, string, string, number, number][] = [
    ["23107", "bs_pmax_nov", "PERFORMANCE_MAX", 12, 120],
    ["23108", "bs_display_nov", "DISPLAY", 3, 10],
    ["23109", "bs_video_nov", "VIDEO", 2, 8],
    ["23110", "bs_local_nov", "LOCAL_SERVICES", 1, 2],
  ];
  const head = tabs.Perf_Campaigns_Daily![0];
  const days = ["2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17", "2026-11-18"];
  const more: SheetData = {
    ...data,
    tabs: {
      ...tabs,
      Perf_Campaigns_Daily: [...tabs.Perf_Campaigns_Daily!, ...extra.flatMap(([id, name, type, cost, clicks]) => days.map((d) => [d, id, name, type, "ENABLED", clicks * 20, clicks, cost, 0, 0, "", ""]))],
      Setup_Campaigns: [...tabs.Setup_Campaigns!, ...extra.map(([id, name, type]) => [id, name, "ENABLED", type, 20, "MAXIMIZE_CONVERSIONS", ""])],
    },
  };
  expect(head[3]).toBe("Campaign type");
  const go = (qs: string) => blocks({ data: more, erp, joinReady: true, landings: landingsFrom("2026-11-16", "2026-11-18"), q: new URLSearchParams(qs), today: TODAY });
  it("the filter lists every type with spend, highest first; the page shows the top 3 + More past 4", () => {
    const b = go("");
    expect(b.channels.map((c) => c.key)).toEqual(["DEMAND_GEN", "SEARCH", "PERFORMANCE_MAX", "DISPLAY", "VIDEO", "LOCAL_SERVICES"]);
    expect(b.channels.find((c) => c.key === "PERFORMANCE_MAX")).toMatchObject({ label: "Performance Max", color: "#7B5CE0" });
    expect(b.channels.find((c) => c.key === "LOCAL_SERVICES")).toMatchObject({ label: "Local Services", color: "#7A7F8C" });
    const html = googleAdsHtml({ kind: "ok", query: new URLSearchParams("view=google-ads"), today: TODAY, data: more, stale: false, note: "", erp, joinReady: true, landings: null });
    const nav = html.slice(html.indexOf('aria-label="Channel"'), html.indexOf("</nav>", html.indexOf('aria-label="Channel"')));
    expect(nav.match(/<a /g)!.length).toBe(1 + 3 + 3);
    expect(nav).toContain("<summary>More</summary>");
    expect(nav).toContain("channel=local_services");
  });
  it("donut, stacked chart and spend split read the same config", () => {
    const b = go("");
    expect(b.spend.parts.find((p) => p.ch === "PERFORMANCE_MAX")).toMatchObject({ cost: 84, color: "#7B5CE0", label: "Performance Max" });
    expect(b.chart.stacks[0].key).toBe("SEARCH");
    expect(b.chart.stacks.map((s) => s.key)).toContain("PERFORMANCE_MAX");
    expect(b.kpis.find((k) => k.key === "spend")!.sub).toMatch(/^Demand Gen \d+ · Search \d+ · Performance Max 84$/);
  });
  it("accidental clicks on any non-Search type: Performance Max 840 clicks at AED 0.10, 0 leads", () => {
    const b = go("");
    expect(b.attn.find((a) => a.title === "bs_pmax_nov: 840 clicks, 0 leads")).toMatchObject({ level: "red", why: "AED 0.10 a click looks like accidental taps" });
  });
  it("Performance Max selected: its numbers; the Search-only blocks stay Search and say so", () => {
    const p = go("channel=performance_max");
    expect(p.channel).toBe("PERFORMANCE_MAX");
    expect(p.kpis.find((k) => k.key === "spend")!.value).toBe(84);
    expect(p.kpis.find((k) => k.key === "cpc")!.label).toBe("Avg CPC · Search");
    expect(p.funnel.channel).toBe("SEARCH");
    expect(p.terms.searchOnly).toBe(true);
    expect(p.pagesNote).toMatch(/Performance Max pages aren't/);
  });
});

describe("Change list: new settings from Setup_History", () => {
  it("bidding, budget and status changes read the first record after them", () => {
    const m = run("").chart.markers.map((x) => `${x.day} ${x.campaign} ${x.kind}: ${x.detail}${x.n > 1 ? ` (${x.n})` : ""}`);
    expect(m).toEqual([
      "2026-10-25 bs_mainland_search_101026 Status: Paused",
      "2026-11-02 bs_accounting_081026 Status: Paused",
      "2026-11-06 BS_DemandGen_Competitor_061126 Status: Enabled",
      "2026-11-10 fz_search_061026 Budget: AED 30/day",
      "2026-11-16 fz_search_061026 Bidding: Max clicks, cap AED 8",
      "2026-11-16 BS_DemandGen_Competitor_061126 Status: Enabled (2)",
    ]);
  });
  it("no record after the change: no detail (the page says 'budget changed')", () => {
    expect(changeDetail({ at: "2026-11-19 21:00", campaign: "fz_search_061026", kind: "Budget" }, [])).toBe("");
  });
});
