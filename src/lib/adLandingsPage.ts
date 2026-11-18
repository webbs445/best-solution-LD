import { readFileSync } from "node:fs";
import { join } from "node:path";
import { KEEP_DAYS } from "@/lib/adLandings";
import { FZ_ZONE_VIEWS, ZONE_BY_ID, type FzSitelinkView } from "@/content/freezone";
import type { TestNote } from "@/lib/adLandingsNotes";
import {
  COUNT_START,
  byClickType,
  byPath,
  countChange,
  dailyRows,
  rateChange,
  rates,
  totals,
  yTicks,
  byDim,
  campaignLabel,
  NOT_RECORDED,
  type DimEntry,
  type DayRow,
  type Entry,
  type GroupRow,
  type Range,
  type Totals,
} from "@/lib/adLandingsReport";

/*
  /internal/ad-landings, rendered on the server. It wears the Ads dashboard's own design (lib/adsReportPage.html, the
  "Lead Insights" page): its stylesheet and icon sprite are read from that template, so the two pages never drift
  apart, and its lr-* components are used as they are. The alx-* rules below only add what that page has no part for
  (stacked bars, plain tables, the toolbar), built from the same tokens. Light theme only, as the Ads dashboard is.
  A small inline script handles tooltips, info popovers, sorting and the "Show all" rows; the numbers are all in the
  HTML. Nothing here loads on public pages.
*/

let tpl: string | null = null;
const template = () => {
  if (!tpl || process.env.NODE_ENV !== "production") tpl = readFileSync(join(process.cwd(), "src/lib/adsReportPage.html"), "utf8");
  return tpl;
};
const slice = (s: string, start: string, end: string, inner = false) => {
  const i = s.indexOf(start), j = s.indexOf(end, i + start.length);
  if (i < 0 || j < 0) return "";
  return inner ? s.slice(i + start.length, j) : s.slice(i, j + end.length);
};
export const dashCss = () => slice(template(), "<style>", "</style>", true);
export const sprite = () => slice(template(), '<svg class="lr-sprite"', "</svg>");

/* ---------- Formatting ---------- */

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
const DASH = "–";
const num = (n: number) => n.toLocaleString("en-US");
const pct = (v: number | null) => (v == null ? DASH : `${(v * 100).toFixed(1)}%`);

/* Readable page names for the breakdown; any other path shows as itself, so a new page never breaks the table. */
const PAGE_NAMES: Record<string, string> = {
  "/": "Home", "/services": "Services", "/freezone": "Free zone", "/mainland": "Mainland", "/offshore": "Offshore",
  "/cost-calculator": "Cost calculator", "/corporate-tax": "Corporate tax", "/spv": "SPV", "/accounting": "Accounting", "/consult": "Consultation",
};
const FZ_VIEW_NAMES: Record<string, string> = {
  planner: "Planner", compare: "Compare zones", activity: "Activity search", budget: "Budget", "vs-mainland": "vs Mainland", consultation: "Consultation", dubai: "Dubai zones",
};
export function pageLabel(path: string): string {
  if (PAGE_NAMES[path]) return PAGE_NAMES[path];
  const view = /^\/freezone\/([a-z-]+)$/.exec(path)?.[1];
  if (!view) return path;
  const zone = ZONE_BY_ID[FZ_ZONE_VIEWS[view as FzSitelinkView] ?? ""];
  const name = zone ? zone.short[0] : FZ_VIEW_NAMES[view];
  return name ? `Free zone · ${name}` : path;
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dayMonth = (d: string) => `${Number(d.slice(8))} ${MONTHS[Number(d.slice(5, 7)) - 1]}`;
const longDate = (d: string) => `${WEEKDAYS[new Date(`${d}T00:00:00Z`).getUTCDay()]} ${dayMonth(d)} ${d.slice(0, 4)}`;
const span = (a: string, b: string) => (a === b ? dayMonth(a) : `${dayMonth(a)} – ${dayMonth(b)}`);
export const icon = (name: string) => `<svg class="lr-icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;

let infoSeq = 0;
export const info = (label: string, text: string) => {
  const id = `alx-info-${++infoSeq}`;
  return `<span class="lr-info"><button type="button" class="lr-info__btn" aria-expanded="false" aria-controls="${id}" aria-label="About: ${esc(label)}">${icon("info")}</button><span class="lr-info__pop lr-glass" id="${id}" role="note" hidden>${esc(text)}</span></span>`;
};

/* ---------- Data for one render ---------- */

export interface PageData {
  range: Range;
  today: string;
  updated: string; // HH:MM, Dubai
  preview: boolean;
  excludeTests: boolean;
  /** Entries for the range and for the previous period, already filtered for test visits as the toggle says. */
  entries: Entry[];
  /** Device and system fields for the range (none on days before device counting). */
  dims: DimEntry[];
  prevEntries: Entry[] | null;
  notes: TestNote[];
  query: URLSearchParams;
}
export type PageState = { kind: "ok"; data: PageData } | { kind: "kv-off" | "kv-error"; range: Range; today: string; updated: string; preview: boolean; query: URLSearchParams };

/* Chip labels as on the ads dashboard's other views; the long form names the range in the page head. */
const RANGE_CHIP = { today: "Today", "7d": "7 days", "30d": "30 days", since: "From start" } as const;
const RANGE_LABEL = { today: "Today", "7d": "Last 7 days", "30d": "Last 30 days", since: "From start", custom: "Custom" } as const;
const PREV_WORDS = { today: "yesterday", "7d": "the previous 7 days", "30d": "the previous 30 days", since: "an earlier period", custom: "the previous period" } as const;

/** The current query with some keys changed (null removes the key). */
export const href = (q: URLSearchParams, set: Record<string, string | null>) => {
  const n = new URLSearchParams(q);
  for (const [k, v] of Object.entries(set)) {
    if (v == null) n.delete(k);
    else n.set(k, v);
  }
  const s = n.toString();
  return s ? `?${s}` : "?";
};

/* ---------- Pieces ---------- */

/** A link to one of the dashboard's views, keeping the selected range (the views share the range keys). */
const viewHref = (q: URLSearchParams, view: string) => {
  const n = new URLSearchParams();
  n.set("view", view);
  for (const k of ["range", "from", "to"]) if (q.get(k)) n.set(k, q.get(k)!);
  return `?${n}`;
};

/** The dashboard's views: [view, label, icon]. */
const NAV = [["google", "Google leads", "bars"], ["erp", "ERP status", "db"], ["landings", "Ad landings", "layers"], ["google-ads", "Google Ads", "link"]] as const;
type View = (typeof NAV)[number][0];

export function topbar(preview: boolean, updated: string, q: URLSearchParams, current: View = "landings") {
  const badge = preview
    ? `<span class="alx-env" data-env="preview">Preview test data, not the live site</span>`
    : `<span class="alx-env" data-env="live"><span class="lr-dot" aria-hidden="true"></span>Live data</span>`;
  return `<header class="lr-topbar lr-glass">
    <div class="lr-topbar__in">
      <a class="lr-brand" href="${esc(viewHref(q, current))}" aria-label="Lead Insights, Best Solution">
        <img class="lr-brand__mark" src="/lead-insights/icon-192.png" alt="" width="32" height="32">
        <span class="lr-brand__text"><span class="lr-brand__name">Lead Insights</span><span class="lr-brand__by">Best Solution</span><span class="lr-brand__live" aria-hidden="true">${preview ? "Preview test data" : `<span class="lr-dot"></span>Live data · ${esc(updated)}`}</span></span>
      </a>
      <button type="button" class="lr-menu-btn" popovertarget="lr-menu" aria-label="Menu">${icon("more")}</button>
      <div class="lr-menu" id="lr-menu" popover>
        <p class="lr-menu__state">${preview ? "Preview test data, not the live site" : `<span class="lr-dot" aria-hidden="true"></span>Live data · updated ${esc(updated)}`}</p>
        <form method="post" action="/ads-report"><input type="hidden" name="action" value="signout">
          <button type="submit" class="lr-menu__item" data-tone="out">${icon("signout")}Sign out</button></form>
      </div>
      <nav class="lr-nav" aria-label="Dashboards">
        <p class="lr-nav__label">Dashboards</p>
        ${NAV.map(([v, label, ic]) => `<a class="lr-nav__item" href="${esc(viewHref(q, v))}"${v === current ? ' aria-current="page"' : ""}>${icon(ic)}<span>${label}</span></a>`).join("")}
      </nav>
      <div class="lr-fresh" role="status" aria-label="Data source">
        <span class="lr-fresh__item">${badge}</span>
        <span class="lr-fresh__item">Updated ${esc(updated)} (UAE)</span>
      </div>
      <form class="lr-signout" method="post" action="/ads-report">
        <input type="hidden" name="action" value="signout">
        <button class="lr-btn-ghost" type="submit" aria-label="Sign out">${icon("signout")}<span class="lr-signout__label">Sign out</span></button>
      </form>
    </div>
  </header>`;
}

/** The dashboard's view switch (phones and tablets; the top bar's tabs replace it on laptops). */
export const viewSwitch = (q: URLSearchParams, num: string, current: View = "landings") => `<div class="lr-switchbar"><nav class="lr-switch lr-glass" aria-label="Data source">
    ${NAV.map(([v, label]) =>
      v === current
        ? `<a class="lr-switch__side" href="${esc(viewHref(q, v))}" aria-current="page"><span class="lr-switch__hl" aria-hidden="true"></span><span class="lr-switch__label">${label}</span>${num ? `<span class="lr-switch__num">${esc(num)}</span>` : ""}</a>`
        : `<a class="lr-switch__side" href="${esc(viewHref(q, v))}"><span class="lr-switch__label">${label}</span></a>`,
    ).join("")}
  </nav></div>`;

/** Page head (laptop), view switch and range chips in the ads dashboard's layout, then this view's own tools. */
function header(range: Range, today: string, q: URLSearchParams, excludeTests: boolean | null, headline: string, answer: string, landings: string) {
  const chips = (["today", "7d", "30d", "since"] as const)
    .map((k) => `<a class="lr-chip lr-glass" href="${esc(href(q, { range: k, from: null, to: null, format: null }))}"${range.key === k ? ' aria-current="page"' : ""} data-nav>${RANGE_CHIP[k]}</a>`)
    .join("");
  const custom = range.key === "custom";
  const tests =
    excludeTests == null
      ? ""
      : `<a class="lr-chip lr-glass alx-toggle" href="${esc(href(q, { tests: excludeTests ? "include" : null, format: null }))}" role="switch" aria-checked="${excludeTests}" data-nav>
          <span class="alx-toggle__track" aria-hidden="true"></span>Exclude test visits</a>`;
  const csv = excludeTests == null ? "" : `<a class="lr-btn-ghost alx-csv" href="${esc(href(q, { format: "csv" }))}" download>${icon("copy")}Export CSV</a>`;
  const phrase = `${RANGE_LABEL[range.key]} · ${span(range.from, range.to)}`;
  return `<h1 class="lr-sr">Lead Insights: Ad landings. ${esc(headline)}</h1>
    <div class="lr-pagehead" aria-hidden="true"><span>Ad landings · ${esc(phrase)}</span><strong>${esc(headline)}</strong></div>
    <div class="lr-controls">
      ${viewSwitch(q, landings)}
      <nav class="lr-range" aria-label="Date range">
          <div class="lr-range__chips">${chips}
            <button type="button" class="lr-chip lr-glass" aria-expanded="${range.error ? "true" : "false"}" aria-controls="alx-custom"${custom ? ' aria-current="page"' : ""}>
              ${custom ? `Custom: ${esc(span(range.from, range.to))}` : "Custom"}${icon("chevron")}</button>
          </div>
          <form class="lr-custom lr-glass alx-custom" id="alx-custom" method="get" action=""${range.error ? "" : " hidden"} aria-label="Custom date range">
            <input type="hidden" name="view" value="landings">
            ${q.get("tests") ? `<input type="hidden" name="tests" value="${esc(q.get("tests"))}">` : ""}
            <label class="lr-field"><span class="lr-field__label">From</span><input class="lr-input" type="date" name="from" value="${esc(range.from)}" max="${esc(today)}" required></label>
            <label class="lr-field"><span class="lr-field__label">To</span><input class="lr-input" type="date" name="to" value="${esc(range.to)}" max="${esc(today)}" required></label>
            <p class="lr-custom__err" role="alert">${esc(range.error)}</p>
            <div class="lr-custom__actions">
              <button type="button" class="lr-btn-ghost" data-action="custom-cancel">Cancel</button>
              <button type="submit" class="lr-btn">Apply</button>
            </div>
          </form>
      </nav>
    </div>
    <div class="alx-bar">
      <div class="alx-bar__text">
        <p class="alx-period">Ad landings · ${esc(phrase)}${excludeTests === false ? " · test visits included" : ""}</p>
        ${answer ? `<p class="alx-answer__text">${esc(answer)}</p>` : ""}
        <p class="alx-lead">What happens after someone clicks a Google ad: did the page open, and what did they choose on the cookie banner.</p>
      </div>
      <div class="alx-tools__row">${tests}${csv}</div>
    </div>`;
}

function delta(change: number | null, unit: "%" | "pts", goodWay: "up" | "down" | "neutral", prevWords: string) {
  if (change == null) return `<span class="alx-nodelta">No fair comparison with ${esc(prevWords)}</span>`;
  const dir = change > 0 ? "up" : change < 0 ? "down" : "flat";
  const tone = goodWay === "neutral" || dir === "flat" ? "neutral" : dir === goodWay ? "good" : "bad";
  const glyph = dir === "up" ? "▲" : dir === "down" ? "▼" : "→";
  const amount = `${Math.abs(change)}${unit === "%" ? "%" : " pts"}`;
  const words = `${dir === "flat" ? "no change" : `${dir} ${amount}`} on ${prevWords}`;
  return `<span class="lr-delta" data-tone="${tone}" role="img" aria-label="${esc(words)}"><span class="lr-delta__glyph" aria-hidden="true">${glyph}</span>${esc(amount)}</span><span class="alx-vs">vs ${esc(prevWords)}</span>`;
}

function kpis(t: Totals, p: Totals | null, prevWords: string) {
  const r = rates(t), pr = p ? rates(p) : null;
  const tile = (label: string, value: string, sub: string, d: string, help: string) => `<section class="lr-card lr-kpi" aria-label="${esc(label)}">
      <h3 class="lr-kpi__label">${esc(label)}${info(label, help)}</h3>
      <div class="lr-kpi__value">${esc(value)}</div>
      <p class="alx-kpi__sub">${esc(sub)}</p>
      <div class="lr-kpi__meta">${d}</div>
    </section>`;
  const shownP = p?.shown ?? null;
  return `<div class="alx-kpis">
    ${tile("Ad landings", num(t.land), "page opens from a Google ad", delta(countChange(t.land, p?.land ?? null), "%", "up", prevWords), "Page opens whose address carries a Google click ID (gclid, gbraid or wbraid).")}
    ${tile("Banner shown", num(t.shown), `${pct(t.land ? t.shown / t.land : null)} of ad landings`, delta(countChange(t.shown, shownP), "%", "neutral", prevWords), "Ad landings where the cookie banner appeared. Visitors who already chose on an earlier visit don't see it.")}
    ${tile("Accept rate", pct(r.accept), `${num(t.accept_all)} of ${num(t.shown)} banners`, delta(rateChange(r.accept, pr?.accept ?? null, t.shown, shownP), "pts", "up", prevWords), "Accept all ÷ banners shown.")}
    ${tile("Reject rate", pct(r.reject), `${num(t.reject_all)} of ${num(t.shown)} banners`, delta(rateChange(r.reject, pr?.reject ?? null, t.shown, shownP), "pts", "down", prevWords), "Reject all ÷ banners shown.")}
    ${tile("No choice rate", pct(r.none), `${num(t.none)} of ${num(t.shown)} banners`, delta(rateChange(r.none, pr?.none ?? null, t.shown, shownP), "pts", "down", prevWords), "Banner shown but left without a choice ÷ banners shown. Saving custom choices (Manage) is counted separately.")}
  </div>`;
}

function funnel(t: Totals) {
  const steps: [string, number, number | null, string][] = [
    ["Ad landings", t.land, null, "base"],
    ["Banner shown", t.shown, t.land ? t.shown / t.land : null, "base"],
    ["Accepted", t.accept_all, t.shown ? t.accept_all / t.shown : null, "accent"],
  ];
  const max = Math.max(1, t.land, t.shown);
  const row = ([label, n, share, tone]: (typeof steps)[number], i: number) => `<li class="alx-fn__row">
      <div class="alx-fn__top"><span class="alx-fn__label">${esc(label)}</span><span class="alx-fn__num">${esc(num(n))}</span></div>
      <div class="alx-fn__track"><span class="alx-fn__bar" data-tone="${tone}" style="--w:${((n / max) * 100).toFixed(1)}%"></span></div>
      <span class="alx-fn__share">${i === 0 ? "Start" : `${pct(share)} of ${esc(steps[i - 1][0].toLowerCase())}`}</span>
    </li>`;
  const summary = `${num(t.land)} ad landings, ${num(t.shown)} saw the banner, ${num(t.accept_all)} accepted and can join remarketing audiences.`;
  return `<section class="lr-card alx-fn" aria-labelledby="alx-fn-title" data-lg="5">
    <div class="lr-card__head"><h2 class="lr-card__title" id="alx-fn-title">From ad click to remarketing${info("the funnel", "Bars are drawn to scale against ad landings. Each step shows its share of the step before.")}</h2></div>
    <ol class="alx-fn__list" aria-label="${esc(summary)}">${steps.map(row).join("")}
      <li class="alx-fn__row alx-fn__end"><span class="alx-fn__label">${icon("chevron")}Joins remarketing audiences</span><span class="alx-fn__share">accepted visitors only</span></li>
    </ol>
    <p class="alx-caption">Only visitors who accept can join remarketing audiences.</p>
    ${split(t)}
  </section>`;
}

const SEGMENTS: [keyof Totals, string][] = [["accept_all", "Accept"], ["reject_all", "Reject"], ["manage", "Manage"], ["none", "No choice"]];

/** Banner outcomes as one bar: each choice's share of banners shown. */
function split(t: Totals) {
  if (!t.shown) return "";
  const parts = SEGMENTS.map(([k, l]) => [k, l, t[k] / t.shown] as const);
  return `<div class="alx-split">
      <p class="alx-split__title">Banner choices</p>
      <div class="alx-split__bar" role="img" aria-label="${esc(parts.map(([, l, s]) => `${l} ${pct(s)}`).join(", "))}">${parts
        .map(([k, , s]) => (s ? `<span data-k="${k}" style="--w:${(s * 100).toFixed(2)}%"></span>` : ""))
        .join("")}</div>
      <ul class="alx-split__legend">${parts.map(([k, l, s]) => `<li class="alx-key" data-k="${k}">${l} <b>${pct(s)}</b> <span>(${num(t[k])})</span></li>`).join("")}</ul>
    </div>`;
}

function chart(rows: DayRow[]) {
  const ticks = yTicks(Math.max(0, ...rows.map((r) => Math.max(r.land, r.shown))));
  const max = ticks[ticks.length - 1];
  const n = rows.length;
  const x = (i: number) => ((i + 0.5) / n) * 100;
  const line = rows.map((r, i) => `${i ? "L" : "M"}${x(i).toFixed(2)},${(100 - (r.land / max) * 100).toFixed(2)}`).join(" ");
  const every = n <= 10 ? 1 : n <= 31 ? Math.ceil(n / 8) : Math.ceil(n / 10);
  const cols = rows
    .map((r) => {
      const segs = SEGMENTS.map(([k]) => `<span class="alx-seg" data-k="${k}" style="--h:${((r[k] / max) * 100).toFixed(2)}%"></span>`).join("");
      const tip = `${longDate(r.date)}|Ad landings ${r.land}|Banner shown ${r.shown}|Accept ${r.accept_all}|Reject ${r.reject_all}|Manage ${r.manage}|No choice ${r.none}`;
      const label = tip.split("|").join(", ");
      return `<button type="button" class="alx-col" data-tip="${esc(tip)}" aria-label="${esc(label)}"><span class="alx-stack">${segs}</span></button>`;
    })
    .join("");
  const xs = rows.map((r, i) => `<span>${i % every === 0 || i === n - 1 ? esc(dayMonth(r.date)) : ""}</span>`).join("");
  return `<section class="lr-card alx-chart" aria-labelledby="alx-chart-title" data-lg="7">
    <div class="lr-card__head"><h2 class="lr-card__title" id="alx-chart-title">Banner choices per day${info("the daily chart", "Bars stack the banner outcomes for each day (UAE days). The line is ad landings. The daily table below has the same numbers.")}</h2></div>
    <div class="alx-legend" aria-hidden="true">${SEGMENTS.map(([k, l]) => `<span class="alx-key" data-k="${k}">${l}</span>`).join("")}<span class="alx-key alx-key--line">Ad landings</span></div>
    <div class="alx-plot">
      <div class="alx-area">
        ${ticks.map((v) => `<div class="alx-grid${v ? "" : " alx-grid--zero"}" style="--t:${(100 - (v / max) * 100).toFixed(2)}%" aria-hidden="true"><span>${num(v)}</span></div>`).join("")}
        <div class="alx-cols" style="--n:${n}">${cols}</div>
        ${n > 1 ? `<svg class="alx-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${line}"/></svg>` : ""}
        ${rows.map((r, i) => `<span class="alx-pt" aria-hidden="true" style="--x:${x(i).toFixed(2)}%;--y:${((r.land / max) * 100).toFixed(2)}%"></span>`).join("")}
        <div class="lr-chart__tip lr-glass alx-tip" hidden></div>
      </div>
      <div class="alx-x" aria-hidden="true" style="--n:${n}">${xs}</div>
    </div>
    <p class="lr-sr">The same numbers are in the daily table below.</p>
  </section>`;
}

const NOT_RECORDED_HELP = "Ad landings from before device counting started, or from pages opened before that update.";

/**
 * One card for device and system (they share the same landings, so one table each would repeat itself): two columns
 * of bars, each type's share of the landings that carry device data, with its accept rate; "Not recorded" once, below.
 */
function deviceCard(dev: GroupRow[], os: GroupRow[]) {
  const recorded = (rows: GroupRow[]) => rows.filter((r) => r.key !== NOT_RECORDED);
  const devRows = recorded(dev), base = devRows.reduce((s, r) => s + r.land, 0);
  const notRec = dev.find((r) => r.key === NOT_RECORDED)?.land ?? 0;
  const column = (title: string, rows: GroupRow[]) => {
    const total = rows.reduce((s, r) => s + r.land, 0);
    const items = rows
      .map((r) => {
        const share = total ? r.land / total : 0;
        return `<li class="alx-dv__row">
            <div class="alx-dv__top"><span class="alx-dv__name">${esc(r.label)}</span><span class="alx-dv__num">${esc(num(r.land))}<small>${esc(pct(share))}</small></span></div>
            <div class="alx-fn__track"><span class="alx-fn__bar" data-k="${esc(r.key)}" style="--w:${(share * 100).toFixed(1)}%"></span></div>
            <span class="alx-fn__share">Accept rate ${esc(pct(rates(r).accept))} · ${esc(num(r.accept_all))} accepted</span>
          </li>`;
      })
      .join("");
    return `<div class="alx-dv__col"><h3 class="alx-split__title">${esc(title)}</h3>${items ? `<ol class="alx-dv__list">${items}</ol>` : `<p class="alx-dv__none">No device data in this period yet.</p>`}</div>`;
  };
  return `<section class="lr-card alx-dv" aria-labelledby="alx-dv-title">
    <div class="lr-card__head"><h2 class="lr-card__title" id="alx-dv-title">Device and system${info("device and system", "Worked out in the browser: the device type from the screen size, the system from the browser. Only these names are stored, never browser details or the screen size.")}</h2></div>
    <div class="alx-dv__cols">${column("Device", devRows)}${column("System", recorded(os))}</div>
    <p class="alx-caption">Shares of the ${esc(num(base))} ad landings with device data.${notRec ? ` ${esc(num(notRec))} more are not recorded${info("not recorded", NOT_RECORDED_HELP)}` : ""}</p>
  </section>`;
}

/** Each row's share of ad landings, as one bar (same style as the banner-choices bar). */
function shareBar(rows: GroupRow[]) {
  const total = rows.reduce((s, r) => s + r.land, 0);
  if (!total) return "";
  const parts = rows.map((r) => [r.key, r.label, r.land / total, r.land] as const);
  return `<div class="alx-split">
      <p class="alx-split__title">Share of ad landings</p>
      <div class="alx-split__bar" role="img" aria-label="${esc(parts.map(([, l, s]) => `${l} ${pct(s)}`).join(", "))}">${parts.map(([k, , s]) => `<span data-k="${k}" style="--w:${(s * 100).toFixed(2)}%"></span>`).join("")}</div>
      <ul class="alx-split__legend">${parts.map(([k, l, s, n]) => `<li class="alx-key" data-k="${k}">${esc(l)} <b>${pct(s)}</b> <span>(${num(n)})</span></li>`).join("")}</ul>
    </div>`;
}

function groupTable(id: string, title: string, help: string, rows: GroupRow[], first: string, rowHelp?: (r: GroupRow) => string, extra = "") {
  const body = rows.length
    ? rows
        .map((r) => {
          const ar = rates(r).accept;
          // Pages: the path (when the name differs) and the Google Ads campaign the page belongs to.
          const path = r.key.startsWith("/")
            ? `<small class="alx-path">${r.label !== r.key ? `${esc(r.key)} · ` : ""}<span class="alx-camp">${esc(campaignLabel(r.key))}</span></small>`
            : "";
          const help = rowHelp?.(r);
          return `<tr><th scope="row"><span class="alx-cell"><span class="alx-name">${esc(r.label)}${path}</span>${help ? info(r.label, help) : ""}</span></th>
            <td data-v="${r.land}" data-label="Ad landings">${num(r.land)}</td><td data-v="${r.accept_all}" data-label="Accept">${num(r.accept_all)}</td><td data-v="${ar ?? -1}" data-label="Accept rate">${pct(ar)}</td></tr>`;
        })
        .join("")
    : `<tr><td colspan="4" class="alx-none">No ad landings in this period.</td></tr>`;
  const th = (label: string, i: number, sort: string) =>
    `<th scope="col"${sort ? ` aria-sort="${sort}"` : ""}><button type="button" class="alx-sort" data-col="${i}">${esc(label)}</button></th>`;
  return `<section class="lr-card is-half" aria-labelledby="${id}">
    <div class="lr-card__head"><h2 class="lr-card__title" id="${id}">${esc(title)}${info(title, help)}</h2></div>
    <div class="alx-scroll"><table class="alx-table alx-table--sortable">
      <thead><tr>${th(first, 0, "")}${th("Ad landings", 1, "descending")}${th("Accept", 2, "")}${th("Accept rate", 3, "")}</tr></thead>
      <tbody>${body}</tbody></table></div>
    ${extra}
  </section>`;
}

function dailyTable(rows: DayRow[], total: Totals, notes: TestNote[], excludeTests: boolean) {
  const shownRows = [...rows].reverse();
  const emptyDays = shownRows.filter((r) => !r.land && !r.shown).length;
  const cell = (n: number, r: number | null) => `${num(n)}<span class="alx-rate">${r == null ? "" : pct(r)}</span>`;
  const tr = (r: DayRow | (Totals & { date: string }), foot = false) => {
    const rr = rates(r);
    const note = notes.filter((t) => t.date === r.date);
    const mark = note.length
      ? info(`notes for ${dayMonth(r.date)}`, note.map((t) => `${t.note} on ${t.path} (${t.param}): ${t.counts.land} landings, ${t.counts.shown} banners, ${t.counts.accept_all} accept, ${t.counts.reject_all} reject, ${t.counts.none} no choice. ${excludeTests ? "Taken off these numbers." : "Included in these numbers."}`).join(" "))
      : "";
    const label = foot ? "Total" : `<span class="alx-cell">${esc(longDate(r.date))}${note.length ? `<span class="alx-mark" aria-hidden="true"></span>${mark}` : ""}</span>`;
    // Days with no landings and no banners stay hidden until "Show empty days".
    return `<tr${!foot && !r.land && !r.shown ? ' class="alx-more" data-empty="1" hidden' : ""}>
      <th scope="row">${label}</th><td data-label="Ad landings">${num(r.land)}</td><td data-label="Banner shown">${num(r.shown)}</td>
      <td data-label="Accept">${cell(r.accept_all, rr.accept)}</td><td data-label="Reject">${cell(r.reject_all, rr.reject)}</td><td data-label="Manage">${cell(r.manage, rr.manage)}</td><td data-label="No choice">${cell(r.none, rr.none)}</td></tr>`;
  };
  const more = emptyDays ? `<button type="button" class="lr-btn-ghost alx-showall" aria-expanded="false" data-more="${emptyDays}">Show empty days (${emptyDays})</button>` : "";
  return `<section class="lr-card" aria-labelledby="alx-table-title">
    <div class="lr-card__head"><h2 class="lr-card__title" id="alx-table-title">Daily numbers${info("the daily table", "UAE days with data, newest first. Rates are shares of banners shown. A dot marks a day with a test-visit note.")}</h2></div>
    <div class="alx-scroll alx-scroll--tall" tabindex="0" role="region" aria-labelledby="alx-table-title"><table class="alx-table alx-table--daily">
      <thead><tr><th scope="col">Date</th><th scope="col">Ad landings</th><th scope="col">Banner shown</th><th scope="col">Accept</th><th scope="col">Reject</th><th scope="col">Manage</th><th scope="col">No choice</th></tr></thead>
      <tbody>${shownRows.map((r) => tr(r)).join("")}</tbody>
      <tfoot>${tr({ ...total, date: "" }, true)}</tfoot>
    </table></div>
    ${more}
  </section>`;
}

const empty = (q: URLSearchParams, range: Range) => `<section class="lr-card lr-empty alx-empty">
    <div class="lr-radar" aria-hidden="true"><span class="lr-radar__sweep"></span><span class="lr-radar__dot"></span></div>
    <h2 class="lr-empty__title">No ad landings ${range.key === "today" ? "yet today" : "in this period"}</h2>
    <p class="lr-empty__lead">A landing is counted when someone opens the site from a Google ad (the address carries gclid, gbraid or wbraid).${range.key === "30d" ? "" : " Try a longer range."}</p>
    ${range.key === "30d" ? "" : `<a class="lr-btn-ghost" href="${esc(href(q, { range: "30d", from: null, to: null }))}" data-nav>Show the last 30 days</a>`}
  </section>`;

const footer = () => `<footer class="alx-foot">
    <p>${icon("info")}Anonymous daily totals. No IP, no click ID value, no cookies, no browser details: only the device type and system.</p>
    <p>Counts start ${dayMonth(COUNT_START)} ${COUNT_START.slice(0, 4)} · Data kept ${KEEP_DAYS} days.</p>
  </footer>`;

/* ---------- Whole page ---------- */

export function adLandingsHtml(state: PageState): string {
  infoSeq = 0;
  const { range, today, updated, preview, query } = state.kind === "ok" ? state.data : state;
  let body: string;
  if (state.kind !== "ok") {
    const off = state.kind === "kv-off";
    body = `${header(range, today, query, null, off ? "The counter store isn't connected" : "Couldn't read the counts", "", "")}
      <section class="lr-card alx-error" role="alert">
        <h2 class="lr-empty__title">${icon("alert")}${off ? "The counter store isn't connected" : "Couldn't read the counts"}</h2>
        <p class="lr-empty__lead">${off ? "Connect the Upstash (Vercel KV) store to this project so KV_REST_API_URL and KV_REST_API_TOKEN are set, then redeploy." : "The counter store didn't answer. Try again in a minute."}</p>
        ${off ? "" : `<a class="lr-btn-ghost" href="" data-nav>${icon("refresh")}Try again</a>`}
      </section>`;
  } else {
    const d = state.data;
    const prevWords = PREV_WORDS[range.key];
    const t = totals(d.entries), p = d.prevEntries ? totals(d.prevEntries) : null;
    const rows = dailyRows(d.entries, range.from, range.to);
    // The one-look answer: how many landed, and how many accepted (and so can join remarketing audiences).
    const headline = t.land ? `${num(t.land)} ad landings, ${pct(rates(t).accept)} accepted cookies` : "No ad landings in this period yet";
    const answer = t.land ? `${num(t.land)} ad landings · ${num(t.accept_all)} accepted cookies${t.shown ? ` (${pct(t.accept_all / t.shown)} of banners)` : ""} and can join remarketing audiences` : headline;
    body = `${header(range, today, query, d.excludeTests, headline, answer, num(t.land))}
      <main class="lr-view lr-bento alx-view" id="alx-view">
        ${kpis(t, p, prevWords)}
        ${t.land === 0 && t.shown === 0
          ? empty(query, range)
          : `${funnel(t)}${chart(rows)}
             ${groupTable("alx-pages-title", "By landing page", "Ad landings per page, with accepts and the accept rate. Click a column to sort.", byPath(d.entries).map((r) => ({ ...r, label: pageLabel(r.key) })), "Page")}
             ${(() => {
               const types = byClickType(d.entries);
               return groupTable("alx-types-title", "By click type", "Which Google click ID the landing carried.", types, "Click type", (r) =>
                 r.key === "ios"
                   ? "Google uses gbraid or wbraid instead of gclid for many clicks from iPhones and iPads (Apple's privacy rules)."
                   : "Clicks that carry a gclid: most clicks outside iOS.", shareBar(types));
             })()}
             ${(() => {
               return deviceCard(byDim(d.dims, "dev", t), byDim(d.dims, "os", t));
             })()}
             ${dailyTable(rows, t, d.notes, d.excludeTests)}`}
      </main>`;
  }
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light">
<title>Ad landings · Lead Insights</title>
<meta name="theme-color" content="#f1ede8">
<link rel="icon" href="/lead-insights/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/lead-insights/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
<style>${dashCss()}
${CSS}</style>
</head>
<body>
<div class="lr-aurora" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
${sprite()}
${topbar(preview, updated, query)}
<div class="lr-page"><div class="lr-main alx">
${body}
${footer()}
</div></div>
<script>${SCRIPT}</script>
</body>
</html>`;
}

/* ---------- Page-only styles (alx-*), from the dashboard's tokens ---------- */

export const CSS = `
.alx { --accent: var(--copper-hi); --g1: #3f4b5e; --g2: #6a7588; --g3: #9aa3b1; }
/* Layout: the dashboard's own (page head beside the controls on laptops); this view's rows span the full width. */
.alx > .alx-bar, .alx > .alx-foot { grid-column: 1 / -1; }
.alx-bar { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: var(--s3); }
.alx-bar__text { display: grid; gap: 6px; min-width: 0; max-width: 680px; }
.alx-answer__text { color: var(--text); font: 700 var(--fs-body)/1.4 var(--font); }
.alx-lead { color: var(--muted); font: 500 var(--fs-small)/var(--lh-small) var(--font); }
/* Laptop: the page head already names the range and gives the answer. */
@media (min-width: 1200px) { .alx-bar .alx-period, .alx-bar .alx-answer__text { display: none; } }
.alx-tools__row { display: flex; flex-wrap: wrap; gap: var(--s2); align-items: center; }
.alx-custom { display: grid; gap: var(--s2); grid-template-columns: 1fr 1fr; width: min(100%, 360px); }
.alx-custom[hidden] { display: none; }
.alx-custom .lr-field { margin: 0; }
.alx-custom .lr-custom__err, .alx-custom .lr-custom__actions { grid-column: 1 / -1; }
@media (min-width: 1024px) { .alx-custom { position: absolute; right: 0; top: calc(100% + 8px); z-index: 20; } }
.alx-toggle { display: inline-flex; align-items: center; gap: var(--s2); text-decoration: none; }
.alx-toggle__track { position: relative; width: 30px; height: 18px; border-radius: 999px; background: var(--line-strong); transition: background var(--t-fast); }
.alx-toggle__track::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(20,37,62,.3); transition: transform var(--t-fast); }
.alx-toggle[aria-checked="true"] .alx-toggle__track { background: var(--accent); }
.alx-toggle[aria-checked="true"] .alx-toggle__track::after { transform: translateX(12px); }
.alx-csv { text-decoration: none; }
.alx-env { display: inline-flex; align-items: center; gap: 6px; padding: 2px 10px; border-radius: 999px; font: 700 11px/1.6 var(--font); letter-spacing: .04em; color: var(--won); background: color-mix(in srgb, var(--won) 12%, transparent); }
.alx-env[data-env="preview"] { color: var(--copper-lo); background: color-mix(in srgb, var(--copper) 16%, transparent); }
.alx-period { color: var(--muted); font: 600 var(--fs-label)/1 var(--font); letter-spacing: .12em; text-transform: uppercase; }
.alx-view { margin: 0; }
.alx-kpis { grid-column: 1 / -1; display: grid; gap: var(--gap-panel); grid-template-columns: repeat(2, minmax(0, 1fr)); }
.alx-kpis > :first-child { grid-column: 1 / -1; }
@media (min-width: 768px) { .alx-kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); } .alx-kpis > :first-child { grid-column: auto; } }
@media (min-width: 1200px) { .alx-kpis { grid-template-columns: repeat(5, minmax(0, 1fr)); } }
.alx-kpis .lr-kpi__label { display: flex; align-items: center; gap: var(--s1); white-space: nowrap; letter-spacing: .06em; }
.alx-kpi__sub { color: var(--muted); font: 500 var(--fs-small)/var(--lh-small) var(--font); }
.alx-vs, .alx-nodelta { color: var(--muted); font: 500 12px/1.3 var(--font); }
.alx-fn__list { list-style: none; display: grid; gap: var(--s3); }
.alx-fn__top { display: flex; justify-content: space-between; align-items: baseline; gap: var(--s2); }
.alx-fn__label { display: inline-flex; align-items: center; gap: 4px; font: 600 var(--fs-small)/1.3 var(--font); }
.alx-fn__num { font: 700 22px/1 var(--font); letter-spacing: -.02em; }
.alx-fn__track { margin-top: 6px; height: 12px; border-radius: 999px; background: var(--surface-3); overflow: hidden; }
.alx-fn__bar { display: block; width: var(--w); min-width: 2px; height: 100%; border-radius: inherit; background: var(--g2); }
.alx-fn__bar[data-tone="accent"] { background: var(--accent); }
.alx-fn__share { display: block; margin-top: 4px; color: var(--muted); font: 500 12px/1.3 var(--font); }
.alx-fn__end { display: flex; justify-content: space-between; align-items: center; padding-top: var(--s2); border-top: 1px dashed var(--line-strong); }
.alx-fn__end .alx-fn__label { color: var(--accent); }
.alx-fn__end .alx-fn__share { margin: 0; }
.alx-caption { margin-top: var(--s3); color: var(--muted); font: 500 var(--fs-small)/var(--lh-small) var(--font); }
.alx-legend { display: flex; flex-wrap: wrap; gap: var(--s1) var(--s3); margin-bottom: var(--s3); color: var(--muted); font: 500 12px/1.3 var(--font); }
.alx-key { display: inline-flex; align-items: center; gap: 6px; }
.alx-key::before { content: ""; width: 10px; height: 10px; border-radius: 3px; background: var(--c); }
.alx-key--line::before { height: 2px; border-radius: 1px; background: var(--text); }
[data-k="accept_all"] { --c: var(--accent); } [data-k="reject_all"] { --c: var(--g1); } [data-k="manage"] { --c: var(--g2); } [data-k="none"] { --c: var(--g3); }
/* Y-axis: round steps (0, 10, 20 …) labelled in a left gutter; the x labels line up under the plot. */
.alx-plot { position: relative; padding: 8px 0 0 34px; }
.alx-area { position: relative; height: 220px; }
.alx-grid { position: absolute; left: 0; right: 0; top: var(--t); border-top: 1px dashed var(--line-strong); }
.alx-grid--zero { border-top: 1px solid var(--line-strong); }
.alx-grid span { position: absolute; right: calc(100% + 8px); top: -7px; color: var(--muted); font: 600 11px/1 var(--font); font-variant-numeric: tabular-nums; }
.alx-cols { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); }
.alx-col { position: relative; display: flex; align-items: flex-end; justify-content: center; height: 100%; padding: 0 18%; border: 0; background: none; cursor: pointer; }
.alx-col:hover, .alx-col:focus-visible { background: var(--sort-tint); }
.alx-col:focus-visible { outline-offset: -2px; border-radius: var(--r-small); }
.alx-stack { display: flex; flex-direction: column-reverse; width: 100%; max-width: 28px; height: 100%; justify-content: flex-start; }
.alx-seg { display: block; height: var(--h); background: var(--c); }
.alx-seg + .alx-seg { box-shadow: 0 1px 0 #fff; }
.alx-stack .alx-seg:last-child { border-radius: 4px 4px 0 0; }
.alx-line { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.alx-line path { fill: none; stroke: var(--text); stroke-width: 2; vector-effect: non-scaling-stroke; stroke-linejoin: round; }
.alx-pt { position: absolute; left: var(--x); bottom: var(--y); width: 7px; height: 7px; margin: 0 0 -3.5px -3.5px; border-radius: 50%; background: var(--surface); box-shadow: 0 0 0 2px var(--text); pointer-events: none; }
.alx-tip { --top: 0px; bottom: auto; top: 8px; white-space: normal; min-width: 170px; }
.alx-tip span { display: flex; justify-content: space-between; gap: var(--s3); }
.alx-x { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); margin-top: 6px; color: var(--muted); font: 500 11px/1 var(--font); text-align: center; white-space: nowrap; }
/* Breakdown tables only ever scroll sideways (narrow phones); the daily table also scrolls down inside its card. */
.alx-scroll { overflow-x: auto; overflow-y: hidden; max-width: 100%; border-radius: var(--r-small); }
.alx-scroll--tall { overflow-y: auto; max-height: 560px; }
[data-k="other"] { --c: var(--g1); } [data-k="ios"] { --c: var(--g3); }
[data-k="phone"] { --c: var(--g1); } [data-k="tablet"] { --c: var(--g2); } [data-k="desktop"] { --c: var(--g3); } [data-k="android"] { --c: var(--g2); }
[data-k="notrec"] { --c: #d5dae2; }
.alx-camp { color: var(--copper-lo); font-weight: 600; }
/* Device and system card: two columns of bars (one column on phones), "Not recorded" once in the caption. */
.alx-dv__cols { display: grid; gap: var(--s4); }
@media (min-width: 768px) { .alx-dv__cols { grid-template-columns: 1fr 1fr; gap: var(--s5); } }
.alx-dv__list { list-style: none; display: grid; gap: var(--s3); margin-top: var(--s3); }
.alx-dv__top { display: flex; justify-content: space-between; align-items: baseline; gap: var(--s2); }
.alx-dv__name { font: 600 var(--fs-small)/1.3 var(--font); }
.alx-dv__num { font: 700 20px/1 var(--font); letter-spacing: -.02em; }
.alx-dv__num small { margin-left: 8px; color: var(--muted); font: 600 12px/1 var(--font); letter-spacing: 0; }
.alx-dv .alx-fn__bar { background: var(--c, var(--g2)); }
.alx-dv__none { margin-top: var(--s3); color: var(--muted); font: 500 var(--fs-small)/1.4 var(--font); }
.alx-dv .alx-caption { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
/* Side-by-side breakdown cards keep their own height instead of stretching to the taller one. */
.alx-view > .is-half { align-self: start; }
/* Side by side only where a table fits in half the width (1024 px and up); narrower, each card takes the full width. */
@media (max-width: 1023px) { .alx-view > .is-half { grid-column: 1 / -1; } }
.alx-scroll:focus-visible { outline-offset: 2px; }
.alx-table { width: 100%; border-collapse: separate; border-spacing: 0; font: 500 var(--fs-table)/var(--lh-table) var(--font); font-variant-numeric: tabular-nums; }
.alx-table th, .alx-table td { padding: 10px 12px; text-align: right; white-space: nowrap; border-bottom: 1px solid var(--line); }
/* Names and column headers wrap, so a long page name never pushes the numbers out of the card (no sideways scroll). */
.alx-table th[scope="row"], .alx-table thead th:first-child { white-space: normal; }
@media (max-width: 1199px) { .alx-table thead th { white-space: normal; } }
.alx-path { overflow-wrap: anywhere; }
/* Info popups keep their own small wrapped box, even inside a table cell. */
.alx .lr-info__pop { white-space: normal; text-align: left; font-weight: 400; }
.alx-table th:first-child, .alx-table td:first-child { text-align: left; }
.alx-table thead th { position: sticky; top: 0; z-index: 2; background: var(--surface); color: var(--muted); font: 600 var(--fs-label)/1.3 var(--font); letter-spacing: .06em; text-transform: uppercase; }
.alx-table tbody tr:nth-child(even) { background: var(--surface-low); }
.alx-table tbody th { font-weight: 600; }
.alx-table tbody tr[data-empty] td { color: var(--muted); }
.alx-table tfoot td, .alx-table tfoot th { position: sticky; bottom: 0; background: var(--surface); border-top: 1px solid var(--line-strong); border-bottom: 0; font-weight: 700; }
.alx-rate { display: inline-block; min-width: 3.2em; margin-left: 6px; color: var(--muted); font-weight: 500; }
.alx-cell { display: inline-flex; align-items: center; gap: 6px; }
.alx-mark { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); }
.alx-sort { all: unset; cursor: pointer; border-radius: 4px; }
.alx-sort:focus-visible { outline: 2px solid var(--copper-hi); outline-offset: 2px; }
.alx-sort::after { content: ""; display: inline-block; width: 0; margin-left: 4px; }
th[aria-sort="descending"] .alx-sort::after { content: "▼"; width: auto; font-size: 9px; color: var(--accent); }
th[aria-sort="ascending"] .alx-sort::after { content: "▲"; width: auto; font-size: 9px; color: var(--accent); }
.alx-none { text-align: center !important; color: var(--muted); }
/* Phones: each row becomes a small card (name on top, labelled values in a grid) instead of a sideways-scrolling table.
   The column headers stay for screen readers. */
@media (max-width: 767px) {
  .alx-scroll, .alx-scroll--tall { overflow: visible; max-height: none; }
  .alx-table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .alx-table, .alx-table tbody, .alx-table tfoot { display: block; }
  .alx-table tr { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px 12px; padding: 14px 4px; border-bottom: 1px solid var(--line); }
  .alx-table tr[hidden] { display: none; }
  .alx-table tbody tr:nth-child(even) { background: none; }
  .alx-table th, .alx-table td { padding: 0; border: 0; text-align: left; white-space: normal; }
  .alx-table th[scope="row"] { grid-column: 1 / -1; font-size: var(--fs-body); }
  .alx-table td { display: block; font-weight: 600; }
  .alx-table td::before { content: attr(data-label); display: block; margin-bottom: 3px; color: var(--muted); font: 600 10.5px/1.2 var(--font); letter-spacing: .06em; text-transform: uppercase; }
  .alx-table tfoot td, .alx-table tfoot th { position: static; border: 0; }
  .alx-table tfoot tr { margin-top: 4px; border: 0; border-radius: var(--r-small); background: var(--surface-low); padding: 14px 12px; }
  .alx-rate { min-width: 0; margin-left: 6px; }
  .alx-none { grid-column: 1 / -1; }
}
.alx-showall { margin-top: var(--s3); }
.alx-empty, .alx-error { grid-column: 1 / -1; }
.alx-error { display: grid; justify-items: start; gap: var(--s2); }
.alx-error .lr-empty__title { display: flex; align-items: center; gap: var(--s2); color: var(--bad); }
.alx-error .lr-btn-ghost, .alx-showall { text-decoration: none; }
.alx-split { margin-top: var(--s4); padding-top: var(--s3); border-top: 1px solid var(--line); }
.alx-split__title { color: var(--muted); font: 600 var(--fs-label)/1.3 var(--font); letter-spacing: .06em; text-transform: uppercase; }
.alx-split__bar { display: flex; gap: 2px; height: 12px; margin: var(--s2) 0; border-radius: 999px; overflow: hidden; }
.alx-split__bar span { width: var(--w); background: var(--c); }
.alx-split__legend { list-style: none; display: flex; flex-wrap: wrap; gap: var(--s1) var(--s3); color: var(--muted); font: 500 12px/1.3 var(--font); }
.alx-split__legend b { color: var(--text); font-weight: 700; }
.alx-name { display: grid; gap: 1px; }
.alx-path { color: var(--muted); font: 500 12px/1.2 var(--font); }
.alx-foot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--s2); padding: var(--s3) 0 0; color: var(--muted); font: 500 var(--fs-small)/var(--lh-small) var(--font); }
.alx-foot p { display: inline-flex; align-items: center; gap: 6px; }
/* Loading: while a range or toggle loads, the cards dim and shimmer. */
.alx.is-loading .lr-card { position: relative; overflow: hidden; }
.alx.is-loading .lr-card > * { opacity: .25; transition: opacity var(--t-fast); }
.alx.is-loading .lr-card::after { content: ""; position: absolute; inset: 0; background: linear-gradient(100deg, transparent 20%, rgba(255,255,255,.6) 50%, transparent 80%); background-size: 200% 100%; animation: alx-shimmer 1.1s linear infinite; }
@keyframes alx-shimmer { from { background-position: 150% 0; } to { background-position: -50% 0; } }
@media (prefers-reduced-motion: reduce) { .alx.is-loading .lr-card::after { animation: none; } }
`;

/* ---------- Page-only script: tooltips, info popovers, sort, show all, custom range, loading state ---------- */

export const SCRIPT = `(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  // Info popovers (same behaviour as the Ads dashboard: placed under the button, flipped above when needed).
  const place = (btn, pop) => {
    const r = btn.getBoundingClientRect(), m = 16, w = pop.offsetWidth, h = pop.offsetHeight;
    const left = Math.min(Math.max(m, r.left + r.width / 2 - w / 2), innerWidth - w - m);
    let top = r.bottom + 8; if (top + h > innerHeight - m) top = Math.max(m, r.top - h - 8);
    pop.style.setProperty("--x", Math.round(left) + "px"); pop.style.setProperty("--y", Math.round(top) + "px");
  };
  const closeInfo = () => $$(".lr-info__btn[aria-expanded=true]").forEach((b) => { b.setAttribute("aria-expanded", "false"); document.getElementById(b.getAttribute("aria-controls")).hidden = true; });
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".lr-info__btn");
    if (!b) { if (!e.target.closest(".lr-info__pop")) closeInfo(); return; }
    const pop = document.getElementById(b.getAttribute("aria-controls")), open = b.getAttribute("aria-expanded") === "true";
    closeInfo();
    if (!open) { b.setAttribute("aria-expanded", "true"); pop.hidden = false; place(b, pop); }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeInfo(); hideTip(); } });
  addEventListener("scroll", closeInfo, { passive: true });

  // Chart tooltip on hover, focus and tap.
  const tip = $(".alx-tip");
  const showTip = (col) => {
    if (!tip) return;
    const [date, ...rows] = col.dataset.tip.split("|");
    tip.innerHTML = "<b>" + date + "</b>" + rows.map((r) => { const i = r.lastIndexOf(" "); return "<span>" + r.slice(0, i) + "<b>" + r.slice(i + 1) + "</b></span>"; }).join("");
    tip.hidden = false;
    const area = tip.parentElement.getBoundingClientRect(), c = col.getBoundingClientRect();
    const x = Math.min(Math.max(0, c.left - area.left + c.width / 2 - tip.offsetWidth / 2), area.width - tip.offsetWidth);
    tip.style.left = x + "px"; tip.style.transform = "none";
  };
  const hideTip = () => { if (tip) tip.hidden = true; };
  $$(".alx-col").forEach((c) => {
    c.addEventListener("mouseenter", () => showTip(c)); c.addEventListener("focus", () => showTip(c));
    c.addEventListener("click", () => showTip(c)); c.addEventListener("mouseleave", hideTip); c.addEventListener("blur", hideTip);
  });

  // Sortable breakdown tables.
  $$(".alx-table--sortable").forEach((t) => $$(".alx-sort", t).forEach((b) => b.addEventListener("click", () => {
    const th = b.closest("th"), col = +b.dataset.col, desc = th.getAttribute("aria-sort") !== "descending";
    $$("th", t.tHead).forEach((h) => h.removeAttribute("aria-sort")); th.setAttribute("aria-sort", desc ? "descending" : "ascending");
    const key = (tr) => col === 0 ? tr.cells[0].textContent.trim() : +tr.cells[col].dataset.v;
    const rows = $$("tr", t.tBodies[0]).filter((r) => r.cells.length > 1);
    rows.sort((a, z) => { const x = key(a), y = key(z); const d = typeof x === "string" ? x.localeCompare(y) : x - y; return desc ? -d : d; });
    rows.forEach((r) => t.tBodies[0].appendChild(r));
  })));

  // Daily table: show the older days.
  const more = $(".alx-showall");
  more && more.addEventListener("click", () => {
    const open = more.getAttribute("aria-expanded") !== "true";
    $$(".alx-more").forEach((r) => (r.hidden = !open));
    more.setAttribute("aria-expanded", String(open));
    more.textContent = open ? "Hide empty days" : "Show empty days (" + more.dataset.more + ")";
  });

  // Custom range form.
  const custom = $("#alx-custom"), opener = $('[aria-controls="alx-custom"]');
  opener && opener.addEventListener("click", () => { const open = custom.hidden; custom.hidden = !open; opener.setAttribute("aria-expanded", String(open)); if (open) $("input", custom).focus(); });
  $('[data-action="custom-cancel"]') && $('[data-action="custom-cancel"]').addEventListener("click", () => { custom.hidden = true; opener.setAttribute("aria-expanded", "false"); opener.focus(); });
  custom && custom.addEventListener("submit", () => $(".alx").classList.add("is-loading"));

  // Loading state while the next range or toggle loads.
  $$("[data-nav]").forEach((a) => a.addEventListener("click", (e) => { if (!e.metaKey && !e.ctrlKey) $(".alx").classList.add("is-loading"); }));
  addEventListener("pageshow", () => $(".alx") && $(".alx").classList.remove("is-loading"));
})();`;
