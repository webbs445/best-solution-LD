import type { ReportLead } from "@/lib/erp";
import { ADS_LEAD_CONVERSION, exclusionReason, uaeNow } from "@/lib/adsExport";

/*
  The team's Google Ads lead dashboard (/ads-report, same password as the CSV): every new lead from a Google ad since
  REPORT_START, by campaign, keyword, ad and page, with its ERP status, so nobody has to open the ERP to see what the ads
  bring in. Lead numbers, tracking fields and statuses only; never a name, phone or email. A whole HTML page, so it
  needs nothing from the site's layout or consent scripts.
*/

/** The dashboard counts new leads from this UAE date on; earlier leads are history and stay in the ERP. */
export const REPORT_START = "2026-10-12";

const JUNK = new Set(["Junk", "Duplicate Lead"]);
const WON = new Set(["Interested", "Opportunity", "Quotation", "Converted"]);
const tone = (status: string) => (JUNK.has(status) ? "bad" : WON.has(status) ? "good" : "open");

/** A Google ad click: a Google click ID on the lead, or Google as the UTM source. */
export function isGoogleAdsLead(l: ReportLead): boolean {
  const why = exclusionReason(l);
  return why === null || why.startsWith("Marked") || /google/i.test(`${l.custom_platform ?? ""} ${l.source ?? ""}`);
}

const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-12" as "12 Oct 2026". */
function day(d: string): string {
  const [y, m, dd] = d.split("-").map(Number);
  return `${dd} ${MONTHS[m - 1] ?? ""} ${y}`;
}

/** "2026-10-12 12:04:04.123" (UAE) as "12 Oct, 12:04". */
function when(creation: string): string {
  return `${day(creation.slice(0, 10)).replace(/ \d{4}$/, "")}, ${creation.slice(11, 16)}`;
}

const val = (v: string | undefined) => v?.trim() || "";
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

/** Counts per value of one field, biggest first, with how many of them are junk or duplicates. */
function groupBy(leads: ReportLead[], pick: (l: ReportLead) => string, none: string) {
  const m = new Map<string, { n: number; junk: number }>();
  for (const l of leads) {
    const k = pick(l) || none;
    const g = m.get(k) ?? { n: 0, junk: 0 };
    g.n++;
    if (JUNK.has(l.status)) g.junk++;
    m.set(k, g);
  }
  return [...m].sort((a, b) => b[1].n - a[1].n);
}

/** A ranked leaderboard: each row's bar is split into real leads and junk, against the top row. */
function board(title: string, tag: string, leads: ReportLead[], pick: (l: ReportLead) => string, none: string): string {
  const groups = groupBy(leads, pick, none).slice(0, 6);
  const max = groups[0]?.[1].n ?? 1;
  const rows = groups.length
    ? groups
        .map(
          ([k, g], i) => `<li>
            <i class="rk">${i + 1}</i>
            <div class="bd">
              <div class="bl"><span title="${esc(k)}">${esc(k)}</span><b>${g.n}</b></div>
              <div class="bar" style="--w:${Math.max(6, (g.n / max) * 100)}%"><span class="real" style="flex:${g.n - g.junk}"></span><span class="junk" style="flex:${g.junk}"></span></div>
              <small>${pct(g.n - g.junk, g.n)}% real${g.junk ? ` · ${g.junk} junk` : ""}</small>
            </div>
          </li>`,
        )
        .join("")
    : `<li class="none">Waiting for leads</li>`;
  return `<section class="glass board"><header><h3>${esc(title)}</h3><code>${esc(tag)}</code></header><ol>${rows}</ol></section>`;
}

/** Leads per day for the last 14 days (or since REPORT_START), as an SVG area chart. */
function trend(leads: ReportLead[], today: string): string {
  const days: string[] = [];
  for (let t = Date.parse(`${today}T00:00:00Z`), i = 0; i < 14; i++, t -= 86_400_000) {
    const d = new Date(t).toISOString().slice(0, 10);
    if (d < REPORT_START) break;
    days.unshift(d);
  }
  const counts = days.map((d) => leads.filter((l) => l.creation.startsWith(d)).length);
  const max = Math.max(1, ...counts);
  const W = 1000, H = 220, top = 30;
  const pts = counts.map((c, i) => [days.length > 1 ? (i / (days.length - 1)) * W : 0, H - (c / max) * (H - top)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = pts.length > 1 ? `${line} L${W},${H} L0,${H} Z` : "";
  const dots = pts
    .map(([x, y], i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5"><title>${esc(day(days[i]))}: ${counts[i]}</title></circle>${counts[i] ? `<text x="${x.toFixed(1)}" y="${(y - 14).toFixed(1)}">${counts[i]}</text>` : ""}`)
    .join("");
  const labels = days.map((d) => `<span>${esc(day(d).split(" ").slice(0, 2).join(" "))}</span>`).join("");
  return `<section class="glass trend">
    <header><h3>Leads per day</h3><code>UAE time</code></header>
    <svg viewBox="-12 0 ${W + 24} ${H + 4}" preserveAspectRatio="none" aria-label="Leads per day">
      <defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0a283" stop-opacity=".45"/><stop offset="1" stop-color="#e0a283" stop-opacity="0"/></linearGradient></defs>
      ${[0.25, 0.5, 0.75].map((f) => `<line x1="0" x2="${W}" y1="${H * f}" y2="${H * f}"/>`).join("")}
      ${area ? `<path class="area" d="${area}"/><path class="line" d="${line}"/>` : ""}${dots}
    </svg>
    <div class="days">${labels}</div>
  </section>`;
}

export function adsReportHtml(all: ReportLead[], now = uaeNow()): string {
  const leads = all
    .filter((l) => l.creation >= REPORT_START && isGoogleAdsLead(l))
    .sort((a, b) => b.creation.localeCompare(a.creation));
  const today = now.slice(0, 10);
  const weekAgo = new Date(Date.parse(`${today}T00:00:00Z`) - 6 * 86_400_000).toISOString().slice(0, 10);
  const sent = leads.filter((l) => exclusionReason(l) === null).length;
  const junk = leads.filter((l) => JUNK.has(l.status)).length;
  const won = leads.filter((l) => tone(l.status) === "good").length;
  const real = leads.length - junk;
  const realPct = pct(real, leads.length);
  const topCampaign = groupBy(leads, (l) => val(l.custom_campaign), "")[0];

  const kpis = [
    ["Today", String(leads.filter((l) => l.creation.startsWith(today)).length), leads[0] ? `Latest ${when(leads[0].creation)}` : "None yet"],
    ["Last 7 days", String(leads.filter((l) => l.creation.slice(0, 10) >= weekAgo).length), "Including today"],
    ["Interested or better", String(won), "Interested, Opportunity, Quotation, Converted"],
    ["Sent to Google", String(sent), `As “${ADS_LEAD_CONVERSION}”`],
  ]
    .map(([k, v, s], i) => `<div class="glass kpi" style="--i:${i + 1}"><span class="k">${esc(k)}</span><b>${esc(v)}</b><small>${esc(s)}</small></div>`)
    .join("");

  const feed = leads.length
    ? `<div class="glass feed">
        <header><h3>Lead feed</h3><input id="q" type="search" placeholder="Filter by campaign, keyword, status…" aria-label="Filter leads"></header>
        <div class="tbl" role="table" aria-label="Google Ads leads">
          <div class="tr th" role="row"><span role="columnheader">Lead</span><span role="columnheader">Received</span><span role="columnheader">Campaign</span><span role="columnheader">Keyword / ad group</span><span role="columnheader">Ad</span><span role="columnheader">Page / form</span><span role="columnheader">Status</span></div>
          ${leads
            .map(
              (l) => `<div class="tr" role="row">
              <span role="cell" data-l="Lead"><b>${esc(l.name)}</b>${exclusionReason(l) === null ? `<em class="g" title="Imported to Google Ads">G</em>` : ""}</span>
              <span role="cell" data-l="Received">${esc(when(l.creation))}</span>
              <span role="cell" data-l="Campaign">${esc(val(l.custom_campaign) || "–")}</span>
              <span role="cell" data-l="Keyword">${esc(val(l.custom_ad_set_name) || "–")}</span>
              <span role="cell" data-l="Ad">${esc(val(l.custom_ad_name) || "–")}</span>
              <span role="cell" data-l="Page / form">${esc(val(l.custom_form_name) || "–")}</span>
              <span role="cell" data-l="Status"><em class="st ${tone(l.status)}">${esc(l.status || "–")}</em></span>
            </div>`,
            )
            .join("")}
        </div>
        <p class="nomatch" hidden>No lead matches that filter.</p>
      </div>`
    : `<div class="glass empty">
        <span class="radar" aria-hidden="true"></span>
        <div>
          <b>Listening for the first Google Ads lead</b>
          <p>New leads from Google ads appear here the moment they reach the ERP. The page refreshes itself every 5 minutes.</p>
          <ul>
            <li>Keep <b>auto-tagging</b> on in Google Ads (Admin, Account settings), so every ad click carries a click ID.</li>
            <li>To see campaign, keyword and ad names, add UTM tags to the ads’ final URL suffix.</li>
          </ul>
        </div>
      </div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="dark">
<meta http-equiv="refresh" content="300">
<title>Google Ads Leads</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#060b16;--glass:rgba(255,255,255,.045);--edge:rgba(255,255,255,.09);--text:#eef2f8;--soft:#8d9ab0;--copper:#e0a283;--deep:#b8714f;--good:#3ddc97;--open:#7ba7ff;--bad:#ff7a8a}
*{box-sizing:border-box;margin:0;padding:0}
html{background:var(--bg)}
body{min-height:100vh;color:var(--text);font:14.5px/1.5 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;
  background:radial-gradient(900px 520px at 8% -8%,rgba(224,162,131,.20),transparent 60%),radial-gradient(800px 600px at 105% 30%,rgba(70,110,220,.18),transparent 60%),var(--bg);background-attachment:fixed}
body::before{content:"";position:fixed;inset:0;z-index:-1;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(ellipse at top,#000 20%,transparent 75%)}
.wrap{max-width:1240px;margin:0 auto;padding:22px 22px 60px}
@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes ping{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.6);opacity:0}}
@keyframes sweep{to{transform:rotate(360deg)}}
@keyframes draw{from{stroke-dashoffset:1600}to{stroke-dashoffset:0}}
.glass{position:relative;border:1px solid var(--edge);border-radius:24px;background:var(--glass);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 24px 60px rgba(0,0,0,.35);animation:rise .6s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*70ms)}
.top{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:22px}
.brand{display:flex;align-items:center;gap:12px}
.mark{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,var(--copper),#7a3f26);font:700 15px "Space Grotesk",sans-serif;box-shadow:0 10px 30px rgba(224,162,131,.35)}
.brand small{display:block;color:var(--copper);font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase}
.brand h1{font:700 22px/1.15 "Space Grotesk",sans-serif;letter-spacing:-.02em}
.live{display:flex;flex-wrap:wrap;gap:8px}
.chip{display:inline-flex;align-items:center;gap:8px;padding:7px 13px;border:1px solid var(--edge);border-radius:999px;background:var(--glass);color:#c9d3e2;font-size:12.5px;font-weight:600}
.dot{position:relative;width:8px;height:8px;border-radius:50%;background:var(--good)}
.dot::after{content:"";position:absolute;inset:0;border-radius:50%;background:var(--good);animation:ping 1.8s ease-out infinite}
.hero{display:grid;grid-template-columns:1.6fr 1fr;gap:16px}
.big{padding:28px;overflow:hidden}
.big::after{content:"";position:absolute;right:-90px;top:-90px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(224,162,131,.28),transparent 65%)}
.k{color:var(--soft);font-size:11.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.big .num{display:flex;align-items:baseline;gap:14px;margin-top:6px}
.big .num b{font:700 clamp(64px,9vw,104px)/.95 "Space Grotesk",sans-serif;letter-spacing:-.05em;background:linear-gradient(180deg,#fff,#f0c3a9);-webkit-background-clip:text;background-clip:text;color:transparent}
.big .num span{color:var(--soft);font-size:15px}
.big p{margin-top:14px;max-width:520px;color:#b3bfd1}
.big p b{color:var(--text)}
.ringbox{display:flex;align-items:center;gap:22px;padding:24px}
.ring{--p:${realPct};flex:none;position:relative;display:grid;place-items:center;width:150px;height:150px;border-radius:50%;background:conic-gradient(var(--good) calc(var(--p)*1%),${leads.length ? "var(--bad)" : "rgba(255,255,255,.08)"} 0)}
.ring::before{content:"";position:absolute;inset:13px;border-radius:50%;background:#0b1322;box-shadow:inset 0 0 30px rgba(0,0,0,.5)}
.ring div{position:relative;text-align:center}
.ring b{display:block;font:700 34px/1 "Space Grotesk",sans-serif}
.ring small{color:var(--soft);font-size:11.5px;font-weight:600}
.legend{list-style:none;display:grid;gap:10px;font-size:13.5px}
.legend li{display:flex;align-items:center;gap:9px}
.legend i{width:10px;height:10px;border-radius:3px}
.legend b{margin-left:auto;padding-left:14px;font-family:"Space Grotesk",sans-serif}
.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:16px}
.kpi{display:flex;flex-direction:column;gap:2px;padding:18px 20px}
.kpi b{font:700 36px/1.1 "Space Grotesk",sans-serif;letter-spacing:-.03em}
.kpi small{color:var(--soft);font-size:12.5px}
.kpi:nth-child(3) b{color:var(--good)}
h2{display:flex;align-items:center;gap:10px;margin:34px 0 14px;font:600 13px "Space Grotesk",sans-serif;letter-spacing:.18em;text-transform:uppercase;color:var(--soft)}
h2::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--edge),transparent)}
.glass header{display:flex;align-items:center;justify-content:space-between;gap:12px}
h3{font:600 16px "Space Grotesk",sans-serif;letter-spacing:-.01em}
.glass header code{padding:3px 9px;border-radius:8px;background:rgba(255,255,255,.06);color:var(--soft);font:500 11.5px ui-monospace,SFMono-Regular,Consolas,monospace}
.trend{padding:20px 22px 16px}
.trend svg{display:block;width:100%;height:auto;margin-top:10px;overflow:visible}
.trend line{stroke:rgba(255,255,255,.06);stroke-dasharray:4 6}
.trend .area{fill:url(#fill)}
.trend .line{fill:none;stroke:var(--copper);stroke-width:3;vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round;stroke-dasharray:1600;animation:draw 1.6s ease-out both;filter:drop-shadow(0 6px 14px rgba(224,162,131,.55))}
.trend circle{fill:#0b1322;stroke:var(--copper);stroke-width:2.5;vector-effect:non-scaling-stroke}
.trend text{fill:var(--text);font:600 15px "Space Grotesk",sans-serif;text-anchor:middle}
.days{display:flex;justify-content:space-between;margin-top:8px;color:var(--soft);font-size:11px}
.boards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.board{padding:20px}
.board ol{list-style:none;display:grid;gap:14px;margin-top:16px}
.board li{display:flex;gap:12px}
.rk{flex:none;display:grid;place-items:center;width:24px;height:24px;border-radius:8px;background:rgba(255,255,255,.07);color:var(--soft);font:700 12px "Space Grotesk",sans-serif;font-style:normal}
.board li:first-child .rk{background:linear-gradient(135deg,var(--copper),var(--deep));color:#fff}
.bd{flex:1;min-width:0}
.bl{display:flex;justify-content:space-between;gap:10px;font-size:13.5px}
.bl span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bl b{font-family:"Space Grotesk",sans-serif}
.bar{display:flex;gap:2px;width:var(--w);height:7px;margin-top:6px;overflow:hidden;border-radius:99px}
.bar .real{background:linear-gradient(90deg,var(--deep),var(--copper))}
.bar .junk{background:rgba(255,122,138,.55)}
.bd small{display:block;margin-top:4px;color:var(--soft);font-size:11.5px}
.none{color:var(--soft);font-size:13.5px}
.feed{padding:20px 0 6px}
.feed header{padding:0 22px 14px}
#q{width:min(340px,100%);padding:10px 14px;border:1px solid var(--edge);border-radius:12px;background:rgba(0,0,0,.25);color:var(--text);font:inherit;outline:none;transition:border-color .2s,box-shadow .2s}
#q:focus{border-color:var(--copper);box-shadow:0 0 0 4px rgba(224,162,131,.15)}
.tr{display:grid;grid-template-columns:1.15fr .95fr 1.3fr 1.3fr 1fr 1.2fr 1fr;gap:12px;align-items:center;padding:13px 22px;border-top:1px solid var(--edge);font-size:13.5px;color:#c9d3e2}
.tr[hidden]{display:none}
.tr span{min-width:0;overflow-wrap:anywhere}
.tr b{color:var(--text);font-family:"Space Grotesk",sans-serif;font-weight:600}
.tr:not(.th):hover{background:rgba(255,255,255,.035)}
.th{color:var(--soft);font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.g{display:inline-grid;place-items:center;width:18px;height:18px;margin-left:8px;border-radius:6px;background:rgba(61,220,151,.15);color:var(--good);font:700 10.5px "Space Grotesk",sans-serif;font-style:normal;vertical-align:1px}
.st{display:inline-flex;align-items:center;gap:7px;padding:4px 11px;border-radius:999px;font-size:12px;font-style:normal;font-weight:600}
.st::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.st.good{background:rgba(61,220,151,.12);color:var(--good)}
.st.open{background:rgba(123,167,255,.12);color:var(--open)}
.st.bad{background:rgba(255,122,138,.12);color:var(--bad)}
.nomatch{padding:18px 22px;color:var(--soft)}
.empty{display:flex;align-items:center;gap:26px;padding:28px}
.radar{flex:none;position:relative;width:110px;height:110px;border-radius:50%;border:1px solid rgba(224,162,131,.35);background:radial-gradient(circle,transparent 30%,rgba(224,162,131,.08) 31%,transparent 32%,transparent 60%,rgba(224,162,131,.08) 61%,transparent 62%);overflow:hidden}
.radar::before{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(rgba(224,162,131,.55),transparent 25%);animation:sweep 2.8s linear infinite}
.radar::after{content:"";position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px;border-radius:50%;background:var(--copper)}
.empty>div>b{font:600 18px "Space Grotesk",sans-serif}
.empty p{margin-top:4px;color:#b3bfd1}
.empty ul{margin:12px 0 0 18px;color:var(--soft)}
.empty li+li{margin-top:4px}
.foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-top:28px;color:var(--soft);font-size:12.5px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border:1px solid var(--edge);border-radius:12px;background:var(--glass);color:var(--text);font-weight:600;text-decoration:none;transition:border-color .2s}
.btn:hover{border-color:var(--copper)}
@media (max-width:1060px){.boards{grid-template-columns:repeat(2,minmax(0,1fr))}.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:820px){
  .wrap{padding:16px 16px 44px}
  .hero{grid-template-columns:1fr}
  .boards{grid-template-columns:1fr}
  .kpis{gap:12px}.kpi{padding:16px}.kpi b{font-size:30px}
  .big{padding:22px}
  .ringbox{padding:20px;gap:18px}.ring{width:122px;height:122px}.ring b{font-size:28px}
  .days span:nth-child(even){visibility:hidden}.trend svg{height:150px}.trend circle,.trend text{display:none}
  .feed header{flex-direction:column;align-items:stretch;padding:0 16px 12px}
  .th{display:none}
  .tr{grid-template-columns:1fr 1fr;gap:10px 14px;padding:14px 16px}
  .tr span::before{content:attr(data-l);display:block;margin-bottom:1px;color:var(--soft);font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
  .empty{flex-direction:column;align-items:flex-start}
}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important}}
</style>
</head>
<body>
<main class="wrap">
  <div class="top">
    <div class="brand"><span class="mark">BS</span><div><small>Best Solution</small><h1>Google Ads lead radar</h1></div></div>
    <div class="live">
      <span class="chip"><span class="dot"></span>Live from the ERP</span>
      <span class="chip">Updated ${esc(when(now))}</span>
      <span class="chip">Since ${esc(day(REPORT_START))}</span>
    </div>
  </div>

  <div class="hero">
    <section class="glass big">
      <span class="k">Google Ads leads</span>
      <div class="num"><b>${leads.length}</b><span>since ${esc(day(REPORT_START))}</span></div>
      <p>${topCampaign?.[0] ? `Top campaign: <b>${esc(topCampaign[0])}</b>, ${topCampaign[1].n} lead${topCampaign[1].n === 1 ? "" : "s"}.` : leads.length ? "No campaign tags on these leads yet." : "Every new lead from a Google ad lands here, with its campaign, keyword, ad and ERP status."}</p>
    </section>
    <section class="glass ringbox" style="--i:1">
      <div class="ring"><div><b>${realPct}%</b><small>real leads</small></div></div>
      <ul class="legend">
        <li><i style="background:var(--good)"></i>Real<b>${real}</b></li>
        <li><i style="background:var(--bad)"></i>Junk or duplicate<b>${junk}</b></li>
        <li><i style="background:var(--copper)"></i>Sent to Google<b>${sent}</b></li>
      </ul>
    </section>
  </div>

  <div class="kpis">${kpis}</div>

  <h2>Momentum</h2>
  ${trend(leads, today)}

  <h2>What brings them in</h2>
  <div class="boards">
    ${board("Campaigns", "utm_campaign", leads, (l) => val(l.custom_campaign), "No campaign tag")}
    ${board("Keywords", "utm_term", leads, (l) => val(l.custom_ad_set_name), "No keyword tag")}
    ${board("Ads", "utm_content", leads, (l) => val(l.custom_ad_name), "No ad tag")}
    ${board("Pages / forms", "form", leads, (l) => val(l.custom_form_name), "Unknown")}
  </div>

  <h2>New leads</h2>
  ${feed}

  <div class="foot">
    <span>No names, phone numbers or emails here. Open a lead number in the ERP for contact details. <b class="g" style="margin:0 2px">G</b> = imported to Google Ads.</span>
    <a class="btn" href="/ads-conversions.csv">Raw file Google Ads imports →</a>
  </div>
</main>
<script>
(() => {
  const q = document.getElementById("q");
  if (!q) return;
  const rows = [...document.querySelectorAll(".tr:not(.th)")], none = document.querySelector(".nomatch");
  q.addEventListener("input", () => {
    const t = q.value.trim().toLowerCase();
    let shown = 0;
    for (const r of rows) { const on = !t || r.textContent.toLowerCase().includes(t); r.hidden = !on; shown += on; }
    none.hidden = shown > 0;
  });
})();
</script>
</body>
</html>`;
}
