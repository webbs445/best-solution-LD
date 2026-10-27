import type { ClickLead } from "@/lib/erp";
import type { SheetLead } from "@/lib/adsSheet";

/*
  Google Ads offline click conversion file (the "Google Click ID" template) built from the lead log sheet and ERP leads, so a
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

/** Why a lead is left out of the upload, or null when it goes to Google. Shared with the report page. */
export function exclusionReason(l: ClickLead): string | null {
  const id = l.custom_clid?.trim() ?? "";
  if (!id) return "No click ID";
  if (!isGclid(id)) return "Not a Google web click";
  if (SKIP_STATUS.has(l.status)) return `Marked ${l.status} in the ERP`;
  return null;
}

/**
 * The leads to upload: every Google Ads lead in the lead log sheet (it keeps the click id after the ERP hides a lead
 * from the website's API user once sales responds) plus the ERP's own click-id leads, which also cover
 * www.best-solution.ae (its leads are not in the sheet). One row per lead number; where the ERP still shows a lead,
 * its record and status win, so Junk and Duplicate stay out. `since` is the first UAE date in Google's 90-day window.
 * ponytail: a lead the ERP hides has no status here, so one later marked Junk still uploads; a read-only ERP user
 * that sees every lead would close that.
 */
export function uploadLeads(erp: ClickLead[], sheet: SheetLead[] | null, since: string): ClickLead[] {
  const byName = new Map(erp.map((l) => [l.name, l]));
  for (const s of sheet ?? [])
    if (!byName.has(s.name) && s.creation >= since && s.custom_clid?.trim())
      byName.set(s.name, { name: s.name, creation: s.creation, custom_clid: s.custom_clid, status: "" });
  return [...byName.values()].sort((a, b) => a.creation.localeCompare(b.creation));
}

/** Current UAE time as "YYYY-MM-DD HH:MM:SS" (UTC+4, no daylight saving). */
export const uaeNow = () => new Date(Date.now() + 4 * 3_600_000).toISOString().slice(0, 19).replace("T", " ");

const cell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function adsConversionCsv(leads: ClickLead[]): string {
  const rows = leads
    .filter((l) => exclusionReason(l) === null)
    // The ERP stores UAE time (UTC+4, no daylight saving); the offset goes on each time, as Data Manager reads the
    // first line as the column names. Order ID (the ERP lead number) stops a lead being counted twice.
    .map((l) => [l.custom_clid.trim(), ADS_LEAD_CONVERSION, `${l.creation.slice(0, 19)}+04:00`, l.name].map(cell).join(","));
  // Google's Data Manager needs one row to read the layout. Until a real ad-click lead exists, a marked sample row
  // stands in; its click id is not a real one, so Google rejects that row and nothing is counted.
  if (!rows.length) rows.push(["SAMPLE-not-a-real-click", ADS_LEAD_CONVERSION, `${uaeNow()}+04:00`, "SAMPLE"].join(","));
  return ["Google Click ID,Conversion Name,Conversion Time,Order ID", ...rows].join("\n") + "\n";
}
