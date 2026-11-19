import { CSS, dashCss, esc, href, sprite, topbar, viewSwitch, type Freshness } from "@/lib/adLandingsPage";
import { REPORT_START } from "@/lib/adsReport";
import { biddingLabel, blocks, dayMonth, span, type Blocks, type Kpi } from "@/lib/googleAdsBlocks";
import { THRESHOLDS, erpFor, friendly, kwKey, lowQualityScore, noLeadKeyword, pausedSince, type Attention, type ErpLead } from "@/lib/googleAdsInsights";
import type { Entry } from "@/lib/adLandingsReport";
import type { Diagnosis, SheetData } from "@/lib/googleAdsSheet";
import {
  DASH,
  PERIODS,
  adGroupRows,
  adRows,
  campaignRows,
  channelInfo,
  conversionRows,
  cpc,
  div,
  fmtAed,
  fmtNum,
  fmtShare,
  freshness,
  historyEntities,
  historySteps,
  imprShare,
  inPeriod,
  keywordRows,
  nextRun,
  rowsOf,
  searchTermRows,
  stampMs,
  stampOf,
  statusOf,
  str,
  type AdRow,
  type CampaignRow,
  type KeywordRow,
  type NamedRow,
  type Row,
  type TermRow,
  type Totals,
} from "@/lib/googleAdsReport";

/*
  The Google Ads view of the ads dashboard (/ads-report?view=google-ads), rendered on the server in the dashboard's light
  "Copper & Glass" look (the same header, page, cards and copper accent as ERP status and Ad landings: their styles are
  reused, the gx-* rules below only add this view's parts). Numbers come from lib/googleAdsBlocks (the Sheet through the
  Apps Script bridge, the ERP's Google Ads leads, the ad landing counter); this file only lays them out, top to bottom:
  header and filters, tracking banner, KPIs, the 30-day chart with Needs attention and Budget to redirect, channel /
  lead quality / funnel, cost per qualified lead and the lead heatmap, devices / cities / landing pages, search terms
  and campaigns, then "All details" (one tabbed table). Charts are inline SVG.
  Query: ?range=today|7d|30d|month or ?from=&to=, ?channel=<campaign type, e.g. search, demand_gen>,
  ?details=<tab> (opens All details on that tab), ?hist=<id> (settings history), ?note= (after Refresh).
*/

/* ---------- Formatting ---------- */

const aed0 = (v: number | null) => (v == null || !Number.isFinite(v) ? DASH : `AED ${Math.round(v).toLocaleString("en-US")}`);
const aed2 = (v: number | null) => (v == null || !Number.isFinite(v) ? DASH : `AED ${v.toFixed(2)}`);
const n0 = (v: number | null) => (v == null || !Number.isFinite(v) ? DASH : Math.round(v).toLocaleString("en-US"));
const pct = (v: number | null, dp = 0) => (v == null || !Number.isFinite(v) ? DASH : `${(v * 100).toFixed(dp)}%`);
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
const pretty = (s: string) => (s ? (s[0] + s.slice(1).toLowerCase()).replace(/_/g, " ") : DASH);
const svg = (paths: string, size = 16, extra = "") => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${paths}</svg>`;
const I = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
  alert: '<path d="M12 8v5"/><path d="M12 17h.01"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/>',
};
/** A small "i" that shows its text on hover and keyboard focus. */
const tip = (label: string, text: string) => `<span class="gx-tip" tabindex="0" role="note" aria-label="${esc(`${label}: ${text}`)}" data-tip="${esc(text)}">${svg(I.info, 14)}</span>`;
// Channel colours live in CHANNELS (googleAdsReport); these are the status colours of the light theme.
const COLORS = { search: channelInfo("SEARCH").color, extra: "#7B5CE0", good: "#12A16B", bad: "#D64545", warn: "#E09A1E", grey: "#A9A39B" } as const;
/** A channel colour darkened enough for small text on the light cards (AA). */
const ink = (c: string) => `color-mix(in srgb, ${c} 72%, #000)`;

/** Change chip: arrow and words, not colour alone. */
function chip(ch: number | null, tone: "good" | "bad" | "neu", vsWords: string) {
  if (ch == null) return "";
  const p = Math.round(ch * 100);
  const dir = p > 0 ? "up" : p < 0 ? "down" : "flat";
  return `<span class="chip" data-tone="${tone}"><span aria-hidden="true">${dir === "up" ? "▲" : dir === "down" ? "▼" : "→"}</span>${Math.abs(p)}%<span class="sr"> ${dir === "flat" ? "no change" : dir} vs ${esc(vsWords)}</span></span>`;
}

/* ---------- Small charts ---------- */

function spark(vals: number[], color: string, id: string) {
  const v = vals.length > 1 ? vals : [vals[0] ?? 0, vals[0] ?? 0];
  const max = Math.max(...v), min = Math.min(...v), rng = max - min || 1;
  const pts = v.map((y, i) => [(i / (v.length - 1)) * 120, 3 + (1 - (y - min) / rng) * 30]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return `<svg class="gx-spark" viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${line} L120,36 L0,36 Z" fill="url(#${id})"/><path d="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}

const C = 2 * Math.PI * 54;
function donut(parts: { v: number; c: string }[], label: string, center: string, size = 140, stroke = 16) {
  const tot = parts.reduce((s, p) => s + p.v, 0);
  let acc = 0;
  const gap = parts.filter((p) => p.v > 0).length > 1 ? 4 : 0;
  const segs = tot
    ? parts
        .filter((p) => p.v > 0)
        .map((p) => {
          const len = (p.v / tot) * C;
          const s = `<circle cx="70" cy="70" r="54" fill="none" stroke="${p.c}" stroke-width="${stroke}" stroke-dasharray="${Math.max(len - gap, 0.5).toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-acc).toFixed(1)}"/>`;
          acc += len;
          return s;
        })
        .join("")
    : "";
  return `<div class="gx-donut" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" viewBox="0 0 140 140" role="img" aria-label="${esc(label)}"><g transform="rotate(-90 70 70)"><circle cx="70" cy="70" r="54" fill="none" stroke="#EFE9E2" stroke-width="${stroke}"/>${segs}</g></svg><div class="gx-donut__c">${center}</div></div>`;
}

/** A card in the dashboard's light glass style, its title like the other views' card titles. */
const card = (id: string, title: string, sub: string, body: string, extra = "", cls = "") =>
  `<section class="lr-card gx-card ${cls}" aria-labelledby="${id}-t"${id ? ` id="${id}"` : ""}><div class="ct"><h2 class="lr-card__title" id="${id}-t">${esc(title)}</h2>${sub ? `<span class="cap">· ${esc(sub)}</span>` : ""}${extra ? `<span class="ct__x">${extra}</span>` : ""}</div>${body}</section>`;
const none = (text: string) => `<p class="gx-none">${esc(text)}</p>`;

/* ---------- 1. Header ---------- */

function head(b: Blocks, q: URLSearchParams, today: string) {
  const p = b.period;
  const seg = (items: [string, string][], key: string, cur: string, label: string) =>
    `<nav class="seg" aria-label="${label}">${items.map(([k, l]) => `<a href="${esc(href(q, { [key]: k, from: null, to: null, note: null }))}"${cur === k ? ' aria-current="page"' : ""}>${esc(l)}</a>`).join("")}<button type="button" class="gx-custom-btn" aria-expanded="${p.error ? "true" : "false"}" aria-controls="gx-custom"${p.key === "custom" ? ' aria-current="page"' : ""}>${p.key === "custom" ? esc(span(p.from, p.to)) : "Custom"}</button></nav>`;
  const keep = q.get("channel") ? `<input type="hidden" name="channel" value="${esc(q.get("channel"))}">` : "";
  // Channel: All + each campaign type with spend in the period (highest first); more than 4 → the top 3 + "More".
  const chHref = (k: string) => esc(href(q, { channel: k === "all" ? null : k.toLowerCase(), note: null }));
  const chLink = (k: string, label: string) => `<a href="${chHref(k)}"${b.channel === k ? ' aria-current="page"' : ""}>${esc(label)}</a>`;
  const shown = b.channels.length > 4 ? b.channels.slice(0, 3) : b.channels;
  const rest = b.channels.slice(shown.length);
  const restOn = rest.some((c) => c.key === b.channel);
  const channelNav = `<nav class="seg gx-chseg" aria-label="Channel">${chLink("all", "All")}${shown.map((c) => chLink(c.key, c.label)).join("")}${
    rest.length
      ? `<details class="gx-more-ch"><summary${restOn ? ' aria-current="page"' : ""}>${restOn ? esc(rest.find((c) => c.key === b.channel)!.label) : "More"}</summary><div class="gx-more-ch__m">${rest.map((c) => chLink(c.key, c.label)).join("")}</div></details>`
      : ""
  }</nav>`;
  return `<div class="gx-head">
      <div class="gx-head__t"><p class="gx-kicker">Best Solution Management Services · ${esc(span(p.from, p.to))} vs ${esc(span(p.prevFrom, p.prevTo))}</p><h1>Google Ads</h1></div>
      ${seg(PERIODS.map(([k, l]) => [k, l]), "range", p.key, "Period")}
      ${channelNav}
      <a class="gx-refresh" href="${esc(href(q, { refresh: "1", note: null }))}" aria-label="Refresh (once every 2 minutes)" title="Refresh (once every 2 minutes)">${svg(I.refresh, 17)}</a>
    </div>
    <form class="gx-customf" id="gx-custom" method="get" action=""${p.error ? "" : " hidden"} aria-label="Custom period">
      <input type="hidden" name="view" value="google-ads">${keep}
      <label>From <input type="date" name="from" value="${esc(p.from)}" max="${esc(today)}" required></label>
      <label>To <input type="date" name="to" value="${esc(p.to)}" max="${esc(today)}" required></label>
      <button type="submit">Apply</button>
      ${p.error ? `<p class="gx-err" role="alert">${esc(p.error)}</p>` : ""}
    </form>`;
}

/* ---------- 2. Tracking banner and the form test ---------- */

function banner(b: Blocks) {
  if (!b.banner) return "";
  const { since, landings, leads } = b.banner;
  return `<div class="gx-banner" role="alert">
      <span class="gx-banner__i">${svg(I.alert, 16, ' stroke-width="2.6"')}</span>
      <p><b>Lead tracking under test since ${esc(since ? dayMonth(since) : DASH)}</b> · ${landings != null ? `${n0(landings)} landings, ` : ""}${plural(leads, b.leadSource === "google" ? "Google conversion" : "form lead")}. Lead numbers may be missing.</p>
      <button type="button" class="gx-banner__b" aria-expanded="false" aria-controls="form-test">Run form test</button>
    </div>
    <section class="lr-card gx-card gx-test" id="form-test" hidden aria-labelledby="form-test-t">
      <div class="ct"><h2 class="lr-card__title" id="form-test-t">Form test · 5 steps</h2></div>
      <ol>
        <li>Open Google Tag Manager, click <b>Preview</b> and connect it to <b>business.best-solution.ae/freezone</b>.</li>
        <li>Send the form as a test lead: name <b>Test</b>, phone <b>050 000 0000</b>.</li>
        <li>In the Preview window, check that the tag <b>"Google Ads - Lead Form Submit"</b> fired on the thank-you step.</li>
        <li>Check that the test lead arrived in the ERP (and in this view after the next ERP refresh, up to 5 minutes).</li>
        <li>Delete the test lead in the ERP, so it never counts as a real lead.</li>
      </ol>
      <p class="cap">If the tag didn't fire, the form works but Google Ads can't see leads: fix the tag before changing ads or budgets.</p>
    </section>`;
}

/* ---------- 3. KPIs ---------- */

const KPI_COLOR: Record<Kpi["key"], string> = { spend: COLORS.search, clicks: COLORS.extra, cpc: COLORS.search, leads: COLORS.good, cpl: COLORS.good };

function kpis(b: Blocks) {
  const vs = span(b.period.prevFrom, b.period.prevTo);
  return `<div class="gx-kpis">${b.kpis
    .map((k, i) => {
      const value = k.value != null ? (k.key === "cpc" ? aed2(k.value) : k.money ? aed0(k.value) : n0(k.value)) : k.text ?? DASH;
      const color = k.key === "leads" && k.value === 0 ? COLORS.bad : KPI_COLOR[k.key];
      // Label row: the label only. The change chip sits right of the number; a target is plain text under it.
      return `<section class="lr-card gx-card gx-kpi" aria-label="${esc(k.label)}">
        <div class="gx-kpi__top"><h3 class="lr-card__title" title="${esc(k.label)}">${esc(k.label)}</h3></div>
        <div class="gx-kpi__vr"><p class="num gx-kpi__v${k.value == null && !k.text ? " is-na" : ""}">${esc(k.value == null && !k.text ? DASH : value)}</p>${k.delta ? chip(k.delta.ch, k.delta.tone, vs) : ""}</div>
        ${k.chip ? `<p class="cap gx-kpi__tgt">${esc(k.chip)}</p>` : ""}
        ${k.reason ? `<p class="cap gx-kpi__why">${esc(k.reason)}</p>` : k.gauge ? gauge(k.gauge.value, k.gauge.target) : spark(k.spark, color, `kg${i}`)}
        <p class="cap">${esc(k.sub || " ")}</p>
      </section>`;
    })
    .join("")}</div>`;
}

/** Since start vs the target: a bar on a 0 – 2 × target scale with the target marked at the middle; red over, green under. */
function gauge(v: number, target: number) {
  const over = v > target;
  return `<div class="gx-gauge" role="img" aria-label="${esc(`Since start: ${aed0(v)} per qualified lead, target ${aed0(target)}, ${over ? "over" : "under"} target`)}">
    <div class="gx-gauge__top"><span class="cap">Since start</span><b data-tone="${over ? "bad" : "good"}">${esc(aed0(v))}</b></div>
    <div class="gx-gauge__tr" aria-hidden="true"><span data-kind="${over ? "over" : "under"}" style="width:${Math.min(100, (v / (2 * target)) * 100).toFixed(1)}%"></span><i></i></div>
    <div class="gx-gauge__t cap" aria-hidden="true">target ${esc(aed0(target))}</div>
  </div>`;
}

/* ---------- 4. Spend and leads, last 30 days ---------- */

const KIND_WORD = { Status: "status changed", Budget: "budget changed", Bidding: "bidding changed" } as const;
/** How lead numbers are named, by where they come from. */
const LEADS_WORD = { erp: "Leads (ERP)", sheet: "Leads (lead log)", google: "Google conversions" } as const;
const SOURCE_WORD = { erp: "ERP", sheet: "lead log", google: "Google conversions" } as const;
/** One lead number, for plural(): "lead" only where the numbers are leads (ERP, lead log). */
const UNIT = { erp: "lead", sheet: "lead", google: "Google conversion" } as const;
/** "3 leads", or "3 conv." in the Google conversions fallback (the abbreviation has no plural). */
const nLeads = (src: keyof typeof UNIT, n: number) => (src === "google" ? `${n0(n)} conv.` : plural(n, "lead"));

/** Round steps (1, 2, 2.5 or 5 × 10ⁿ): three gridlines above 0, the top about 15% above the highest day. */
function threeTicks(max: number) {
  const raw = Math.max(1, max * 1.15) / 3;
  const p = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw)!;
  return [0, step, 2 * step, 3 * step];
}

/** The All details panel on a tab (and opened there). */
const detailsHref = (q: URLSearchParams, tab: string) => `${href(q, { details: tab, hist: null, refresh: null, note: null })}#details`;

function chart(b: Blocks, today: string, q: URLSearchParams) {
  const c = b.chart;
  const n = c.days.length;
  const tops = c.days.map((d) => d.costs.reduce((s, v) => s + v, 0));
  const ticks = threeTicks(Math.max(0, ...tops)), max = ticks[3];
  // The plot stretches to the card's height: lines and areas in a 1000 × 1000 box drawn without keeping the aspect
  // ratio; dots, labels and pills are HTML on top (positions in %), so circles and text never stretch.
  const px = (i: number) => (i / Math.max(1, n - 1)) * 100;
  const py = (v: number) => (1 - v / max) * 100;
  const cum = c.stacks.map((_, k) => c.days.map((d) => d.costs.slice(0, k + 1).reduce((s, v) => s + v, 0)));
  // Soft gradients on light: about 35% at the top, nothing at the bottom; plain 2px lines, no glow.
  const grads = c.stacks.map((s, k) => `<linearGradient id="gk${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity=".35"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient>`).join("");
  // Each type is drawn from its first day with spend (Demand Gen starts mid-chart), so its line never runs over Search.
  const areas = c.stacks
    .map((s, k) => {
      const from = Math.max(0, c.days.findIndex((d) => d.costs[k] > 0));
      const seg = (vals: number[]) => vals.map((v, i) => [i, v] as const).slice(from);
      const line = seg(cum[k]).map(([i, v], j) => `${j ? "L" : "M"}${(px(i) * 10).toFixed(1)},${(py(v) * 10).toFixed(1)}`).join(" ");
      const base = seg(k ? cum[k - 1] : c.days.map(() => 0)).reverse().map(([i, v]) => `L${(px(i) * 10).toFixed(1)},${(py(v) * 10).toFixed(1)}`).join(" ");
      return `<path d="${line} ${base} Z" fill="url(#gk${k})"/><path d="${line}" fill="none" stroke="${s.color}" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
    })
    .join("");
  const grid = ticks.map((v) => `<line x1="0" x2="1000" y1="${(py(v) * 10).toFixed(1)}" y2="${(py(v) * 10).toFixed(1)}" stroke="${v ? "rgba(20,37,62,.08)" : "rgba(20,37,62,.18)"}" vector-effect="non-scaling-stroke"/>`).join("");
  const yl = ticks.map((v) => `<span class="gx-ay" style="top:${py(v).toFixed(2)}%">${n0(v)}</span>`).join("");
  const xl = [0, 7, 14, 21, n - 1].map((i, k) => `<span class="gx-ax${k % 2 ? " gx-ax--wide" : ""}" style="left:${px(i).toFixed(2)}%">${esc(dayMonth(c.days[i].day))}</span>`).join("");
  // Lead dots float just above the top line on lead days, bigger with more leads.
  const dots = c.leadsKnown
    ? c.days.map((d, i) => (d.leads ? `<span class="gx-ld" style="left:${px(i).toFixed(2)}%;top:${py(tops[i]).toFixed(2)}%;--r:${4 + 2 * Math.min(d.leads, 3)}px" title="${esc(`${dayMonth(d.day)} · ${plural(d.leads, UNIT[b.leadSource])}`)}"></span>` : "")).join("")
    : "";
  // Two labels at most: the newest channel start ("Demand Gen on") and the newest bidding or budget change, with its new
  // value (a status change only when there's none: channel starts have their own label).
  const start = c.stacks
    .map((s, k) => ({ s, i: c.days.findIndex((d) => d.costs[k] > 0) }))
    .filter(({ s, i }) => s.key !== "SEARCH" && i > 0)
    .sort((a, z) => z.i - a.i)[0];
  const last = c.markers.filter((m) => m.kind !== "Status").at(-1) ?? c.markers.at(-1);
  const lastI = last ? c.days.findIndex((d) => d.day === last.day) : -1;
  const vline = (x: number, color: string, dash: string) => `<line x1="${(x * 10).toFixed(1)}" x2="${(x * 10).toFixed(1)}" y1="0" y2="1000" stroke="${color}" stroke-dasharray="${dash}" vector-effect="non-scaling-stroke"/>`;
  const side = (x: number) => (x > 70 ? "end" : x < 30 ? "start" : "mid");
  const pills = [
    start ? `<span class="gx-on" data-side="${side(px(start.i))}" style="left:${px(start.i).toFixed(2)}%;color:${ink(start.s.color)}">${esc(start.s.label)} on</span>` : "",
    last && lastI >= 0
      ? `<span class="gx-pill" data-side="${side(px(lastI))}" style="left:${px(lastI).toFixed(2)}%" title="${esc(`${last.campaign}${last.who ? ` · by ${last.who}` : ""}`)}">${esc(dayMonth(last.day))} · <span class="gx-pill__n">${esc(friendly(last.campaign))} · </span>${esc(last.detail || KIND_WORD[last.kind])}</span>`
      : "",
  ].join("");
  const lines = `${start ? vline(px(start.i), start.s.color, "3 6") : ""}${last && lastI >= 0 ? vline(px(lastI), "rgba(20,37,62,.45)", "4 6") : ""}`;
  // Per-day numbers for the tooltip (hover, or focus the chart and use the arrow keys).
  const tipDays = c.days.map((d) => ({
    t: `${dayMonth(d.day)}${d.day === today ? " (partial)" : ""}`,
    r: [...c.stacks.map((s, k) => [s.label, aed0(d.costs[k])]), [b.leadSource === "google" ? "Conversions" : "Leads", c.leadsKnown ? String(d.leads) : DASH]],
  }));
  const f = c.foot;
  const label = `Daily spend, last 30 days: ${c.stacks.map((s, k) => `${s.label} ${aed0(c.days.reduce((a, d) => a + d.costs[k], 0))}`).join(", ") || "no spend"}. ${f.leads == null ? "ERP leads not connected." : `${plural(f.leads, b.leadSource === "erp" ? "ERP lead" : UNIT[b.leadSource])}.`}${c.lastLead ? ` Last ${b.leadSource === "google" ? "conversion" : "lead"} ${dayMonth(c.lastLead)}.` : ""}${start ? ` ${start.s.label} started ${dayMonth(c.days[start.i].day)}.` : ""}${last ? ` Latest change: ${dayMonth(last.day)}, ${friendly(last.campaign)}, ${last.detail || KIND_WORD[last.kind]}.` : ""}`;
  const legend = `${c.stacks.map((s) => `<span class="leg"><span class="sw" style="background:${s.color}"></span>${esc(s.label)}</span>`).join("")}${c.leadsKnown ? `<span class="leg"><span class="sw sw--dot"></span>${b.leadSource === "google" ? "Conversions" : "Leads"}</span>` : ""}`;
  const late = f.lastLeadDays != null && f.lastLeadDays > THRESHOLDS.bannerLeadDays;
  return card(
    "gx-chart",
    b.leadSource === "google" ? "Spend and conversions" : "Spend and leads",
    "last 30 days",
    `<div class="gx-chart" tabindex="0" aria-label="Daily numbers: use the left and right arrow keys" data-days="${esc(JSON.stringify(tipDays))}">
      <div class="gx-plot" role="img" aria-label="${esc(label)}">
        <div class="gx-plot__in">
          ${yl}
          <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><defs>${grads}</defs>${grid}${areas}${lines}</svg>
          ${pills}${dots}
          <span class="gx-guide" hidden></span>
        </div>
        <div class="gx-axis">${xl}</div>
      </div>
      <div class="gx-ctip" role="status" aria-live="polite" hidden></div>
    </div>
    <div class="gx-foot4">
      <div><p class="cap">30-day spend</p><p class="num">${esc(aed0(f.spend))}</p></div>
      <div><p class="cap">${LEADS_WORD[b.leadSource]}</p><p class="num">${esc(f.leads == null ? DASH : n0(f.leads))}</p></div>
      <div><p class="cap">${b.leadSource === "google" ? "Cost per conversion" : "Cost per lead"}</p><p class="num">${esc(f.leads ? aed0(f.spend / f.leads) : f.leads === 0 ? (b.leadSource === "google" ? "No conversions" : "No leads") : DASH)}</p></div>
      <div><p class="cap">${b.leadSource === "google" ? "Last conversion" : "Last lead"}</p><p class="num"${late ? ' data-tone="bad"' : ""}>${esc(f.lastLeadDays == null ? DASH : f.lastLeadDays === 0 ? "today" : `${plural(f.lastLeadDays, "day")} ago`)}</p></div>
    </div>
    ${c.changeCount ? `<a class="gx-chlink" href="${esc(detailsHref(q, "history"))}">${plural(c.changeCount, "change")} in 30 days →</a>` : ""}`,
    `<span class="gx-legend">${legend}</span>`,
    "gx-chartcard",
  );
}

/* ---------- 5, 6. Needs attention, budget to redirect ---------- */

/** Where an attention item's action goes: an anchor on the page, or a tab of All details. */
const actionHref = (q: URLSearchParams, target: string) => (target === "d-campaigns" ? detailsHref(q, "campaigns") : target === "d-changes" ? detailsHref(q, "history") : `#${target}`);

function attentionCard(b: Blocks, q: URLSearchParams) {
  const items = b.attn;
  const icon = (a: Attention) => (a.share != null ? "%" : a.level === "red" ? "!" : "▲");
  const li = items
    .map((a, i) => `<li class="gx-attn__i" data-level="${a.level}"${i >= THRESHOLDS.visibleItems ? " hidden data-extra" : ""}>
        <span class="gx-attn__ic" aria-hidden="true">${icon(a)}</span>
        <div class="gx-attn__b"><p class="gx-attn__t"><span class="sr">${a.level === "red" ? "Urgent" : "Check"}: </span>${esc(a.title)}</p><p class="cap">${esc(a.why)}${a.source === "sheet" ? ` · from the Sheet's ${esc(b.alertsCheckedAt.slice(11, 16) || "")} check` : ""}</p><a href="${esc(actionHref(q, a.action.target))}"${a.action.target.startsWith("d-") ? "" : ` data-open="${a.action.target}"`}>${esc(a.action.label)} →</a></div>
        <p class="gx-attn__a">${esc(a.share != null ? pct(a.share) : a.aed != null ? aed0(a.aed) : "")}</p>
      </li>`)
    .join("");
  const reds = items.filter((a) => a.level === "red").length;
  const extra = items.length - THRESHOLDS.visibleItems;
  const r = b.redirect;
  const redirect = r
    ? `<div class="gx-redirect" id="redirect" tabindex="-1" title="${esc(`${friendly(r.from)} spent ${aed0(r.aed)} in 7 days with no qualified lead. ${friendly(r.to)} costs ${aed0(r.cpl)} per qualified lead since ${dayMonth(REPORT_START)} and loses ${pct(r.lost)} of impressions to budget.`)}">
        <p class="gx-redirect__k">Budget to redirect <span>· estimate</span></p>
        <p class="num gx-redirect__v">${esc(aed0(r.aed))} / week</p>
        <p class="gx-redirect__s">${esc(friendly(r.from))} → ${esc(friendly(r.to))} · ~${r.more} more qualified ${r.more === 1 ? "lead" : "leads"}/week</p>
      </div>`
    : "";
  return `<section class="lr-card gx-card gx-attn" aria-labelledby="gx-attn-t">
      <div class="ct"><h2 class="lr-card__title" id="gx-attn-t">Needs attention</h2>${items.length ? `<span class="chip" data-tone="${reds ? "bad" : "warn"}">${items.length}<span class="sr"> items, ${reds} urgent</span></span>` : ""}</div>
      ${items.length ? `<ol class="gx-attn__l">${li}</ol>${extra > 0 ? `<button type="button" class="gx-more gx-attn__all" aria-expanded="false">Show all (${extra} more)</button>` : ""}` : `<p class="gx-clear">${svg(I.check, 18)} Nothing needs attention in this period.</p>`}
      <div class="gx-grow"></div>
      ${redirect}
    </section>`;
}

/* ---------- 7, 8, 9. Spend by channel, lead quality, funnel ---------- */

function spendCard(b: Blocks) {
  const s = b.spend;
  const label = s.parts.map((p) => `${p.label} ${pct(p.share)}`).join(", ");
  const body = s.total
    ? `<div class="gx-dn">${donut(s.parts.map((p) => ({ v: p.cost, c: p.color })), `Spend by channel: ${label}. Total ${aed0(s.total)}`, `<p class="num gx-dn__v${aed0(s.total).length > 7 ? " gx-dn__v--sm" : ""}">${esc(aed0(s.total))}</p><p class="cap">total</p>`)}
        <ul class="gx-dn__l">${s.parts.map((p) => `<li><span class="leg"><span class="sw" style="background:${p.color}"></span>${esc(p.label)}</span><p class="gx-dn__n">${esc(aed0(p.cost))} <span class="cap">${esc(pct(p.share))}</span></p><p class="cap">${esc(plural(p.clicks, "click"))} · ${p.leads == null ? `${DASH} leads` : esc(nLeads(b.leadSource, p.leads))}</p></li>`).join("")}</ul></div>`
    : none("No spend in this period.");
  return card("gx-spend", "Spend by channel", span(b.period.from, b.period.to), body);
}

function qualityCard(b: Blocks) {
  const q = b.quality;
  if (!q) return card("gx-quality", "Lead quality", "ERP", none(b.erpReason));
  const label = `${q.qualified} qualified, ${q.notQualified} not qualified, ${q.won} won, of ${q.total} Google Ads leads since ${dayMonth(REPORT_START)}`;
  const body = q.total
    ? `<div class="gx-dn">${donut(
        [{ v: q.qualified - q.won, c: COLORS.good }, { v: q.won, c: COLORS.search }, { v: q.notQualified, c: COLORS.grey }],
        label,
        `<p class="num gx-dn__v gx-dn__v--big">${esc(pct(q.share))}</p><p class="cap">qualified</p>`,
      )}
      <ul class="gx-dn__l gx-dn__l--rows">
        <li><span class="leg"><span class="sw" style="background:${COLORS.good}"></span>Qualified</span><b>${q.qualified}</b></li>
        <li><span class="leg"><span class="sw" style="background:${COLORS.grey}"></span>Not qualified</span><b>${q.notQualified}</b></li>
        <li><span class="leg"><span class="sw" style="background:${COLORS.search}"></span>Won</span><b>${q.won}</b></li>
        ${q.top ? `<li class="cap gx-dn__note">${q.top.n} of ${q.total} leads came from ${esc(friendly(q.top.name))}</li>` : ""}
      </ul></div>`
    : none(`No Google Ads leads for this channel since ${dayMonth(REPORT_START)}.`);
  return card("gx-quality", "Lead quality", "ERP", body, `<span class="chip" data-tone="neu">since ${esc(dayMonth(REPORT_START))}</span>`);
}

function funnelCard(b: Blocks) {
  const f = b.funnel;
  const steps: [string, number | null, string][] = [
    ["Seen", f.seen, "linear-gradient(90deg,#2F5BD3,#4F7CFF)"],
    ["Clicked", f.clicked, "linear-gradient(90deg,#4F7CFF,#7B8CFF)"],
    ["Landed", f.landed, "linear-gradient(90deg,#7B8CFF,#7B5CE0)"],
    [b.leadSource === "google" ? "Conversions" : "Leads", f.leads, f.leads ? COLORS.good : COLORS.bad],
  ];
  const top = Math.log10((f.seen ?? 0) + 1) || 1;
  const rows = steps
    .map(([l, v, bg]) => `<li><span class="cap gx-fn__l">${l}</span><span class="gx-fn__t"><span style="width:${v == null ? 0 : Math.max(3, (Math.log10(v + 1) / top) * 100).toFixed(1)}%;background:${bg}"></span></span><b>${esc(v == null ? DASH : n0(v))}</b></li>`)
    .join("");
  const rateTone = (v: number | null) => (v === 0 ? "bad" : "neu");
  const label = `Search funnel: seen ${n0(f.seen)}, clicked ${n0(f.clicked)}, landed ${f.landed == null ? "not known" : n0(f.landed)}, ${b.leadSource === "google" ? "Google conversions" : "leads"} ${f.leads == null ? "not known" : n0(f.leads)}.`;
  const landTip = `${f.note ? `${f.note} ` : ""}Landings are counted per page, not per campaign: pages of the Search ads (/freezone…). The funnel is Search only, whatever the Channel filter.`;
  return card(
    "gx-funnel",
    "Conversion funnel",
    `Search, ${span(b.period.from, b.period.to)}`,
    `<ol class="gx-fn" role="img" aria-label="${esc(label)}">${rows}</ol>
     <div class="gx-chips"><span class="chip" data-tone="neu">CTR ${esc(pct(f.ctr, 1))}</span><span class="chip" data-tone="neu">Landed ${esc(pct(f.landedRate))}</span><span class="chip" data-tone="${rateTone(f.formRate)}">${b.leadSource === "google" ? "Conv." : "Form"} ${esc(pct(f.formRate, 1))}</span>${tip("Landed", landTip)}</div>`,
  );
}

/* ---------- 10, 11. Cost per qualified lead, leads per day ---------- */

function cplCard(b: Blocks) {
  const T = THRESHOLDS.targetCplAed;
  const rows = b.cplRows;
  if (!rows) return card("gx-cpl", "Cost per qualified lead", "by campaign", none(b.erpReason));
  const items = rows
    .map((r) => {
      const over = r.cpl != null && r.cpl > T, zero = r.cpl == null;
      const w = zero ? 100 : Math.min(100, (r.cpl! / (2 * T)) * 100);
      const word = zero ? "No qualified lead" : `${aed0(r.cpl)}${over ? " · over target" : " · under target"}`;
      return `<li><div class="gx-cpl__top"><span class="gx-cpl__n" title="${esc(r.name)}">${esc(friendly(r.name))}</span><span class="gx-cpl__v" data-tone="${over || zero ? "bad" : "good"}">${esc(word)}</span></div>
        <div class="gx-cpl__tr"><span class="gx-cpl__b" data-kind="${zero ? "none" : over ? "over" : "under"}" style="width:${w.toFixed(1)}%"></span><span class="gx-cpl__tg" aria-hidden="true"></span></div>
        <p class="cap">${esc(aed0(r.cost))} spent · ${esc(plural(r.qualified, "qualified lead"))}</p></li>`;
    })
    .join("");
  const best = rows.find((r) => r.cpl != null && r.cpl <= T);
  const worst = [...rows].filter((r) => r.cpl == null).sort((a, z) => z.cost - a.cost)[0];
  const over = rows.filter((r) => r.cpl != null && r.cpl > T)[0];
  const take = [best ? `${friendly(best.name)} is under the target (${aed0(best.cpl)}).` : "No campaign is under the target.", worst ? `${friendly(worst.name)} has no qualified lead after ${aed0(worst.cost)}.` : over ? `${friendly(over.name)} costs ${aed0(over.cpl)}.` : ""].filter(Boolean).join(" ");
  const label = `Cost per qualified lead since ${dayMonth(REPORT_START)} against the AED ${T} target: ${rows.map((r) => `${friendly(r.name)} ${r.cpl == null ? "no qualified lead" : aed0(r.cpl)}`).join("; ")}.`;
  return card(
    "gx-cpl",
    "Cost per qualified lead",
    `by campaign, since ${dayMonth(REPORT_START)}`,
    rows.length ? `<ul class="gx-cpl" role="img" aria-label="${esc(label)}">${items}</ul><p class="gx-take" data-tone="${best ? "good" : "bad"}">${esc(take)}</p>` : none("No spend since counting started."),
    `<span class="leg"><span class="gx-target" aria-hidden="true"></span>Target AED ${T}</span>`,
  );
}

const SHADES = ["#F1ECE6", "#C9EEDB", "#6FD3A5", "#12A16B"];
function heatCard(b: Blocks, today: string) {
  const heatTitle = b.leadSource === "google" ? "Conversions per day" : "Leads per day", heatSub = `${SOURCE_WORD[b.leadSource]}, last 6 weeks`;
  if (!b.heat) return card("gx-heat", heatTitle, heatSub, none(b.erpReason));
  const unit = b.leadSource === "google" ? "conversion" : "lead";
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const cells = b.heat
    .map((w) => `<span class="cap gx-heat__w">${esc(dayMonth(w[0].day))}</span>${w
      .map((c) => {
        if (c.n == null) return `<span class="gx-heat__c is-off" title="${esc(`${dayMonth(c.day)} · ${c.day > today ? "not yet" : "before counting started"}`)}"></span>`;
        const lvl = Math.min(c.n, 3);
        return `<span class="gx-heat__c" style="background:${SHADES[lvl]};color:${lvl >= 3 ? "#FFFFFF" : "#0E3B28"}" title="${esc(`${dayMonth(c.day)} · ${plural(c.n, unit)}`)}">${c.n || ""}</span>`;
      })
      .join("")}`)
    .join("");
  const total = b.heat.flat().reduce((s, c) => s + (c.n ?? 0), 0);
  const last = b.lastLead;
  const gap = last ? Math.round((Date.parse(today) - Date.parse(last)) / 86_400_000) : null;
  // "Form leads" only where the numbers are leads (ERP, lead log); the fallback counts Google conversions.
  const noneWord = b.leadSource === "google" ? "No Google conversions" : "No form leads";
  const take = !last ? `${noneWord} since counting started.` : gap! > THRESHOLDS.bannerLeadDays ? `${noneWord} since ${dayMonth(last)} (${gap} days).` : `${plural(total, unit)} in 6 weeks; the last on ${dayMonth(last)}.`;
  return card(
    "gx-heat",
    heatTitle,
    heatSub,
    `<div class="gx-heat" role="img" aria-label="${esc(`Google Ads ${unit}s per day over 6 weeks from ${dayMonth(b.heatStart)}: ${total} in all. ${take}`)}"><span></span>${DAYS.map((d) => `<span class="cap gx-heat__d">${d}</span>`).join("")}${cells}</div>
     <p class="gx-take gx-take--plain" data-tone="${gap != null && gap > THRESHOLDS.bannerLeadDays ? "bad" : "neu"}">${esc(take)}</p>`,
    `<span class="gx-heat__lg"><span class="cap">0</span>${SHADES.map((s) => `<span class="sw" style="background:${s}"></span>`).join("")}<span class="cap">3+</span></span>`,
  );
}

/* ---------- 12, 13, 14. Devices, cities, landing pages ---------- */

const DEV_COLOR: Record<string, string> = { Mobile: "#2F5BD3", Desktop: "#8FA8E8", Tablet: "#7B5CE0" };
function devicesCard(b: Blocks) {
  const d = b.devices;
  if (!d.length) return card("gx-dev", "Devices", `${channelInfo(b.deviceChannel).label}, 30D`, none("No device data for the last 30 days."));
  const label = `Share of ${channelInfo(b.deviceChannel).label} cost by device, last 30 days: ${d.map((x) => `${x.name} ${pct(x.share)}`).join(", ")}.`;
  const withCpl = d.filter((x) => x.cpl != null).sort((a, z) => a.cpl! - z.cpl!);
  const tipText = b.joinReady && withCpl.length >= 2 ? `${withCpl[0].name} leads cost <b>${pct(1 - withCpl[0].cpl! / withCpl.at(-1)!.cpl!)} less</b> than ${withCpl.at(-1)!.name}.` : "";
  return card(
    "gx-dev",
    "Devices",
    `${channelInfo(b.deviceChannel).label}, 30D`,
    `<div class="gx-dn">${donut(d.map((x) => ({ v: x.cost, c: DEV_COLOR[x.name] ?? COLORS.grey })), label, svg(I.phone, 26), 120, 18)}
      <ul class="gx-dn__l">${d.map((x) => `<li><span class="leg"><span class="sw" style="background:${DEV_COLOR[x.name] ?? COLORS.grey}"></span>${esc(x.name)} ${esc(pct(x.share))}</span><p class="cap">${b.joinReady ? (x.cpl != null ? `${esc(aed0(x.cpl))} per qualified lead` : "no qualified lead") : `${DASH} per qualified lead`}</p></li>`).join("")}</ul></div>
     ${tipText ? `<p class="gx-take" data-tone="info">${tipText}</p>` : ""}`,
  );
}

function citiesCard(b: Blocks) {
  const c = b.cities;
  const max = Math.max(1, ...c.map((x) => x.cost));
  const body = c.length
    ? `<ul class="gx-bars">${c.map((x) => `<li><div class="gx-bars__top"><span>${esc(x.name)}</span><span><b>${esc(aed0(x.cost))}</b>${x.qualified != null && b.joinReady ? ` <span class="cap">· ${x.qualified} qual.</span>` : ""}</span></div><div class="track"><span style="width:${((x.cost / max) * 100).toFixed(1)}%"></span></div></li>`).join("")}</ul>`
    : none("No location data in the Sheet.");
  return card("gx-cities", "Top cities", "spend, 30D", body);
}

function pagesCard(b: Blocks) {
  if (!b.pages) return card("gx-pages", "Landing pages", "landings", none("Landing counter not connected here."));
  const max = Math.max(1, ...b.pages.map((p) => p.n));
  const body = b.pages.length
    ? `<ul class="gx-pg">${b.pages.map((p) => `<li><span class="gx-pg__p" title="${esc(`${p.path} · ${p.label}`)}">${esc(p.path)}</span><span class="gx-pg__t"><span style="width:${((p.n / max) * 100).toFixed(1)}%"></span></span><span class="chip" data-tone="neu">${esc(n0(p.n))}</span></li>`).join("")}</ul>`
    : none("No ad landings in this period.");
  return card(
    "gx-pages",
    "Landing pages",
    "landings",
    `${body}<p class="cap gx-pg__note">Landings only: the ERP doesn't store a lead's landing page, so leads per page can't be shown.${b.pagesNote ? ` ${esc(b.pagesNote)}` : ""}</p>`,
  );
}

/* ---------- 15, 16. Search terms, campaigns ---------- */

function termsCard(b: Blocks) {
  const t = b.terms;
  if (t.searchOnly) return card("gx-terms", "Search terms", "30D", none("Search terms exist for Search campaigns only. Switch Channel to All or Search."));
  const wMax = Math.max(1, ...t.winning.slice(0, 5).map((x) => x.conv)), bMax = Math.max(1, ...t.wasted.slice(0, 5).map((x) => x.cost));
  const row = (term: string, v: string, w: number, c: string) => `<li><div class="gx-bars__top"><span>${esc(term)}</span><b class="gx-nowrap">${esc(v)}</b></div><div class="track track--thin"><span style="width:${w.toFixed(1)}%;background:${c}"></span></div></li>`;
  const kw = t.erpKeywords?.length ? `<ul class="gx-kw">${t.erpKeywords.map((k) => `<li>Keyword <b>${esc(k.keyword)}</b> brought ${esc(plural(k.n, "ERP lead"))}</li>`).join("")}</ul>` : "";
  return card(
    "gx-terms",
    "Search terms",
    "30D",
    `<div class="gx-terms">
      <div><p class="gx-terms__h" data-tone="good">${svg(I.check, 14)} Winning · Google conversions</p>${t.winning.length ? `<ul class="gx-bars">${t.winning.slice(0, 5).map((x) => row(x.term, `${n0(x.conv)} conv.`, (x.conv / wMax) * 100, COLORS.good)).join("")}</ul>` : none("No search term with a Google conversion.")}${kw}</div>
      <div><p class="gx-terms__h" data-tone="bad">${svg(I.alert, 14, ' stroke-width="2.6"')} Wasted · add as negative</p>${t.wasted.length ? `<ul class="gx-bars">${t.wasted.slice(0, 5).map((x) => row(x.term, aed0(x.cost), (x.cost / bMax) * 100, COLORS.bad)).join("")}</ul>${t.wasted.length > 5 ? `<p class="cap">+ ${t.wasted.length - 5} more in the copied list</p>` : ""}` : none(`No term spent AED ${THRESHOLDS.searchTermCostAed}+ without a conversion.`)}</div>
    </div>
    <p class="cap gx-terms__r">Wasted: AED ${THRESHOLDS.searchTermCostAed}+ spent, 0 conversions, not excluded, and not the keyword of any ERP lead.</p>
    <textarea id="gx-neg" hidden>${esc(t.copy)}</textarea>`,
    t.wasted.length ? `<button type="button" class="gx-btn" data-copy="gx-neg">${svg(I.copy, 14)}Copy negatives</button><span class="gx-copied" role="status" aria-live="polite"></span>` : "",
  );
}

/** The channel tag of a campaign: short letters in its CHANNELS colour. */
const chTag = (channel: string, cls = "gx-tag") => {
  const ch = channelInfo(channel);
  return `<span class="${cls}" style="--c:${ch.color}" title="${esc(ch.label)}"><span aria-hidden="true">${esc(ch.tag)}</span><span class="sr">${esc(ch.label)}</span></span>`;
};

function campaignsCard(b: Blocks, q: URLSearchParams) {
  const c = b.campaigns;
  const cards = c.cards.length
    ? c.cards
        .map(({ c: x, leads }) => {
          const ch = channelInfo(x.channel);
          const meta = [ch.label, x.budget ? `AED ${x.budget}/day` : "", x.maxCpc ? `cap AED ${x.maxCpc}` : ""].filter(Boolean).join(" · ");
          return `<li class="gx-camp">${chTag(x.channel, "gx-tag gx-tag--lg")}
            <div class="gx-camp__b"><p class="gx-camp__n" title="${esc(x.name)}">${esc(friendly(x.name))}</p><p class="cap">${esc(meta)}</p></div>
            <div class="gx-camp__r"><p class="gx-camp__c">${esc(aed0(x.t.cost))}</p><p class="cap">${esc(plural(x.t.clicks ?? 0, "click"))} · ${leads == null ? DASH : esc(nLeads(b.leadSource, leads))}</p></div>
            <span class="chip" data-tone="good"><span class="gx-dot" aria-hidden="true"></span>Live</span></li>`;
        })
        .join("")
    : `<li>${none("No enabled campaign in this channel.")}</li>`;
  const bc = c.bidChange;
  return card(
    "gx-camps",
    "Campaigns",
    span(b.period.from, b.period.to),
    `<ul class="gx-camps">${cards}</ul>
     <div class="gx-mini">
       <div><p class="cap">Lost to budget</p><p class="num">${esc(c.lost ? pct(c.lost.share) : DASH)}</p><p class="cap" title="${esc(c.lost?.name ?? "")}">${esc(c.lost ? friendly(c.lost.name) : "no Search campaign")}</p></div>
       <div><p class="cap">Avg CPC</p><p class="num">${esc(bc ? aed2(bc.cpc) : DASH)}</p><p class="cap">${bc ? (bc.ch == null ? `since ${esc(dayMonth(bc.day))}` : `${bc.ch < 0 ? "▼" : "▲"} ${Math.abs(Math.round(bc.ch * 100))}% since bidding change ${esc(dayMonth(bc.day))}`) : "no bidding change in 30 days"}</p></div>
       <div><p class="cap">Paused</p><p class="num">${c.paused}</p><p class="cap">${c.paused === 1 ? "campaign" : "campaigns"}</p></div>
     </div>`,
    `<a href="${esc(detailsHref(q, "campaigns"))}">All ${c.all} incl. paused →</a>`,
  );
}

/* ---------- 17. All details: one tabbed panel (search, filter chips, sort, CSV of every matching row, 25 rows then "Show more") ---------- */

interface Col<T> {
  label: string;
  html: (r: T) => string;
  v?: (r: T) => number | string | null;
  left?: boolean;
}
const money = <T,>(label: string, get: (r: T) => number | null, dp = 2): Col<T> => ({ label, html: (r) => esc(fmtAed(get(r), dp)), v: get });
const count = <T,>(label: string, get: (r: T) => number | null): Col<T> => ({ label, html: (r) => esc(fmtNum(get(r))), v: get });
const share = <T,>(label: string, get: (r: T) => number | null): Col<T> => ({ label, html: (r) => esc(fmtShare(get(r))), v: get });
const text = <T,>(label: string, get: (r: T) => string): Col<T> => ({ label, html: (r) => esc(get(r) || DASH), v: get, left: true });
const metricCols = <T,>(t: (r: T) => Totals, impr = true): Col<T>[] => [
  ...(impr ? [count<T>("Impr.", (r) => t(r).impr)] : []),
  count<T>("Clicks", (r) => t(r).clicks),
  money<T>("Spend", (r) => t(r).cost),
  count<T>("Google conv.", (r) => t(r).conv),
];
type Tone = "good" | "warn" | "bad" | "neu";
const TONES: [RegExp, Tone][] = [
  [/^(enabled|approved|excellent|good|above[_ ]average|eligible|added)$/i, "good"],
  [/^(average|limited|approved[_ ]limited|learning|pending|under[_ ]review|paused)$/i, "warn"],
  [/^(disapproved|poor|below[_ ]average|excluded|not[_ ]eligible|suspended|removed)$/i, "bad"],
];
const toneOf = (s: string): Tone => TONES.find(([re]) => re.test(s.trim()))?.[1] ?? "neu";
/** Status as a coloured dot + the word (never colour alone). */
const status = (s: string, extra = "") => (s ? `<span class="gx-st" data-tone="${toneOf(s)}"><span class="gx-st__d" aria-hidden="true"></span>${esc(pretty(s))}</span>${extra}` : DASH);
/** A friendly name in bold with Google's own name underneath (small, monospace). */
const named2 = (label: string, raw: string) => `<span class="gx-name"><b>${esc(label)}</b>${raw && raw !== label ? `<span class="gx-raw" title="${esc(raw)}">${esc(raw).replace(/_/g, "_<wbr>")}</span>` : ""}</span>`;
const muted = (s: string) => `<span class="gx-sub">${esc(s)}</span>`;
const PAGE_ROWS = 25;

interface TableOpts<T> {
  empty: string;
  rowAttr?: (r: T) => string;
  /** Filter chips: [label, key, value, count]; "All" first (value ""). Rows carry data-<key> with space-separated values. */
  chips?: [string, string, string, number][];
  note?: string;
}

function table<T>(id: string, name: string, cols: Col<T>[], rows: T[], o: TableOpts<T>) {
  if (!rows.length) return `<p class="gx-empty">${o.empty}</p>`;
  const headRow = cols.map((c, i) => `<th scope="col"${i === 0 || c.left ? "" : ' class="gx-n"'}><button type="button" class="gx-sort" data-col="${i}">${esc(c.label)}</button></th>`).join("");
  const body = rows
    .map((r) => {
      const cells = cols
        .map((c, i) => {
          const v = c.v?.(r);
          const dv = v == null || v === "" ? "" : ` data-v="${esc(v)}"`;
          return i === 0 ? `<th scope="row"${dv}>${c.html(r)}</th>` : `<td${c.left ? "" : ' class="gx-n"'}${dv}>${c.html(r)}</td>`;
        })
        .join("");
      return `<tr${o.rowAttr?.(r) ?? ""}>${cells}</tr>`;
    })
    .join("");
  const chips = o.chips?.length
    ? `<div class="gx-chips2" role="group" aria-label="Filter ${esc(name.toLowerCase())}">${o.chips
        .map(([l, k, v, n], i) => `<button type="button" class="gx-fchip" data-chip="${id}" data-key="${k}" data-val="${v}" aria-pressed="${i === 0}">${l} <span class="gx-fchip__n">${n}</span></button>`)
        .join("")}</div>`
    : "";
  return `<div class="gx-tools">
      <label class="gx-search">${svg(I.search, 15)}<span class="sr">Search ${esc(name)}</span><input type="search" placeholder="Search ${esc(name.toLowerCase())}" data-search="${id}"></label>
      ${chips}
      <span class="gx-grow"></span>
      ${o.note ? `<span class="cap">${esc(o.note)}</span>` : ""}
      <span class="cap gx-count" data-count="${id}" aria-live="polite">${plural(rows.length, "row")}</span>
      <button type="button" class="gx-btn gx-csv" data-csv="${id}" data-name="${esc(name)}">${svg(I.download, 14)}CSV</button>
    </div>
    <div class="gx-scroll" tabindex="0" role="region" aria-label="${esc(name)} table"><table class="gx-table" id="${id}" data-limit="${PAGE_ROWS}"><thead><tr>${headRow}</tr></thead><tbody>${body}</tbody></table></div>
    <button type="button" class="gx-more" data-more="${id}" hidden>Show more</button>`;
}

const TABS = [["campaigns", "Campaigns"], ["adgroups", "Ad groups"], ["keywords", "Keywords"], ["terms", "Search terms"], ["ads", "Ads"], ["conversions", "Conversions"], ["sitelinks", "Sitelinks"], ["history", "History"]] as const;
type TabKey = (typeof TABS)[number][0];
const QS_PARTS = [["expCtr", "Expected CTR", "CTR"], ["adRelevance", "Ad relevance", "Ad"], ["landingPage", "Landing page experience", "Page"]] as const;
const FIX: Record<(typeof QS_PARTS)[number][0], string> = {
  expCtr: "Put the keyword in the headlines and give a reason to click (price, speed, a free consultation), so more searchers pick this ad.",
  adRelevance: "Move the keyword into an ad group whose ads mention it, or write an ad for it in that ad group.",
  landingPage: "Send it to a page about that exact search (its own section or a dedicated page), fast on phones, with the form in view.",
};

function details(b: Blocks, d: SheetData, q: URLSearchParams, erp: ErpLead[] | null) {
  const { period, inScope } = b;
  const tab = (TABS.find(([k]) => k === q.get("details"))?.[0] ?? "campaigns") as TabKey;
  const open = q.has("details") || q.has("hist");
  const cut = (name: keyof SheetData["tabs"]) => inPeriod(rowsOf(d.tabs[name]), period.from, period.to).filter((r) => inScope(str(r, "Campaign")));
  const inCh = (rows: Row[]) => rows.filter((r) => inScope(str(r, "Campaign")));
  const erpP = erp ? erp.filter((l) => l.created.slice(0, 10) >= period.from && l.created.slice(0, 10) <= period.to) : null;
  const history = rowsOf(d.tabs.Setup_History), log = rowsOf(d.tabs.Change_Log_30d);
  const when = span(period.from, period.to);
  const note = "Spend: selected period · settings: today";

  // Every tab's rows (counts on the tabs); only the open tab is drawn.
  const camps = campaignRows(inPeriod(rowsOf(d.tabs.Perf_Campaigns_Daily), period.from, period.to), rowsOf(d.tabs.Setup_Campaigns)).filter((c) => inScope(c.name));
  const keywords = keywordRows(cut("Perf_Keywords_Daily"), rowsOf(d.tabs.Setup_Keywords));
  const terms = searchTermRows(cut("Perf_SearchTerms_Daily"));
  const ads = adRows(inCh(rowsOf(d.tabs.Setup_Ads)), cut("Perf_Ads_Daily"));
  const adGroups = adGroupRows(cut("Perf_AdGroups_Daily"));
  const convs = conversionRows(cut("Perf_Conversions_Daily"));
  const assets = inCh(rowsOf(d.tabs.Perf_CampaignAssets_30d));
  const changes = inCh(log).sort((a, z) => stampOf(z["Changed at"]).localeCompare(stampOf(a["Changed at"])));
  const counts: Record<TabKey, number> = { campaigns: camps.length, adgroups: adGroups.length, keywords: keywords.length, terms: terms.length, ads: ads.length, conversions: convs.length, sitelinks: assets.length, history: b.chart.changeCount };
  const erpKw = new Set((erp ?? []).map((l) => kwKey(l.keyword)).filter(Boolean));
  const wastedTerm = (t: TermRow) => (t.t.cost ?? 0) >= THRESHOLDS.searchTermCostAed && (t.t.conv ?? 0) === 0 && !/excluded|added/i.test(t.added) && !erpKw.has(kwKey(t.term));

  let body = "";
  if (tab === "campaigns") {
    const leads = (r: CampaignRow) => (erpP ? erpFor(erpP, r.name).length : null);
    const total = camps.reduce((s, c) => s + (c.t.cost ?? 0), 0);
    const st = (re: RegExp) => camps.filter((c) => re.test(c.status)).length;
    body = table<CampaignRow>(
      "t-campaigns",
      "Campaigns",
      [
        { label: "Campaign", html: (r) => `<span class="gx-cn">${chTag(r.channel)}${named2(friendly(r.name || r.id), r.name)}</span>`, v: (r) => friendly(r.name), left: true },
        { label: "Status", html: (r) => { const since = /paused/i.test(r.status) ? pausedSince(r, history, log) : ""; return status(r.status, since ? muted(`since ${dayMonth(since)}`) : ""); }, v: (r) => r.status, left: true },
        money("Budget / day", (r) => r.budget, 0),
        { label: "Bidding", html: (r) => `${esc(r.bidding ? biddingLabel(r.bidding) : DASH)}${r.maxCpc ? muted(`cap ${fmtAed(r.maxCpc)}`) : ""}`, v: (r) => r.bidding, left: true },
        { label: "Spend", html: (r) => `${esc(fmtAed(r.t.cost))}${r.t.cost && total ? `<span class="gx-share" aria-hidden="true"><span style="width:${(((r.t.cost ?? 0) / total) * 100).toFixed(1)}%;background:${channelInfo(r.channel).color}"></span></span>` : ""}`, v: (r) => r.t.cost },
        count("Clicks", (r) => r.t.clicks),
        { label: "Avg CPC", html: (r) => { const v = cpc(r.t); const junk = v != null && r.channel !== "SEARCH" && v < THRESHOLDS.junkClickCpcAed; return junk ? `<span class="gx-bad" title="Under AED ${THRESHOLDS.junkClickCpcAed.toFixed(2)} a click: looks accidental">${esc(fmtAed(v))}</span>` : esc(fmtAed(v)); }, v: (r) => cpc(r.t) },
        count("Leads", leads),
        money("Cost / lead", (r) => div(r.t.cost, leads(r)), 0),
        count("Google conv.", (r) => r.t.conv),
      ],
      camps,
      {
        empty: "No campaigns in the Sheet.",
        chips: [["All", "status", "", camps.length], ["Enabled", "status", "enabled", st(/enabled/i)], ["Paused", "status", "paused", st(/paused/i)], ["Removed", "status", "removed", st(/removed/i)]],
        note,
        rowAttr: (r) => ` data-status="${esc(r.status.toLowerCase())}"${r.inactive ? ' class="gx-off"' : ""}`,
      },
    );
    if (camps.length) {
      const clicks = camps.reduce((s, c) => s + (c.t.clicks ?? 0), 0), all = erpP ? camps.reduce((s, c) => s + erpFor(erpP, c.name).length, 0) : null;
      body += `<div class="gx-total"><span>Total <b>${esc(fmtAed(total))}</b> · ${esc(plural(clicks, "click"))} · ${all == null ? `${DASH} leads` : esc(plural(all, "lead"))}</span><a href="https://ads.google.com/aw/campaigns" target="_blank" rel="noopener noreferrer">Open in Google Ads →</a></div>`;
    }
  } else if (tab === "keywords") {
    const kwLeads = (k: KeywordRow) => (erpP ? erpFor(erpP, k.campaign).filter((l) => kwKey(l.keyword) === kwKey(k.keyword)).length : null);
    const flags = (k: KeywordRow) => [lowQualityScore(k) ? "lowqs" : "", noLeadKeyword(k, erpP) ? "noleads" : ""].filter(Boolean).join(" ");
    const dotOf = (s: string) => `<span class="gx-qd" data-tone="${/above/i.test(s) ? "good" : /below/i.test(s) ? "bad" : /average/i.test(s) ? "warn" : "neu"}"></span>`;
    const qsBar = (v: number) => `<span class="gx-qs" data-tone="${v >= 7 ? "good" : v >= 5 ? "warn" : "bad"}"><b>${v}</b><span class="gx-qs__bar" aria-hidden="true">${Array.from({ length: 10 }, (_, i) => `<i${i < v ? ' class="on"' : ""}></i>`).join("")}</span><span class="sr"> of 10</span></span>`;
    const path = (u: string) => {
      if (!/^https?:\/\//i.test(u)) return DASH;
      const p = u.replace(/^https?:\/\/[^/]+/i, "") || "/";
      return `<a class="gx-url" href="${esc(u)}" target="_blank" rel="noopener noreferrer" title="${esc(u)}">${esc(p.length > 24 ? `${p.slice(0, 23)}…` : p)}</a>`;
    };
    body = table<KeywordRow>(
      "t-keywords",
      "Keywords",
      [
        { label: "Keyword", html: (r) => `<span class="gx-name"><b>${esc(r.keyword)} <span class="gx-match">${esc(pretty(r.match))}</span></b>${muted(`${friendly(r.campaign)} · ${r.adGroup}`)}</span>`, v: (r) => r.keyword, left: true },
        ...metricCols<KeywordRow>((r) => r.t),
        count("ERP leads", kwLeads),
        share("Impr. share", (r) => imprShare(r.t)),
        { label: "Quality Score", html: (r) => (r.qs == null ? DASH : qsBar(r.qs)), v: (r) => r.qs, left: true },
        { label: "CTR · Ad · Page", html: (r) => `<span class="gx-qds">${QS_PARTS.map(([k, full]) => `<span title="${esc(`${full}: ${pretty(r[k]) || "not known"}`)}">${dotOf(r[k])}<span class="sr">${esc(`${full}: ${pretty(r[k]) || "not known"}. `)}</span></span>`).join("")}</span>`, left: true },
        { label: "Landing page", html: (r) => path(r.finalUrl), v: (r) => r.finalUrl, left: true },
      ],
      keywords,
      {
        empty: `No keyword data for ${esc(when)}. <a href="${esc(detailsHref(new URLSearchParams({ ...Object.fromEntries(q), range: "30d" }), "keywords"))}">Try 30D</a>.`,
        chips: [["All", "flags", "", keywords.length], ["Low Quality Score", "flags", "lowqs", keywords.filter(lowQualityScore).length], ["Spend, no leads", "flags", "noleads", keywords.filter((k) => noLeadKeyword(k, erpP)).length]],
        note,
        rowAttr: (r) => ` data-flags="${flags(r)}"`,
      },
    );
    if (keywords.length) {
      body += `<p class="gx-qlegend cap"><b>CTR · Ad · Page</b>: expected click rate, ad relevance and landing page experience, Google's three parts of the Quality Score. <span class="gx-qd" data-tone="good"></span> above average <span class="gx-qd" data-tone="warn"></span> average <span class="gx-qd" data-tone="bad"></span> below average</p>`;
      // The tip: the keyword with spend and the lowest Quality Score, its weakest part and what to do.
      const weak = keywords.filter((k) => k.qs != null && (k.t.cost ?? 0) > 0).sort((a, z) => a.qs! - z.qs! || (z.t.cost ?? 0) - (a.t.cost ?? 0))[0];
      if (weak) {
        const part = QS_PARTS.find(([k]) => /below/i.test(weak[k])) ?? QS_PARTS.find(([k]) => /^average/i.test(weak[k]));
        if (part)
          body += `<div class="gx-tipcard"><p class="gx-tipcard__k">Tip</p><p><b>${esc(weak.keyword)}</b> has Quality Score ${weak.qs} and cost ${esc(fmtAed(weak.t.cost))}. Its weakest part is <b>${esc(part[1].toLowerCase())}</b> (${esc(pretty(weak[part[0]]).toLowerCase())}). ${esc(FIX[part[0]])}</p></div>`;
      }
    }
  } else if (tab === "terms") {
    body = table<TermRow>(
      "t-terms",
      "Search terms",
      [
        { label: "Search term", html: (r) => `<span class="gx-name"><b>${esc(r.term)}</b>${muted(`${friendly(r.campaign)} · ${r.adGroup}`)}</span>`, v: (r) => r.term, left: true },
        text("Matched keyword", (r) => r.matched),
        { label: "Added / excluded", html: (r) => (r.added && !/^none$/i.test(r.added) ? status(r.added) : DASH), v: (r) => r.added, left: true },
        ...metricCols<TermRow>((r) => r.t),
      ],
      terms,
      {
        empty: `No search terms in this period. <a href="${esc(detailsHref(new URLSearchParams({ ...Object.fromEntries(q), range: "30d" }), "terms"))}">Try 30D</a>.`,
        chips: [["All", "flags", "", terms.length], ["Wasted", "flags", "wasted", terms.filter(wastedTerm).length], ["Converting", "flags", "converting", terms.filter((t) => (t.t.conv ?? 0) > 0).length]],
        note: "Selected period",
        rowAttr: (r) => ` data-flags="${[wastedTerm(r) ? "wasted" : "", (r.t.conv ?? 0) > 0 ? "converting" : ""].filter(Boolean).join(" ")}"`,
      },
    );
  } else if (tab === "ads") {
    body = table<AdRow>(
      "t-ads",
      "Ads",
      [
        { label: "Ad", html: (r) => `<span class="gx-name"><b>${esc(pretty(str(r.setup, "Ad type")))} <span class="gx-match">#${esc(str(r.setup, "Ad ID"))}</span></b>${muted(`${friendly(str(r.setup, "Campaign"))} · ${str(r.setup, "Ad group")}`)}</span>`, v: (r) => str(r.setup, "Ad group"), left: true },
        { label: "Status", html: (r) => status(str(r.setup, "Ad status")), v: (r) => str(r.setup, "Ad status"), left: true },
        { label: "Ad strength", html: (r) => status(str(r.setup, "Ad strength")), v: (r) => str(r.setup, "Ad strength"), left: true },
        { label: "Approval", html: (r) => status(str(r.setup, "Ad approval")), v: (r) => str(r.setup, "Ad approval"), left: true },
        ...metricCols<AdRow>((r) => r.t),
      ],
      ads,
      { empty: "No ads in the Sheet.", note },
    );
  } else if (tab === "adgroups") {
    body = table<NamedRow>("t-adgroups", "Ad groups", [{ label: "Ad group", html: (r) => `<span class="gx-name"><b>${esc(r.label)}</b>${muted(friendly(r.sub))}</span>`, v: (r) => r.label, left: true }, { label: "Status", html: (r) => status(r.status), v: (r) => r.status, left: true }, ...metricCols<NamedRow>((r) => r.t)], adGroups, { empty: "No ad group data in this period.", note: "Selected period" });
  } else if (tab === "conversions") {
    body = table<NamedRow>("t-conv", "Conversions", [{ label: "Conversion action", html: (r) => `<span class="gx-name"><b>${esc(r.label)}</b>${muted(friendly(r.sub))}</span>`, v: (r) => r.label, left: true }, text("Category", (r) => pretty(r.status)), count("Conversions", (r) => r.t.conv), count("All conv.", (r) => r.t.allConv)], convs, { empty: "No conversions in this period.", note: "Selected period · Google may update conversions for several days" });
  } else if (tab === "sitelinks") {
    const n = (r: Row, h: string) => (r[h] === "" || r[h] == null ? null : Number(r[h]) || 0);
    body = table<Row>(
      "t-assets",
      "Sitelinks and callouts",
      [
        { label: "Sitelink or callout", html: (r) => `<span class="gx-name"><b>${esc(str(r, "Sitelink text") || str(r, "Callout") || DASH)}</b>${muted(friendly(str(r, "Campaign")))}</span>`, v: (r) => str(r, "Sitelink text") || str(r, "Callout"), left: true },
        text("Slot", (r) => pretty(str(r, "Asset slot"))),
        count("Impr.", (r) => n(r, "Impr.")),
        count("Clicks", (r) => n(r, "Clicks")),
      ],
      assets,
      { empty: "No sitelinks or callouts in the Sheet.", note: "Last 30 days" },
    );
  } else {
    const ents = historyEntities(history.filter((r) => inScope(str(r, "Campaign")) || inScope(str(r, "Name"))));
    const pick = ents.find((e) => e.id === q.get("hist")) ?? ents[0];
    const steps = pick ? historySteps(history, pick.id) : [];
    const keep = ["view", "range", "from", "to", "channel"].map((k) => (q.get(k) ? `<input type="hidden" name="${k}" value="${esc(q.get(k))}">` : "")).join("");
    const timeline = steps.length
      ? `<ol class="gx-tl">${steps.map((s) => `<li><p class="gx-tl__at">${esc(s.at || DASH)}</p><dl>${s.lines.map(([k, v, ch]) => `<div${ch ? ' class="is-ch"' : ""}><dt>${esc(k)}</dt><dd>${esc(v)}${ch ? '<span class="chip" data-tone="warn">changed</span>' : ""}</dd></div>`).join("")}${s.removed.map((k) => `<div class="is-ch"><dt>${esc(k)}</dt><dd>(removed)<span class="chip" data-tone="warn">changed</span></dd></div>`).join("")}</dl></li>`).join("")}</ol>`
      : `<p class="gx-empty">No settings history${d.tabs.Setup_History ? "" : " (the Setup_History tab isn't in the Sheet yet)"}.</p>`;
    body = `<h3 class="gx-h3">Changes <span class="cap">· last 30 days, newest first</span></h3>${table<Row>(
      "t-changes",
      "Change history",
      [
        { label: "Changed at", html: (r) => `<span class="gx-name"><b>${esc(stampOf(r["Changed at"]))}</b>${muted(str(r, "Changed from"))}</span>`, v: (r) => stampOf(r["Changed at"]), left: true },
        text("Who", (r) => str(r, "Changed by")),
        text("What changed", (r) => pretty(str(r, "What changed"))),
        text("Action", (r) => pretty(str(r, "Action"))),
        text("Fields changed", (r) => str(r, "Fields changed")),
        { label: "Where", html: (r) => `${named2(friendly(str(r, "Campaign")), str(r, "Campaign"))}${str(r, "Ad group") ? muted(str(r, "Ad group")) : ""}`, v: (r) => str(r, "Campaign"), left: true },
      ],
      changes,
      { empty: "No changes in the last 30 days." },
    )}
    <h3 class="gx-h3">Settings history <span class="cap">· newest first; lines marked “changed” differ from the record before</span></h3>
    ${ents.length ? `<form method="get" action="#details" class="gx-hist"><input type="hidden" name="details" value="history">${keep}<label><span class="cap">Campaign or ad</span><select name="hist" data-autosubmit>${ents.map((e) => `<option value="${esc(e.id)}"${e.id === pick?.id ? " selected" : ""}>${esc(e.label)}</option>`).join("")}</select></label><noscript><button class="gx-btn" type="submit">Show</button></noscript></form>` : ""}${timeline}`;
  }

  const tabs = TABS.map(([k, l]) => `<a class="gx-tab" href="${esc(detailsHref(q, k))}"${k === tab ? ' aria-current="page"' : ""}>${l} <span class="gx-tab__n">${counts[k]}</span></a>`).join("");
  return `<details class="lr-card gx-card gx-details" id="details"${open ? " open" : ""}>
      <summary><span class="gx-details__t">All details</span><span class="cap">Everything in the account, as Google names it · ${esc(when)}</span>${svg(I.chevron, 18)}</summary>
      <nav class="gx-tabs" aria-label="Detail tables">${tabs}</nav>
      <section class="gx-panel" id="d-${tab}" aria-label="${esc(TABS.find(([k]) => k === tab)![1])}">${body}</section>
    </details>`;
}

/* ---------- Status card (bridge not working) ---------- */

function diagnosisHtml(d: Diagnosis) {
  const mark = (ok: boolean | null) => `<span class="gx-diag__m" data-tone="${ok == null ? "neu" : ok ? "good" : "bad"}" aria-hidden="true">${ok == null ? "–" : ok ? "✓" : "✗"}</span>`;
  return `<div class="gx-diag">
      <div><p class="cap">Environment variables (names only)</p><ul>${d.env.map((e) => `<li>${mark(e.set)}<code>${esc(e.name)}</code><span class="cap">${e.set ? "set" : "missing"}</span></li>`).join("")}</ul></div>
      <div><p class="cap">Sheet bridge</p><ol>${d.checks.map((c) => `<li>${mark(c.ok)}<span><b>${esc(c.label)}</b> <span class="cap">${esc(c.detail)}</span></span></li>`).join("")}</ol></div>
    </div>`;
}

/* ---------- Whole page ---------- */

export type GoogleAdsState =
  | { kind: "off" | "error"; query: URLSearchParams; today: string; diagnosis: Diagnosis }
  | { kind: "ok"; query: URLSearchParams; today: string; data: SheetData; stale: boolean; note: string; erp: ErpLead[] | null; leadSource?: "erp" | "sheet" | null; joinReady: boolean; landings: Entry[] | null };

const NOTES: Record<string, string> = { done: "Refreshed from the Sheet just now.", wait: "Refresh can be used once every 2 minutes. Showing the latest copy." };
const minutesAgo = (ms: number) => {
  const m = Math.round((Date.now() - ms) / 60_000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
};

export function googleAdsHtml(state: GoogleAdsState): string {
  const q = state.query;
  let body: string;
  let fresh: Freshness = { text: "Google Ads data not connected", tone: "bad" };
  if (state.kind !== "ok") {
    const off = state.kind === "off";
    body = `<div class="gx-head"><div class="gx-head__t"><p class="gx-kicker">Best Solution Management Services</p><h1>Google Ads</h1></div></div>
      <section class="lr-card gx-card" role="${off ? "status" : "alert"}">
        <div class="ct"><h2 class="lr-card__title">${off ? "Google Ads data not connected" : "Couldn't read the Google Ads Sheet"}</h2></div>
        <p>${off ? "Needs ADS_SHEET_BRIDGE_URL and ADS_SHEET_BRIDGE_TOKEN in this deployment's environment variables, then a redeploy." : "Reading the Sheet through the bridge failed, and there's no earlier copy to show. The status below says where."}</p>
        ${off ? "" : `<p><a class="gx-btn" href="${esc(href(q, { refresh: null, note: null }))}">${svg(I.refresh, 14)}Try again</a></p>`}
        ${diagnosisHtml(state.diagnosis)}
      </section>`;
  } else {
    const d = state.data;
    const st = statusOf(d.tabs._Status);
    const updated = stampOf(st.get("updated"));
    const fr = freshness(stampMs(updated), Date.now());
    const hm = updated.slice(11, 16);
    const at = updated ? (updated.slice(0, 10) === state.today ? hm : `${dayMonth(updated.slice(0, 10))} ${hm}`) : "";
    // One freshness badge: green on time, amber late, red not updating.
    fresh =
      fr === "good"
        ? { text: `Updated ${at} (UAE)${nextRun(updated) ? ` · next ${nextRun(updated)}` : ""}`, tone: "good" }
        : fr === "warn"
          ? { text: `Updated ${at} (UAE) · late (9+ hours)`, tone: "warn" }
          : fr === "bad"
            ? { text: `Report is not updating · last update ${at || "unknown"}`, tone: "bad" }
            : { text: "Update time not in the Sheet", tone: "warn" };
    const b = blocks({ data: d, erp: state.erp, leadSource: state.leadSource, joinReady: state.joinReady, landings: state.landings, q, today: state.today });
    // Where lead numbers come from, when it isn't the ERP.
    const source =
      b.leadSource === "sheet"
        ? `<p class="gx-note" role="status">${svg(I.info, 16)}ERP not connected here: leads come from the lead log sheet. It has no lead status, so qualified leads and cost per qualified lead show –.</p>`
        : b.leadSource === "google"
          ? `<p class="gx-note" role="status">${svg(I.info, 16)}ERP and lead log not connected here: lead numbers are Google Ads conversions (Google may update them for several days).</p>`
          : "";
    const note =
      state.stale || state.note === "failed"
        ? `<p class="gx-note" data-tone="bad" role="alert">${svg(I.alert, 16, ' stroke-width="2.6"')}Data could not be refreshed. Showing the copy read ${esc(minutesAgo(d.fetchedAt))}.</p>`
        : NOTES[state.note]
          ? `<p class="gx-note" role="status">${svg(I.info, 16)}${esc(NOTES[state.note])}</p>`
          : "";
    const sv = (k: string) => {
      const v = st.get(k);
      return v == null || v === "" ? DASH : stampOf(v);
    };
    const script = sv("script version");
    const dataFrom = sv("data from");
    body = `${head(b, q, state.today)}
      ${note}
      ${source}
      ${banner(b)}
      ${kpis(b)}
      <div class="g84">${chart(b, state.today, q)}${attentionCard(b, q)}</div>
      ${b.leadSource === "erp"
        ? `<div class="g3">${spendCard(b)}${qualityCard(b)}${funnelCard(b)}</div>
      <div class="g2">${cplCard(b)}${heatCard(b, state.today)}</div>`
        : // Without the ERP's lead status both cards would be empty: one line instead.
          `<div class="g3">${spendCard(b)}${funnelCard(b)}${heatCard(b, state.today)}</div>
      <section class="lr-card gx-card gx-needs" aria-label="Lead quality and cost per qualified lead"><p>${svg(I.info, 16)}Lead quality and cost per qualified lead need the ERP lead status. Shown on the live site.</p></section>`}
      <div class="g3">${devicesCard(b)}${citiesCard(b)}${pagesCard(b)}</div>
      <div class="g2">${termsCard(b)}${campaignsCard(b, q)}</div>
      ${details(b, d, q, state.erp)}
      <footer class="gx-footer">Data from ${esc(/^\d{4}-\d{2}-\d{2}/.test(dataFrom) ? dayMonth(dataFrom) : dataFrom)} · Script ${esc(script === DASH || /^v/i.test(script) ? script : `v${script}`)} · Google may update conversions for several days</footer>`;
  }
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light">
<title>Google Ads · Lead Insights</title>
<meta name="theme-color" content="#f1ede8">
<link rel="icon" href="/lead-insights/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/lead-insights/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600&display=swap">
<style>${dashCss()}
${CSS}
${GX_CSS}</style>
</head>
<body>
<div class="lr-aurora" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
${sprite()}
${topbar(false, "", q, "google-ads", fresh)}
<div class="lr-page"><main class="gx">
${viewSwitch(q, "", "google-ads")}
${body}
</main></div>
<script>${GX_SCRIPT}</script>
</body>
</html>`;
}

/* ---------- View-only styles (gx-*), on the dashboard's light tokens (--text, --muted, --line, --copper…) ---------- */

const GX_CSS = `
/* Muted text one step darker than the other views' --muted: on the glass over the warm background it keeps 4.5:1 (AA). */
.gx { --muted: #475569; display: flex; flex-direction: column; gap: 18px; color: var(--text); font-feature-settings: "tnum" 1; }
.gx h1, .gx h2, .gx h3, .gx p, .gx ul, .gx ol, .gx dl, .gx dd { margin: 0; padding: 0; }
.gx ul, .gx ol { list-style: none; }
.gx a { color: var(--copper-lo); text-decoration: none; font-weight: 600; }
.gx a:hover { text-decoration: underline; }
.gx :focus-visible { outline: 2px solid var(--copper-lo); outline-offset: 2px; border-radius: 6px; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* Big numbers only. */
.num { font-family: "Space Grotesk", var(--font); font-weight: 600; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.cap { font: 500 12.5px/1.4 var(--font); color: var(--muted); }
.gx-card { padding: 22px 24px; min-width: 0; }
.ct { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.ct .lr-card__title { margin: 0; }
.ct__x { margin-left: auto; display: inline-flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 13px; }
/* Chips: light tints with dark text (AA). */
.chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; font: 700 12px/1.4 var(--font); white-space: nowrap; }
.chip[data-tone="good"] { background: rgba(18,161,107,.14); color: #0B6B47; }
.chip[data-tone="bad"] { background: rgba(214,69,69,.13); color: #A12D2D; }
.chip[data-tone="warn"] { background: rgba(224,154,30,.18); color: #7A4F00; }
.chip[data-tone="neu"] { background: #EFE9E2; color: #43495A; }
.gx-bad { color: #A12D2D; font-weight: 700; }
.leg { display: inline-flex; align-items: center; gap: 6px; font: 600 12px/1.3 var(--font); color: var(--muted); }
.sw { width: 10px; height: 10px; border-radius: 3px; display: inline-block; flex: none; }
.sw--dot { border-radius: 50%; background: #12A16B; }
.track { height: 8px; border-radius: 4px; background: #EFE9E2; overflow: hidden; }
.track > span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #2F5BD3, #7B5CE0); min-width: 2px; }
.track--thin { height: 6px; margin-top: 4px; }
.g84 { display: grid; grid-template-columns: minmax(0, 8fr) minmax(0, 4fr); gap: 18px; }
.g3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.gx-none, .gx-empty { color: var(--muted); font: 500 14px/1.5 var(--font); padding: 8px 0; }
.gx-empty { padding: 28px 0; text-align: center; }
.gx-grow { flex: 1; }
.gx-btn { display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 14px; border: 0; border-radius: 999px; background: rgba(255,255,255,.75); box-shadow: inset 0 0 0 1px var(--line-strong); color: var(--text); font: 600 13px/1 var(--font); cursor: pointer; }
.gx-btn:hover { background: #fff; text-decoration: none; }
.gx-more { margin-top: 10px; min-height: 40px; padding: 0 16px; border: 0; border-radius: 999px; background: rgba(255,255,255,.6); box-shadow: inset 0 0 0 1px var(--line-strong); color: var(--text); font: 600 13px/1 var(--font); cursor: pointer; }
.gx-more[hidden] { display: none; }
.gx-tip { position: relative; display: inline-grid; place-items: center; width: 28px; height: 28px; color: var(--muted); cursor: help; border-radius: 50%; }
.gx-tip::after { content: attr(data-tip); position: absolute; right: 0; bottom: calc(100% + 6px); z-index: 5; width: max-content; max-width: min(280px, 80vw); padding: 8px 10px; border-radius: 12px; background: var(--text); color: #fff; font: 500 12px/1.4 var(--font); opacity: 0; pointer-events: none; transition: opacity .15s; }
.gx-tip:hover::after, .gx-tip:focus::after { opacity: 1; }
/* 1. Header and filters */
.gx-head { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
.gx-head__t { flex: 1 1 260px; }
.gx-kicker { color: #7A4530; font: 700 12px/1.4 var(--font); letter-spacing: .08em; text-transform: uppercase; }
.gx-head h1 { margin-top: 4px; font: 800 30px/1.1 var(--font); letter-spacing: -.03em; }
.seg { display: flex; gap: 2px; padding: 4px; border-radius: 999px; background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.8), 0 6px 20px -12px rgba(20,37,62,.3); }
.seg a, .seg button, .gx-more-ch summary { display: inline-flex; align-items: center; justify-content: center; min-height: 36px; padding: 0 14px; border: 0; border-radius: 999px; background: transparent; color: var(--muted); font: 600 13.5px/1 var(--font); cursor: pointer; white-space: nowrap; text-decoration: none; }
.seg a:hover, .seg button:hover { color: var(--text); text-decoration: none; }
.seg [aria-current="page"] { background: var(--text); color: #fff; }
.gx-more-ch { position: relative; }
.gx-more-ch summary { list-style: none; }
.gx-more-ch summary::-webkit-details-marker { display: none; }
.gx-more-ch summary::after { content: " ▾"; font-size: 10px; margin-left: 4px; }
.gx-more-ch__m { position: absolute; right: 0; top: calc(100% + 6px); z-index: 10; display: grid; min-width: 180px; padding: 6px; border-radius: 16px; background: var(--glass-bg-dense); box-shadow: var(--shadow-pop); }
.gx-more-ch__m a { padding: 10px 12px; border-radius: 10px; color: var(--text); }
.gx-more-ch__m a[aria-current="page"] { background: var(--text); color: #fff; }
.gx-refresh { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,.65); box-shadow: inset 0 0 0 1px rgba(255,255,255,.85), 0 6px 20px -12px rgba(20,37,62,.3); color: var(--text) !important; }
.gx-customf { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px; padding: 14px 16px; border-radius: 18px; background: rgba(255,255,255,.65); box-shadow: inset 0 0 0 1px rgba(255,255,255,.85); }
.gx-customf[hidden] { display: none; }
.gx-customf label { display: grid; gap: 4px; font: 600 12px/1.3 var(--font); color: var(--muted); }
.gx-customf input { min-height: 40px; padding: 0 10px; border: 1px solid var(--line-strong); border-radius: 12px; background: #fff; color: var(--text); }
.gx-customf button { min-height: 40px; padding: 0 18px; border: 0; border-radius: 999px; background: var(--text); color: #fff; font-weight: 700; cursor: pointer; }
.gx-err { flex-basis: 100%; color: #A12D2D; font-size: 13px; }
.gx-note { display: flex; align-items: center; gap: 8px; color: var(--text); font: 600 13px/1.4 var(--font); }
.gx-note > svg { flex: none; }
.gx-note[data-tone="bad"] { padding: 10px 14px; border-radius: 14px; background: #FDECEC; color: #8A2323; }
/* Header freshness badge (Google Ads): green on time, amber late, red not updating. */
.lr-fresh__tone[data-tone], .lr-brand__live[data-tone], .lr-menu__state[data-tone] { font-weight: 600; }
.lr-fresh__tone[data-tone="good"], .lr-brand__live[data-tone="good"], .lr-menu__state[data-tone="good"] { color: #0B6B47; }
.lr-fresh__tone[data-tone="warn"], .lr-brand__live[data-tone="warn"], .lr-menu__state[data-tone="warn"] { color: #7A4F00; }
.lr-fresh__tone[data-tone="bad"], .lr-brand__live[data-tone="bad"], .lr-menu__state[data-tone="bad"] { color: #A12D2D; }
[data-tone="good"] > .lr-dot { background: #12A16B; } [data-tone="warn"] > .lr-dot { background: #E09A1E; } [data-tone="bad"] > .lr-dot { background: #D64545; }
/* 2. Tracking banner: light amber, dark button */
.gx-banner { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 10px 10px 10px 16px; border-radius: 18px; border: 1px solid #EBCB86; background: #FFF4DE; }
.gx-banner__i { width: 28px; height: 28px; border-radius: 9px; background: #E09A1E; color: #fff; display: inline-grid; place-items: center; flex: none; }
.gx-banner p { flex: 1 1 400px; font: 500 14px/1.45 var(--font); color: #5C3D00; }
.gx-banner b { color: #3D2800; }
.gx-banner__b { min-height: 44px; padding: 0 18px; border: 0; border-radius: 999px; background: var(--text); color: #fff; font: 700 13px/1 var(--font); cursor: pointer; }
.gx-test[hidden] { display: none; }
.gx-test ol { list-style: decimal; padding-left: 20px; display: grid; gap: 8px; margin-bottom: 10px; font-size: 14px; }
/* 3. KPIs */
.gx-kpis { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 18px; }
.gx-kpi { padding: 18px 20px 14px; display: flex; flex-direction: column; gap: 6px; }
.gx-kpi__top { display: flex; align-items: center; min-height: 24px; min-width: 0; }
.gx-kpi__top .lr-card__title { display: block; margin: 0; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* The chip goes under the number when both don't fit, so the number is never cut for it. */
.gx-kpi__vr { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 8px; min-width: 0; }
.gx-kpi__vr .chip { flex: none; white-space: nowrap; }
.gx-kpi__tgt { color: var(--muted); margin-top: -4px; }
.gx-kpi__v { min-width: 0; font-size: 30px; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gx-kpi__v.is-na { color: var(--muted); }
.gx-kpi__why { min-height: 40px; display: flex; align-items: center; }
.gx-spark { display: block; width: 100%; height: 40px; }
.gx-gauge { display: grid; gap: 4px; min-height: 40px; }
.gx-gauge__top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.gx-gauge__top b { font: 700 13.5px/1.2 var(--font); font-variant-numeric: tabular-nums; }
.gx-gauge__top b[data-tone="bad"] { color: #A12D2D; } .gx-gauge__top b[data-tone="good"] { color: #0B6B47; }
.gx-gauge__tr { position: relative; height: 8px; border-radius: 4px; background: #EFE9E2; }
.gx-gauge__tr span { display: block; height: 100%; border-radius: inherit; }
.gx-gauge__tr span[data-kind="over"] { background: linear-gradient(90deg, #E0702F, #D64545); } .gx-gauge__tr span[data-kind="under"] { background: linear-gradient(90deg, #0E8A5C, #12A16B); }
.gx-gauge__tr i { position: absolute; left: 50%; top: -4px; height: 16px; border-left: 2px dashed var(--text); }
.gx-gauge__t { text-align: center; }
/* 4. Chart */
.gx-legend { display: inline-flex; flex-wrap: wrap; gap: 12px; }
.gx-chartcard { display: flex; flex-direction: column; }
.gx-chart { position: relative; flex: 1; display: flex; flex-direction: column; border-radius: 14px; }
.gx-plot { position: relative; flex: 1; min-height: 300px; }
.gx-plot__in { position: absolute; left: 40px; right: 10px; top: 36px; bottom: 26px; }
.gx-plot__in svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.gx-ay { position: absolute; right: calc(100% + 8px); transform: translateY(-50%); font: 600 11px/1 var(--font); color: var(--muted); }
.gx-axis { position: absolute; left: 40px; right: 10px; bottom: 0; height: 18px; }
.gx-ax { position: absolute; transform: translateX(-50%); font: 600 11px/1 var(--font); color: var(--muted); white-space: nowrap; }
.gx-ax:first-child { transform: none; }
.gx-ax:last-child { transform: translateX(-100%); }
.gx-ld { position: absolute; width: calc(var(--r) * 2); height: calc(var(--r) * 2); border-radius: 50%; background: #12A16B; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(20,37,62,.2); transform: translate(-50%, calc(-100% - 8px)); }
.gx-pill { position: absolute; top: -34px; height: 26px; padding: 0 12px; border-radius: 13px; background: var(--text); color: #fff; font: 600 12px/26px var(--font); white-space: nowrap; box-shadow: 0 6px 16px -6px rgba(20,37,62,.4); }
.gx-on { position: absolute; top: 5%; margin-left: 7px; font: 700 12px/1.2 var(--font); white-space: nowrap; }
.gx-pill[data-side="mid"] { transform: translateX(-50%); }
.gx-pill[data-side="end"] { transform: translateX(calc(-100% + 12px)); }
.gx-pill[data-side="start"] { transform: translateX(-12px); }
.gx-on[data-side="end"] { transform: translateX(-100%); margin-left: -7px; }
.gx-guide { position: absolute; top: 0; bottom: 0; width: 0; border-left: 1px solid rgba(20,37,62,.35); pointer-events: none; }
.gx-guide[hidden] { display: none; }
.gx-chlink { align-self: flex-start; display: inline-flex; align-items: center; min-height: 32px; margin-top: 8px; font-size: 13px; }
.gx-ctip { position: absolute; top: 40px; transform: translateX(-50%); z-index: 4; display: grid; gap: 2px; min-width: 160px; padding: 9px 11px; border-radius: 14px; background: var(--glass-bg-dense); box-shadow: var(--shadow-pop); color: var(--text); font: 500 12px/1.45 var(--font); pointer-events: none; }
.gx-ctip[hidden] { display: none; }
.gx-ctip b { font-weight: 700; }
.gx-ctip span { display: flex; justify-content: space-between; gap: 12px; color: var(--muted); }
.gx-ctip span b { color: var(--text); }
.gx-foot4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; border-top: 1px solid var(--line); padding-top: 14px; margin-top: 6px; }
.gx-foot4 .num { font-size: 21px; }
.num[data-tone="bad"] { color: #A12D2D; }
/* 5. Needs attention */
.gx-attn { display: flex; flex-direction: column; }
.gx-attn__i { display: flex; gap: 12px; padding: 12px 0; border-top: 1px solid var(--line); }
.gx-attn__i[hidden] { display: none; }
.gx-attn__ic { width: 34px; height: 34px; border-radius: 11px; flex: none; display: inline-grid; place-items: center; font: 800 15px/1 var(--font); background: rgba(214,69,69,.13); color: #A12D2D; }
[data-level="amber"] .gx-attn__ic { background: rgba(224,154,30,.18); color: #7A4F00; }
.gx-attn__b { flex: 1; min-width: 0; }
.gx-attn__t { font: 700 14px/1.35 var(--font); overflow-wrap: anywhere; }
.gx-attn__b .cap { margin-top: 2px; }
.gx-attn__b a { display: inline-flex; align-items: center; min-height: 32px; margin-top: 2px; font-size: 13px; }
.gx-attn__a { font: 700 14px/1.35 var(--font); white-space: nowrap; font-variant-numeric: tabular-nums; }
.gx-clear { display: flex; align-items: center; gap: 8px; color: #0B6B47; font-weight: 700; }
/* The one strong element: blue gradient, white text (the end colour kept dark enough for small white text, AA). */
.gx-redirect { margin-top: 10px; padding: 16px 18px; border-radius: 20px; color: #fff; background: linear-gradient(135deg, #2F5BD3, #4169E1); box-shadow: 0 16px 34px -14px rgba(47,91,211,.55); }
.gx-redirect__k { font: 600 12.5px/1.4 var(--font); }
.gx-redirect__v { font-size: 26px; margin-top: 2px; }
.gx-redirect__s { font: 500 12.5px/1.4 var(--font); margin-top: 2px; overflow-wrap: anywhere; }
/* Donuts */
.gx-dn { display: flex; align-items: center; gap: 18px; }
.gx-donut { position: relative; flex: none; }
.gx-donut svg { display: block; }
.gx-donut__c { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--muted); }
.gx-dn__v { font-size: 20px; color: var(--text); }
.gx-dn__v--big { font-size: 26px; }
/* "AED 1,354" and longer: smaller, so it stays inside the ring. */
.gx-dn__v--sm { font-size: 16px; }
.gx-dn__l { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
.gx-dn__n { font: 700 16px/1.3 var(--font); margin-top: 2px; font-variant-numeric: tabular-nums; }
.gx-dn__l--rows { gap: 10px; font-size: 14px; }
.gx-dn__l--rows li:not(.gx-dn__note) { display: flex; justify-content: space-between; }
.gx-dn__note { border-top: 1px solid var(--line); padding-top: 8px; overflow-wrap: anywhere; }
/* Funnel */
.gx-fn { display: flex; flex-direction: column; gap: 9px; }
.gx-fn li { display: flex; align-items: center; gap: 10px; }
.gx-fn__l { width: 56px; flex: none; }
.gx-fn__t { flex: 1; display: flex; justify-content: center; }
.gx-fn__t span { display: block; height: 26px; border-radius: 8px; min-width: 6px; }
.gx-fn b { width: 56px; text-align: right; font: 700 15px/1 var(--font); font-variant-numeric: tabular-nums; }
.gx-chips { display: flex; align-items: center; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
/* Cost per qualified lead */
.gx-cpl { display: flex; flex-direction: column; gap: 16px; padding-top: 4px; }
.gx-cpl__top { display: flex; justify-content: space-between; gap: 10px; font-size: 13.5px; margin-bottom: 6px; }
.gx-cpl__n { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.gx-cpl__v { font-weight: 700; white-space: nowrap; }
.gx-cpl__v[data-tone="good"] { color: #0B6B47; } .gx-cpl__v[data-tone="bad"] { color: #A12D2D; }
.gx-cpl__tr { position: relative; height: 14px; border-radius: 7px; background: #EFE9E2; }
.gx-cpl__b { display: block; height: 14px; border-radius: 7px; }
.gx-cpl__b[data-kind="under"] { background: linear-gradient(90deg, #0E8A5C, #12A16B); }
.gx-cpl__b[data-kind="over"] { background: linear-gradient(90deg, #E0702F, #D64545); }
.gx-cpl__b[data-kind="none"] { background: repeating-linear-gradient(45deg, rgba(214,69,69,.5) 0 6px, rgba(214,69,69,.18) 6px 12px); }
.gx-cpl__tg, .gx-target { position: absolute; left: 50%; top: -5px; height: 24px; border-left: 2px dashed var(--text); }
.gx-target { position: static; display: inline-block; height: 12px; }
.gx-cpl .cap { margin-top: 4px; }
.gx-take { margin-top: 16px; font: 500 13.5px/1.45 var(--font); border-radius: 14px; padding: 10px 12px; background: rgba(255,255,255,.6); color: var(--text); }
.gx-take[data-tone="good"] { background: rgba(18,161,107,.1); color: #0A5C3D; }
.gx-take[data-tone="bad"] { background: rgba(214,69,69,.09); color: #8A2323; }
.gx-take[data-tone="info"] { background: rgba(47,91,211,.08); color: #1E3F99; }
.gx-take.gx-take--plain { padding: 0; background: none; }
.gx-nowrap { white-space: nowrap; flex: none; }
.gx-needs { padding: 14px 20px; }
.gx-needs p { display: flex; align-items: center; gap: 8px; font: 600 13.5px/1.45 var(--font); color: var(--text); }
.gx-needs svg { flex: none; }
/* Heatmap */
.gx-heat { display: grid; grid-template-columns: 48px repeat(7, minmax(0, 1fr)); gap: 6px; align-items: center; }
.gx-heat__d { text-align: center; }
.gx-heat__w { white-space: nowrap; }
.gx-heat__c { height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font: 700 11px/1 var(--font); }
.gx-heat__c.is-off { background: repeating-linear-gradient(45deg, rgba(20,37,62,.05) 0 4px, transparent 4px 8px); }
.gx-heat__lg { display: inline-flex; align-items: center; gap: 4px; }
.gx-heat__lg .sw { width: 12px; height: 12px; }
/* Bars (cities, terms) */
.gx-bars { display: flex; flex-direction: column; gap: 12px; }
.gx-bars__top { display: flex; justify-content: space-between; gap: 10px; font-size: 13.5px; margin-bottom: 5px; }
.gx-bars__top > span:first-child { overflow-wrap: anywhere; }
.gx-bars b { font-variant-numeric: tabular-nums; }
/* Landing pages */
.gx-pg { display: flex; flex-direction: column; gap: 11px; }
.gx-pg li { display: flex; align-items: center; gap: 10px; }
.gx-pg__p { width: 128px; flex: none; font: 500 12px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gx-pg__t { flex: 1; height: 8px; border-radius: 4px; background: #EFE9E2; overflow: hidden; }
.gx-pg__t span { display: block; height: 100%; border-radius: inherit; background: #8FA8E8; min-width: 3px; }
.gx-pg .chip { min-width: 48px; justify-content: center; }
.gx-pg__note { margin-top: 12px; }
/* Search terms */
.gx-terms { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.gx-terms__h { display: flex; align-items: center; gap: 6px; font: 700 12.5px/1.3 var(--font); margin-bottom: 8px; }
.gx-terms__h[data-tone="good"] { color: #0B6B47; }
.gx-terms__h[data-tone="bad"] { color: #A12D2D; }
.gx-kw { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--line); display: grid; gap: 6px; font-size: 13px; color: var(--muted); }
.gx-kw b { color: var(--text); }
.gx-terms__r { margin-top: 12px; }
.gx-copied { font-size: 12.5px; color: #0B6B47; font-weight: 600; }
/* Campaigns card */
.gx-tag { display: inline-grid; place-items: center; flex: none; width: 28px; height: 28px; border-radius: 9px; background: color-mix(in srgb, var(--c) 14%, #fff); color: color-mix(in srgb, var(--c) 72%, #000); font: 800 10.5px/1 var(--font); }
.gx-tag--lg { width: 38px; height: 38px; border-radius: 12px; font-size: 12px; }
.gx-camp { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-top: 1px solid var(--line); }
.gx-camp__b { flex: 1; min-width: 0; }
.gx-camp__n { font: 700 14px/1.35 var(--font); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gx-camp__r { text-align: right; }
.gx-camp__c { font: 700 15px/1.3 var(--font); font-variant-numeric: tabular-nums; }
.gx-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.gx-mini { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 8px; }
.gx-mini > div { background: rgba(255,255,255,.55); border-radius: 16px; padding: 10px 12px; min-width: 0; }
.gx-mini .num { font-size: 18px; }
.gx-mini .cap { overflow-wrap: anywhere; }
/* 17. All details: one tabbed panel */
.gx-details > summary { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 12px; min-height: 44px; cursor: pointer; list-style: none; }
.gx-details > summary::-webkit-details-marker { display: none; }
.gx-details > summary svg { margin-left: auto; transition: transform .2s; color: var(--muted); }
.gx-details[open] > summary svg { transform: rotate(180deg); }
.gx-details__t { font: 800 18px/1.2 var(--font); letter-spacing: -.01em; }
.gx-tabs { display: flex; gap: 2px; margin-top: 14px; border-bottom: 1px solid var(--line-strong); overflow-x: auto; scrollbar-width: none; }
.gx-tabs::-webkit-scrollbar { display: none; }
.gx .gx-tab { flex: none; display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 14px; color: var(--muted); font: 600 14px/1 var(--font); white-space: nowrap; }
.gx .gx-tab:hover { color: var(--text); text-decoration: none; }
.gx .gx-tab[aria-current="page"] { color: var(--text); box-shadow: inset 0 -2px 0 var(--copper); }
.gx-tab__n { padding: 2px 8px; border-radius: 999px; background: #EFE9E2; color: #43495A; font: 700 11px/1.3 var(--font); }
.gx-tab[aria-current="page"] .gx-tab__n { background: rgba(204,134,103,.2); color: #6E3E29; }
.gx-panel { padding-top: 16px; }
.gx-h3 { font: 700 15px/1.3 var(--font); margin: 4px 0 10px !important; }
.gx-h3 ~ .gx-h3 { margin-top: 26px !important; }
.gx-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 12px; }
.gx-search { display: flex; align-items: center; gap: 8px; width: 240px; max-width: 100%; height: 36px; padding: 0 12px; border-radius: 12px; background: #fff; box-shadow: inset 0 0 0 1px var(--line-strong); color: var(--muted); }
.gx-search input { flex: 1; min-width: 0; height: 34px; border: 0; background: transparent; color: var(--text); font: 500 13.5px/1 var(--font); outline: none; }
.gx-search:focus-within { outline: 2px solid var(--copper-lo); outline-offset: 2px; }
.gx-chips2 { display: flex; flex-wrap: wrap; gap: 6px; }
.gx-fchip { display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 13px; border: 0; border-radius: 999px; background: rgba(255,255,255,.6); box-shadow: inset 0 0 0 1px var(--line-strong); color: var(--text); font: 600 13px/1 var(--font); cursor: pointer; }
.gx-fchip[aria-pressed="true"] { background: var(--text); color: #fff; box-shadow: none; }
.gx-fchip__n { opacity: .72; font-weight: 700; }
.gx-count { white-space: nowrap; }
.gx-scroll { max-height: 620px; overflow: auto; border-radius: 16px; background: rgba(255,255,255,.72); box-shadow: inset 0 0 0 1px var(--line); }
.gx-table { width: 100%; border-collapse: separate; border-spacing: 0; font: 500 14px/1.4 var(--font); font-variant-numeric: tabular-nums; }
.gx-table th, .gx-table td { padding: 13px 14px; text-align: left; vertical-align: middle; border-bottom: 1px solid var(--line); white-space: nowrap; }
.gx-table .gx-n { text-align: right; }
.gx-table thead th { position: sticky; top: 0; z-index: 2; padding-top: 12px; padding-bottom: 10px; background: #FBF9F6; color: var(--muted); font: 600 12.5px/1.3 var(--font); }
.gx-table tbody th { position: sticky; left: 0; z-index: 1; background: #FFFFFF; font-weight: 500; min-width: 200px; max-width: 300px; white-space: normal; }
.gx-table thead th:first-child { left: 0; z-index: 3; }
.gx-table tbody tr:hover > * { background: #FBF6F2; }
.gx-table tbody tr[hidden] { display: none; }
.gx-table tr.gx-off > * { color: var(--muted); }
.gx-table tr.gx-off .gx-name b { color: #43495A; font-weight: 600; }
.gx-sort { all: unset; cursor: pointer; border-radius: 4px; }
.gx-sort:focus-visible { outline: 2px solid var(--copper-lo); outline-offset: 2px; }
th[aria-sort="descending"] .gx-sort::after { content: " ▼"; font-size: 9px; color: var(--copper-lo); }
th[aria-sort="ascending"] .gx-sort::after { content: " ▲"; font-size: 9px; color: var(--copper-lo); }
.gx-cn { display: flex; align-items: center; gap: 10px; }
.gx-name { display: grid; gap: 2px; min-width: 0; }
.gx-name b { font-weight: 700; }
.gx-raw { font: 500 11.5px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--muted); overflow-wrap: anywhere; }
.gx-sub { display: block; color: var(--muted); font: 500 12.5px/1.35 var(--font); white-space: normal; }
.gx-match { margin-left: 4px; padding: 1px 6px; border-radius: 6px; background: #EFE9E2; color: #43495A; font: 700 10.5px/1.4 var(--font); letter-spacing: .03em; text-transform: uppercase; vertical-align: 1px; }
.gx-st { display: inline-flex; align-items: center; gap: 7px; font-weight: 600; }
.gx-st__d { width: 8px; height: 8px; border-radius: 50%; background: #7A7F8C; flex: none; }
.gx-st[data-tone="good"] .gx-st__d { background: #12A16B; } .gx-st[data-tone="warn"] .gx-st__d { background: #E09A1E; } .gx-st[data-tone="bad"] .gx-st__d { background: #D64545; }
.gx-share { display: block; width: 90px; height: 4px; margin: 6px 0 0 auto; border-radius: 2px; background: #EFE9E2; overflow: hidden; }
.gx-share span { display: block; height: 100%; border-radius: inherit; }
.gx-total { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding: 14px 2px 0; font: 500 13.5px/1.4 var(--font); color: var(--muted); }
.gx-total b { color: var(--text); font-weight: 700; }
.gx-qs { display: inline-flex; align-items: center; gap: 8px; }
.gx-qs b { min-width: 14px; text-align: right; font-weight: 800; }
.gx-qs[data-tone="good"] b { color: #0B6B47; } .gx-qs[data-tone="warn"] b { color: #7A4F00; } .gx-qs[data-tone="bad"] b { color: #A12D2D; }
.gx-qs__bar { display: inline-flex; gap: 2px; }
.gx-qs__bar i { width: 5px; height: 12px; border-radius: 1.5px; background: #E7E0D8; }
.gx-qs[data-tone="good"] i.on { background: #12A16B; } .gx-qs[data-tone="warn"] i.on { background: #E09A1E; } .gx-qs[data-tone="bad"] i.on { background: #D64545; }
.gx-qds { display: inline-flex; gap: 8px; }
.gx-qd { display: inline-block; width: 11px; height: 11px; border-radius: 50%; background: #B9B3AB; vertical-align: -1px; }
.gx-qd[data-tone="good"] { background: #12A16B; } .gx-qd[data-tone="warn"] { background: #E09A1E; } .gx-qd[data-tone="bad"] { background: #D64545; }
.gx-qlegend { margin-top: 12px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.gx-qlegend b { color: var(--text); }
.gx-tipcard { margin-top: 14px; padding: 14px 16px; border-radius: 16px; background: rgba(204,134,103,.1); box-shadow: inset 0 0 0 1px rgba(204,134,103,.28); font: 500 14px/1.5 var(--font); }
.gx-tipcard__k { color: #6E3E29; font: 800 11.5px/1.3 var(--font); letter-spacing: .08em; text-transform: uppercase; margin-bottom: 4px !important; }
.gx-url { font-weight: 600; }
.gx-hist { margin: 4px 0 14px; max-width: 520px; }
.gx-hist label { display: grid; gap: 4px; }
.gx-hist select { min-height: 40px; padding: 0 10px; border: 1px solid var(--line-strong); border-radius: 12px; background: #fff; color: var(--text); font: 500 14px/1 var(--font); }
.gx-tl { display: grid; gap: 14px; border-left: 2px solid var(--line-strong); padding-left: 16px !important; }
.gx-tl li { position: relative; }
.gx-tl li::before { content: ""; position: absolute; left: -23px; top: 4px; width: 10px; height: 10px; border-radius: 50%; background: var(--copper); }
.gx-tl__at { font: 700 13px/1.3 var(--font); margin-bottom: 6px !important; }
.gx-tl dl { display: grid; gap: 2px; font-size: 13px; }
.gx-tl dl > div { display: grid; grid-template-columns: minmax(120px, 34%) 1fr; gap: 10px; padding: 3px 8px; border-radius: 8px; }
.gx-tl dt { color: var(--muted); overflow-wrap: anywhere; }
.gx-tl dd { overflow-wrap: anywhere; }
.gx-tl dd .chip { margin-left: 8px; }
.gx-tl .is-ch { background: rgba(224,154,30,.12); }
.gx-footer { text-align: center; padding-top: 4px; font: 500 12.5px/1.4 var(--font); color: var(--muted); }
.gx-diag { display: grid; gap: 16px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line); }
@media (min-width: 768px) { .gx-diag { grid-template-columns: 1fr 1.4fr; } }
.gx-diag ul, .gx-diag ol { display: grid; gap: 6px; margin-top: 6px; }
.gx-diag li { display: flex; gap: 8px; font-size: 13px; }
.gx-diag code { font: 600 12px/1.4 ui-monospace, Menlo, monospace; overflow-wrap: anywhere; }
.gx-diag__m[data-tone="good"] { color: #0B6B47; } .gx-diag__m[data-tone="bad"] { color: #A12D2D; }
/* Tablet and phone */
@media (max-width: 1100px) {
  .gx-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .g84, .g3, .g2 { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 767px) {
  .gx { gap: 14px; }
  .gx-head h1 { font-size: 26px; }
  .gx-head .seg { flex: 1 0 100%; flex-wrap: wrap; border-radius: 22px; }
  .gx-head .seg > * { flex: 1 1 0; padding: 0 6px; min-height: 44px; }
  .gx-refresh { position: absolute; top: 0; right: 0; }
  .gx-head { position: relative; }
  .gx-head__t { padding-right: 56px; }
  .gx-card { padding: 18px; }
  .gx-kpis { gap: 12px; }
  .gx-kpi { padding: 14px 14px 10px; }
  .gx-kpi__v { font-size: 22px; }
  .gx-foot4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .gx-dn { gap: 14px; }
  .gx-terms { grid-template-columns: minmax(0, 1fr); }
  .gx-mini { grid-template-columns: minmax(0, 1fr); }
  .gx-camp { gap: 10px; flex-wrap: wrap; }
  .gx-camp__b { flex-basis: calc(100% - 52px); }
  .gx-camp__r { text-align: left; margin-left: 48px; }
  .gx-heat { grid-template-columns: 40px repeat(7, minmax(0, 1fr)); gap: 4px; }
  .gx-heat__c { height: 24px; }
  .gx-pg__p { width: 104px; }
  .gx-plot { min-height: 220px; }
  .gx-ax--wide, .gx-pill__n { display: none; }
  .gx-search { width: 100%; }
  .gx-table tbody th { min-width: 160px; }
  .gx-tl dl > div { grid-template-columns: 1fr; gap: 0; }
  .gx-btn, .gx-banner__b, .gx-more, .gx-fchip, .gx-search { min-height: 44px; }
  .gx-search input { height: 42px; }
  .gx-attn__b a, .ct__x > a, .gx-chlink, .gx-total a { display: inline-flex; align-items: center; min-height: 44px; }
}
`;

/* ---------- Script: details tables (sort, search, chips, show more, CSV), attention, form test, copy, chart tooltip ---------- */

const GX_SCRIPT = `(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rowsOf = (t) => $$("tr", t.tBodies[0]);
  // A row shows when it matches the search box and the pressed chip; then only the first 25 until "Show more".
  const apply = (t) => {
    const q = (($('[data-search="' + t.id + '"]') || {}).value || "").trim().toLowerCase();
    const chip = $('[data-chip="' + t.id + '"][aria-pressed="true"]'), key = chip && chip.dataset.key, val = chip ? chip.dataset.val : "";
    const more = $('[data-more="' + t.id + '"]'), open = more && more.dataset.open === "1", limit = +t.dataset.limit || 25;
    let n = 0, shown = 0;
    rowsOf(t).forEach((r) => {
      const ok = (!q || r.textContent.toLowerCase().includes(q)) && (!val || (" " + (r.dataset[key] || "") + " ").includes(" " + val + " "));
      r.dataset.match = ok ? "1" : "0";
      if (ok) n++;
      r.hidden = !ok || (!open && !q && shown >= limit);
      if (ok && !r.hidden) shown++;
    });
    const c = $('[data-count="' + t.id + '"]'); if (c) c.textContent = n + (n === 1 ? " row" : " rows");
    if (more) { more.hidden = open || q || n <= limit; more.textContent = "Show more (" + (n - limit) + ")"; }
  };
  $$(".gx-table").forEach((t) => {
    apply(t);
    $$(".gx-sort", t).forEach((b) => b.addEventListener("click", () => {
      const th = b.closest("th"), col = +b.dataset.col, desc = th.getAttribute("aria-sort") !== "descending";
      $$("th", t.tHead).forEach((h) => h.removeAttribute("aria-sort")); th.setAttribute("aria-sort", desc ? "descending" : "ascending");
      const key = (tr) => { const c = tr.cells[col], v = c && c.dataset.v; if (v == null) return null; const n = Number(v); return v !== "" && !isNaN(n) ? n : v.toLowerCase(); };
      const rows = rowsOf(t);
      rows.sort((a, z) => { const x = key(a), y = key(z); if (x == null) return 1; if (y == null) return -1; const d = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y)); return desc ? -d : d; });
      rows.forEach((r) => t.tBodies[0].appendChild(r));
      apply(t);
    }));
  });
  $$("[data-search]").forEach((i) => i.addEventListener("input", () => apply(document.getElementById(i.dataset.search))));
  $$("[data-chip]").forEach((b) => b.addEventListener("click", () => {
    $$('[data-chip="' + b.dataset.chip + '"]').forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    apply(document.getElementById(b.dataset.chip));
  }));
  $$("[data-more]").forEach((b) => b.addEventListener("click", () => { b.dataset.open = "1"; apply(document.getElementById(b.dataset.more)); }));
  // CSV: every row that matches the search and the chip (not only the first 25 on screen).
  const cell = (s) => { s = s.replace(/\\s+/g, " ").trim(); return /[",\\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  $$("[data-csv]").forEach((b) => b.addEventListener("click", () => {
    const t = document.getElementById(b.dataset.csv);
    const head = $$("th", t.tHead).map((h) => cell(h.textContent));
    const body = rowsOf(t).filter((r) => r.dataset.match !== "0").map((r) => [...r.cells].map((c) => cell(c.textContent)).join(","));
    const blob = new Blob(["\\ufeff" + [head.join(","), ...body].join("\\n") + "\\n"], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "google-ads-" + b.dataset.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".csv"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }));
  // Needs attention: "Show all".
  const all = $(".gx-attn__all");
  all && all.addEventListener("click", () => { $$(".gx-attn__i[data-extra]").forEach((li) => (li.hidden = false)); all.remove(); });
  // The form test panel.
  const testBtn = $(".gx-banner__b"), test = $("#form-test");
  const showTest = (open) => { if (!test) return; test.hidden = !open; testBtn && testBtn.setAttribute("aria-expanded", String(open)); };
  testBtn && testBtn.addEventListener("click", () => { showTest(test.hidden); if (!test.hidden) test.scrollIntoView({ block: "nearest", behavior: "smooth" }); });
  // In-page links (form test, budget move): open first, then go there.
  const go = (id) => {
    const el = document.getElementById(id); if (!el) return false;
    if (id === "form-test") showTest(true);
    el.scrollIntoView({ block: "start", behavior: "smooth" }); el.focus({ preventScroll: true });
    return true;
  };
  $$("[data-open]").forEach((a) => a.addEventListener("click", (e) => { if (go(a.dataset.open)) { e.preventDefault(); history.replaceState(null, "", "#" + a.dataset.open); } }));
  if (location.hash === "#form-test") go("form-test");
  // Copy negatives: one per line, phrase match.
  $$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
    const src = document.getElementById(b.dataset.copy), out = b.parentElement.querySelector(".gx-copied"), text = src.value;
    try { await navigator.clipboard.writeText(text); }
    catch { src.hidden = false; src.select(); document.execCommand("copy"); src.hidden = true; }
    const n = text ? text.split("\\n").length : 0;
    if (out) out.textContent = "Copied " + n + (n === 1 ? " negative" : " negatives");
  }));
  // Chart: each day's numbers on hover, or focus the chart and use the arrow keys.
  $$(".gx-chart[data-days]").forEach((box) => {
    const days = JSON.parse(box.dataset.days), tip = $(".gx-ctip", box), area = $(".gx-plot__in", box), guide = $(".gx-guide", box), n = days.length;
    let i = -1;
    const show = (k) => {
      i = Math.max(0, Math.min(n - 1, k)); const d = days[i], x = (i / Math.max(1, n - 1)) * 100;
      tip.replaceChildren(Object.assign(document.createElement("b"), { textContent: d.t }), ...d.r.map(([l, v]) => { const sp = document.createElement("span"); sp.append(l, Object.assign(document.createElement("b"), { textContent: v })); return sp; }));
      const bw = box.getBoundingClientRect().width, aw = area.getBoundingClientRect().width;
      tip.hidden = false; tip.style.left = Math.min(Math.max(40 + (x / 100) * aw, 90), bw - 90) + "px";
      guide.hidden = false; guide.style.left = x + "%";
    };
    const hide = () => { tip.hidden = true; guide.hidden = true; };
    box.addEventListener("mousemove", (e) => { const r = area.getBoundingClientRect(); if (e.clientY > r.bottom + 30) return; show(Math.round(((e.clientX - r.left) / r.width) * (n - 1))); });
    box.addEventListener("mouseleave", () => { if (document.activeElement !== box) hide(); });
    box.addEventListener("focus", () => show(i < 0 ? n - 1 : i));
    box.addEventListener("blur", hide);
    box.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); show(i + (e.key === "ArrowLeft" ? -1 : 1)); }
      else if (e.key === "Escape") hide();
    });
  });
  // Custom period.
  const cb = $(".gx-custom-btn"), cf = $("#gx-custom");
  cb && cb.addEventListener("click", () => { cf.hidden = !cf.hidden; cb.setAttribute("aria-expanded", String(!cf.hidden)); if (!cf.hidden) cf.querySelector("input").focus(); });
  $$("[data-autosubmit]").forEach((s) => s.addEventListener("change", () => s.form.submit()));
})();`;
