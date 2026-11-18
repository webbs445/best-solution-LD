import { dubaiDate } from "@/lib/adLandings";
import { googleAdsHtml } from "@/lib/googleAdsPage";
import { readGoogleAdsSheet } from "@/lib/googleAdsSheet";
import { rateLimit } from "@/lib/rateLimit";

/*
  The "Google Ads" view of the ads dashboard (/ads-report?view=google-ads; the route has already checked the sign-in).
  ?refresh=1 reads the Sheet now (once per 2 minutes for everyone), then sends the browser back without it.
*/

const PRIVATE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
export const REFRESH_EVERY_MS = 2 * 60_000;

export async function googleAdsResponse(query: URLSearchParams): Promise<Response> {
  if (query.has("refresh")) {
    const allowed = rateLimit("google-ads-refresh", 1, REFRESH_EVERY_MS);
    const read = allowed ? await readGoogleAdsSheet(true) : null;
    const back = new URLSearchParams(query);
    back.delete("refresh");
    back.set("note", !allowed ? "wait" : read?.kind === "ok" ? "done" : "failed");
    return new Response(null, { status: 303, headers: { Location: `/ads-report?${back}`, ...PRIVATE } });
  }
  const read = await readGoogleAdsSheet();
  const base = { query, today: dubaiDate() };
  const body =
    "data" in read
      ? googleAdsHtml({ kind: "ok", ...base, data: read.data, stale: read.kind === "stale", note: query.get("note") ?? "" })
      : googleAdsHtml({ kind: read.kind, ...base, diagnosis: read.diagnosis });
  return new Response(body, { status: read.kind === "error" ? 502 : 200, headers: { "Content-Type": "text/html; charset=utf-8", ...PRIVATE } });
}
