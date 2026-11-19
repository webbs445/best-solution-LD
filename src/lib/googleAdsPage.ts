import { CSS, SCRIPT, dashCss, esc, href, icon, info, sprite, topbar, viewSwitch } from "@/lib/adLandingsPage";
import { yTicks } from "@/lib/adLandingsReport";
import { REPORT_START } from "@/lib/adsReport";
import {
  THRESHOLDS,
  attention,
  erpFor,
  erpIn,
  lowQualityScore,
  negativeCandidate,
  noLeadKeyword,
  pausedSince,
  type Attention,
  type ErpLead,
} from "@/lib/googleAdsInsights";
import type { Diagnosis, SheetData } from "@/lib/googleAdsSheet";
import {
  CHANNEL_LABEL,
  DASH,
  PERIODS,
  adRows,
  addDays,
  alertsOf,
  campaignRows,
  change,
  channelOf,
  cpc,
  ctr,
  dateOf,
  daysIn,
  div,
  fmtAed,
  fmtNum,
  fmtShare,
  freshness,
  groupBy,
  historyEntities,
  historySteps,
  inPeriod,
  imprShare,
  keywordRows,
  lostBudget,
  nextRun,
  pickPeriod,
  rowsOf,
  searchTermRows,
  segmentRows,
  stampMs,
  stampOf,
  statusOf,
  str,
  totals,
  type AdRow,
  type CampaignRow,
  type Channel,
  type Fresh,
  type KeywordRow,
  type NamedRow,
  type Period,
  type Row,
  type TermRow,
  type Totals,
} from "@/lib/googleAdsReport";

/*
  The Google Ads view of the ads dashboard (/ads-report?view=google-ads), rendered on the server from the report Sheet
  (through the Apps Script bridge) and the ERP's Google Ads leads. It answers three questions, top to bottom:
  1. Is anything wrong? (Needs attention)  2. How are we doing? (period, channel, KPIs, trend)  3. Why? (Campaigns ·
  Search · Audience · History). It wears the dashboard's design: the Ad landings page's top bar, view switch, styles
  and script are reused; the gad-* rules below add this view's parts.
  Query: ?range= | ?from=&to=, ?compare=off, ?channel=all|search|demandgen, ?campaign=<name>, ?section=, ?sub=,
  ?flag=noleads|lowqs|negative, ?hist=<id>, ?note= (after Refresh).
*/

/* ---------- Formatting ---------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayMonth = (d: string) => `${Number(d.slice(8))} ${MONTHS[Number(d.slice(5, 7)) - 1]}`;
const span = (a: string, b: string) => (a === b ? dayMonth(a) : `${dayMonth(a)} – ${dayMonth(b)}`);
const datesBetween = (a: string, b: string) => Array.from({ length: Math.max(0, daysIn(a, b)) }, (_, i) => addDays(a, i));
/** "APPROVED_LIMITED" → "Approved limited". */
const pretty = (s: string) => (s ? (s[0] + s.slice(1).toLowerCase()).replace(/_/g, " ") : DASH);
const count1 = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

type Tone = "good" | "warn" | "bad" | "neutral" | "muted";
const TONES: [RegExp, Tone][] = [
  [/^(enabled|approved|excellent|good|above[_ ]average|eligible|added)$/i, "good"],
  [/^(paused)$/i, "neutral"],
  [/^(removed)$/i, "muted"],
  [/^(average|limited|approved[_ ]limited|learning|pending|under[_ ]review)$/i, "warn"],
  [/^(disapproved|poor|below[_ ]average|excluded|not[_ ]eligible|suspended)$/i, "bad"],
];
const toneOf = (s: string): Tone => TONES.find(([re]) => re.test(s.trim()))?.[1] ?? "neutral";
const pill = (s: string) => (s ? `<span class="gad-pill" data-tone="${toneOf(s)}">${esc(pretty(s))}</span>` : DASH);
/** A long name cut with an ellipsis; the full name in the tooltip. */
const trunc = (s: string) => `<span class="gad-trunc" title="${esc(s)}">${esc(s || DASH)}</span>`;

/* ---------- Tables: sortable, searchable, filterable, CSV of the matching rows, 25 rows then "Show more" ---------- */

interface Col<T> {
  label: string;
  /** Cell HTML. */
  html: (r: T) => string;
  /** Sort value (numbers sort as numbers). */
  v?: (r: T) => number | string | null;
  /** Text column (left-aligned). */
  left?: boolean;
}

const money = <T,>(label: string, get: (r: T) => number | null, dp = 2): Col<T> => ({ label, html: (r) => esc(fmtAed(get(r), dp)), v: get });
const count = <T,>(label: string, get: (r: T) => number | null): Col<T> => ({ label, html: (r) => esc(fmtNum(get(r))), v: get });
const share = <T,>(label: string, get: (r: T) => number | null): Col<T> => ({ label, html: (r) => esc(fmtShare(get(r))), v: get });
const text = <T,>(label: string, get: (r: T) => string): Col<T> => ({ label, html: (r) => esc(get(r) || DASH), v: get, left: true });
const metricCols = <T,>(t: (r: T) => Totals, impr = true): Col<T>[] => [
  ...(impr ? [count<T>("Impr.", (r) => t(r).impr)] : []),
  count<T>("Clicks", (r) => t(r).clicks),
  money<T>("Cost", (r) => t(r).cost),
  count<T>("Google conv.", (r) => t(r).conv),
];

const PAGE_ROWS = 25;

function table<T>(id: string, name: string, cols: Col<T>[], rows: T[], opts: { empty: string; rowAttr?: (r: T) => string; filters?: string } = { empty: "" }) {
  const head = cols.map((c, i) => `<th scope="col"${i === 0 || c.left ? "" : ' class="gad-num"'}><button type="button" class="gad-sort" data-col="${i}">${esc(c.label)}</button></th>`).join("");
  const body = rows.length
    ? rows
        .map((r) => {
          const cells = cols
            .map((c, i) => {
              const v = c.v?.(r);
              const dv = v == null || v === "" ? "" : ` data-v="${esc(v)}"`;
              return i === 0 ? `<th scope="row"${dv}>${c.html(r)}</th>` : `<td${c.left ? "" : ' class="gad-num"'}${dv}>${c.html(r)}</td>`;
            })
            .join("");
          return `<tr${opts.rowAttr?.(r) ?? ""}>${cells}</tr>`;
        })
        .join("")
    : `<tr class="gad-none-row"><td colspan="${cols.length}">${esc(opts.empty)}</td></tr>`;
  return `<div class="gad-tools">
      <label class="lr-search gad-search">${icon("search")}<span class="lr-sr">Search ${esc(name)}</span><input class="lr-input" type="search" placeholder="Search ${esc(name.toLowerCase())}" data-search="${id}"></label>
      ${opts.filters ?? ""}
      <span class="gad-count" data-count="${id}" aria-live="polite">${count1(rows.length, "row")}</span>
      <button type="button" class="lr-btn-ghost gad-csv" data-csv="${id}" data-name="${esc(name)}">${icon("copy")}CSV</button>
    </div>
    <div class="gad-scroll" tabindex="0" role="region" aria-label="${esc(name)} table"><table class="gad-table" id="${id}" data-limit="${PAGE_ROWS}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
    <button type="button" class="lr-btn-ghost gad-more" data-more="${id}" hidden>Show more</button>`;
}

/* ---------- Header and freshness ---------- */

function header(q: URLSearchParams, updated: string, fresh: Fresh) {
  const when = updated ? `Updated ${updated.slice(11, 16) || updated} Dubai` : "Update time not in the Sheet";
  const text: Record<Fresh, string> = {
    good: `${when}${nextRun(updated) ? ` · next ${nextRun(updated)}` : ""}`,
    warn: `${when} · late (9+ hours)`,
    bad: `Report is not updating · last update ${updated ? `${dayMonth(updated.slice(0, 10))} ${updated.slice(11, 16)}` : "unknown"}`,
    unknown: when,
  };
  return `<header class="gad-head">
      <div class="gad-head__title"><h1 class="gad-title">Google Ads</h1><p class="gad-muted">Best Solution Management Services</p></div>
      <div class="gad-head__right">
        <span class="gad-fresh" data-tone="${fresh}" role="status"><span class="gad-dot" aria-hidden="true"></span>${esc(text[fresh])}</span>
        <a class="lr-btn-ghost gad-refresh" href="${esc(href(q, { refresh: "1", note: null }))}" data-nav title="Read the Sheet again (once every 2 minutes)">${icon("refresh")}<span class="gad-refresh__label">Refresh</span></a>
      </div>
    </header>`;
}

/* ---------- 1. Needs attention ---------- */

const LEVEL_WORD: Record<Attention["level"], string> = { red: "Urgent", orange: "Check", yellow: "Review", info: "Note" };

function needsAttention(items: Attention[], q: URLSearchParams, checkedAt: string) {
  if (!items.length)
    return `<section class="lr-card gad-attn gad-attn--clear" aria-labelledby="gad-attn-t"><h2 class="gad-h2" id="gad-attn-t">${icon("tick")}Nothing needs attention</h2><p class="gad-muted">No check found a problem in this period${checkedAt ? `, and the ${checkedAt.slice(11, 16)} check of the Sheet found none` : ""}.</p></section>`;
  const sheetLabel = checkedAt ? `From the ${checkedAt.slice(11, 16)} check` : "From the Sheet's check";
  const li = items
    .map((a, i) => {
      const link = href(q, { section: null, sub: null, flag: null, hist: null, campaign: null, refresh: null, note: null, ...a.link });
      return `<li class="gad-attn__item" data-level="${a.level}"${i >= THRESHOLDS.visibleItems ? " hidden data-extra" : ""}>
          <span class="gad-attn__level">${LEVEL_WORD[a.level]}</span>
          <p class="gad-attn__text">${esc(a.text)}${a.source === "sheet" ? ` <span class="gad-attn__src">${esc(sheetLabel)}</span>` : ""}</p>
          ${a.aed != null ? `<span class="gad-attn__aed">${esc(fmtAed(a.aed, 0))}<small>spent</small></span>` : `<span class="gad-attn__aed"></span>`}
          <a class="gad-attn__go" href="${esc(link)}#why" data-nav>See details<span class="lr-sr">: ${esc(a.text)}</span></a>
        </li>`;
    })
    .join("");
  const extra = items.length - THRESHOLDS.visibleItems;
  return `<section class="lr-card gad-attn" aria-labelledby="gad-attn-t">
      <div class="gad-attn__head"><h2 class="gad-h2" id="gad-attn-t">Needs attention <span class="gad-badge">${items.length}</span>${info("Needs attention", "Checks on the selected period (cost without leads, accidental clicks, tracking gaps, budget limits, status changes, keywords and search terms), plus the alerts the Google Ads script writes to the Sheet. Most urgent first, then by money involved.")}</h2></div>
      <ol class="gad-attn__list">${li}</ol>
      ${extra > 0 ? `<button type="button" class="lr-btn-ghost gad-attn__all" aria-expanded="false">Show all (${extra} more)</button>` : ""}
    </section>`;
}

/* ---------- 2. How are we doing? ---------- */

function controls(q: URLSearchParams, period: Period, today: string, channel: Channel | "all", campaign: string, compare: boolean) {
  const chip = (k: string, l: string) =>
    `<a class="lr-chip lr-glass gad-chip${k === "7d" || k === "30d" ? " gad-chip--2" : ""}" href="${esc(href(q, { range: k, from: null, to: null, refresh: null, note: null }))}"${period.key === k ? ' aria-current="page"' : ""} data-nav>${l}${k === "7d" || k === "30d" ? '<small>to yesterday</small>' : ""}</a>`;
  const custom = period.key === "custom";
  const keep = ["campaign", "compare", "channel", "section", "sub"].map((k) => (q.get(k) ? `<input type="hidden" name="${k}" value="${esc(q.get(k))}">` : "")).join("");
  const channels = (["all", "search", "demandgen"] as const)
    .map((c) => `<a class="gad-seg__opt" href="${esc(href(q, { channel: c, refresh: null, note: null }))}"${channel === c ? ' aria-current="true"' : ""} data-nav>${CHANNEL_LABEL[c]}</a>`)
    .join("");
  const prevWords = span(period.prevFrom, period.prevTo);
  return `<div class="lr-controls">
      ${viewSwitch(q, "", "google-ads")}
      <nav class="lr-range" aria-label="Period">
        <div class="lr-range__chips">${PERIODS.map(([k, l]) => chip(k, l)).join("")}
          <button type="button" class="lr-chip lr-glass gad-chip" aria-expanded="${period.error ? "true" : "false"}" aria-controls="alx-custom"${custom ? ' aria-current="page"' : ""}>${custom ? `${esc(span(period.from, period.to))}` : "Custom"}${icon("chevron")}</button>
        </div>
        <form class="lr-custom lr-glass alx-custom" id="alx-custom" method="get" action=""${period.error ? "" : " hidden"} aria-label="Custom range">
          <input type="hidden" name="view" value="google-ads">${keep}
          <label class="lr-field"><span class="lr-field__label">From</span><input class="lr-input" type="date" name="from" value="${esc(period.from)}" max="${esc(today)}" required></label>
          <label class="lr-field"><span class="lr-field__label">To</span><input class="lr-input" type="date" name="to" value="${esc(period.to)}" max="${esc(today)}" required></label>
          <p class="lr-custom__err" role="alert">${esc(period.error)}</p>
          <div class="lr-custom__actions"><button type="button" class="lr-btn-ghost" data-action="custom-cancel">Cancel</button><button type="submit" class="lr-btn">Apply</button></div>
        </form>
      </nav>
    </div>
    <div class="gad-bar">
      ${campaign
        ? `<p class="gad-filter">Campaign: <b>${trunc(campaign)}</b> <a class="gad-filter__x" href="${esc(href(q, { campaign: null, hist: null, refresh: null, note: null }))}" data-nav aria-label="Clear the campaign filter">${icon("x")}</a></p>`
        : `<nav class="gad-seg" aria-label="Channel">${channels}</nav>${info("the channel switch", "Search and Demand Gen are shown apart because Demand Gen brings many cheap clicks that make the totals look better than they are. All adds them up.")}`}
      <a class="lr-chip lr-glass alx-toggle gad-compare" href="${esc(href(q, { compare: compare ? "off" : null, refresh: null, note: null }))}" role="switch" aria-checked="${compare}" data-nav><span class="alx-toggle__track" aria-hidden="true"></span>Compare with ${esc(prevWords)}</a>
    </div>`;
}

function delta(ch: number | null, goodWhenDown: boolean, prevWords: string) {
  if (ch == null) return `<span class="alx-nodelta">No fair comparison</span>`;
  const p = Math.round(ch * 100);
  const dir = p > 0 ? "up" : p < 0 ? "down" : "flat";
  const tone = dir === "flat" ? "neutral" : (dir === "down") === goodWhenDown ? "good" : "bad";
  const glyph = dir === "up" ? "▲" : dir === "down" ? "▼" : "→";
  const words = dir === "flat" ? `no change on ${prevWords}` : `${dir} ${Math.abs(p)}% on ${prevWords}`;
  return `<span class="lr-delta" data-tone="${tone}" role="img" aria-label="${esc(words)}"><span class="lr-delta__glyph" aria-hidden="true">${glyph}</span>${Math.abs(p)}%</span><span class="alx-vs">vs ${esc(prevWords)}</span>`;
}

interface Kpi {
  t: Totals;
  /** ERP leads and qualified leads, or null when the ERP isn't connected. */
  leads: number | null;
  qualified: number | null;
}

/** `nc`: what an ERP tile says when it has no number (the ERP isn't connected, or the period is before ERP leads were counted). */
function kpis(cur: Kpi, prev: Kpi | null, prevWords: string, channelWord: string, nc: string) {
  const NC = nc;
  const tile = (key: string, label: string, value: string | null, c: number | null, p: number | null, goodDown: boolean, help: string) => `<section class="lr-card lr-kpi is-kpi gad-kpi" data-kpi="${key}" aria-label="${esc(label)}">
      <h3 class="lr-kpi__label gad-kpi__label">${esc(label)}${info(label, help)}</h3>
      ${value == null ? `<div class="gad-kpi__nc">${NC}</div>` : `<div class="lr-kpi__value gad-kpi__value">${esc(value)}</div>`}
      ${prev && value != null ? `<div class="lr-kpi__meta">${delta(change(c, p), goodDown, prevWords)}</div>` : ""}
    </section>`;
  const erp = (v: number | null) => (cur.leads == null ? null : v);
  const cpl = div(cur.t.cost, cur.leads), pcpl = prev ? div(prev.t.cost, prev.leads) : null;
  return [
    tile("cost", "Cost", fmtAed(cur.t.cost, 0), cur.t.cost, prev?.t.cost ?? null, true, `What Google Ads charged for ${channelWord} in this period, in AED.`),
    tile("clicks", "Clicks", fmtNum(cur.t.clicks), cur.t.clicks, prev?.t.clicks ?? null, false, "How many times people clicked the ads."),
    tile("cpc", "Avg CPC", fmtAed(cpc(cur.t)), cpc(cur.t), prev ? cpc(prev.t) : null, true, "Average cost of one click: cost ÷ clicks."),
    tile("leads", "ERP leads", erp(cur.leads) == null ? null : fmtNum(cur.leads), cur.leads, prev?.leads ?? null, false, "Leads in the ERP whose campaign is one of these Google Ads campaigns, created in this period (Dubai time). These are real enquiries, not Google's count."),
    tile("cpl", "Cost per ERP lead", erp(cpl) == null && cur.leads == null ? null : fmtAed(cpl), cpl, pcpl, true, "Cost ÷ ERP leads: what one real lead cost."),
    tile("qualified", "Qualified leads (ERP)", erp(cur.qualified) == null ? null : fmtNum(cur.qualified), cur.qualified, prev?.qualified ?? null, false, "ERP leads that are not Junk, Duplicate or Lost: won or still in progress."),
    tile("conv", "Google conversions", fmtNum(cur.t.conv), cur.t.conv, prev?.t.conv ?? null, false, "What Google Ads counted as conversions. It can differ from ERP leads (tracking, consent, duplicates) and Google may update it for several days."),
    tile("ctr", "CTR", fmtShare(ctr(cur.t)), ctr(cur.t), prev ? ctr(prev.t) : null, false, "Share of ad views that got a click: clicks ÷ impressions."),
  ].join("");
}

function trend(rows: Row[], leads: ErpLead[] | null, period: Period, today: string) {
  const by = groupBy(rows, (r) => dateOf(r.Date));
  const days = datesBetween(period.from, period.to).map((d) => ({ d, t: totals(by.get(d) ?? []), l: leads ? leads.filter((x) => x.created.slice(0, 10) === d).length : null }));
  const n = days.length;
  const conv = days.map((x) => x.t.conv ?? 0);
  const lead = days.map((x) => x.l ?? 0);
  const cost = days.map((x) => x.t.cost ?? 0);
  const ticks = yTicks(Math.max(0, ...cost)), max = ticks[ticks.length - 1];
  const rTicks = yTicks(Math.max(3, Math.ceil(Math.max(0, ...conv, ...lead) * 1.25))), rMax = rTicks[rTicks.length - 1];
  const x = (i: number) => ((i + 0.5) / n) * 100;
  // About six labels, so they never overlap on a phone.
  const every = n <= 7 ? 1 : Math.ceil(n / 6);
  const grid = (t: number[], m: number, side: "l" | "r", fmt: (v: number) => string) =>
    t.map((v) => `<div class="alx-grid gad-grid${v ? "" : " alx-grid--zero"}" data-side="${side}" style="--t:${(100 - (v / m) * 100).toFixed(2)}%" aria-hidden="true"><span>${esc(fmt(v))}</span></div>`).join("");
  const cols = days
    .map(({ d, t, l }) => {
      const tip = `${dayMonth(d)} ${d.slice(0, 4)}${d === today ? " (partial)" : ""}|Cost ${fmtAed(t.cost)}|ERP leads ${l == null ? "not connected" : l}|Google conversions ${fmtNum(t.conv ?? 0)}`;
      return `<button type="button" class="alx-col" data-tip="${esc(tip)}" aria-label="${esc(tip.split("|").join(", "))}"><span class="alx-stack"><span class="alx-seg gad-cost" style="--h:${(((t.cost ?? 0) / max) * 100).toFixed(2)}%"></span></span></button>`;
    })
    .join("");
  const path = (v: number[]) => v.map((y, i) => `${i ? "L" : "M"}${x(i).toFixed(2)},${(100 - (y / rMax) * 100).toFixed(2)}`).join(" ");
  const xs = days.map(({ d }, i) => `<span>${i % every === 0 || (i === n - 1 && i % every >= every / 2) ? esc(dayMonth(d)) : ""}</span>`).join("");
  return `<section class="lr-card gad-card gad-chart" aria-labelledby="gad-chart-t">
    <div class="lr-card__head"><h2 class="lr-card__title" id="gad-chart-t">Daily cost and leads${info("the daily chart", "Bars: cost per Dubai day (left axis, AED). Lines: ERP leads (solid) and Google conversions (dashed) per day (right axis). Tap or hover a day for its numbers.")}</h2></div>
    <div class="alx-legend gad-legend" aria-hidden="true"><span class="alx-key gad-key-bar">Cost (AED)</span>${leads ? '<span class="alx-key gad-key-lead">ERP leads</span>' : ""}<span class="alx-key gad-key-conv">Google conversions</span></div>
    <div class="alx-plot gad-plot">
      <div class="alx-area">
        ${grid(ticks, max, "l", (v) => fmtNum(v))}${grid(rTicks, rMax, "r", (v) => fmtNum(v))}
        <div class="alx-cols" style="--n:${n}">${cols}</div>
        ${n > 1 ? `<svg class="alx-line gad-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${leads ? `<path class="gad-line-lead" d="${path(lead)}"/>` : ""}<path class="gad-line-conv" d="${path(conv)}"/></svg>` : ""}
        ${leads ? lead.map((v, i) => `<span class="alx-pt gad-pt-lead" aria-hidden="true" style="--x:${x(i).toFixed(2)}%;--y:${((v / rMax) * 100).toFixed(2)}%"></span>`).join("") : ""}
        <div class="lr-chart__tip lr-glass alx-tip" hidden></div>
      </div>
      <div class="alx-x" aria-hidden="true" style="--n:${n}">${xs}</div>
    </div>
    <p class="alx-caption">${period.to === today ? "Today is partial: the Sheet is updated at 06:00, 13:00 and 20:00 Dubai. " : ""}${leads ? "" : "No ERP leads to show for this period here."}</p>
  </section>`;
}

/* ---------- 3. Why? ---------- */

const SECTIONS = [["campaigns", "Campaigns"], ["search", "Search"], ["audience", "Audience"], ["history", "History"]] as const;
type Section = (typeof SECTIONS)[number][0];
const SUBS = [["keywords", "Keywords"], ["terms", "Search terms"], ["ads", "Ads"]] as const;
type Sub = (typeof SUBS)[number][0];
const FLAGS: Record<string, string> = {
  noleads: `Keywords that spent AED ${THRESHOLDS.keywordNoLeadsCostAed}+ with no leads`,
  lowqs: `Keywords with Quality Score ${THRESHOLDS.lowQualityScore} or less`,
  negative: `Search terms that spent AED ${THRESHOLDS.searchTermCostAed}+ with no conversions (negative-keyword candidates)`,
};

const where = (campaign: string, adGroup: string) => `<small class="gad-sub">${esc([campaign, adGroup].filter(Boolean).join(" · "))}</small>`;
const flagPill = (label: string) => `<span class="gad-pill gad-flag" data-tone="bad">${esc(label)}</span>`;
const url = (u: string) => (/^https?:\/\//i.test(u) ? `<a class="gad-url" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(u.replace(/^https?:\/\/(www\.)?/, ""))}</a>` : esc(u || DASH));

interface WhyInput {
  d: SheetData;
  q: URLSearchParams;
  period: Period;
  campaign: string;
  camps: CampaignRow[];
  /** ERP leads in the period (null: not connected). */
  erp: ErpLead[] | null;
  keywords: KeywordRow[];
  terms: TermRow[];
}

function campaignsSection(w: WhyInput) {
  const { q, campaign, camps, erp, d } = w;
  const history = rowsOf(d.tabs.Setup_History), log = rowsOf(d.tabs.Change_Log_30d);
  const leads = (r: CampaignRow) => (erp ? erpFor(erp, r.name).length : null);
  const cols: Col<CampaignRow>[] = [
    { label: "Campaign", html: (r) => `<a class="gad-camp" href="${esc(href(q, { campaign: campaign === r.name ? null : r.name, refresh: null, note: null }))}#why" data-nav>${trunc(r.name || r.id)}</a>`, v: (r) => r.name, left: true },
    {
      label: "Status now",
      html: (r) => {
        const since = /paused/i.test(r.status) ? pausedSince(r, history, log) : "";
        return `${pill(r.status)}${since ? `<small class="gad-sub gad-nowrap">since ${esc(dayMonth(since))}</small>` : ""}`;
      },
      v: (r) => r.status,
      left: true,
    },
    text("Type", (r) => pretty(r.type)),
    money("Daily budget", (r) => r.budget, 0),
    { label: "Bidding", html: (r) => `${esc(r.bidding ? pretty(r.bidding) : DASH)}${r.maxCpc ? `<small class="gad-sub">Max CPC ${esc(fmtAed(r.maxCpc))}</small>` : ""}`, v: (r) => r.bidding, left: true },
    money("Cost", (r) => r.t.cost),
    count("Clicks", (r) => r.t.clicks),
    money("Avg CPC", (r) => cpc(r.t)),
    count("ERP leads", leads),
    money("Cost / ERP lead", (r) => div(r.t.cost, leads(r))),
    count("Google conv.", (r) => r.t.conv),
    share("Lost IS (budget)", (r) => lostBudget(r.t)),
  ];
  const select = (key: string, label: string, opts: [string, string][]) =>
    `<label class="gad-select"><span>${label}</span><select class="lr-select" data-filter="gad-campaigns" data-key="${key}">${opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></label>`;
  const filters = campaign
    ? ""
    : select("status", "Status", [["all", "All"], ["enabled", "Enabled"], ["paused", "Paused"], ["removed", "Removed"]]) +
      select("channel", "Channel", [["all", "All"], ["search", "Search"], ["demandgen", "Demand Gen"]]);
  return `<p class="gad-note">${erp ? "" : "ERP not connected here: ERP lead columns show –. "}Status, budget and bidding are today's settings; the numbers are for the period. Click a campaign to filter the whole page to it.</p>
    ${table("gad-campaigns", "Campaigns", cols, camps, {
      empty: "No campaigns in the Sheet.",
      filters,
      rowAttr: (r) => ` data-status="${esc(r.status.toLowerCase())}" data-channel="${r.channel}"${r.inactive ? ' class="gad-inactive"' : ""}${r.name === campaign ? ' aria-current="true"' : ""}`,
    })}`;
}

function searchSection(w: WhyInput, sub: Sub) {
  const { q, d, period, campaign, erp } = w;
  const flag = q.get("flag") ?? "";
  const subNav = `<nav class="gad-subtabs" aria-label="Search details">${SUBS.map(([k, l]) => `<a class="lr-bd__tab" href="${esc(href(q, { section: "search", sub: k, flag: null, refresh: null, note: null }))}#why"${k === sub ? ' aria-current="true"' : ""} data-nav>${l}</a>`).join("")}</nav>`;
  const flagChip = FLAGS[flag] ? `<p class="gad-filter">Showing only: <b>${esc(FLAGS[flag])}</b> <a class="gad-filter__x" href="${esc(href(q, { flag: null, refresh: null, note: null }))}#why" data-nav aria-label="Show all rows">${icon("x")}</a></p>` : "";
  const keep90 = `<p class="gad-note">Keywords and search terms are kept for the last 90 days.</p>`;
  if (sub === "keywords") {
    let rows = w.keywords;
    if (flag === "noleads") rows = rows.filter((k) => noLeadKeyword(k, erp));
    if (flag === "lowqs") rows = rows.filter(lowQualityScore);
    const kwLeads = (k: KeywordRow) => (erp ? erpFor(erp, k.campaign).filter((l) => l.keyword.trim().toLowerCase() === k.keyword.replace(/[[\]"+]/g, "").trim().toLowerCase()).length : null);
    return `${subNav}${flagChip}${keep90}${table<KeywordRow>(
      "gad-keywords",
      "Keywords",
      [
        { label: "Keyword", html: (r) => `<span class="gad-name">${esc(r.keyword)} <span class="gad-match">${esc(pretty(r.match))}</span>${where(r.campaign, r.adGroup)}${noLeadKeyword(r, erp) ? flagPill("Spend, no leads") : ""}${lowQualityScore(r) ? flagPill("Low QS") : ""}</span>`, v: (r) => r.keyword, left: true },
        ...metricCols<KeywordRow>((r) => r.t),
        count("ERP leads", kwLeads),
        share("Impr. share", (r) => imprShare(r.t)),
        { label: "QS", html: (r) => (r.qs == null ? DASH : `<b class="gad-qs" data-tone="${r.qs >= 7 ? "good" : r.qs >= 5 ? "warn" : "bad"}">${r.qs}</b><span class="lr-sr"> of 10</span>`), v: (r) => r.qs },
        { label: "Exp. CTR", html: (r) => pill(r.expCtr), v: (r) => r.expCtr, left: true },
        { label: "Ad relevance", html: (r) => pill(r.adRelevance), v: (r) => r.adRelevance, left: true },
        { label: "Landing page", html: (r) => pill(r.landingPage), v: (r) => r.landingPage, left: true },
        { label: "Final URL", html: (r) => url(r.finalUrl), v: (r) => r.finalUrl, left: true },
      ],
      rows,
      { empty: flag ? "No keywords match this filter in this period." : "No keyword data for this period.", rowAttr: (r) => (noLeadKeyword(r, erp) || lowQualityScore(r) ? ' class="gad-flagged"' : "") },
    )}`;
  }
  if (sub === "terms") {
    let rows = w.terms;
    if (flag === "negative") rows = rows.filter(negativeCandidate);
    return `${subNav}${flagChip}${keep90}${table<TermRow>(
      "gad-terms",
      "Search terms",
      [
        { label: "Search term", html: (r) => `<span class="gad-name">${esc(r.term)}${where(r.campaign, r.adGroup)}${negativeCandidate(r) ? flagPill("Negative candidate") : ""}</span>`, v: (r) => r.term, left: true },
        text("Matched keyword", (r) => r.matched),
        { label: "Added / excluded", html: (r) => (r.added && !/^none$/i.test(r.added) ? pill(r.added) : DASH), v: (r) => r.added, left: true },
        ...metricCols<TermRow>((r) => r.t),
      ],
      rows,
      { empty: flag ? "No search terms match this filter in this period." : "No search terms for this period.", rowAttr: (r) => (negativeCandidate(r) ? ' class="gad-flagged"' : "") },
    )}`;
  }
  const perfNote = d.tabs.Perf_Ads_Daily ? "" : `<p class="gad-note">Period numbers need the Perf_Ads_Daily tab; it isn't in the Sheet yet.</p>`;
  return `${subNav}${perfNote}${table<AdRow>(
    "gad-ads",
    "Ads",
    [
      { label: "Ad", html: (r) => `<span class="gad-name">${esc(pretty(str(r.setup, "Ad type")))} <small class="gad-muted">#${esc(str(r.setup, "Ad ID"))}</small>${where(str(r.setup, "Campaign"), str(r.setup, "Ad group"))}</span>`, v: (r) => str(r.setup, "Ad group"), left: true },
      { label: "Status", html: (r) => pill(str(r.setup, "Ad status")), v: (r) => str(r.setup, "Ad status"), left: true },
      { label: "Ad strength", html: (r) => pill(str(r.setup, "Ad strength")), v: (r) => str(r.setup, "Ad strength"), left: true },
      { label: "Approval", html: (r) => pill(str(r.setup, "Ad approval")), v: (r) => str(r.setup, "Ad approval"), left: true },
      { label: "Final URL", html: (r) => `${url(str(r.setup, "Final URL"))}${str(r.setup, "Path 1") || str(r.setup, "Path 2") ? `<small class="gad-sub">/${esc([str(r.setup, "Path 1"), str(r.setup, "Path 2")].filter(Boolean).join("/"))}</small>` : ""}`, v: (r) => str(r.setup, "Final URL"), left: true },
      ...metricCols<AdRow>((r) => r.t),
    ],
    adRows(rowsOf(d.tabs.Setup_Ads), inPeriod(rowsOf(d.tabs.Perf_Ads_Daily), period.from, period.to, campaign), campaign),
    { empty: "No ads in the Sheet." },
  )}`;
}

/** Small bars (share of cost, or of clicks when there's no cost) and a table, for one audience breakdown. */
function segment(id: string, title: string, column: string, rows: Row[], when: string, impr = true) {
  const list = segmentRows(rows, column);
  const by: "cost" | "clicks" = list.some((r) => r.t.cost) ? "cost" : "clicks";
  const sum = list.reduce((s, r) => s + (r.t[by] ?? 0), 0);
  const bars = sum
    ? `<ol class="gad-bars">${list
        .slice(0, 6)
        .map((r) => {
          const sh = (r.t[by] ?? 0) / sum;
          return `<li><div class="gad-bars__top"><span>${esc(r.label)}</span><span>${esc(by === "cost" ? fmtAed(r.t.cost, 0) : fmtNum(r.t.clicks))} <small>${(sh * 100).toFixed(0)}%</small></span></div><div class="gad-bars__track"><span style="--w:${(sh * 100).toFixed(1)}%"></span></div></li>`;
        })
        .join("")}</ol>`
    : "";
  const cols: Col<NamedRow>[] = [{ label: title, html: (r) => esc(r.label), v: (r) => r.label, left: true }, ...metricCols<NamedRow>((r) => r.t, impr), money<NamedRow>("Cost / conv.", (r) => div(r.t.cost, r.t.conv))];
  return `<section class="gad-aud" aria-labelledby="${id}-t"><h3 class="gad-h3" id="${id}-t">${esc(title)}s <span class="gad-muted">· ${esc(when)}</span></h3>${bars}${table(id, `${title}s`, cols, list, { empty: "No data for this period." })}</section>`;
}

function audienceSection(w: WhyInput) {
  const { d, period, campaign } = w;
  const cut = (name: keyof SheetData["tabs"]) => inPeriod(rowsOf(d.tabs[name]), period.from, period.to, campaign);
  const camp = (name: keyof SheetData["tabs"]) => rowsOf(d.tabs[name]).filter((r) => !campaign || str(r, "Campaign") === campaign);
  const when = `${span(period.from, period.to)}`;
  return [
    segment("gad-devices", "Device", "Device", cut("Perf_Devices_Daily"), when),
    segment("gad-networks", "Network", "Network", cut("Perf_Channels_Daily"), when),
    segment("gad-locations", "Location", "City", camp("Perf_Locations_30d"), "last 30 days"),
    segment("gad-ages", "Age range", "Age range", camp("Perf_Ages_30d"), "last 30 days", false),
    segment("gad-audiences", "Audience", "Name", camp("Perf_Audiences_30d"), "last 30 days", false),
  ].join("");
}

function historySection(w: WhyInput) {
  const { d, q, campaign } = w;
  const log = rowsOf(d.tabs.Change_Log_30d)
    .filter((r) => !campaign || str(r, "Campaign") === campaign)
    .sort((a, b) => stampOf(b["Changed at"]).localeCompare(stampOf(a["Changed at"])));
  const list = table<Row>(
    "gad-changes",
    "Changes",
    [
      { label: "Changed at", html: (r) => `<span class="gad-name">${esc(stampOf(r["Changed at"]))}<small class="gad-sub">${esc(str(r, "Changed from"))}</small></span>`, v: (r) => stampOf(r["Changed at"]), left: true },
      text("Who", (r) => str(r, "Changed by")),
      text("What changed", (r) => pretty(str(r, "What changed"))),
      text("Action", (r) => pretty(str(r, "Action"))),
      text("Fields changed", (r) => str(r, "Fields changed")),
      { label: "Where", html: (r) => trunc([str(r, "Campaign"), str(r, "Ad group")].filter(Boolean).join(" · ")), v: (r) => str(r, "Campaign"), left: true },
    ],
    log,
    { empty: "No changes in the last 30 days." },
  );
  const hist = rowsOf(d.tabs.Setup_History);
  const ents = historyEntities(campaign ? hist.filter((r) => str(r, "Campaign") === campaign || str(r, "Name") === campaign) : hist);
  const pick = ents.find((e) => e.id === q.get("hist")) ?? ents[0];
  const steps = pick ? historySteps(hist, pick.id) : [];
  const keep = ["view", "range", "from", "to", "compare", "channel", "campaign", "section"].map((k) => (q.get(k) ? `<input type="hidden" name="${k}" value="${esc(q.get(k))}">` : "")).join("");
  const timeline = steps.length
    ? `<ol class="gad-timeline">${steps
        .map(
          (s) => `<li><p class="gad-timeline__at">${esc(s.at || DASH)}</p><dl>${s.lines.map(([k, v, ch]) => `<div${ch ? ' class="is-changed"' : ""}><dt>${esc(k)}</dt><dd>${esc(v)}${ch ? '<span class="gad-chg">changed</span>' : ""}</dd></div>`).join("")}${s.removed.map((k) => `<div class="is-changed"><dt>${esc(k)}</dt><dd>(removed)<span class="gad-chg">changed</span></dd></div>`).join("")}</dl></li>`,
        )
        .join("")}</ol>`
    : `<p class="gad-note">No settings history${d.tabs.Setup_History ? "" : " (the Setup_History tab isn't in the Sheet yet)"}.</p>`;
  return `<h3 class="gad-h3">Changes <span class="gad-muted">· last 30 days, newest first</span></h3>${list}
    <div class="gad-hist">
      <h3 class="gad-h3">Settings history</h3>
      ${ents.length ? `<form method="get" action="" class="gad-hist__pick">${keep}<label class="lr-field"><span class="lr-field__label">Campaign or ad</span>
        <select class="lr-select" name="hist" data-autosubmit>${ents.map((e) => `<option value="${esc(e.id)}"${e.id === pick?.id ? " selected" : ""}>${esc(e.label)}</option>`).join("")}</select></label>
        <noscript><button class="lr-btn" type="submit">Show</button></noscript></form>` : ""}
      <p class="gad-muted">Newest first. Lines marked "changed" differ from the record before.</p>
      ${timeline}
    </div>`;
}

function why(w: WhyInput, section: Section, sub: Sub) {
  const nav = `<nav class="gad-seg gad-seg--why" aria-label="Why: details">${SECTIONS.map(([k, l]) => `<a class="gad-seg__opt" href="${esc(href(q0(w.q), { section: k, sub: null, flag: null, hist: null }))}#why"${k === section ? ' aria-current="true"' : ""} data-nav>${l}</a>`).join("")}</nav>`;
  const body = section === "campaigns" ? campaignsSection(w) : section === "search" ? searchSection(w, sub) : section === "audience" ? audienceSection(w) : historySection(w);
  return `<section class="lr-card gad-card gad-why" id="why" aria-labelledby="gad-why-t">
      <div class="gad-why__head"><h2 class="gad-h2" id="gad-why-t">Why?</h2>${nav}</div>
      ${body}
    </section>`;
}
const q0 = (q: URLSearchParams) => {
  const n = new URLSearchParams(q);
  n.delete("refresh");
  n.delete("note");
  return n;
};

/* ---------- Status card (bridge not working) ---------- */

/** Which variables are set (names only) and how far the bridge call got: reachable, password accepted, tabs received. */
function diagnosisHtml(d: Diagnosis) {
  const mark = (ok: boolean | null) => `<span class="gad-diag__mark" data-tone="${ok == null ? "neutral" : ok ? "good" : "bad"}" aria-hidden="true">${ok == null ? "–" : ok ? "✓" : "✗"}</span>`;
  const env = d.env.map((e) => `<li>${mark(e.set)}<code>${esc(e.name)}</code><span class="gad-muted">${e.set ? "set" : "missing"}</span></li>`).join("");
  const list = d.checks
    .map((c) => `<li>${mark(c.ok)}<span><b>${esc(c.label)}</b><small class="${c.ok === false ? "gad-diag__err" : "gad-muted"}">${esc(c.detail)}</small></span></li>`)
    .join("");
  return `<div class="gad-diag">
      <h3 class="gad-h3">Status</h3>
      <div class="gad-diag__cols">
        <div><p class="gad-muted">Environment variables (names only)</p><ul>${env}</ul></div>
        <div><p class="gad-muted">Sheet bridge</p><ol>${list}</ol></div>
      </div>
    </div>`;
}

/* ---------- Whole page ---------- */

export type GoogleAdsState =
  | { kind: "off" | "error"; query: URLSearchParams; today: string; diagnosis: Diagnosis }
  | { kind: "ok"; query: URLSearchParams; today: string; data: SheetData; stale: boolean; note: string; erp: ErpLead[] | null };

const NOTES: Record<string, string> = {
  done: "Refreshed from the Sheet just now.",
  wait: "Refresh can be used once every 2 minutes. Showing the latest copy.",
};

const PERIOD_NAME: Record<string, string> = { today: "Today", yesterday: "Yesterday", "7d": "Last 7 days, to yesterday", "30d": "Last 30 days, to yesterday", month: "This month", lastmonth: "Last month", since: "Since start", custom: "Custom range" };
const minutesAgo = (ms: number) => {
  const m = Math.round((Date.now() - ms) / 60_000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
};

export function googleAdsHtml(state: GoogleAdsState): string {
  const q = state.query;
  let body: string;
  if (state.kind !== "ok") {
    const off = state.kind === "off";
    body = `<header class="gad-head"><div class="gad-head__title"><h1 class="gad-title">Google Ads</h1><p class="gad-muted">Best Solution Management Services</p></div></header>
      <div class="lr-controls">${viewSwitch(q, "", "google-ads")}</div>
      <section class="lr-card alx-error gad-card" role="${off ? "status" : "alert"}">
        <h2 class="lr-empty__title">${icon(off ? "link" : "alert")}${off ? "Google Ads data not connected" : "Couldn't read the Google Ads Sheet"}</h2>
        <p class="lr-empty__lead">${off ? "Needs ADS_SHEET_BRIDGE_URL and ADS_SHEET_BRIDGE_TOKEN in this deployment's environment variables, then a redeploy." : "Reading the Sheet through the bridge failed, and there's no earlier copy to show. The status below says where."}</p>
        ${off ? "" : `<a class="lr-btn-ghost" href="${esc(href(q, { refresh: null, note: null }))}" data-nav>${icon("refresh")}Try again</a>`}
        ${diagnosisHtml(state.diagnosis)}
      </section>`;
  } else {
    const d = state.data;
    const status = statusOf(d.tabs._Status);
    const updated = stampOf(status.get("updated"));
    const fresh = freshness(stampMs(updated), Date.now());
    const campaign = q.get("campaign") ?? "";
    const channel = (["all", "search", "demandgen"] as const).find((c) => c === q.get("channel")) ?? "search";
    const perfAll = rowsOf(d.tabs.Perf_Campaigns_Daily);
    const setup = rowsOf(d.tabs.Setup_Campaigns);
    const start = perfAll.reduce((m, r) => { const x = dateOf(r.Date); return x && (!m || x < m) ? x : m; }, "");
    const period = pickPeriod(q, state.today, start);
    const compare = q.get("compare") !== "off";
    const prevWords = span(period.prevFrom, period.prevTo);

    // Channel of each campaign (by name), from Setup_Campaigns, else the daily rows.
    const chOf = new Map<string, Channel>();
    for (const r of perfAll) chOf.set(str(r, "Campaign"), channelOf(str(r, "Campaign type")));
    for (const r of setup) chOf.set(str(r, "Campaign"), channelOf(str(r, "Campaign type")));
    const inScope = (name: string) => (campaign ? name === campaign : channel === "all" || chOf.get(name) === channel);
    const scoped = (rows: Row[]) => rows.filter((r) => inScope(str(r, "Campaign")));
    // ERP leads in scope: "All" counts every Google Ads lead; a channel or campaign counts leads of its campaigns.
    const names = [...chOf.keys()].filter(inScope).map((n) => n.toLowerCase());
    const erpScope = (leads: ErpLead[]) => (!campaign && channel === "all" ? leads : leads.filter((l) => names.includes(l.campaign.trim().toLowerCase())));
    // ERP leads are counted from REPORT_START: a period that ends before it has no ERP numbers ("–"), not 0.
    const erpCovered = period.to >= REPORT_START;
    const erpCur = state.erp && erpCovered ? erpScope(erpIn(state.erp, period.from, period.to)) : null;
    const erpPrevFair = period.prevFrom >= REPORT_START;
    const erpPrev = state.erp && erpPrevFair ? erpScope(erpIn(state.erp, period.prevFrom, period.prevTo)) : null;

    const cur = scoped(inPeriod(perfAll, period.from, period.to));
    const kCur: Kpi = { t: totals(cur), leads: erpCur?.length ?? null, qualified: erpCur ? erpCur.filter((l) => l.qualified).length : null };
    const kPrev: Kpi | null = compare ? { t: totals(scoped(inPeriod(perfAll, period.prevFrom, period.prevTo))), leads: erpPrev?.length ?? null, qualified: erpPrev ? erpPrev.filter((l) => l.qualified).length : null } : null;
    const channelWord = campaign || (channel === "all" ? "all campaigns" : `${CHANNEL_LABEL[channel]} campaigns`);

    // Everything below "Why?" and the checks use all campaigns of the period (or the one campaign).
    const allPeriod = inPeriod(perfAll, period.from, period.to, campaign);
    const camps = campaignRows(allPeriod, setup, campaign);
    const erpPeriod = state.erp ? erpIn(state.erp, period.from, period.to) : null;
    const keywords = keywordRows(inPeriod(rowsOf(d.tabs.Perf_Keywords_Daily), period.from, period.to, campaign), rowsOf(d.tabs.Setup_Keywords));
    const terms = searchTermRows(inPeriod(rowsOf(d.tabs.Perf_SearchTerms_Daily), period.from, period.to, campaign));
    const alerts = alertsOf(d.tabs.Alerts);
    const items = attention({
      campaigns: camps.filter((c) => c.t.cost != null || c.t.clicks != null),
      erp: erpPeriod,
      keywords,
      terms,
      changes: rowsOf(d.tabs.Change_Log_30d).filter((r) => !campaign || str(r, "Campaign") === campaign),
      from: period.from,
      to: period.to,
      alerts: campaign ? { ...alerts, items: alerts.items.filter((a) => a.where === campaign) } : alerts,
      approvalData: String(status.get("ad approval data") ?? ""),
    });
    const section = (SECTIONS.find(([k]) => k === q.get("section"))?.[0] ?? "campaigns") as Section;
    const sub = (SUBS.find(([k]) => k === q.get("sub"))?.[0] ?? "keywords") as Sub;
    const banner =
      state.stale || state.note === "failed"
        ? `<p class="gad-banner" role="alert">${icon("alert")}Data could not be refreshed. Showing the copy read ${esc(minutesAgo(d.fetchedAt))}.</p>`
        : NOTES[state.note]
          ? `<p class="gad-banner" data-tone="info" role="status">${icon("info")}${esc(NOTES[state.note])}</p>`
          : "";
    const s = (k: string) => {
      const v = status.get(k);
      return v == null || v === "" ? DASH : stampOf(v);
    };
    const script = s("script version");
    const empty = !cur.length;
    body = `${header(q, updated, fresh)}
      ${banner}
      ${needsAttention(items, q, alerts.checkedAt)}
      <h2 class="gad-h2 gad-how">How are we doing?</h2>
      ${controls(q, period, state.today, channel, campaign, compare)}
      <p class="gad-period">${esc(PERIOD_NAME[period.key])} · ${esc(span(period.from, period.to))} · ${esc(channelWord)}${period.to === state.today ? " · today is partial" : ""}${compare && !erpPrevFair && state.erp ? " · ERP leads start 12 Oct, so they have no comparison here" : ""}</p>
      <main class="lr-view lr-bento alx-view gad-view" id="alx-view">
        ${empty ? `<p class="gad-empty lr-card">No spend for ${esc(channelWord)} in this period. Try a longer period or another channel.</p>` : ""}
        ${kpis(kCur, kPrev, prevWords, channelWord, state.erp ? "No ERP leads before 12 Oct" : "ERP not connected here")}
        ${trend(cur, erpCur, period, state.today)}
        ${why({ d, q, period, campaign, camps, erp: erpPeriod, keywords, terms }, section, sub)}
      </main>
      <footer class="alx-foot gad-foot">
        <p>Data from ${esc(s("data from"))} · Script ${esc(script === DASH || /^v/i.test(script) ? script : `v${script}`)} · Google may update conversions for several days.</p>
      </footer>`;
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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
<style>${dashCss()}
${CSS}
${GAD_CSS}</style>
</head>
<body>
<div class="lr-aurora" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
${sprite()}
${topbar(false, "", q, "google-ads", false)}
<div class="lr-page"><div class="lr-main alx gad">
${body}
</div></div>
<script>${SCRIPT}</script>
<script>${GAD_SCRIPT}</script>
</body>
</html>`;
}

/* ---------- View-only styles (gad-*), from the dashboard's tokens ---------- */

const GAD_CSS = `
.gad { --attn: #c2410c; --good-c: #0b7a53; --warn-c: #9a5b00; --bad-c: #b42318; --muted-c: #5b6576; }
.gad > * { grid-column: 1 / -1; }
.gad-view > .gad-card, .gad-view > .gad-empty { grid-column: 1 / -1; }
.gad-muted { color: var(--muted-c); font: 500 var(--fs-small)/var(--lh-small) var(--font); }
.gad-h2 { display: flex; align-items: center; gap: var(--s2); font: 700 18px/1.3 var(--font); letter-spacing: -.01em; }
.gad-h3 { font: 700 15px/1.3 var(--font); margin: var(--s4) 0 var(--s2); }
.gad-h3:first-child { margin-top: 0; }
/* Header: title left, one freshness badge and Refresh right. */
.gad-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--s3); }
.gad-title { font: 800 28px/1.1 var(--font); letter-spacing: -.02em; }
.gad-head__right { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s2) var(--s3); }
[data-tone="good"] { --c: var(--good-c); } [data-tone="warn"] { --c: var(--warn-c); } [data-tone="bad"] { --c: var(--bad-c); } [data-tone="neutral"], [data-tone="unknown"] { --c: var(--muted-c); } [data-tone="muted"] { --c: #9b4b45; }
.gad-fresh { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; font: 700 13px/1.3 var(--font); color: var(--c); background: color-mix(in srgb, var(--c) 10%, #fff); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 25%, transparent); }
.gad-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--c); flex: none; }
.gad-refresh { text-decoration: none; }
.gad-banner { display: flex; align-items: center; gap: var(--s2); padding: 12px var(--s3); border-radius: var(--r-control); color: #8a2c20; background: #fdecea; box-shadow: inset 0 0 0 1px #f5c6c0; font: 600 var(--fs-small)/1.4 var(--font); }
.gad-banner[data-tone="info"] { color: var(--text); background: var(--surface); box-shadow: inset 0 0 0 1px var(--line-strong); }
/* Needs attention: level word + sentence + money + link; the accent colour is reserved for attention. */
.gad-attn { padding: var(--s4); }
.gad-attn__head { margin-bottom: var(--s3); }
.gad-badge { display: inline-grid; place-items: center; min-width: 24px; height: 24px; padding: 0 7px; border-radius: 999px; background: var(--attn); color: #fff; font: 800 12px/1 var(--font); }
.gad-attn__list { list-style: none; display: grid; gap: 2px; }
.gad-attn__item { display: grid; grid-template-columns: 76px 1fr auto auto; align-items: center; gap: var(--s3); padding: 12px 0; border-top: 1px solid var(--line); }
.gad-attn__item:first-child { border-top: 0; }
.gad-attn__item[hidden] { display: none; }
.gad-attn__level { justify-self: start; padding: 3px 9px; border-radius: 999px; font: 800 11px/1.3 var(--font); letter-spacing: .04em; text-transform: uppercase; color: #fff; background: var(--lc); }
[data-level="red"] { --lc: var(--bad-c); } [data-level="orange"] { --lc: var(--attn); } [data-level="yellow"] { --lc: #8a6a00; } [data-level="info"] { --lc: var(--muted-c); }
.gad-attn__text { font: 500 15px/1.45 var(--font); color: var(--text); }
.gad-attn__src { display: inline-block; margin-left: 4px; color: var(--muted-c); font: 600 11.5px/1.3 var(--font); }
.gad-attn__aed { font: 700 14px/1 var(--font); font-variant-numeric: tabular-nums; white-space: nowrap; color: var(--text); }
.gad-attn__go { font: 700 13px/1.2 var(--font); color: var(--copper-lo); text-decoration: none; white-space: nowrap; }
.gad-attn__go:hover { text-decoration: underline; }
.gad-attn__all { margin-top: var(--s2); }
.gad-attn--clear .gad-h2 { color: var(--good-c); }
.gad-attn--clear .gad-h2 .lr-icon { color: var(--good-c); }
.gad-attn--clear .gad-muted { margin-top: 4px; }
@media (max-width: 767px) {
  .gad-attn { padding: var(--s3); }
  .gad-attn__item { grid-template-columns: auto 1fr auto; grid-template-areas: "lvl aed go" "txt txt txt"; gap: 6px var(--s2); }
  .gad-attn__level { grid-area: lvl; } .gad-attn__aed { grid-area: aed; justify-self: end; } .gad-attn__go { grid-area: go; } .gad-attn__text { grid-area: txt; font-size: 14.5px; }
}
/* How are we doing? */
.gad-how { margin-top: var(--s3); }
.gad-chip--2 { flex-direction: column; gap: 0; line-height: 1.1; }
.gad-chip small { display: block; font: 600 10px/1.1 var(--font); opacity: .75; }
.gad-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--s2) var(--s3); }
.gad-seg { display: inline-flex; gap: 2px; padding: 4px; max-width: 100%; overflow-x: auto; scrollbar-width: none; border-radius: 999px; background: rgba(20,37,62,.06); box-shadow: inset 0 1px 2px rgba(20,37,62,.08); }
.gad-seg::-webkit-scrollbar { display: none; }
.gad-seg__opt { flex: none; display: inline-flex; align-items: center; min-height: 38px; padding: 0 16px; border-radius: 999px; color: var(--muted-c); font: 700 13.5px/1 var(--font); text-decoration: none; white-space: nowrap; }
.gad-seg__opt:hover { color: var(--text); background: rgba(255,255,255,.55); }
.gad-seg__opt[aria-current="true"] { color: #fff; background: #14253e; }
.gad-bar > .lr-info { margin-left: -8px; margin-right: auto; }
.gad-compare { text-decoration: none; }
.gad-filter { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 6px 6px 6px 14px; border-radius: 999px; background: #14253e; color: #fff; font: 500 var(--fs-small)/1.3 var(--font); }
.gad-filter b { font-weight: 700; }
.gad-filter .gad-trunc { max-width: 240px; vertical-align: bottom; }
.gad-filter__x { display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; color: #fff; background: rgba(255,255,255,.15); }
.gad-filter__x:hover { background: rgba(255,255,255,.3); }
.gad-why .gad-filter { margin-bottom: var(--s3); }
.gad-period { color: var(--muted-c); font: 600 var(--fs-small)/1.4 var(--font); }
.gad-empty { padding: var(--s3) var(--s4); color: var(--muted-c); font: 600 var(--fs-body)/1.4 var(--font); }
.gad-kpi__label { display: flex; align-items: center; gap: var(--s1); letter-spacing: .05em; }
.gad-kpi__value { font-size: clamp(22px, 2.2vw, 30px); white-space: nowrap; }
.gad-kpi__nc { margin: 6px 0 2px; color: var(--muted-c); font: 600 13.5px/1.35 var(--font); }
@media (min-width: 1200px) { .gad-view > .is-kpi { grid-column: span 3; } }
@media (max-width: 767px) { .gad-kpi__value { font-size: clamp(20px, 6vw, 26px); } .gad-kpi { padding: 14px; } .gad-kpi__label { font-size: 10.5px; } }
/* Chart: cost bars, ERP leads line (solid), Google conversions line (dashed). */
.gad-plot { padding-right: 30px; }
.alx-seg.gad-cost { --c: #e2b49c; border-radius: 4px 4px 0 0; }
.gad-grid[data-side="r"] { border-top: 0; }
.gad-grid[data-side="r"] span { right: auto; left: calc(100% + 6px); }
.gad-lines path { fill: none; stroke-width: 2.25; vector-effect: non-scaling-stroke; stroke-linejoin: round; }
.gad-line-lead { stroke: #14253e; }
.gad-line-conv { stroke: var(--attn); stroke-dasharray: 5 4; }
.gad-key-bar::before { background: #e2b49c; }
.gad-key-lead::before { height: 3px; border-radius: 2px; background: #14253e; }
.gad-key-conv::before { height: 0; border-top: 3px dashed var(--attn); background: none; }
/* Why? */
.gad-why { scroll-margin-top: 90px; }
.gad-why__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--s2) var(--s3); margin-bottom: var(--s4); }
.gad-subtabs { display: flex; gap: 2px; margin-bottom: var(--s3); overflow-x: auto; scrollbar-width: none; }
.gad-subtabs .lr-bd__tab { text-decoration: none; }
.lr-bd__tab[aria-current="true"] { color: var(--text); background: linear-gradient(180deg, #fff, #f8f4f0); box-shadow: inset 0 1px 0 #fff, 0 6px 16px -8px rgba(20,37,62,.35); }
.gad-note { margin-bottom: var(--s3); color: var(--muted-c); font: 500 var(--fs-small)/var(--lh-small) var(--font); }
.gad-tools { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--s2) var(--s3); margin-bottom: var(--s2); }
.gad-search { flex: 1 1 220px; max-width: 340px; }
.gad-search .lr-input { width: 100%; min-height: 40px; }
.gad-select { display: grid; gap: 2px; color: var(--muted-c); font: 700 10.5px/1.2 var(--font); letter-spacing: .06em; text-transform: uppercase; }
.gad-select .lr-select { min-height: 40px; font-size: 14px; padding: 0 10px; }
.gad-count { color: var(--muted-c); font: 600 12px/40px var(--font); }
.gad-csv { margin-left: auto; }
/* Tables: scroll inside their card (sticky header and first column), numbers right-aligned in tabular figures. */
.gad-scroll { max-height: 620px; overflow: auto; border-radius: var(--r-small); background: #fff; box-shadow: inset 0 0 0 1px var(--line); }
.gad-scroll:focus-visible { outline: 2px solid var(--copper-lo); outline-offset: 2px; }
.gad-table { width: 100%; border-collapse: separate; border-spacing: 0; font: 500 13.5px/1.4 var(--font); font-variant-numeric: tabular-nums; }
.gad-table th, .gad-table td { padding: 9px 8px; text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); white-space: nowrap; }
.gad-table .gad-num { text-align: right; }
.gad-table thead th { position: sticky; top: 0; z-index: 2; background: #fbfaf8; color: var(--muted-c); font: 700 11px/1.3 var(--font); letter-spacing: .05em; text-transform: uppercase; white-space: normal; vertical-align: bottom; }
.gad-table tbody th { position: sticky; left: 0; z-index: 1; background: #fff; font-weight: 600; max-width: 200px; white-space: normal; }
.gad-table thead th:first-child { left: 0; z-index: 3; }
.gad-table tbody tr:hover > * { background: #fbf6f2; }
.gad-table tbody tr[hidden] { display: none; }
.gad-table tbody tr.gad-inactive > * { color: var(--muted-c); }
.gad-table tbody tr[aria-current="true"] > th { box-shadow: inset 3px 0 0 var(--copper-hi); }
.gad-table tbody tr.gad-flagged > th { box-shadow: inset 3px 0 0 var(--bad-c); }
.gad-none-row td { text-align: center !important; color: var(--muted-c); white-space: normal; padding: var(--s4) !important; }
.gad-sort { all: unset; cursor: pointer; border-radius: 4px; }
.gad-sort:focus-visible { outline: 2px solid var(--copper-lo); outline-offset: 2px; }
th[aria-sort="descending"] .gad-sort::after { content: " ▼"; font-size: 9px; color: var(--copper-lo); }
th[aria-sort="ascending"] .gad-sort::after { content: " ▲"; font-size: 9px; color: var(--copper-lo); }
.gad-name { display: grid; gap: 2px; }
.gad-sub { display: block; color: var(--muted-c); font: 500 12px/1.3 var(--font); white-space: normal; }
.gad-trunc { display: inline-block; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: bottom; }
.gad-camp { color: var(--text); font-weight: 700; text-decoration: none; }
.gad-camp .gad-trunc { border-bottom: 1px dashed var(--line-strong); }
.gad-camp:hover { color: var(--copper-lo); }
.gad-url { color: var(--copper-lo); }
.gad-table td:has(.gad-url) { white-space: normal; min-width: 180px; overflow-wrap: anywhere; }
.gad-pill { display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 999px; font: 700 12px/1.5 var(--font); white-space: nowrap; color: var(--c); background: color-mix(in srgb, var(--c) 11%, #fff); }
.gad-flag { margin-top: 4px; width: fit-content; }
.gad-match { color: var(--muted-c); font: 700 10.5px/1 var(--font); text-transform: uppercase; letter-spacing: .04em; }
.gad-qs { color: var(--c); }
.gad-more { margin-top: var(--s2); }
.gad-more[hidden], .gad-attn__all[hidden] { display: none; }
/* Critique fixes: "since" on one line, wrapping sub-lines, the amount says "spent", dots on the ERP leads line. */
.gad-nowrap { white-space: nowrap; }
.gad-table td:has(.gad-sub) { white-space: normal; min-width: 120px; }
.gad-attn__aed small { display: block; margin-top: 2px; color: var(--muted-c); font: 600 10.5px/1.2 var(--font); text-align: right; }
.alx-pt.gad-pt-lead { width: 7px; height: 7px; background: #fff; box-shadow: 0 0 0 2px #14253e; }
/* Audience: one scrolling page of small bars + tables. */
.gad-aud + .gad-aud { margin-top: var(--s5); padding-top: var(--s4); border-top: 1px solid var(--line); }
.gad-bars { list-style: none; display: grid; gap: 10px; max-width: 560px; margin-bottom: var(--s3); }
.gad-bars__top { display: flex; justify-content: space-between; gap: var(--s2); font: 600 13.5px/1.3 var(--font); }
.gad-bars__top small { color: var(--muted-c); font-weight: 600; }
.gad-bars__track { height: 8px; margin-top: 4px; border-radius: 999px; background: rgba(20,37,62,.07); overflow: hidden; }
.gad-bars__track span { display: block; width: var(--w); min-width: 2px; height: 100%; border-radius: inherit; background: #14253e; }
/* History */
.gad-hist { margin-top: var(--s5); padding-top: var(--s4); border-top: 1px solid var(--line); display: grid; gap: var(--s3); }
.gad-hist .gad-h3 { margin: 0; }
.gad-hist__pick { max-width: 520px; }
.gad-hist__pick .lr-select { width: 100%; }
.gad-timeline { list-style: none; display: grid; gap: var(--s3); border-left: 2px solid var(--line-strong); padding-left: var(--s3); }
.gad-timeline li { position: relative; }
.gad-timeline li::before { content: ""; position: absolute; left: calc(-1 * var(--s3) - 6px); top: 4px; width: 10px; height: 10px; border-radius: 50%; background: var(--copper-hi); }
.gad-timeline__at { font: 700 var(--fs-small)/1.3 var(--font); margin-bottom: 6px; }
.gad-timeline dl { display: grid; gap: 2px; font: 500 var(--fs-small)/1.4 var(--font); }
.gad-timeline dl > div { display: grid; grid-template-columns: minmax(120px, 34%) 1fr; gap: var(--s2); padding: 3px 8px; border-radius: 6px; }
.gad-timeline dt { color: var(--muted-c); overflow-wrap: anywhere; }
.gad-timeline dd { overflow-wrap: anywhere; }
.gad-timeline .is-changed { background: #fff3e6; }
.gad-timeline .is-changed dd { font-weight: 700; }
.gad-chg { margin-left: 8px; padding: 1px 7px; border-radius: 999px; background: var(--attn); color: #fff; font: 800 10px/1.5 var(--font); text-transform: uppercase; letter-spacing: .04em; }
/* Footer, status card */
.gad-foot { grid-column: 1 / -1; }
.gad-diag { width: 100%; margin-top: var(--s3); padding-top: var(--s3); border-top: 1px solid var(--line); display: grid; gap: var(--s2); }
.gad-diag__cols { display: grid; gap: var(--s3); }
@media (min-width: 768px) { .gad-diag__cols { grid-template-columns: 1fr 1.4fr; } }
.gad-diag ul, .gad-diag ol { list-style: none; display: grid; gap: 6px; margin-top: 6px; }
.gad-diag li { display: flex; align-items: flex-start; gap: 8px; font: 500 var(--fs-small)/1.4 var(--font); }
.gad-diag li > span { display: grid; gap: 2px; min-width: 0; }
.gad-diag code { font: 600 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; overflow-wrap: anywhere; }
.gad-diag__mark { flex: none; width: 18px; text-align: center; font-weight: 800; color: var(--c); }
.gad-diag__err { color: #8a2c20; overflow-wrap: anywhere; }
/* Visible focus everywhere in this view. */
.gad a:focus-visible, .gad button:focus-visible, .gad select:focus-visible, .gad input:focus-visible { outline: 2px solid var(--copper-lo); outline-offset: 2px; }
@media (max-width: 767px) {
  .gad-title { font-size: 24px; }
  /* One row for the badge and an icon-only Refresh, so "Needs attention" starts higher. */
  .gad-head__right { width: 100%; flex-wrap: nowrap; justify-content: space-between; }
  .gad-fresh { font-size: 12.5px; padding: 6px 10px; }
  .gad-refresh { flex: none; min-height: 40px; padding: 0 12px; }
  .gad-refresh__label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .gad .lr-range__chips { flex-wrap: wrap; }
  .gad .lr-range__chips .lr-chip { flex: 1 1 auto; padding: 4px 8px; }
  .gad-scroll { max-height: 520px; }
  .gad-table tbody th { max-width: 150px; }
  .gad-trunc { max-width: 130px; }
  .gad-timeline dl > div { grid-template-columns: 1fr; gap: 0; }
  .gad-csv { margin-left: 0; }
}
`;

/* ---------- View-only script: tables (sort, search, filters, show more, CSV), chart lines, attention, history ---------- */

const GAD_SCRIPT = `(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rowsOf = (t) => $$("tr", t.tBodies[0]).filter((r) => !r.classList.contains("gad-none-row"));
  // A row shows when it matches the search box and every filter; then only the first 25 until "Show more".
  const apply = (t) => {
    const q = (($('[data-search="' + t.id + '"]') || {}).value || "").trim().toLowerCase();
    const filters = $$('[data-filter="' + t.id + '"]').map((s) => [s.dataset.key, s.value]);
    const more = $('[data-more="' + t.id + '"]'), open = more && more.dataset.open === "1", limit = +t.dataset.limit || 25;
    let n = 0, shown = 0;
    rowsOf(t).forEach((r) => {
      const ok = (!q || r.textContent.toLowerCase().includes(q)) && filters.every(([k, v]) => v === "all" || r.dataset[k] === v);
      r.dataset.match = ok ? "1" : "0";
      if (ok) n++;
      r.hidden = !ok || (!open && !q && shown >= limit);
      if (ok && !r.hidden) shown++;
    });
    const c = $('[data-count="' + t.id + '"]'); if (c) c.textContent = n + (n === 1 ? " row" : " rows");
    if (more) { more.hidden = open || q || n <= limit; more.textContent = "Show more (" + (n - limit) + ")"; }
  };
  $$(".gad-table").forEach((t) => {
    apply(t);
    $$(".gad-sort", t).forEach((b) => b.addEventListener("click", () => {
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
  $$("[data-filter]").forEach((s) => s.addEventListener("change", () => apply(document.getElementById(s.dataset.filter))));
  $$("[data-more]").forEach((b) => b.addEventListener("click", () => { b.dataset.open = "1"; apply(document.getElementById(b.dataset.more)); }));
  // CSV: every row that matches the search and filters (not only the first 25 on screen).
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
  const all = $(".gad-attn__all");
  all && all.addEventListener("click", () => { $$(".gad-attn__item[data-extra]").forEach((li) => (li.hidden = false)); all.remove(); });
  $$("[data-autosubmit]").forEach((s) => s.addEventListener("change", () => { document.querySelector(".alx").classList.add("is-loading"); s.form.submit(); }));
})();`;
