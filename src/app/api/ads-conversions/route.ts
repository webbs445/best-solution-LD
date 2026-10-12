import { adsConversionCsv } from "@/lib/adsExport";
import { adsAuthFailure } from "@/lib/adsAuth";
import { listClickLeads } from "@/lib/erp";

/*
  The CSV Google Ads fetches every night (Data Manager, HTTPS source) at /ads-conversions.csv, as Google needs the
  .csv ending, to import website leads from the ERP as "Website lead (ERP)" conversions. Basic auth (lib/adsAuth).
  Leads from the last 90 days (Google's click window). The same data, readable, is at /ads-report.
*/
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const refused = adsAuthFailure(request);
  if (refused) return refused;

  const leads = await listClickLeads(90);
  if (!leads) return new Response("ERP unavailable", { status: 502 });
  console.info(JSON.stringify({ msg: "ads_export", leads: leads.length }));
  return new Response(adsConversionCsv(leads), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Cache-Control": "no-store" },
  });
}
