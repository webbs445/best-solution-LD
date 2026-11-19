import { after } from "next/server";
import { dubaiDate, kvConfigured, readRaw } from "@/lib/adLandings";
import { TEST_NOTES } from "@/lib/adLandingsNotes";
import { COUNT_START, datesBetween, excludeTests, parseDay, type Entry } from "@/lib/adLandingsReport";
import { REPORT_START, googleAdsLeads, isGoogleAdsLead, isQualifiedStatus, isWonStatus } from "@/lib/adsReport";
import { readAdsSheet, type SheetLead } from "@/lib/adsSheet";
import { listLeads, type ReportLead } from "@/lib/erp";
import type { ErpLead } from "@/lib/googleAdsInsights";
import { googleAdsHtml } from "@/lib/googleAdsPage";
import { pickPeriod, rowsOf, str } from "@/lib/googleAdsReport";
import { readGoogleAdsSheet, type Cell } from "@/lib/googleAdsSheet";
import { rateLimit } from "@/lib/rateLimit";

/*
  The "Google Ads" view of the ads dashboard (/ads-report?view=google-ads; the route has already checked the sign-in).
  ?refresh=1 reads the Sheet now (once per 2 minutes for everyone), then sends the browser back without it.
  ERP leads come from the same source as the ERP status view (lib/erp listLeads + the lead log sheet, lib/adsReport);
  null when the ERP isn't connected here (e.g. a preview without the ERP keys), which the page shows as such, never as 0.
  Click ids stay in this file: the leads' ids go to the bridge, the click rows it returns are joined here, and each
  lead carries only its click's device, city and keyword on to the page.
*/

const PRIVATE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow, noarchive" };
export const REFRESH_EVERY_MS = 2 * 60_000;
const ERP_CACHE_MS = 5 * 60_000;

type Schedule = (task: () => Promise<unknown>) => void;
/** Where the leads came from: the ERP (with status), or the lead log sheet (no status) when the ERP isn't reachable. */
export type LeadSource = "erp" | "sheet";
interface ErpRaw { leads: (ErpLead & { clid: string })[] | null; at: number; source: LeadSource | null }

// ponytail: per-instance memory copy of the ERP's Google leads (stale-while-revalidate, like the Sheet). A lead shows
// here up to 5 minutes late; the ERP status view stays live.
let erpLast: ErpRaw | null = null;
let erpInflight: Promise<ErpRaw> | null = null;

/** The Google Ads leads (ERP + lead log) as the page counts them, each with its click id for the join; null: no ERP. */
export const toErpLeads = (all: ReportLead[] | null, sheet: SheetLead[] | null): ErpRaw["leads"] =>
  all
    ? googleAdsLeads(all, sheet).map((l) => ({
        created: l.creation.slice(0, 16),
        campaign: l.custom_campaign ?? "",
        keyword: l.custom_ad_set_name ?? "",
        qualified: isQualifiedStatus(l.status),
        won: isWonStatus(l.status),
        clid: l.custom_clid?.trim() ?? "",
      }))
    : null;

/** The lead log's Google Ads leads since REPORT_START, for when the ERP isn't reachable: no status, so not "qualified". */
export const fromLeadLog = (sheet: SheetLead[] | null): ErpRaw["leads"] =>
  // [] is also what an unset lead log gives: nothing to show, so Google conversions stand in instead.
  sheet?.length
    ? sheet
        .filter((l) => l.creation >= REPORT_START && isGoogleAdsLead({ ...l, status: "" }))
        .map((l) => ({ created: l.creation.slice(0, 16), campaign: l.custom_campaign ?? "", keyword: l.custom_ad_set_name ?? "", qualified: false, won: false, clid: l.custom_clid?.trim() ?? "" }))
    : null;

function readErp(): Promise<ErpRaw> {
  erpInflight ??= Promise.all([listLeads(REPORT_START), readAdsSheet()])
    .then(([all, sheet]): ErpRaw => {
      // No ERP here (e.g. a preview without its keys): the lead log sheet still has every Google Ads lead, without status.
      const fromErp = toErpLeads(all, sheet);
      const leads = fromErp ?? fromLeadLog(sheet);
      const r: ErpRaw = { leads, at: Date.now(), source: fromErp ? "erp" : leads ? "sheet" : null };
      // A failed read is not kept: the next load asks the ERP again.
      if (leads) erpLast = r;
      return r;
    })
    .finally(() => (erpInflight = null));
  return erpInflight;
}

/** The ERP leads at once from the copy (refreshed in the background when over 5 minutes old); the first load waits. */
async function erpLeads(schedule: Schedule): Promise<ErpRaw> {
  if (!erpLast) return readErp();
  if (Date.now() - erpLast.at >= ERP_CACHE_MS) schedule(() => readErp());
  return erpLast;
}

/** Each lead with the device, city and keyword of its click (matched by click id), or null when unmatched. */
export function joinClicks(leads: (ErpLead & { clid: string })[], clicks: Cell[][] | null): ErpLead[] {
  const by = new Map(rowsOf(clicks ?? []).map((r) => [str(r, "GCLID"), r]));
  return leads.map(({ clid, ...l }) => {
    const r = clid ? by.get(clid) : undefined;
    return { ...l, click: r ? { device: str(r, "Device"), city: str(r, "City").split(",")[0].trim(), keyword: str(r, "Keyword") } : null };
  });
}

/** Ad landings for the period (from the counter's first day), test visits left out; null when the counter isn't here. */
async function landings(from: string, to: string): Promise<Entry[] | null> {
  if (!kvConfigured()) return null;
  const start = from > COUNT_START ? from : COUNT_START;
  if (start > to) return [];
  try {
    const dates = datesBetween(start, to);
    const raw = await readRaw(dates);
    return excludeTests(dates.flatMap((d) => parseDay(d, raw[d])), TEST_NOTES);
  } catch {
    return null;
  }
}

export async function googleAdsResponse(query: URLSearchParams): Promise<Response> {
  const schedule: Schedule = (task) => after(task);
  const today = dubaiDate();
  const erp = await erpLeads(schedule);
  const ids = erp.leads?.map((l) => l.clid).filter(Boolean) ?? [];
  if (query.has("refresh")) {
    const allowed = rateLimit("google-ads-refresh", 1, REFRESH_EVERY_MS);
    const read = allowed ? await readGoogleAdsSheet(true, schedule, ids) : null;
    const back = new URLSearchParams(query);
    back.delete("refresh");
    back.set("note", !allowed ? "wait" : read?.kind === "ok" ? "done" : "failed");
    return new Response(null, { status: 303, headers: { Location: `/ads-report?${back}`, ...PRIVATE } });
  }
  const period = pickPeriod(query, today);
  const [read, land] = await Promise.all([readGoogleAdsSheet(false, schedule, ids), landings(period.from, period.to)]);
  const base = { query, today };
  const body =
    "data" in read
      ? googleAdsHtml({
          kind: "ok",
          ...base,
          data: read.data,
          stale: read.kind === "stale",
          note: query.get("note") ?? "",
          erp: erp.leads ? joinClicks(erp.leads, read.data.clicks) : null,
          leadSource: erp.source,
          joinReady: read.data.clicks != null,
          landings: land,
        })
      : googleAdsHtml({ kind: read.kind, ...base, diagnosis: read.diagnosis });
  return new Response(body, { status: read.kind === "error" ? 502 : 200, headers: { "Content-Type": "text/html; charset=utf-8", ...PRIVATE } });
}
