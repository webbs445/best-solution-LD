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

/**
 * The ERP's click id field also holds Facebook ("Iw…") and LinkedIn (a UUID) ids from the cookie fallback, and Google
 * app ids (gbraid / wbraid, "0AAAA…"). Only web gclids go in the "Google Click ID" column; Google rejects the rest.
 * ponytail: app clicks (gbraid / wbraid) are skipped; add their own columns if iOS app traffic ever matters.
 */
const isGclid = (v: string) => !/^Iw/.test(v) && !/^0AAAA/.test(v) && !/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(v);

const cell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function adsConversionCsv(leads: ClickLead[]): string {
  const rows = leads
    .filter((l) => l.custom_clid?.trim() && isGclid(l.custom_clid.trim()) && !SKIP_STATUS.has(l.status))
    // The ERP stores UAE time (UTC+4, no daylight saving); the offset goes on each time, as Data Manager reads the
    // first line as the column names. Order ID (the ERP lead number) stops a lead being counted twice.
    .map((l) => [l.custom_clid.trim(), ADS_LEAD_CONVERSION, `${l.creation.slice(0, 19)}+04:00`, l.name].map(cell).join(","));
  return ["Google Click ID,Conversion Name,Conversion Time,Order ID", ...rows].join("\n") + "\n";
}
