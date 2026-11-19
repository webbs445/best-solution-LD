import { dubaiDate } from "@/lib/adLandings";
import { REPORT_START, googleAdsLeads, isQualifiedStatus } from "@/lib/adsReport";
import { readAdsSheet } from "@/lib/adsSheet";
import { listLeads } from "@/lib/erp";
import type { ErpLead } from "@/lib/googleAdsInsights";
import { googleAdsHtml } from "@/lib/googleAdsPage";
import { readGoogleAdsSheet } from "@/lib/googleAdsSheet";
import { rateLimit } from "@/lib/rateLimit";

/*
  The "Google Ads" view of the ads dashboard (/ads-report?view=google-ads; the route has already checked the sign-in).
  ?refresh=1 reads the Sheet now (once per 2 minutes for everyone), then sends the browser back without it.
  ERP leads come from the same source as the ERP status view (lib/erp listLeads + the lead log sheet, lib/adsReport);
  null when the ERP isn't connected here (e.g. a preview without the ERP keys), which the page shows as such, never as 0.
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
  const [read, all, sheet] = await Promise.all([readGoogleAdsSheet(), listLeads(REPORT_START), readAdsSheet()]);
  const erp: ErpLead[] | null = all
    ? googleAdsLeads(all, sheet).map((l) => ({
        created: l.creation.slice(0, 16),
        campaign: l.custom_campaign ?? "",
        keyword: l.custom_ad_set_name ?? "",
        qualified: isQualifiedStatus(l.status),
      }))
    : null;
  const base = { query, today: dubaiDate() };
  const body =
    "data" in read
      ? googleAdsHtml({ kind: "ok", ...base, data: read.data, stale: read.kind === "stale", note: query.get("note") ?? "", erp })
      : googleAdsHtml({ kind: read.kind, ...base, diagnosis: read.diagnosis });
  return new Response(body, { status: read.kind === "error" ? 502 : 200, headers: { "Content-Type": "text/html; charset=utf-8", ...PRIVATE } });
}
