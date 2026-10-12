import { adsAuthFailure } from "@/lib/adsAuth";
import { adsReportHtml, REPORT_START } from "@/lib/adsReport";
import { listLeads } from "@/lib/erp";

/* /ads-report: the team's dashboard of new Google Ads leads, live from the ERP. Same password as the CSV (lib/adsAuth). */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const refused = adsAuthFailure(request);
  if (refused) return refused;

  const leads = await listLeads(REPORT_START);
  if (!leads) return new Response("The ERP is not answering right now. Please try again in a minute.", { status: 502 });
  return new Response(adsReportHtml(leads), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
}
