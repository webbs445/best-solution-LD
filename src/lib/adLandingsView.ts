import { dubaiDate, kvConfigured, previewData, readRaw } from "@/lib/adLandings";
import { TEST_NOTES } from "@/lib/adLandingsNotes";
import { adLandingsHtml } from "@/lib/adLandingsPage";
import { dailyRows, datesBetween, excludeTests, parseDay, pickRange, toCsv, totals, type Entry } from "@/lib/adLandingsReport";

/*
  The "Ad landings" view of the ads dashboard (/ads-report?view=landings; the route has already checked the sign-in).
  ?range=today|7d|30d|since (default 7d) or ?from=&to=, ?tests=include keeps the test visits in, ?format=csv downloads.
*/

const PRIVATE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
const html = (body: string, status = 200) => new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", ...PRIVATE } });

export async function adLandingsResponse(query: URLSearchParams): Promise<Response> {
  const now = Date.now();
  const today = dubaiDate(now);
  const updated = new Date(now + 4 * 3_600_000).toISOString().slice(11, 16);
  const range = pickRange(query, today);
  const base = { range, today, updated, preview: previewData(), query };
  if (!kvConfigured()) return html(adLandingsHtml({ kind: "kv-off", ...base }));

  const cur = datesBetween(range.from, range.to);
  const prev = range.prevFrom && range.prevTo ? datesBetween(range.prevFrom, range.prevTo) : [];
  let raw: Record<string, unknown>;
  try {
    raw = await readRaw([...prev, ...cur]);
  } catch {
    return html(adLandingsHtml({ kind: "kv-error", ...base }), 502);
  }
  const skipTests = query.get("tests") !== "include";
  const load = (dates: string[]): Entry[] => {
    const entries = dates.flatMap((d) => parseDay(d, raw[d]));
    return skipTests ? excludeTests(entries, TEST_NOTES) : entries;
  };
  const entries = load(cur);

  if (query.get("format") === "csv") {
    return new Response(toCsv(dailyRows(entries, range.from, range.to), totals(entries)), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="ad-landings-${range.from}-to-${range.to}.csv"`, ...PRIVATE },
    });
  }
  return html(adLandingsHtml({ kind: "ok", data: { ...base, excludeTests: skipTests, entries, prevEntries: prev.length ? load(prev) : null, notes: TEST_NOTES } }));
}
