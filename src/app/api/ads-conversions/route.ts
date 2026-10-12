import { createHash, timingSafeEqual } from "node:crypto";
import { adsConversionCsv } from "@/lib/adsExport";
import { listClickLeads } from "@/lib/erp";

/*
  The CSV Google Ads fetches on a schedule (Goals > Uploads > Schedules, source HTTPS) to import website
  leads from the ERP as "Website lead (ERP)" conversions. Basic auth with ADS_EXPORT_USER /
  ADS_EXPORT_PASSWORD; without both set, the link is off. Leads from the last 90 days (Google's click window).
*/
export const dynamic = "force-dynamic";

const digest = (v: string) => createHash("sha256").update(v).digest();
const same = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

export async function GET(request: Request) {
  const user = process.env.ADS_EXPORT_USER;
  const pass = process.env.ADS_EXPORT_PASSWORD;
  if (!user || !pass) return new Response("Not found", { status: 404 });

  const [scheme, token] = (request.headers.get("authorization") || "").split(" ");
  const given = scheme === "Basic" && token ? Buffer.from(token, "base64").toString() : "";
  if (!same(given, `${user}:${pass}`)) {
    return new Response("Unauthorized", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="ads-export"' } });
  }

  const leads = await listClickLeads(90);
  if (!leads) return new Response("ERP unavailable", { status: 502 });
  console.info(JSON.stringify({ msg: "ads_export", leads: leads.length }));
  return new Response(adsConversionCsv(leads), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Cache-Control": "no-store" },
  });
}
