import { CSS, SCRIPT, dashCss, esc, href, icon, info, sprite, topbar, viewSwitch } from "@/lib/adLandingsPage";
import { yTicks } from "@/lib/adLandingsReport";
import type { SheetData } from "@/lib/googleAdsSheet";
import {
  DASH,
  PERIODS,
  adGroupRows,
  adRows,
  addDays,
  alertsOf,
  campaignRows,
  change,
  conversionRows,
  cpa,
  cpc,
  ctr,
  dateOf,
  daysIn,
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
  type Fresh,
  type KeywordRow,
  type TermRow,
  type NamedRow,
  type Period,
  type Row,
  type Totals,
} from "@/lib/googleAdsReport";

/*
  The Google Ads view of the ads dashboard (/ads-report?view=google-ads), rendered on the server from the report
  Sheet. It wears the dashboard's design: the Ad landings page's top bar, view switch, styles and script are reused
  as they are; the gad-* rules below only add what this view needs (tabs, tables with search and CSV, pills, alerts).
  Query: ?range= | ?from=&to=, ?compare=off, ?campaign=<name>, ?tab=, ?hist=<id>.
*/

/* ---------- Formatting ---------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayMonth = (d: string) => `${Number(d.slice(8))} ${MONTHS[Number(d.slice(5, 7)) - 1]}`;
const span = (a: string, b: string) => (a === b ? dayMonth(a) : `${dayMonth(a)} – ${dayMonth(b)}`);
const datesBetween = (a: string, b: string) => Array.from({ length: Math.max(0, daysIn(a, b)) }, (_, i) => addDays(a, i));
/** "APPROVED_LIMITED" → "Approved limited". */
const pretty = (s: string) => (s ? (s[0] + s.slice(1).toLowerCase()).replace(/_/g, " ") : DASH);

type Tone = "good" | "warn" | "bad" | "neutral";
const TONES: [RegExp, Tone][] = [
  [/^(enabled|approved|excellent|good|above[_ ]average|eligible|added)$/i, "good"],
  [/^(paused|average|limited|approved[_ ]limited|learning|pending|under[_ ]review)$/i, "warn"],
  [/^(removed|disapproved|poor|below[_ ]average|excluded|not[_ ]eligible|suspended)$/i, "bad"],
];
const toneOf = (s: string): Tone => TONES.find(([re]) => re.test(s.trim()))?.[1] ?? "neutral";
const pill = (s: string) => (s ? `<span class="gad-pill" data-tone="${toneOf(s)}">${esc(pretty(s))}</span>` : DASH);

/* ---------- Tables: sortable, searchable, CSV of the visible rows (all in the page script) ---------- */

interface Col<T> {
  label: string;
  /** Cell HTML. */
  html: (r: T) => string;
  /** Sort value (numbers sort as numbers); defaults to the cell's text. */
  v?: (r: T) => number | string | null;
}

const money = <T,>(label: string, get: (r: T) => number | null, dp = 2): Col<T> => ({ label, html: (r) => esc(fmtAed(get(r), dp)), v: get });
const count = <T,>(label: string, get: (r: T) => number | null): Col<T> => ({ label, html: (r) => esc(fmtNum(get(r))), v: get });
const share = <T,>(label: string, get: (r: T) => number | null): Col<T> => ({ label, html: (r) => esc(fmtShare(get(r))), v: get });
const text = <T,>(label: string, get: (r: T) => string): Col<T> => ({ label, html: (r) => esc(get(r) || DASH), v: get });
const metricCols = <T,>(t: (r: T) => Totals, impr = true): Col<T>[] => [
  ...(impr ? [count<T>("Impr.", (r) => t(r).impr)] : []),
  count<T>("Clicks", (r) => t(r).clicks),
  money<T>("Cost", (r) => t(r).cost),
  count<T>("Conv.", (r) => t(r).conv),
  money<T>("Cost / conv.", (r) => cpa(t(r))),
];

function table<T>(id: string, name: string, cols: Col<T>[], rows: T[], opts: { empty: string; rowAttr?: (r: T) => string; tools?: boolean } = { empty: "" }) {
  const head = cols.map((c, i) => `<th scope="col"${i === 0 ? "" : ' class="gad-num"'}><button type="button" class="alx-sort" data-col="${i}">${esc(c.label)}</button></th>`).join("");
  const body = rows.length
    ? rows
        .map((r) => {
          const cells = cols
            .map((c, i) => {
              const v = c.v?.(r);
              const dv = v == null || v === "" ? "" : ` data-v="${esc(v)}"`;
              return i === 0 ? `<th scope="row"${dv}>${c.html(r)}</th>` : `<td data-label="${esc(c.label)}"${dv}>${c.html(r)}</td>`;
            })
            .join("");
          return `<tr${opts.rowAttr?.(r) ?? ""}>${cells}</tr>`;
        })
        .join("")
    : `<tr class="gad-none-row"><td colspan="${cols.length}" class="alx-none">${esc(opts.empty)}</td></tr>`;
  const tools =
    opts.tools === false
      ? ""
      : `<div class="gad-tools">
        <label class="lr-search gad-search">${icon("search")}<span class="lr-sr">Search ${esc(name)}</span><input class="lr-input" type="search" placeholder="Search" data-search="${id}"></label>
        <span class="gad-count" data-count="${id}">${rows.length} rows</span>
        <button type="button" class="lr-btn-ghost" data-csv="${id}" data-name="${esc(name)}">${icon("copy")}CSV</button>
      </div>`;
  return `${tools}<div class="alx-scroll gad-scroll"><table class="alx-table gad-table" id="${id}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

const card = (id: string, title: string, help: string, inner: string, cls = "") =>
  `<section class="lr-card gad-card ${cls}" aria-labelledby="${id}-t"><div class="lr-card__head"><h2 class="lr-card__title" id="${id}-t">${esc(title)}${help ? info(title, help) : ""}</h2></div>${inner}</section>`;

/* ---------- Header, alerts, KPIs ---------- */

const FRESH_TEXT: Record<Fresh, string> = { good: "Up to date", warn: "Not updated for 9+ hours", bad: "Report is not updating", unknown: "Update time unknown" };

function delta(ch: number | null, goodWhenDown: boolean, prevWords: string) {
  if (ch == null) return `<span class="alx-nodelta">No comparison with ${esc(prevWords)}</span>`;
  const p = Math.round(ch * 100);
  const dir = p > 0 ? "up" : p < 0 ? "down" : "flat";
  const tone = dir === "flat" ? "neutral" : (dir === "down") === goodWhenDown ? "good" : "bad";
  const glyph = dir === "up" ? "▲" : dir === "down" ? "▼" : "→";
  const words = dir === "flat" ? `no change on ${prevWords}` : `${dir} ${Math.abs(p)}% on ${prevWords}`;
  return `<span class="lr-delta" data-tone="${tone}" role="img" aria-label="${esc(words)}"><span class="lr-delta__glyph" aria-hidden="true">${glyph}</span>${Math.abs(p)}%</span><span class="alx-vs">vs ${esc(prevWords)}</span>`;
}

function kpis(t: Totals, p: Totals | null, prevWords: string) {
  const tile = (label: string, value: string, cur: number | null, prev: number | null, goodDown: boolean, help: string) => `<section class="lr-card lr-kpi is-kpi" aria-label="${esc(label)}">
      <h3 class="lr-kpi__label gad-kpi__label">${esc(label)}${info(label, help)}</h3>
      <div class="lr-kpi__value gad-kpi__value">${esc(value)}</div>
      ${p ? `<div class="lr-kpi__meta">${delta(change(cur, prev), goodDown, prevWords)}</div>` : ""}
    </section>`;
  return [
    tile("Cost", fmtAed(t.cost, 0), t.cost, p?.cost ?? null, true, "Spend in AED, as Google Ads reports it."),
    tile("Clicks", fmtNum(t.clicks), t.clicks, p?.clicks ?? null, false, "Clicks on the ads."),
    tile("Avg CPC", fmtAed(cpc(t)), cpc(t), p && cpc(p), true, "Cost ÷ clicks."),
    tile("Conversions", fmtNum(t.conv), t.conv, p?.conv ?? null, false, "Conversions counted for bidding (primary actions). Google may update them for several days."),
    tile("Cost / conv.", fmtAed(cpa(t)), cpa(t), p && cpa(p), true, "Cost ÷ conversions."),
    tile("CTR", fmtShare(ctr(t)), ctr(t), p && ctr(p), false, "Clicks ÷ impressions."),
  ].join("");
}

function alertsStrip(values: SheetData["tabs"]["Alerts"]) {
  const a = alertsOf(values);
  const chips = a.items.length
    ? a.items.map((x) => `<li class="gad-alert">${icon("alert")}<span><b>${esc(x.type || "Alert")}</b>${x.where ? ` · ${esc(x.where)}` : ""}${x.detail ? ` · ${esc(x.detail)}` : ""}</span></li>`).join("")
    : `<li class="gad-alert" data-tone="good">${icon("tick")}<span><b>All clear</b></span></li>`;
  return `<section class="gad-alerts" aria-label="Alerts"><ul>${chips}</ul>${a.checkedAt ? `<p class="gad-muted">${esc(a.checkedAt)}</p>` : ""}</section>`;
}

/* ---------- Trend chart ---------- */

function trend(rows: Row[], period: Period, today: string) {
  const by = groupBy(rows, (r) => dateOf(r.Date));
  const days = datesBetween(period.from, period.to).map((d) => ({ d, t: totals(by.get(d) ?? []) }));
  const n = days.length;
  const conv = days.map((x) => x.t.conv ?? 0);
  const cTicks = yTicks(Math.max(0, ...conv)), cMax = cTicks[cTicks.length - 1];
  const x = (i: number) => ((i + 0.5) / n) * 100;
  // About six labels, so they never overlap on a phone.
  const every = n <= 7 ? 1 : Math.ceil(n / 6);
  // Bars: cost or clicks (the toggle swaps them in CSS); each has its own axis. The line is conversions on its own scale.
  const metric = (m: "cost" | "clicks") => {
    const vals = days.map((x) => (m === "cost" ? x.t.cost : x.t.clicks) ?? 0);
    const ticks = yTicks(Math.max(0, ...vals)), max = ticks[ticks.length - 1];
    return { vals, ticks, max };
  };
  const cost = metric("cost"), clicks = metric("clicks");
  const grid = (m: string, ticks: number[], max: number, side: "l" | "r") =>
    ticks.map((v) => `<div class="alx-grid gad-grid${v ? "" : " alx-grid--zero"}" data-m="${m}" data-side="${side}" style="--t:${(100 - (v / max) * 100).toFixed(2)}%" aria-hidden="true"><span>${esc(fmtNum(v))}</span></div>`).join("");
  const cols = days
    .map(({ d, t }, i) => {
      const tip = `${dayMonth(d)} ${d.slice(0, 4)}${d === today ? " (partial)" : ""}|Cost ${fmtAed(t.cost)}|Clicks ${fmtNum(t.clicks)}|Conversions ${fmtNum(t.conv)}`;
      const seg = (m: string, v: number, max: number) => `<span class="alx-seg gad-seg" data-m="${m}" style="--h:${((v / max) * 100).toFixed(2)}%"></span>`;
      return `<button type="button" class="alx-col" data-tip="${esc(tip)}" aria-label="${esc(tip.split("|").join(", "))}"><span class="alx-stack">${seg("cost", cost.vals[i], cost.max)}${seg("clicks", clicks.vals[i], clicks.max)}</span></button>`;
    })
    .join("");
  const line = days.map((_, i) => `${i ? "L" : "M"}${x(i).toFixed(2)},${(100 - (conv[i] / cMax) * 100).toFixed(2)}`).join(" ");
  const xs = days.map(({ d }, i) => `<span>${i % every === 0 || (i === n - 1 && i % every >= every / 2) ? esc(dayMonth(d)) : ""}</span>`).join("");
  const partial = period.to === today;
  return `<section class="lr-card gad-card gad-chart" data-bars="cost" aria-labelledby="gad-chart-t">
    <div class="lr-card__head gad-chart__head"><h2 class="lr-card__title" id="gad-chart-t">Daily trend${info("the daily trend", "Bars: cost (or clicks) per Dubai day, left axis. Line: conversions, right axis.")}</h2>
      <div class="lr-bd__tabs gad-toggle" role="group" aria-label="Bars show">
        <button type="button" class="lr-bd__tab" data-bars="cost" aria-pressed="true">Cost</button>
        <button type="button" class="lr-bd__tab" data-bars="clicks" aria-pressed="false">Clicks</button>
      </div></div>
    <div class="alx-legend" aria-hidden="true"><span class="alx-key gad-key-bar"><span data-m="cost">Cost (AED)</span><span data-m="clicks">Clicks</span></span><span class="alx-key alx-key--line">Conversions</span></div>
    <div class="alx-plot gad-plot">
      <div class="alx-area">
        ${grid("cost", cost.ticks, cost.max, "l")}${grid("clicks", clicks.ticks, clicks.max, "l")}${grid("conv", cTicks, cMax, "r")}
        <div class="alx-cols" style="--n:${n}">${cols}</div>
        ${n > 1 ? `<svg class="alx-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${line}"/></svg>` : ""}
        ${conv.map((c, i) => `<span class="alx-pt" aria-hidden="true" style="--x:${x(i).toFixed(2)}%;--y:${((c / cMax) * 100).toFixed(2)}%"></span>`).join("")}
        <div class="lr-chart__tip lr-glass alx-tip" hidden></div>
      </div>
      <div class="alx-x" aria-hidden="true" style="--n:${n}">${xs}</div>
    </div>
    ${partial ? `<p class="alx-caption">Today is partial: the Sheet is updated at 06:00, 13:00 and 20:00 Dubai.</p>` : ""}
  </section>`;
}

/* ---------- Tabs ---------- */

const TABS = [
  ["adgroups", "Ad groups"], ["keywords", "Keywords"], ["terms", "Search terms"], ["ads", "Ads"], ["conversions", "Conversions"],
  ["devices", "Devices"], ["networks", "Networks"], ["locations", "Locations"], ["ages", "Ages"], ["audiences", "Audiences"],
  ["assets", "Sitelinks & callouts"], ["changes", "Changes"],
] as const;
type TabKey = (typeof TABS)[number][0];

const FLAG = `<span class="gad-pill gad-flag" data-tone="bad">Spend, no conv.</span>`;
const where = (campaign: string, adGroup: string) => `<small class="alx-path">${esc([campaign, adGroup].filter(Boolean).join(" · "))}</small>`;
const named = (r: NamedRow, extra = "") => `<span class="alx-name">${esc(r.label)}${r.sub ? `<small class="alx-path">${esc(r.sub)}</small>` : ""}${extra}</span>`;

/** Small bars (share of cost, or clicks when there's no cost) above a segment table. */
function segmentCard(id: string, title: string, rows: NamedRow[], note: string, impr = true) {
  const by: "cost" | "clicks" = rows.some((r) => r.t.cost) ? "cost" : "clicks";
  const sum = rows.reduce((s, r) => s + (r.t[by] ?? 0), 0);
  const bars = sum
    ? `<ol class="alx-dv__list gad-bars">${rows
        .slice(0, 8)
        .map((r) => {
          const sh = (r.t[by] ?? 0) / sum;
          return `<li class="alx-dv__row"><div class="alx-dv__top"><span class="alx-dv__name">${esc(r.label)}</span><span class="alx-dv__num">${esc(by === "cost" ? fmtAed(r.t.cost, 0) : fmtNum(r.t.clicks))}<small>${(sh * 100).toFixed(1)}%</small></span></div><div class="alx-fn__track"><span class="alx-fn__bar" data-tone="accent" style="--w:${(sh * 100).toFixed(1)}%"></span></div></li>`;
        })
        .join("")}</ol>`
    : "";
  const cols: Col<NamedRow>[] = [{ label: title, html: (r) => named(r), v: (r) => r.label }, ...metricCols<NamedRow>((r) => r.t, impr)];
  return `${note ? `<p class="gad-note">${esc(note)}</p>` : ""}${bars}${table(id, title, cols, rows, { empty: "No data for this period." })}`;
}

const FIXED_30D = "Last 30 days from the Sheet (this tab doesn't follow the period picker).";

function tabBody(tab: TabKey, d: SheetData, period: Period, campaign: string, q: URLSearchParams): string {
  const tabRows = (name: keyof SheetData["tabs"]) => rowsOf(d.tabs[name]);
  const cut = (name: keyof SheetData["tabs"]) => inPeriod(tabRows(name), period.from, period.to, campaign);
  const camp = (rows: Row[]) => (campaign ? rows.filter((r) => str(r, "Campaign") === campaign) : rows);
  const missing = (name: keyof SheetData["tabs"]) => (d.tabs[name] ? "" : `<p class="gad-note">The ${esc(name)} tab isn't in the Sheet yet.</p>`);
  switch (tab) {
    case "adgroups":
      return missing("Perf_AdGroups_Daily") + table("gad-adgroups", "Ad groups", [{ label: "Ad group", html: (r) => named(r), v: (r) => r.label }, { label: "Status", html: (r) => pill(r.status), v: (r) => r.status }, ...metricCols<NamedRow>((r) => r.t)], adGroupRows(cut("Perf_AdGroups_Daily")), { empty: "No ad group data for this period." });
    case "keywords": {
      const rows = keywordRows(cut("Perf_Keywords_Daily"), tabRows("Setup_Keywords"));
      return `<p class="gad-note">Last 90 days are kept. "Spend, no conv." = cost of AED 50 or more and no conversion in the period.</p>${missing("Perf_Keywords_Daily")}${table<KeywordRow>(
        "gad-keywords",
        "Keywords",
        [
          { label: "Keyword", html: (r) => `<span class="alx-name">${esc(r.keyword)} <span class="gad-match">${esc(pretty(r.match))}</span>${where(r.campaign, r.adGroup)}${r.flag ? FLAG : ""}</span>`, v: (r) => r.keyword },
          ...metricCols<KeywordRow>((r) => r.t),
          share("Impr. share", (r) => imprShare(r.t)),
          { label: "QS", html: (r) => (r.qs == null ? DASH : `<b class="gad-qs" data-tone="${r.qs >= 7 ? "good" : r.qs >= 5 ? "warn" : "bad"}">${r.qs}</b>`), v: (r) => r.qs },
          { label: "Exp. CTR", html: (r) => pill(r.expCtr), v: (r) => r.expCtr },
          { label: "Ad relevance", html: (r) => pill(r.adRelevance), v: (r) => r.adRelevance },
          { label: "Landing page", html: (r) => pill(r.landingPage), v: (r) => r.landingPage },
        ],
        rows,
        { empty: "No keyword data for this period.", rowAttr: (r) => (r.flag ? ' class="gad-flagged"' : "") },
      )}`;
    }
    case "terms":
      return `<p class="gad-note">Last 90 days are kept. Same "Spend, no conv." rule as keywords.</p>${missing("Perf_SearchTerms_Daily")}${table<TermRow>(
        "gad-terms",
        "Search terms",
        [
          { label: "Search term", html: (r) => `<span class="alx-name">${esc(r.term)}${where(r.campaign, r.adGroup)}${r.flag ? FLAG : ""}</span>`, v: (r) => r.term },
          text("Matched keyword", (r) => r.matched),
          { label: "Added / excluded", html: (r) => (r.added && !/^none$/i.test(r.added) ? pill(r.added) : DASH), v: (r) => r.added },
          ...metricCols<TermRow>((r) => r.t),
        ],
        searchTermRows(cut("Perf_SearchTerms_Daily")),
        { empty: "No search terms for this period.", rowAttr: (r) => (r.flag ? ' class="gad-flagged"' : "") },
      )}`;
    case "ads": {
      const url = (u: string) => (/^https?:\/\//i.test(u) ? `<a class="gad-url" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(u.replace(/^https?:\/\//, ""))}</a>` : esc(u || DASH));
      const perf = d.tabs.Perf_Ads_Daily ? "" : `<p class="gad-note">Period metrics need a Perf_Ads_Daily tab (Date, Ad ID, Impr., Clicks, Cost (AED), Conversions); it isn't in the Sheet yet.</p>`;
      return perf + missing("Setup_Ads") + table<AdRow>(
        "gad-ads",
        "Ads",
        [
          { label: "Ad", html: (r) => `<span class="alx-name">${esc(pretty(str(r.setup, "Ad type")))} <small class="gad-muted">#${esc(str(r.setup, "Ad ID"))}</small>${where(str(r.setup, "Campaign"), str(r.setup, "Ad group"))}</span>`, v: (r) => str(r.setup, "Ad group") },
          { label: "Status", html: (r) => pill(str(r.setup, "Ad status")), v: (r) => str(r.setup, "Ad status") },
          { label: "Ad strength", html: (r) => pill(str(r.setup, "Ad strength")), v: (r) => str(r.setup, "Ad strength") },
          { label: "Approval", html: (r) => pill(str(r.setup, "Ad approval")), v: (r) => str(r.setup, "Ad approval") },
          { label: "Final URL", html: (r) => `${url(str(r.setup, "Final URL"))}${str(r.setup, "Path 1") || str(r.setup, "Path 2") ? `<small class="alx-path">/${esc([str(r.setup, "Path 1"), str(r.setup, "Path 2")].filter(Boolean).join("/"))}</small>` : ""}`, v: (r) => str(r.setup, "Final URL") },
          ...metricCols<AdRow>((r) => r.t),
        ],
        adRows(tabRows("Setup_Ads"), cut("Perf_Ads_Daily"), campaign),
        { empty: "No ads in the Sheet." },
      );
    }
    case "conversions":
      return missing("Perf_Conversions_Daily") + table<NamedRow>(
        "gad-conv",
        "Conversions",
        [
          { label: "Conversion action", html: (r) => named(r), v: (r) => r.label },
          text("Category", (r) => pretty(r.status)),
          count("Conversions", (r) => r.t.conv),
          count("All conv.", (r) => r.t.allConv),
        ],
        conversionRows(cut("Perf_Conversions_Daily")),
        { empty: "No conversions in this period." },
      );
    case "devices":
      return missing("Perf_Devices_Daily") + segmentCard("gad-devices", "Device", segmentRows(cut("Perf_Devices_Daily"), "Device"), "");
    case "networks":
      return missing("Perf_Channels_Daily") + segmentCard("gad-networks", "Network", segmentRows(cut("Perf_Channels_Daily"), "Network"), "");
    case "locations":
      return missing("Perf_Locations_30d") + segmentCard("gad-locations", "City", segmentRows(camp(tabRows("Perf_Locations_30d")), "City"), FIXED_30D);
    case "ages":
      return missing("Perf_Ages_30d") + segmentCard("gad-ages", "Age range", segmentRows(camp(tabRows("Perf_Ages_30d")), "Age range"), FIXED_30D, false);
    case "audiences":
      return missing("Perf_Audiences_30d") + segmentCard("gad-audiences", "Audience", segmentRows(camp(tabRows("Perf_Audiences_30d")), "Name"), FIXED_30D, false);
    case "assets": {
      const rows = camp(tabRows("Perf_CampaignAssets_30d"));
      return `<p class="gad-note">${esc(FIXED_30D)}</p>${missing("Perf_CampaignAssets_30d")}${table<Row>(
        "gad-assets",
        "Sitelinks and callouts",
        [
          { label: "Asset", html: (r) => `<span class="alx-name">${esc(str(r, "Sitelink text") || str(r, "Callout") || DASH)}<small class="alx-path">${esc(str(r, "Campaign"))}</small></span>`, v: (r) => str(r, "Sitelink text") || str(r, "Callout") },
          text("Slot", (r) => pretty(str(r, "Asset slot"))),
          count("Impr.", (r) => (r["Impr."] === "" || r["Impr."] == null ? null : Number(r["Impr."]) || 0)),
          count("Clicks", (r) => (r.Clicks === "" || r.Clicks == null ? null : Number(r.Clicks) || 0)),
        ],
        rows,
        { empty: "No sitelinks or callouts in the Sheet." },
      )}`;
    }
    case "changes":
      return changes(d, campaign, q);
  }
}

function changes(d: SheetData, campaign: string, q: URLSearchParams) {
  const log = rowsOf(d.tabs.Change_Log_30d)
    .filter((r) => !campaign || str(r, "Campaign") === campaign)
    .sort((a, b) => stampOf(b["Changed at"]).localeCompare(stampOf(a["Changed at"])));
  const list = table<Row>(
    "gad-changes",
    "Change log",
    [
      { label: "Changed at", html: (r) => `<span class="alx-name">${esc(stampOf(r["Changed at"]))}<small class="alx-path">${esc([str(r, "Changed by"), str(r, "Changed from")].filter(Boolean).join(" · "))}</small></span>`, v: (r) => stampOf(r["Changed at"]) },
      text("What changed", (r) => pretty(str(r, "What changed"))),
      text("Action", (r) => pretty(str(r, "Action"))),
      text("Fields changed", (r) => str(r, "Fields changed")),
      { label: "Where", html: (r) => esc([str(r, "Campaign"), str(r, "Ad group")].filter(Boolean).join(" · ") || DASH), v: (r) => str(r, "Campaign") },
    ],
    log,
    { empty: "No changes in the last 30 days." },
  );
  const hist = rowsOf(d.tabs.Setup_History);
  const ents = historyEntities(campaign ? hist.filter((r) => str(r, "Campaign") === campaign || str(r, "Name") === campaign) : hist);
  const pick = ents.find((e) => e.id === q.get("hist")) ?? ents[0];
  const steps = pick ? historySteps(hist, pick.id) : [];
  const keep = ["view", "range", "from", "to", "compare", "campaign", "tab"].map((k) => (q.get(k) ? `<input type="hidden" name="${k}" value="${esc(q.get(k))}">` : "")).join("");
  const timeline = steps.length
    ? `<ol class="gad-timeline">${steps
        .map(
          (s) => `<li><p class="gad-timeline__at">${esc(s.at || DASH)}</p><dl>${s.lines.map(([k, v, ch]) => `<div${ch ? ' class="is-changed"' : ""}><dt>${esc(k)}</dt><dd>${esc(v)}${ch ? '<span class="lr-sr"> (changed)</span>' : ""}</dd></div>`).join("")}${s.removed.map((k) => `<div class="is-changed"><dt>${esc(k)}</dt><dd>(removed)</dd></div>`).join("")}</dl></li>`,
        )
        .join("")}</ol>`
    : `<p class="gad-note">No settings history${d.tabs.Setup_History ? "" : " (the Setup_History tab isn't in the Sheet yet)"}.</p>`;
  return `${list}
    <div class="gad-hist">
      <h3 class="alx-split__title">Settings history</h3>
      ${ents.length ? `<form method="get" action="" class="gad-hist__pick">${keep}<label class="lr-field"><span class="lr-field__label">Campaign or ad</span>
        <select class="lr-select" name="hist" data-autosubmit>${ents.map((e) => `<option value="${esc(e.id)}"${e.id === pick?.id ? " selected" : ""}>${esc(e.label)}</option>`).join("")}</select></label>
        <noscript><button class="lr-btn" type="submit">Show</button></noscript></form>` : ""}
      <p class="gad-muted">Newest first. Highlighted lines changed since the record before.</p>
      ${timeline}
    </div>`;
}

/* ---------- Whole page ---------- */

export type GoogleAdsState =
  | { kind: "off" | "error"; query: URLSearchParams; today: string }
  | { kind: "ok"; query: URLSearchParams; today: string; data: SheetData; stale: boolean; note: string };

const NOTES: Record<string, string> = {
  done: "Refreshed from the Sheet just now.",
  wait: "Refresh can be used once every 2 minutes. Showing the latest copy.",
  failed: "Data could not be refreshed. Showing the last copy read.",
};

function controls(q: URLSearchParams, period: Period, today: string) {
  const chips = PERIODS.map(([k, l]) => `<a class="lr-chip lr-glass" href="${esc(href(q, { range: k, from: null, to: null, refresh: null, note: null }))}"${period.key === k ? ' aria-current="page"' : ""} data-nav>${l}</a>`).join("");
  const custom = period.key === "custom";
  const keep = ["campaign", "compare", "tab"].map((k) => (q.get(k) ? `<input type="hidden" name="${k}" value="${esc(q.get(k))}">` : "")).join("");
  return `<div class="lr-controls">
      ${viewSwitch(q, "", "google-ads")}
      <nav class="lr-range" aria-label="Period">
        <div class="lr-range__chips">${chips}
          <button type="button" class="lr-chip lr-glass" aria-expanded="${period.error ? "true" : "false"}" aria-controls="alx-custom"${custom ? ' aria-current="page"' : ""}>${custom ? `Custom: ${esc(span(period.from, period.to))}` : "Custom range"}${icon("chevron")}</button>
        </div>
        <form class="lr-custom lr-glass alx-custom" id="alx-custom" method="get" action=""${period.error ? "" : " hidden"} aria-label="Custom range">
          <input type="hidden" name="view" value="google-ads">${keep}
          <label class="lr-field"><span class="lr-field__label">From</span><input class="lr-input" type="date" name="from" value="${esc(period.from)}" max="${esc(today)}" required></label>
          <label class="lr-field"><span class="lr-field__label">To</span><input class="lr-input" type="date" name="to" value="${esc(period.to)}" max="${esc(today)}" required></label>
          <p class="lr-custom__err" role="alert">${esc(period.error)}</p>
          <div class="lr-custom__actions"><button type="button" class="lr-btn-ghost" data-action="custom-cancel">Cancel</button><button type="submit" class="lr-btn">Apply</button></div>
        </form>
      </nav>
    </div>`;
}

function pageHead(q: URLSearchParams, updated: string, fresh: Fresh) {
  return `<section class="lr-card gad-head" aria-label="Report status">
      <div><h1 class="gad-title">Google Ads</h1><p class="gad-muted">Best Solution Management Services</p></div>
      <div class="gad-head__right">
        <span class="gad-fresh" data-tone="${fresh}"><span class="lr-dot" aria-hidden="true"></span>${esc(FRESH_TEXT[fresh])}</span>
        <span class="gad-muted">${updated ? `Updated ${esc(updated)} Dubai` : "Update time not in the Sheet"}</span>
        <a class="lr-btn-ghost gad-refresh" href="${esc(href(q, { refresh: "1", note: null }))}" data-nav>${icon("refresh")}Refresh</a>
      </div>
    </section>`;
}

export function googleAdsHtml(state: GoogleAdsState): string {
  const q = state.query;
  let body: string;
  let updatedShort = "";
  if (state.kind !== "ok") {
    const off = state.kind === "off";
    body = `<h1 class="lr-sr">Lead Insights: Google Ads</h1>
      <div class="lr-controls">${viewSwitch(q, "", "google-ads")}</div>
      <section class="lr-card alx-error gad-card" role="${off ? "status" : "alert"}">
        <h2 class="lr-empty__title">${icon(off ? "link" : "alert")}${off ? "Google Ads data not connected" : "Couldn't read the Google Ads Sheet"}</h2>
        <p class="lr-empty__lead">${off ? "Add ADS_REPORT_SHEET_ID, GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY to this deployment, share the Sheet with the service account (Viewer), then redeploy." : "Google didn't answer and there's no earlier copy to show. Try again in a minute."}</p>
        ${off ? "" : `<a class="lr-btn-ghost" href="${esc(href(q, { refresh: null, note: null }))}" data-nav>${icon("refresh")}Try again</a>`}
      </section>`;
  } else {
    const d = state.data;
    const status = statusOf(d.tabs._Status);
    const updated = stampOf(status.get("updated"));
    updatedShort = updated.slice(11, 16) || updated;
    const fresh = freshness(stampMs(updated), Date.now());
    const campaign = q.get("campaign") ?? "";
    const perfAll = rowsOf(d.tabs.Perf_Campaigns_Daily);
    const start = perfAll.reduce((m, r) => { const x = dateOf(r.Date); return x && (!m || x < m) ? x : m; }, "");
    const period = pickPeriod(q, state.today, start);
    const compare = q.get("compare") !== "off";
    const cur = inPeriod(perfAll, period.from, period.to, campaign);
    const t = totals(cur);
    const p = compare ? totals(inPeriod(perfAll, period.prevFrom, period.prevTo, campaign)) : null;
    const prevWords = span(period.prevFrom, period.prevTo);
    const camps = campaignRows(cur, rowsOf(d.tabs.Setup_Campaigns), campaign);
    const tab = (TABS.find(([k]) => k === q.get("tab"))?.[0] ?? "adgroups") as TabKey;
    const banner = state.stale || state.note === "failed"
      ? `<p class="gad-banner" role="alert">${icon("alert")}Data could not be refreshed. Showing the copy read ${esc(minutesAgo(d.fetchedAt))}.</p>`
      : NOTES[state.note] ? `<p class="gad-banner" data-tone="info" role="status">${icon("info")}${esc(NOTES[state.note])}</p>` : "";
    const campCols: Col<(typeof camps)[number]>[] = [
      { label: "Campaign", html: (r) => `<a class="gad-camp" href="${esc(href(q, { campaign: campaign === r.name ? null : r.name, refresh: null, note: null }))}" data-nav>${esc(r.name || r.id)}</a>`, v: (r) => r.name },
      { label: "Status now", html: (r) => pill(r.status), v: (r) => r.status },
      text("Type", (r) => pretty(r.type)),
      money("Daily budget", (r) => r.budget, 0),
      { label: "Bidding", html: (r) => `${esc(r.bidding ? pretty(r.bidding) : DASH)}${r.maxCpc ? `<small class="alx-path">Max CPC ${esc(fmtAed(r.maxCpc))}</small>` : ""}`, v: (r) => r.bidding },
      money("Cost", (r) => r.t.cost),
      count("Clicks", (r) => r.t.clicks),
      money("Avg CPC", (r) => cpc(r.t)),
      count("Conv.", (r) => r.t.conv),
      money("Cost / conv.", (r) => cpa(r.t)),
      share("Lost IS (budget)", (r) => lostBudget(r.t)),
    ];
    const filterChip = campaign
      ? `<p class="gad-filter">Showing one campaign: <b>${esc(campaign)}</b> <a class="lr-chip lr-glass" href="${esc(href(q, { campaign: null, hist: null, refresh: null, note: null }))}" data-nav>${icon("x")}Show all campaigns</a></p>`
      : "";
    const compareToggle = `<a class="lr-chip lr-glass alx-toggle" href="${esc(href(q, { compare: compare ? "off" : null, refresh: null, note: null }))}" role="switch" aria-checked="${compare}" data-nav><span class="alx-toggle__track" aria-hidden="true"></span>Compare with ${esc(prevWords)}</a>`;
    const tabs = `<nav class="lr-bd__tabs gad-tabs" aria-label="Details">${TABS.map(([k, l]) => `<a class="lr-bd__tab" href="${esc(href(q, { tab: k, hist: null, refresh: null, note: null }))}"${k === tab ? ' aria-current="true"' : ""} data-nav>${esc(l)}</a>`).join("")}</nav>`;
    const s = (k: string) => { const v = status.get(k); return v == null || v === "" ? DASH : stampOf(v); };
    body = `${pageHead(q, updated, fresh)}
      ${banner}
      ${alertsStrip(d.tabs.Alerts)}
      ${controls(q, period, state.today)}
      <div class="alx-bar"><div class="alx-bar__text"><p class="alx-period gad-period">${esc(PERIOD_NAME(period))} · ${esc(span(period.from, period.to))}${period.to === state.today ? " · today is partial" : ""}</p>${filterChip}</div><div class="alx-tools__row">${compareToggle}</div></div>
      <main class="lr-view lr-bento alx-view gad-view" id="alx-view">
        ${kpis(t, p, prevWords)}
        ${trend(cur, period, state.today)}
        ${card("gad-camps", "Campaigns", "Status now, budget and bidding are today's settings (Setup_Campaigns); the numbers are for the period. Greyed: not enabled now. Click a campaign to filter the whole page to it.", table("gad-campaigns", "Campaigns", campCols, camps, { empty: "No campaigns in the Sheet.", rowAttr: (r) => (r.inactive ? ' class="gad-inactive"' : "") + (r.name === campaign ? ' aria-current="true"' : "") }))}
        <section class="lr-card gad-card" aria-label="Details">${tabs}${tabBody(tab, d, period, campaign, q)}</section>
      </main>
      <footer class="alx-foot gad-foot">
        <p>Data from ${esc(s("data from"))} · Script ${esc(s("script version"))} · Ad approval data: ${esc(s("ad approval data"))}</p>
        <p>${icon("info")}Google may update conversions for several days.</p>
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
${topbar(false, updatedShort || "–", q, "google-ads")}
<div class="lr-page"><div class="lr-main alx gad">
${body}
</div></div>
<script>${SCRIPT}</script>
<script>${GAD_SCRIPT}</script>
</body>
</html>`;
}

const PERIOD_NAME = (p: Period) => (p.key === "custom" ? "Custom range" : PERIODS.find(([k]) => k === p.key)![1]);
const minutesAgo = (ms: number) => {
  const m = Math.round((Date.now() - ms) / 60_000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
};

/* ---------- View-only styles (gad-*), from the dashboard's tokens ---------- */

const GAD_CSS = `
.gad > .gad-head, .gad > .gad-banner, .gad > .gad-alerts { grid-column: 1 / -1; }
.gad-view > .gad-card { grid-column: 1 / -1; }
.gad-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--s3); }
.gad-title { font: 800 28px/1.1 var(--font); letter-spacing: -.02em; }
.gad-head__right { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s2) var(--s3); }
.gad-muted { color: var(--muted); font: 500 var(--fs-small)/var(--lh-small) var(--font); }
.gad-fresh { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; font: 700 12px/1.5 var(--font); color: var(--c); background: color-mix(in srgb, var(--c) 13%, transparent); }
.gad-fresh .lr-dot { background: var(--c); }
[data-tone="good"] { --c: #0e8a5f; } [data-tone="warn"] { --c: #b26a00; } [data-tone="bad"] { --c: #c0392b; } [data-tone="neutral"], [data-tone="unknown"] { --c: var(--muted); }
.gad-refresh { text-decoration: none; }
.gad-banner { display: flex; align-items: center; gap: var(--s2); padding: 12px var(--s3); border-radius: var(--r-control); color: #8a2c20; background: #fdecea; border: 1px solid #f5c6c0; font: 600 var(--fs-small)/1.4 var(--font); }
.gad-banner[data-tone="info"] { color: var(--text); background: var(--surface); border-color: var(--line-strong); }
.gad-alerts ul { list-style: none; display: flex; flex-wrap: wrap; gap: var(--s2); }
.gad-alerts .gad-muted { margin-top: 6px; }
.gad-alert { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; padding: 6px 12px; border-radius: 999px; color: #8a4b00; background: #fff4e0; border: 1px solid #f3d6a6; font: 500 var(--fs-small)/1.35 var(--font); }
.gad-alert[data-tone="good"] { color: #0e6b4a; background: #e6f6ef; border-color: #bfe6d4; }
.gad-alert span { overflow-wrap: anywhere; }
.gad-filter { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s2); font: 500 var(--fs-small)/1.4 var(--font); }
.gad-filter .lr-chip { text-decoration: none; }
@media (min-width: 1200px) { .gad .alx-bar .gad-period { display: block; } }
.gad-kpi__label { display: flex; align-items: center; gap: var(--s1); white-space: nowrap; letter-spacing: .06em; }
/* Six tiles in a row on laptops: the value scales down so "AED 12,345" stays inside its tile. */
.gad-kpi__value { font-size: clamp(22px, 2.1vw, var(--fs-kpi)); white-space: nowrap; }
@media (max-width: 1199px) { .gad-kpi__value { font-size: clamp(22px, 4.6vw, var(--fs-kpi)); } }
.gad-table .alx-path { display: block; }
.gad-table th, .gad-table td { padding: 10px 8px; }
.gad-table { font-size: 13.5px; }
.gad-table thead th { white-space: normal; }
.gad-table th[scope="row"] { min-width: 150px; }
.gad-pill { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px; font: 600 12px/1.5 var(--font); white-space: nowrap; color: var(--c); background: color-mix(in srgb, var(--c) 12%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 24%, transparent); }
.gad-flag { margin-top: 4px; width: fit-content; }
.gad-match { color: var(--muted); font: 600 11px/1 var(--font); text-transform: uppercase; letter-spacing: .04em; }
.gad-qs { color: var(--c); }
.gad-table tbody tr.gad-inactive > * { opacity: .55; }
.gad-table tbody tr[aria-current="true"] { box-shadow: inset 3px 0 0 var(--copper-hi); }
.gad-table tbody tr.gad-flagged { background: color-mix(in srgb, #c0392b 5%, transparent); }
.gad-table .gad-num { text-align: right; }
.gad-camp { color: var(--text); font-weight: 700; text-decoration: none; border-bottom: 1px dashed var(--line-strong); }
.gad-camp:hover { color: var(--copper-lo); }
.gad-url { color: var(--copper-lo); overflow-wrap: anywhere; white-space: normal; }
.gad-table td { white-space: nowrap; }
.gad-table td:has(.gad-url), .gad-table td:has(.alx-path) { white-space: normal; min-width: 160px; }
.gad-tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s2) var(--s3); margin-bottom: var(--s3); }
.gad-search { flex: 1 1 220px; max-width: 360px; }
.gad-search .lr-input { width: 100%; min-height: 40px; }
.gad-count { color: var(--muted); font: 600 12px/1 var(--font); }
.gad-scroll { max-height: 640px; overflow: auto; }
.gad-note { margin-bottom: var(--s3); color: var(--muted); font: 500 var(--fs-small)/var(--lh-small) var(--font); }
.gad-tabs { margin-bottom: var(--s4); }
.lr-bd__tab { text-decoration: none; }
.lr-bd__tab[aria-current="true"], .lr-bd__tab[aria-pressed="true"] { color: var(--text); background: linear-gradient(180deg, #fff, #f8f4f0); box-shadow: inset 0 1px 0 #fff, 0 6px 16px -8px rgba(20,37,62,.35); }
.gad-bars { margin: 0 0 var(--s4); max-width: 640px; }
.gad-chart__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--s2); }
.gad-toggle { margin: 0; }
.gad-toggle .lr-bd__tab { min-height: 32px; }
.gad-plot { padding-right: 30px; }
.gad-seg { border-radius: 4px 4px 0 0; --c: var(--copper-hi); }
.gad-chart[data-bars="cost"] [data-m="clicks"], .gad-chart[data-bars="clicks"] [data-m="cost"] { display: none; }
.gad-grid[data-side="r"] { border-top: 0; }
.gad-grid[data-side="r"] span { right: auto; left: calc(100% + 6px); }
.gad-key-bar::before { background: var(--copper-hi); }
.gad-hist { margin-top: var(--s5); padding-top: var(--s4); border-top: 1px solid var(--line); display: grid; gap: var(--s3); }
.gad-hist__pick { max-width: 520px; }
.gad-hist__pick .lr-select { width: 100%; }
.gad-timeline { list-style: none; display: grid; gap: var(--s3); border-left: 2px solid var(--line-strong); padding-left: var(--s3); }
.gad-timeline li { position: relative; }
.gad-timeline li::before { content: ""; position: absolute; left: calc(-1 * var(--s3) - 6px); top: 4px; width: 10px; height: 10px; border-radius: 50%; background: var(--copper-hi); }
.gad-timeline__at { font: 700 var(--fs-small)/1.3 var(--font); margin-bottom: 6px; }
.gad-timeline dl { display: grid; gap: 2px; font: 500 var(--fs-small)/1.4 var(--font); }
.gad-timeline dl > div { display: grid; grid-template-columns: minmax(120px, 34%) 1fr; gap: var(--s2); padding: 2px 6px; border-radius: 6px; }
.gad-timeline dt { color: var(--muted); overflow-wrap: anywhere; }
.gad-timeline dd { overflow-wrap: anywhere; }
.gad-timeline .is-changed { background: #fff4e0; box-shadow: inset 3px 0 0 #b26a00; }
.gad-timeline .is-changed dd { font-weight: 700; }
.gad-foot { grid-column: 1 / -1; }
@media (max-width: 767px) {
  .gad-title { font-size: 24px; }
  /* Eight periods don't fit the phone chip row the other views size for five: they wrap. */
  .gad .lr-range__chips { flex-wrap: wrap; }
  .gad .lr-range__chips .lr-chip { flex: 1 1 auto; padding: 0 8px; }
  .gad-scroll { max-height: none; overflow: visible; }
  .gad-table td { font-size: 13px; white-space: normal; overflow-wrap: anywhere; }
  .gad-table th[scope="row"] { min-width: 0; }
  .gad-table tr.gad-flagged { background: color-mix(in srgb, #c0392b 5%, transparent); }
  .gad-timeline dl > div { grid-template-columns: 1fr; gap: 0; }
}
`;

/* ---------- View-only script: table sort, search and CSV; chart bars toggle; history picker ---------- */

const GAD_SCRIPT = `(() => {
  "use strict";
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rowsOf = (t) => $$("tr", t.tBodies[0]).filter((r) => !r.classList.contains("gad-none-row"));
  $$(".gad-table").forEach((t) => $$(".alx-sort", t).forEach((b) => b.addEventListener("click", () => {
    const th = b.closest("th"), col = +b.dataset.col, desc = th.getAttribute("aria-sort") !== "descending";
    $$("th", t.tHead).forEach((h) => h.removeAttribute("aria-sort")); th.setAttribute("aria-sort", desc ? "descending" : "ascending");
    const key = (tr) => { const c = tr.cells[col], v = c && c.dataset.v; if (v == null) return null; const n = Number(v); return v !== "" && !isNaN(n) ? n : v.toLowerCase(); };
    const rows = rowsOf(t);
    rows.sort((a, z) => { const x = key(a), y = key(z); if (x == null) return 1; if (y == null) return -1; const d = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y)); return desc ? -d : d; });
    rows.forEach((r) => t.tBodies[0].appendChild(r));
  })));
  $$("[data-search]").forEach((i) => i.addEventListener("input", () => {
    const t = document.getElementById(i.dataset.search), q = i.value.trim().toLowerCase();
    let n = 0; rowsOf(t).forEach((r) => { const hit = !q || r.textContent.toLowerCase().includes(q); r.hidden = !hit; n += hit; });
    const c = document.querySelector('[data-count="' + i.dataset.search + '"]'); if (c) c.textContent = n + " rows";
  }));
  const cell = (s) => { s = s.replace(/\\s+/g, " ").trim(); return /[",\\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  $$("[data-csv]").forEach((b) => b.addEventListener("click", () => {
    const t = document.getElementById(b.dataset.csv);
    const head = $$("th", t.tHead).map((h) => cell(h.textContent));
    const body = rowsOf(t).filter((r) => !r.hidden).map((r) => [...r.cells].map((c) => cell(c.textContent)).join(","));
    const blob = new Blob(["\\ufeff" + [head.join(","), ...body].join("\\n") + "\\n"], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "google-ads-" + b.dataset.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".csv"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }));
  $$(".gad-chart [data-bars]").forEach((b) => b.tagName === "BUTTON" && b.addEventListener("click", () => {
    const c = b.closest(".gad-chart"); c.dataset.bars = b.dataset.bars;
    $$("button[data-bars]", c).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  }));
  $$("[data-autosubmit]").forEach((s) => s.addEventListener("change", () => { document.querySelector(".alx").classList.add("is-loading"); s.form.submit(); }));
})();`;
