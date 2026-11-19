// Test data for the Google Ads view: a bridge response shaped exactly like the Apps Script's ({ ok, tabs: { name:
// { headers, rows } } }), the ERP's lead list (GET /api/resource/Lead → { data }) and the ad landing counter's daily
// hashes. Deterministic (seeded), dated around TODAY. No real names, phones, emails or click ids: the click ids are
// made-up "TESTCLID-…" strings, and every lead is a test lead.

export const TODAY = "2026-11-19";
const DAY = 86_400_000;
const add = (d, n) => new Date(Date.parse(`${d}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const days = (a, b) => { const out = []; for (let d = a; d <= b; d = add(d, 1)) out.push(d); return out; };
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const between = (a, b) => a + rnd() * (b - a);
const r2 = (v) => Math.round(v * 100) / 100;

export const CAMPAIGNS = [
  // id, name, type, status, budget, bidding, cap, first day, last day (spend), paused on
  ["23101", "fz_search_061026", "SEARCH", "ENABLED", 35, "MAXIMIZE_CLICKS", 8, "2026-10-07", TODAY, ""],
  ["23102", "bs_accounting_081026", "SEARCH", "PAUSED", 25, "MANUAL_CPC", 0, "2026-10-08", "2026-11-01", "2026-11-02"],
  ["23103", "BS_DemandGen_Competitor_061126", "DEMAND_GEN", "ENABLED", 30, "MAXIMIZE_CLICKS", 0, "2026-11-06", TODAY, ""],
  ["23104", "bs_mainland_search_101026", "SEARCH", "PAUSED", 20, "MANUAL_CPC", 0, "2026-10-10", "2026-10-24", "2026-10-25"],
  ["23105", "bs_brand_search_0910", "SEARCH", "PAUSED", 10, "MANUAL_CPC", 0, "", "", "2026-10-09"],
  ["23106", "bs_pmax_test", "PERFORMANCE_MAX", "REMOVED", 15, "MAXIMIZE_CONVERSIONS", 0, "", "", ""],
];

/* ---------- ERP leads: 19 Google Ads leads since 12 Oct, 18 qualified, 0 won, 15 from fz_search_061026, last on 5 Nov ---------- */
const LEADS = [
  ["2026-10-12 10:14", "fz_search_061026", "free zone setup cost", "Interested", 1],
  ["2026-10-14 16:02", "fz_search_061026", "cheapest free zone uae", "Open", 1],
  ["2026-10-14 18:40", "fz_search_061026", "free zone setup cost", "Replied", 1],
  ["2026-10-15 09:05", "bs_accounting_081026", "accounting services dubai", "Open", 1],
  ["2026-10-17 12:31", "bs_mainland_search_101026", "mainland company setup", "Interested", 0],
  ["2026-10-19 11:50", "fz_search_061026", "dmcc license cost", "Open", 1],
  ["2026-10-20 15:22", "fz_search_061026", "free zone setup cost", "Interested", 1],
  ["2026-10-21 13:00", "bs_accounting_081026", "bookkeeping dubai", "Junk", 0],
  ["2026-10-22 10:45", "fz_search_061026", "cheapest free zone uae", "Opportunity", 1],
  ["2026-10-24 17:10", "fz_search_061026", "free zone setup cost", "Open", 1],
  ["2026-10-26 09:30", "fz_search_061026", "dmcc company setup", "Replied", 1],
  ["2026-10-27 14:15", "bs_accounting_081026", "accounting services dubai", "Interested", 1],
  ["2026-10-28 16:44", "fz_search_061026", "rakez license cost", "Open", 1],
  ["2026-10-29 11:11", "fz_search_061026", "cheapest free zone uae", "Interested", 1],
  ["2026-10-31 10:02", "fz_search_061026", "shams free zone", "Open", 1],
  ["2026-11-02 12:20", "fz_search_061026", "free zone setup cost", "Replied", 1],
  ["2026-11-03 15:35", "fz_search_061026", "dmcc license cost", "Open", 1],
  ["2026-11-04 09:58", "fz_search_061026", "free zone setup cost", "Interested", 1],
  ["2026-11-05 13:47", "fz_search_061026", "cheapest free zone uae", "Open", 1],
];
// Click id, device and city per lead with a click id (1 = has one): the click history the bridge joins.
const DEVICES = ["MOBILE", "MOBILE", "DESKTOP", "MOBILE", "DESKTOP"];
const CITIES = ["Dubai,Dubai,United Arab Emirates", "Dubai,Dubai,United Arab Emirates", "Sharjah,Sharjah,United Arab Emirates", "Dubai,Dubai,United Arab Emirates", "Abu Dhabi,Abu Dhabi,United Arab Emirates"];
export const clidOf = (i) => `TESTCLID-${String(i + 1).padStart(4, "0")}-Cj0KCQiA`;

export function erpLeads() {
  const google = LEADS.map(([created, campaign, keyword, status, hasClid], i) => ({
    name: `CRM-LEAD-2026-${String(9001 + i)}`,
    creation: `${created}:00.000000`,
    status,
    source: "Google Ads",
    custom_platform: "google",
    custom_campaign: campaign,
    custom_ad_set_name: keyword,
    custom_ad_name: `${campaign === "fz_search_061026" ? "free_zone" : "general"}_7731${i}`,
    custom_clid: hasClid ? clidOf(i) : "",
    custom_form_name: "Free zone planner",
  }));
  // Not Google Ads: a website lead without tags, and a Meta lead. Both must stay out of every number.
  const other = [
    { name: "CRM-LEAD-2026-9101", creation: "2026-11-10 10:00:00.000000", status: "Open", source: "Website", custom_platform: "", custom_campaign: "", custom_ad_set_name: "", custom_ad_name: "", custom_clid: "", custom_form_name: "Callback" },
    { name: "CRM-LEAD-2026-9102", creation: "2026-11-12 12:00:00.000000", status: "Open", source: "Facebook", custom_platform: "facebook", custom_campaign: "meta_leads_1111", custom_ad_set_name: "uae", custom_ad_name: "x", custom_clid: "IwAR-test-0001", custom_form_name: "Callback" },
  ];
  return [...google, ...other].sort((a, b) => b.creation.localeCompare(a.creation));
}

/* ---------- Daily performance ---------- */
const searchLeadDays = new Map();
for (const [created, campaign] of LEADS) {
  const k = `${created.slice(0, 10)}|${campaign}`;
  searchLeadDays.set(k, (searchLeadDays.get(k) ?? 0) + 1);
}

function campaignDaily() {
  const rows = [];
  for (const [id, name, type, status, , , , first, last] of CAMPAIGNS) {
    if (!first) continue;
    for (const d of days(first, last)) {
      const dg = type === "DEMAND_GEN";
      const today = d === TODAY;
      const part = today ? 0.45 : 1;
      let cost, clicks, impr;
      if (dg) {
        cost = between(26, 34) * part;
        clicks = Math.round(cost / between(0.06, 0.075));
        impr = Math.round(clicks * between(38, 46));
      } else if (name === "fz_search_061026") {
        cost = between(18, 26) * part;
        // From 16 Nov a Max CPC cap of AED 8 (Maximize clicks): cheaper clicks.
        clicks = Math.round(cost / (d >= "2026-11-16" ? between(1.3, 1.6) : between(3.3, 3.8)));
        impr = Math.round(clicks * between(13, 16));
      } else {
        cost = between(12, 18) * part;
        clicks = Math.round(cost / between(3.6, 4.4));
        impr = Math.round(clicks * between(14, 18));
      }
      const conv = searchLeadDays.get(`${d}|${name}`) ?? 0;
      const is = dg ? "" : r2(between(0.28, 0.36));
      const lost = dg ? "" : name === "fz_search_061026" ? r2(between(0.6, 0.7)) : r2(between(0.1, 0.2));
      rows.push([d, id, name, type, status, impr, clicks, r2(cost), conv, conv, is, lost]);
    }
  }
  return rows;
}

const PERF_CAMPAIGN_HEAD = ["Date", "Campaign ID", "Campaign", "Campaign type", "Campaign status", "Impr.", "Clicks", "Cost (AED)", "Conversions", "All conv.", "Search impr. share", "Lost IS (budget)"];

function devicesDaily(camp) {
  const rows = [];
  for (const [d, , name, type, , impr, clicks, cost, conv] of camp) {
    const mob = type === "DEMAND_GEN" ? 0.9 : 0.71;
    rows.push([d, name, type, "MOBILE", Math.round(impr * mob), Math.round(clicks * mob), r2(cost * mob), conv ? Math.ceil(conv * mob) : 0]);
    rows.push([d, name, type, "DESKTOP", impr - Math.round(impr * mob), clicks - Math.round(clicks * mob), r2(cost - r2(cost * mob)), conv ? conv - Math.ceil(conv * mob) : 0]);
  }
  return rows;
}

function searchTerms() {
  // Over the last 30 days of fz_search_061026: [term, cost, conv, added/excluded]
  const T = [
    ["free zone setup cost", 64.2, 3, "Added"],
    ["cheapest free zone uae", 41.5, 2, "None"],
    ["dmcc company setup", 22.1, 1, "None"],
    ["free zone jobs dubai", 26.4, 0, "None"],
    ["freezone visa price list", 22.8, 0, "None"],
    ["meydan racecourse", 21.3, 0, "None"],
    ["dmcc license cost", 24.9, 0, "None"], // an ERP lead's keyword: linked, so not wasted
    ["free visa dubai", 30.0, 0, "Excluded"], // already excluded: not wasted
    ["ifza login", 9.2, 0, "None"], // under AED 20
    ["rakez portal", 8.1, 0, "None"],
  ];
  const rows = [];
  T.forEach(([term, cost, conv, added], i) => {
    // Split each term over two days in the window.
    const d1 = add(TODAY, -3 - i), d2 = add(TODAY, -12 - i);
    const half = r2(cost / 2);
    rows.push([d1, "fz_search_061026", "Free zone", term, added, "free zone setup", 30, 4, half, conv ? Math.ceil(conv / 2) : 0]);
    rows.push([d2, "fz_search_061026", "Free zone", term, added, "free zone setup", 25, 3, r2(cost - half), conv ? conv - Math.ceil(conv / 2) : 0]);
  });
  return rows;
}

export function bridgeResponse() {
  seed = 7;
  const camp = campaignDaily();
  const setupHead = ["Campaign ID", "Campaign", "Campaign status", "Campaign type", "Daily budget (AED)", "Bidding", "Max CPC cap (AED)"];
  const tabs = {
    _Status: { headers: ["Label", "Value"], rows: [["Updated", `${TODAY} 13:04`], ["Script version", "2.3"], ["Data from", "2026-10-07"], ["Ad approval data", "available"]] },
    Alerts: {
      headers: [`Checked at ${TODAY} 13:05`, "Type", "Where", "Detail"],
      rows: [
        ["", "No leads", "BS_DemandGen_Competitor_061126", "AED 389.40 spent, 0 conversions in 14 days"],
        ["", "Budget", "fz_search_061026", "Limited by budget on 6 of the last 7 days"],
      ],
    },
    Perf_Campaigns_Daily: { headers: PERF_CAMPAIGN_HEAD, rows: camp },
    Perf_AdGroups_Daily: {
      headers: ["Date", "Campaign", "Ad group ID", "Ad group", "Ad group status", "Impr.", "Clicks", "Cost (AED)", "Conversions"],
      rows: camp.filter((r) => r[2] === "fz_search_061026").map((r) => [r[0], r[2], "5501", "Free zone", "ENABLED", r[5], r[6], r[7], r[8]]),
    },
    Perf_Ads_Daily: {
      headers: ["Date", "Campaign", "Ad group", "Ad ID", "Impr.", "Clicks", "Cost (AED)", "Conversions"],
      rows: camp.filter((r) => r[2] === "fz_search_061026").map((r) => [r[0], r[2], "Free zone", "7701", r[5], r[6], r[7], r[8]]),
    },
    Perf_Conversions_Daily: {
      headers: ["Date", "Campaign", "Conversion action", "Conversion category", "Conversions", "All conv."],
      rows: camp.filter((r) => r[8] > 0).map((r) => [r[0], r[2], "Google Ads - Lead Form Submit", "SUBMIT_LEAD_FORM", r[8], r[8]]),
    },
    Perf_Devices_Daily: { headers: ["Date", "Campaign", "Campaign type", "Device", "Impr.", "Clicks", "Cost (AED)", "Conversions"], rows: devicesDaily(camp) },
    Perf_Keywords_Daily: {
      headers: ["Date", "Campaign", "Ad group", "Keyword", "Match type", "Impr.", "Clicks", "Cost (AED)", "Conversions", "Search impr. share"],
      rows: camp.filter((r) => r[2] === "fz_search_061026").flatMap((r) => [
        [r[0], r[2], "Free zone", "free zone setup", "PHRASE", Math.round(r[5] * 0.6), Math.round(r[6] * 0.6), r2(r[7] * 0.6), r[8], 0.35],
        [r[0], r[2], "Free zone", "dmcc license", "BROAD", r[5] - Math.round(r[5] * 0.6), r[6] - Math.round(r[6] * 0.6), r2(r[7] - r2(r[7] * 0.6)), 0, 0.22],
      ]),
    },
    Perf_SearchTerms_Daily: { headers: ["Date", "Campaign", "Ad group", "Search term", "Added / excluded", "Matched keyword", "Impr.", "Clicks", "Cost (AED)", "Conversions"], rows: searchTerms() },
    Perf_Locations_30d: {
      headers: ["Campaign", "City", "Impr.", "Clicks", "Cost (AED)", "Conversions"],
      rows: [
        ["fz_search_061026", "Dubai", 9800, 702, 611.9, 9],
        ["fz_search_061026", "Sharjah", 2100, 140, 140.6, 1],
        ["fz_search_061026", "Abu Dhabi", 1500, 92, 98.2, 0],
        ["fz_search_061026", "Ajman", 600, 33, 37.4, 0],
        ["BS_DemandGen_Competitor_061126", "Dubai", 260000, 4020, 252.3, 0],
        ["BS_DemandGen_Competitor_061126", "Sharjah", 90000, 1302, 88.1, 0],
      ],
    },
    Perf_CampaignAssets_30d: {
      headers: ["Campaign", "Asset slot", "Sitelink text", "Callout", "Impr.", "Clicks"],
      rows: [["fz_search_061026", "SITELINK", "Budget breakdown", "", 3200, 41], ["fz_search_061026", "SITELINK", "Compare free zones", "", 2900, 22], ["fz_search_061026", "CALLOUT", "", "Licence in 5 days", 6100, ""]],
    },
    Setup_Campaigns: { headers: setupHead, rows: CAMPAIGNS.map(([id, n, t, s, b, bid, cap]) => [id, n, s, t, b, bid, cap || ""]) },
    Setup_Keywords: {
      headers: ["Campaign", "Ad group", "Keyword", "Match type", "Status", "Negative", "Quality Score", "Expected CTR", "Ad relevance", "Landing page experience", "Keyword final URL"],
      rows: [
        ["fz_search_061026", "Free zone", "free zone setup", "PHRASE", "ENABLED", "FALSE", 7, "ABOVE_AVERAGE", "AVERAGE", "ABOVE_AVERAGE", "https://business.best-solution.ae/freezone"],
        ["fz_search_061026", "Free zone", "dmcc license", "BROAD", "ENABLED", "FALSE", 4, "BELOW_AVERAGE", "AVERAGE", "AVERAGE", ""],
      ],
    },
    Setup_Ads: {
      headers: ["Campaign", "Ad group", "Ad ID", "Ad type", "Ad status", "Ad strength", "Ad approval", "Final URL", "Path 1", "Path 2"],
      rows: [["fz_search_061026", "Free zone", "7701", "RESPONSIVE_SEARCH_AD", "ENABLED", "GOOD", "APPROVED", "https://business.best-solution.ae/freezone", "free-zone", "cost"]],
    },
    Change_Log_30d: {
      headers: ["Changed at", "Changed by", "Changed from", "What changed", "Action", "Fields changed", "Campaign", "Ad group"],
      rows: [
        ["2026-10-25 10:00", "owner@example.com", "Google Ads web", "CAMPAIGN", "UPDATE", "status", "bs_mainland_search_101026", ""],
        ["2026-11-02 11:00", "owner@example.com", "Google Ads web", "CAMPAIGN", "UPDATE", "status", "bs_accounting_081026", ""],
        ["2026-11-06 09:30", "bibin@example.com", "Google Ads web", "CAMPAIGN", "CREATE", "status, name, campaign_budget", "BS_DemandGen_Competitor_061126", ""],
        ["2026-11-10 12:15", "owner@example.com", "Google Ads web", "CAMPAIGN_BUDGET", "UPDATE", "amount_micros", "fz_search_061026", ""],
        ["2026-11-16 08:50", "owner@example.com", "Google Ads web", "CAMPAIGN", "UPDATE", "maximize_clicks.cpc_bid_ceiling_micros", "fz_search_061026", ""],
        ["2026-11-16 09:10", "bibin@example.com", "Google Ads web", "CAMPAIGN", "UPDATE", "status", "BS_DemandGen_Competitor_061126", ""],
        ["2026-11-16 17:40", "bibin@example.com", "Google Ads web", "CAMPAIGN", "UPDATE", "status", "BS_DemandGen_Competitor_061126", ""],
      ],
    },
    Setup_History: {
      headers: ["Recorded at", "Type", "ID", "Name", "Campaign", "Settings (JSON)"],
      rows: [
        ["2026-10-24 06:00", "Campaign", "23104", "bs_mainland_search_101026", "bs_mainland_search_101026", JSON.stringify({ status: "ENABLED", budget: 20 })],
        ["2026-10-25 13:00", "Campaign", "23104", "bs_mainland_search_101026", "bs_mainland_search_101026", JSON.stringify({ status: "PAUSED", budget: 20 })],
        ["2026-11-10 13:00", "Campaign", "23101", "fz_search_061026", "fz_search_061026", JSON.stringify({ status: "ENABLED", budget: 30, bidding: "MAXIMIZE_CLICKS" })],
        ["2026-11-16 13:00", "Campaign", "23101", "fz_search_061026", "fz_search_061026", JSON.stringify({ status: "ENABLED", budget: 35, bidding: "MAXIMIZE_CLICKS", cap: 8 })],
        ["2026-11-02 13:00", "Campaign", "23102", "bs_accounting_081026", "bs_accounting_081026", JSON.stringify({ status: "PAUSED", budget: 25, bidding: "MANUAL_CPC" })],
        ["2026-11-06 13:00", "Campaign", "23103", "BS_DemandGen_Competitor_061126", "BS_DemandGen_Competitor_061126", JSON.stringify({ status: "ENABLED", budget: 30, bidding: "MAXIMIZE_CLICKS" })],
        ["2026-11-16 13:00", "Campaign", "23103", "BS_DemandGen_Competitor_061126", "BS_DemandGen_Competitor_061126", JSON.stringify({ status: "PAUSED", budget: 30, bidding: "MAXIMIZE_CLICKS" })],
        ["2026-11-16 20:00", "Campaign", "23103", "BS_DemandGen_Competitor_061126", "BS_DemandGen_Competitor_061126", JSON.stringify({ status: "ENABLED", budget: 30, bidding: "MAXIMIZE_CLICKS" })],
      ],
    },
  };
  return { ok: true, tabs };
}

/** The click history rows of the leads' click ids (same headers as Perf_Clicks_Last7Days). */
export const CLICK_HEAD = ["Date", "Campaign", "Ad group", "GCLID", "Device", "Network", "Keyword", "Match type", "City", "Results page", "Clicks"];
export function clickHistory() {
  return LEADS.flatMap(([created, campaign, keyword, , has], i) =>
    has ? [[created.slice(0, 10), campaign, "Free zone", clidOf(i), DEVICES[i % 5], "SEARCH", keyword, "PHRASE", CITIES[i % 5], "1", 1]] : [],
  );
}
/** Unrelated clicks: an unfiltered bridge would send these too. */
export const otherClicks = () => [["2026-11-18", "fz_search_061026", "Free zone", "TESTCLID-UNRELATED-0001", "MOBILE", "SEARCH", "free zone", "PHRASE", "Dubai,Dubai,United Arab Emirates", "1", 1]];

/** The bridge as updated: the click tabs only when asked, filtered to the click ids sent. */
export function bridgeAnswer(body) {
  const res = bridgeResponse();
  if (Array.isArray(body?.clickIds) && body.clickIds.length && body.tabs?.includes("Clicks_History")) {
    const want = new Set(body.clickIds);
    res.tabs.Clicks_History = { headers: CLICK_HEAD, rows: clickHistory().filter((r) => want.has(r[3])) };
  }
  if (Array.isArray(body?.tabs)) for (const t of Object.keys(res.tabs)) if (!body.tabs.includes(t)) delete res.tabs[t];
  return res;
}

/* ---------- Ad landing counter (counting started 16 Nov) ---------- */
export function kvDays() {
  const out = {};
  for (const d of days("2026-11-16", TODAY)) {
    const part = d === TODAY ? 0.5 : 1;
    const f = (n) => Math.max(0, Math.round(n * part));
    out[d] = [
      "/freezone|gclid|land", f(8), "/freezone|gbraid|land", f(2), "/freezone|gclid|shown", f(9),
      "/freezone/budget|gclid|land", f(2), "/freezone/dmcc|gclid|land", f(1), "/freezone/meydan|gclid|land", f(1),
      "/services|gclid|land", f(310), "/services|gbraid|land", f(80), "/services|gclid|shown", f(300),
    ].map(String);
  }
  return out;
}
