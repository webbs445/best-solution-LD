import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReportLead } from "@/lib/erp";
import { exclusionReason, uaeNow } from "@/lib/adsExport";
import type { SheetLead } from "@/lib/adsSheet";

/*
  The team's Google Ads lead dashboard (/ads-report, same password as the CSV): every new lead from a Google ad since
  REPORT_START, with its campaign, ad group, keyword, page and ERP status, so nobody has to open the ERP. The page is
  adsReportPage.html (the "Lead Radar" design); this file builds the one data object it renders. Lead numbers,
  tracking fields and statuses only; never a name, phone or email.
*/

/** The dashboard counts new leads from this UAE date on; earlier leads are history and stay in the ERP. */
export const REPORT_START = "2026-10-12";
const MAX_DAYS = 90;

const val = (v: string | undefined) => v?.trim() || "";

/** A Google ad click: a Google click ID on the lead, or Google as the source with ad tags (untagged Google leads are organic search). */
export function isGoogleAdsLead(l: ReportLead): boolean {
  const why = exclusionReason(l);
  if (why === null || why.startsWith("Marked")) return true;
  const tagged = Boolean(val(l.custom_campaign) || val(l.custom_ad_set_name) || val(l.custom_ad_name));
  return /google/i.test(`${l.custom_platform ?? ""} ${l.source ?? ""}`) && tagged;
}

// Same groups as the page (spec §4.1); unknown statuses are in progress.
const GROUP: Record<string, string> = {
  "Deal Won": "won", Converted: "won",
  "Deal Lost": "lost", Unqualified: "lost", "Do Not Contact": "lost",
  Junk: "junk", "Duplicate Lead": "duplicate",
};
const groupOf = (status: string) => GROUP[status] ?? "progress";

const isDate = (v: string | null): v is string => /^\d{4}-\d{2}-\d{2}$/.test(v ?? "") && !Number.isNaN(Date.parse(v!));
const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const daysIn = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1;

export interface ReportRange { key: "today" | "7d" | "30d" | "since" | "custom"; from: string; to: string; prevFrom: string | null; prevTo: string | null }

/** The date range from the query string (?range=today|7d|30d|since, or ?from=&to=). Anything invalid falls back to "since". */
export function reportRange(q: URLSearchParams, today: string): ReportRange {
  const from = q.get("from"), to = q.get("to");
  const custom = isDate(from) && isDate(to) && from >= REPORT_START && to <= today && from <= to && daysIn(from, to) <= MAX_DAYS;
  const key = custom ? "custom" : (["today", "7d", "30d"] as const).find((k) => k === q.get("range")) ?? "since";
  if (key === "since") return { key, from: REPORT_START, to: today, prevFrom: null, prevTo: null };
  const start = key === "custom" ? from! : addDays(today, key === "today" ? 0 : key === "7d" ? -6 : -29);
  const end = key === "custom" ? to! : today;
  const prevFrom = addDays(start, -daysIn(start, end));
  // No comparison when the previous period starts before counting did: it would look like growth (D21).
  return prevFrom < REPORT_START ? { key, from: start, to: end, prevFrom: null, prevTo: null } : { key, from: start, to: end, prevFrom, prevTo: addDays(start, -1) };
}

/** Which Google Ads keys are in the environment, for the page's setup checklist. */
function googleSetup() {
  const has = (...k: string[]) => k.every((n) => Boolean(process.env[n]));
  return {
    managerAccount: has("GOOGLE_ADS_LOGIN_CUSTOMER_ID"),
    developerToken: has("GOOGLE_ADS_DEVELOPER_TOKEN"),
    cloudSignIn: has("GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN"),
    keysAdded: has("GOOGLE_ADS_CUSTOMER_ID", "GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_LOGIN_CUSTOMER_ID"),
  };
}

/** Shown for a lead the sheet has but the ERP hides: the ERP stops showing a lead to the website once sales responds. */
export const HIDDEN_STATUS = "Contacted by sales";

/**
 * The page's data object. `all` is the ERP's leads (null when it did not answer); `sheet` is the Google Ads lead log,
 * which adds the leads the ERP no longer shows.
 */
export function adsReportData(all: ReportLead[] | null, sheet: SheetLead[] | null, q: URLSearchParams, now = uaeNow()) {
  const range = reportRange(q, now.slice(0, 10));
  const seen = new Set(all?.map((l) => l.name));
  const hidden = all ? (sheet ?? []).filter((l) => !seen.has(l.name)).map((l) => ({ ...l, status: HIDDEN_STATUS, hidden: true })) : [];
  const google = [...(all ?? []), ...hidden].filter((l) => l.creation >= REPORT_START && isGoogleAdsLead(l));
  const inRange = (l: ReportLead, from: string, to: string) => l.creation.slice(0, 10) >= from && l.creation.slice(0, 10) <= to;
  const prev = range.prevFrom ? google.filter((l) => inRange(l, range.prevFrom!, range.prevTo!)) : null;
  const count = (g: string[]) => prev && prev.filter((l) => g.includes(groupOf(l.status))).length;
  return {
    updated: now.slice(0, 16),
    range,
    // ponytail: Google Ads API not wired yet; the Google view shows the setup checklist until it is.
    google: { connected: false, dataAsOf: null, setup: googleSetup(), totals: null, prevTotals: null, daily: [], campaigns: [] },
    erp: {
      available: all !== null,
      leads: google
        .filter((l) => inRange(l, range.from, range.to))
        .sort((a, b) => b.creation.localeCompare(a.creation))
        .map((l) => ({
          leadNo: l.name,
          created: l.creation.slice(0, 16),
          status: l.status,
          campaign: val(l.custom_campaign),
          // utm_content is "{adgroup}_{creative id}" (the ads' URL suffix).
          adGroup: val(l.custom_ad_name).replace(/_\d+$/, ""),
          keyword: val(l.custom_ad_set_name),
          form: val(l.custom_form_name),
          // In tonight's conversion file; a lead the ERP hides isn't, as that file is read from the ERP.
          hasGoogleClickId: !("hidden" in l) && exclusionReason(l) === null,
          googleCampaignId: "",
          googleAdGroupId: "",
        })),
      prevLeadCount: prev?.length ?? null,
      prevQualifiedCount: count(["won", "progress"]),
      prevWonCount: count(["won"]),
    },
  };
}

let template: string | null = null;
/** The page with `data` in it. `<` is escaped so ERP text can never close the script tag. */
function page(data: object): string {
  // Re-read in development so edits to the page show without restarting the server.
  if (!template || process.env.NODE_ENV !== "production") template = readFileSync(join(process.cwd(), "src/lib/adsReportPage.html"), "utf8");
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return template.replace("__LR_DATA__", () => json);
}

export const adsReportHtml = (all: ReportLead[] | null, sheet: SheetLead[] | null, q: URLSearchParams, now?: string) =>
  page(adsReportData(all, sheet, q, now));

/** The sign-in page, in the same design. `error` shows above the form. */
export const adsLoginHtml = (error = "") => page({ signin: true, error });
