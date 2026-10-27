import { adsConversionCsv, uploadLeads } from "@/lib/adsExport";
import { adsAuthFailure } from "@/lib/adsAuth";
import { readAdsSheet } from "@/lib/adsSheet";
import { listClickLeads } from "@/lib/erp";

/*
  The CSV Google Ads fetches every night (Data Manager, HTTPS source) at /ads-conversions.csv, as Google needs the
  .csv ending, to import website leads as "Website lead (ERP)" conversions. Basic auth (lib/adsAuth).
  Leads from the last 90 days (Google's click window): the lead log sheet, which keeps a lead's click id after the
  ERP hides it from the website's API user, plus the ERP's own click-id leads. The same data, readable, is at /ads-report.
*/
export const dynamic = "force-dynamic";

const DAYS = 90;

export async function GET(request: Request) {
  const refused = adsAuthFailure(request);
  if (refused) return refused;

  // ERP down: no file tonight (Google tries again tomorrow) rather than a file that can't skip Junk and Duplicate leads.
  // Sheet down: the ERP's leads still go, as before.
  const [erp, sheet] = await Promise.all([listClickLeads(DAYS), readAdsSheet()]);
  if (!erp) return new Response("ERP unavailable", { status: 502 });
  const since = new Date(Date.now() + 4 * 3_600_000 - DAYS * 86_400_000).toISOString().slice(0, 10);
  const leads = uploadLeads(erp, sheet, since);
  console.info(JSON.stringify({ msg: "ads_export", leads: leads.length, erp: erp.length, sheet: sheet?.length ?? null }));
  return new Response(adsConversionCsv(leads), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Cache-Control": "no-store" },
  });
}
