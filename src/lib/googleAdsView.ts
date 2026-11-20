import { after } from "next/server";
import { dubaiDate, kvConfigured, readRaw } from "@/lib/adLandings";
import { TEST_NOTES } from "@/lib/adLandingsNotes";
import { COUNT_START, datesBetween, excludeTests, parseDay, type Entry } from "@/lib/adLandingsReport";
import { REPORT_START, googleAdsLeads, isGoogleAdsLead, isQualifiedStatus, isWonStatus } from "@/lib/adsReport";
import { readAdsSheet, type SheetLead } from "@/lib/adsSheet";
import { listLeads, type ReportLead } from "@/lib/erp";
import type { ErpLead } from "@/lib/googleAdsInsights";
import { googleAdsHtml, googleAdsRest, googleAdsShell, type GoogleAdsState } from "@/lib/googleAdsPage";
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

/** Data that arrives within this sends the whole page at once; slower, the shell goes first and the view streams after it. */
export const SHELL_AFTER_MS = 150;

/**
 * Step timings, for the Server-Timing header and one log line: durations in ms and where the Sheet copy came from
 * (redis / memory / bridge, and "due" when a background read was started). Never data, ids or secrets.
 */
export class Timings {
  readonly start = performance.now();
  readonly ms: Record<string, number> = {};
  sheet = "";
  async step<T>(name: string, p: Promise<T>): Promise<T> {
    const s = performance.now();
    try {
      return await p;
    } finally {
      this.ms[name] = Math.round(performance.now() - s);
    }
  }
  stepSync<T>(name: string, f: () => T): T {
    const s = performance.now();
    const v = f();
    this.ms[name] = Math.round(performance.now() - s);
    return v;
  }
  total() {
    return (this.ms.total = Math.round(performance.now() - this.start));
  }
  header() {
    return Object.entries(this.ms)
      .map(([k, v]) => `${k};dur=${v}${k === "bridge" && this.sheet ? `;desc="${this.sheet}"` : ""}`)
      .join(", ");
  }
  log(mode: string) {
    console.log(`Google Ads view timing (${mode}): ${Object.entries(this.ms).map(([k, v]) => `${k}=${v}ms`).join(" ")}${this.sheet ? ` sheet=${this.sheet}` : ""}`);
  }
}

export async function googleAdsResponse(query: URLSearchParams): Promise<Response> {
  const schedule: Schedule = (task) => after(task);
  const today = dubaiDate();
  const t = new Timings();
  if (query.has("refresh")) {
    const erp = await t.step("erp", erpLeads(schedule));
    const allowed = rateLimit("google-ads-refresh", 1, REFRESH_EVERY_MS);
    const read = allowed ? await t.step("bridge", readGoogleAdsSheet(true, schedule, erp.leads?.map((l) => l.clid).filter(Boolean) ?? [])) : null;
    const back = new URLSearchParams(query);
    back.delete("refresh");
    back.set("note", !allowed ? "wait" : read?.kind === "ok" ? "done" : "failed");
    t.total();
    t.log("refresh");
    return new Response(null, { status: 303, headers: { Location: `/ads-report?${back}`, "Server-Timing": t.header(), ...PRIVATE } });
  }
  const state = loadState(query, today, schedule, t);
  const quick = await Promise.race([state, new Promise<null>((r) => setTimeout(r, SHELL_AFTER_MS, null))]);
  const headers = { "Content-Type": "text/html; charset=utf-8", ...PRIVATE };
  if (quick) {
    const body = t.stepSync("render", () => googleAdsHtml(quick));
    t.total();
    t.log("whole page");
    return new Response(body, { status: quick.kind === "error" ? 502 : 200, headers: { ...headers, "Server-Timing": t.header() } });
  }
  // Slow data (a cold ERP or Sheet read): the shell now, the view when it's in. The status is already sent as 200,
  // and the header can only time the shell: the full timings are in the log line.
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(c) {
      c.enqueue(enc.encode(googleAdsShell(query, today)));
      try {
        const s = await state;
        c.enqueue(enc.encode(t.stepSync("render", () => googleAdsRest(s))));
        t.total();
        t.log("streamed");
        c.close();
      } catch (err) {
        c.error(err);
      }
    },
  });
  return new Response(stream, { headers: { ...headers, "Server-Timing": `shell;dur=${Math.round(performance.now() - t.start)};desc="data streamed after the shell"` } });
}

/** ERP leads, then the Sheet and the landing counter together, each timed; the page state. Never throws. */
async function loadState(query: URLSearchParams, today: string, schedule: Schedule, t: Timings): Promise<GoogleAdsState> {
  const erp = await t.step("erp", erpLeads(schedule));
  const ids = erp.leads?.map((l) => l.clid).filter(Boolean) ?? [];
  const period = pickPeriod(query, today);
  const [read, land] = await Promise.all([t.step("bridge", readGoogleAdsSheet(false, schedule, ids)), t.step("counter", landings(period.from, period.to))]);
  const base = { query, today };
  if (!("data" in read)) return { kind: read.kind, ...base, diagnosis: read.diagnosis };
  t.sheet = `${read.via}${read.due ? " due" : ""}`;
  return {
    kind: "ok",
    ...base,
    data: read.data,
    stale: read.kind === "stale",
    note: query.get("note") ?? "",
    erp: erp.leads ? joinClicks(erp.leads, read.data.clicks) : null,
    leadSource: erp.source,
    joinReady: read.data.clicks != null,
    landings: land,
  };
}
