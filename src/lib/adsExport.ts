import type { ClickLead } from "@/lib/erp";

/*
  Google Ads offline click conversion file (the "Google Click ID" template) built from ERP leads, so a
  website lead counts in Ads even when the visitor rejected ad cookies: the click id is stored with the lead
  and Google Ads fetches this file on a schedule. Only the click id, the conversion name and the time; no
  contact details.
*/

/** Must match the import conversion action's name in Google Ads exactly. */
export const ADS_LEAD_CONVERSION = "Website lead (ERP)";
/** Leads marked as these in the ERP are not real enquiries. */
const SKIP_STATUS = new Set(["Junk", "Duplicate Lead"]);

const cell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function adsConversionCsv(leads: ClickLead[]): string {
  const rows = leads
    .filter((l) => l.custom_clid?.trim() && !SKIP_STATUS.has(l.status))
    .map((l) => [l.custom_clid.trim(), ADS_LEAD_CONVERSION, l.creation.slice(0, 19)].map(cell).join(","));
  // The ERP stores UAE time (UTC+4, no daylight saving).
  return ["Parameters:TimeZone=+0400", "Google Click ID,Conversion Name,Conversion Time", ...rows].join("\n") + "\n";
}
