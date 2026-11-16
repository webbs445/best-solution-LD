import { adsAuthFailure } from "@/lib/adsAuth";
import { kvConfigured, readDays, type DayRow } from "@/lib/adLandings";

/*
  /internal/ad-landings: daily ad landing totals and cookie banner outcomes, for the team. Same sign-in as the ads
  dashboard (ADS_EXPORT_USER / ADS_EXPORT_PASSWORD: basic auth, or its sign-in cookie); 404 when those are not set.
  ?days=N (1 to 400, default 60).
*/
export const dynamic = "force-dynamic";

const HEADERS = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
const COLS: [keyof DayRow, string][] = [
  ["date", "Date (Dubai)"],
  ["land", "Ad landings"],
  ["shown", "Banner shown"],
  ["accept_all", "Accept"],
  ["reject_all", "Reject"],
  ["manage", "Manage"],
  ["none", "No choice"],
];

const page = (body: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Ad landings</title>
<style>body{font:15px/1.5 system-ui,sans-serif;margin:24px 16px;color:#14253e}table{border-collapse:collapse;min-width:min(100%,640px)}th,td{padding:6px 12px;border-bottom:1px solid #e8e1dc;text-align:right}th:first-child,td:first-child{text-align:left}tfoot td{font-weight:700}.wrap{overflow-x:auto}p{color:#5b6678;max-width:640px}</style></head><body>${body}</body></html>`;

export async function GET(request: Request) {
  const refused = adsAuthFailure(request);
  if (refused) return refused;
  if (!kvConfigured()) return new Response(page("<h1>Ad landings</h1><p>The KV store is not connected yet (KV_REST_API_URL / KV_REST_API_TOKEN).</p>"), { headers: HEADERS });

  const days = Math.min(400, Math.max(1, Number(new URL(request.url).searchParams.get("days")) || 60));
  let rows: DayRow[];
  try {
    rows = await readDays(days);
  } catch {
    return new Response(page("<h1>Ad landings</h1><p>Could not read the counts. Try again shortly.</p>"), { status: 502, headers: HEADERS });
  }
  const total = rows.reduce((t, r) => {
    COLS.slice(1).forEach(([k]) => ((t[k] as number) += r[k] as number));
    return t;
  }, { date: "Total", land: 0, shown: 0, accept_all: 0, reject_all: 0, manage: 0, none: 0 } as DayRow);
  const tr = (r: DayRow, cell = "td") => `<tr>${COLS.map(([k]) => `<${cell}>${r[k]}</${cell}>`).join("")}</tr>`;

  return new Response(
    page(`<h1>Ad landings</h1>
<p>Page loads with a Google Ads click ID (gclid, gbraid or wbraid) and the cookie banner outcome on those loads, last ${days} days. Daily totals only: no cookies, IP addresses or IDs are stored. No choice = banner shown minus Accept, Reject and Manage (saved a custom choice).</p>
<div class="wrap"><table><thead><tr>${COLS.map(([, h]) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => tr(r)).join("")}</tbody><tfoot>${tr(total)}</tfoot></table></div>`),
    { headers: HEADERS },
  );
}
