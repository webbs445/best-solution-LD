import { unstable_cache } from "next/cache";
import type { ReportLead } from "@/lib/erp";
import { isPreviewDeployment } from "@/lib/preview";

/*
  The Google Ads lead log: a Google Sheet behind a small Apps Script web app (scripts/ads-leads-sheet.gs). Each new
  Google Ads lead is added once with its tracking fields (never a name, phone or email). The ERP hides a lead from
  the website's API user once sales responds to it; the sheet keeps it, so /ads-report still counts it.
  Writing needs ADS_SHEET_URL and ADS_SHEET_SECRET (the script's write secret). Reading uses ADS_SHEET_READ_SECRET when
  it is set (the script's READ_SECRET, which can read but never write), else ADS_SHEET_SECRET. Production keeps
  ADS_SHEET_SECRET; Preview gets only ADS_SHEET_URL + ADS_SHEET_READ_SECRET, so it can read and has no way to write.
*/

/** The tracking fields the sheet stores: a ReportLead without the status, which only the ERP knows, plus the cookie choice. */
export type SheetLead = Omit<ReportLead, "status"> & { consent?: string };

const FIELDS = ["name", "creation", "custom_campaign", "custom_ad_set_name", "custom_ad_name", "custom_form_name", "custom_platform", "source", "custom_clid", "consent"] as const;

/** For adding leads: the write secret only. */
function config() {
  const url = process.env.ADS_SHEET_URL, secret = process.env.ADS_SHEET_SECRET;
  return url && secret ? { url, secret } : null;
}

/** For reading: the read-only secret when set, else the write secret. */
function readConfig() {
  const url = process.env.ADS_SHEET_URL, secret = process.env.ADS_SHEET_READ_SECRET || process.env.ADS_SHEET_SECRET;
  return url && secret ? { url, secret } : null;
}

/** Adds one lead to the sheet. Never throws: a failure is logged and the lead is still safe in the ERP. */
export async function recordAdsLead(lead: SheetLead): Promise<void> {
  if (isPreviewDeployment()) return; // previews write nothing to the lead log sheet
  const c = config();
  if (!c) return;
  try {
    const res = await fetch(c.url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret: c.secret, lead: Object.fromEntries(FIELDS.map((f) => [f, lead[f] ?? ""])) }),
      signal: AbortSignal.timeout(15_000),
    });
    const out = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!out?.ok) console.error("Ads lead sheet refused the row", lead.name, res.status, out?.error);
  } catch (err) {
    console.error("Ads lead sheet unreachable", lead.name, err);
  }
}

/** A lead the ERP did not take, with its contact details so sales can call back. Kept in the sheet's "Fallback" tab. */
export interface FallbackLead {
  received: string;
  lead_name: string;
  mobile_no: string;
  email_id: string;
  form_name: string;
  source_page: string;
  landing_page: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  click_id: string;
  consent: string;
  event_id: string;
  erp_error: string;
  erp_check: string;
  details: string;
}

/*
  Saves a lead the ERP refused or never answered for, and has the Apps Script email the alert ("1 lead saved to the
  fallback", no contact details). The Fallback tab is never returned by the script's read endpoint, so Preview and
  /ads-report can't see it. Awaited, unlike recordAdsLead: true only when the script confirms the row was written, so
  the visitor is told "sent" only when the lead is safe somewhere.
*/
export async function saveFallbackLead(lead: FallbackLead): Promise<boolean> {
  if (isPreviewDeployment()) return false;
  const c = config();
  if (!c) return false;
  try {
    const res = await fetch(c.url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret: c.secret, fallback: lead }),
      signal: AbortSignal.timeout(15_000),
    });
    const out = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (out?.ok) return true;
    console.error("Fallback lead refused by the sheet", res.status, out?.error);
  } catch (err) {
    console.error("Fallback lead sheet unreachable", err);
  }
  return false;
}

// The Apps Script takes 2 to 6 seconds to answer, so the report keeps a copy for 5 minutes and Next serves the old
// copy while it fetches a new one. The ERP stays live; only leads the ERP already hides come from here. A failure throws, so it is never cached.
const cachedSheet = unstable_cache(
  async () => {
    const c = readConfig()!;
    const res = await fetch(`${c.url}?secret=${encodeURIComponent(c.secret)}`, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    const out = (await res.json()) as { ok?: boolean; leads?: SheetLead[] };
    if (!out.ok || !Array.isArray(out.leads)) throw new Error(`sheet answered ${res.status}`);
    return out.leads;
  },
  ["ads-sheet-leads"],
  { revalidate: 300 },
);

/** Every lead in the sheet; [] when the sheet is off, null when it is set up but not answering. */
export async function readAdsSheet(): Promise<SheetLead[] | null> {
  if (!readConfig()) return [];
  try {
    return await cachedSheet();
  } catch (err) {
    console.error("Ads lead sheet unreachable", err);
    return null;
  }
}
