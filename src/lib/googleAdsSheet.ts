import { createSign } from "node:crypto";

/*
  The Google Ads report Sheet (/ads-report?view=google-ads): a Google Ads Script writes it 3 times a day; the site only
  reads it, server side, with a service account limited to spreadsheets.readonly. Off unless ADS_REPORT_SHEET_ID,
  GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY are set. Only the tabs in TABS are ever requested:
  Perf_Clicks_Last7Days (click IDs) is never read.
*/

export const TABS = [
  "_Status", "Alerts",
  "Perf_Campaigns_Daily", "Perf_AdGroups_Daily", "Perf_Ads_Daily", "Perf_Conversions_Daily", "Perf_Devices_Daily", "Perf_Channels_Daily",
  "Perf_Keywords_Daily", "Perf_SearchTerms_Daily", "Perf_Locations_30d", "Perf_Ages_30d", "Perf_Audiences_30d", "Perf_CampaignAssets_30d",
  "Setup_Campaigns", "Setup_Keywords", "Setup_Ads", "Change_Log_30d", "Setup_History",
] as const;
export type Tab = (typeof TABS)[number];
export type Cell = string | number | boolean;
export interface SheetData {
  tabs: Partial<Record<Tab, Cell[][]>>;
  fetchedAt: number;
}

const SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

function config() {
  const id = process.env.ADS_REPORT_SHEET_ID, email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL, key = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  // The key is stored with literal \n in the env var.
  return id && email && key ? { id, email, key: key.replace(/\\n/g, "\n") } : null;
}
type Config = NonNullable<ReturnType<typeof config>>;

export const googleAdsConfigured = () => !!config();

let token: { value: string; exp: number } | null = null;

/** A service-account access token (JWT bearer grant), reused until a minute before it expires. */
async function accessToken(c: Config): Promise<string> {
  if (token && token.exp > Date.now() + 60_000) return token.value;
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: c.email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 })}`;
  const sig = createSign("RSA-SHA256").update(unsigned).sign(c.key, "base64url");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${sig}` }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const out = (await res.json().catch(() => null)) as { access_token?: string; expires_in?: number } | null;
  if (!res.ok || !out?.access_token) throw new Error(`token request answered ${res.status}`);
  token = { value: out.access_token, exp: Date.now() + (out.expires_in ?? 3600) * 1000 };
  return token.value;
}

/** The tab list, then every known tab that exists in one values:batchGet (a missing tab would fail the whole batch). */
async function fetchSheet(c: Config): Promise<SheetData> {
  const auth = { Authorization: `Bearer ${await accessToken(c)}` };
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(c.id)}`;
  const get = async (url: string) => {
    const res = await fetch(url, { headers: auth, cache: "no-store", signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`Sheets answered ${res.status}`);
    return res.json();
  };
  const meta = (await get(`${base}?fields=sheets.properties.title`)) as { sheets?: { properties?: { title?: string } }[] };
  const have = new Set(meta.sheets?.map((s) => s.properties?.title));
  const tabs = TABS.filter((t) => have.has(t));
  // Numbers as numbers, dates as serial numbers (exact, whatever the Sheet's display format).
  const q = new URLSearchParams({ valueRenderOption: "UNFORMATTED_VALUE", dateTimeRenderOption: "SERIAL_NUMBER" });
  for (const t of tabs) q.append("ranges", `'${t}'`);
  const out = (await get(`${base}/values:batchGet?${q}`)) as { valueRanges?: { values?: Cell[][] }[] };
  return { tabs: Object.fromEntries(tabs.map((t, i) => [t, out.valueRanges?.[i]?.values ?? []])), fetchedAt: Date.now() };
}

export const CACHE_MS = 15 * 60_000;
const RETRY_MS = 60_000;

// ponytail: per-instance memory cache (the keyword and search-term tabs can pass Next's 2 MB data-cache limit).
// Each server instance reads the Sheet at most once per 15 minutes; move to a shared store if instances multiply.
let last: SheetData | null = null;
let lastFail = 0;
let inflight: Promise<SheetData> | null = null;

export type SheetRead = { kind: "off" } | { kind: "error" } | { kind: "ok" | "stale"; data: SheetData };

/**
 * The Sheet, from memory when under 15 minutes old. `force` (the Refresh button) reads it now. When Google doesn't
 * answer: the last copy as "stale", or "error" with none. Never throws.
 */
export async function readGoogleAdsSheet(force = false): Promise<SheetRead> {
  const c = config();
  if (!c) return { kind: "off" };
  const now = Date.now();
  if (!force && last && now - last.fetchedAt < CACHE_MS) return { kind: "ok", data: last };
  // Right after a failure, don't ask Google again on every page load.
  if (!force && last && now - lastFail < RETRY_MS) return { kind: "stale", data: last };
  try {
    inflight ??= fetchSheet(c).finally(() => (inflight = null));
    last = await inflight;
    return { kind: "ok", data: last };
  } catch (err) {
    lastFail = Date.now();
    // The message only (a status code): never the token, key or response body.
    console.error("Google Ads sheet unreachable:", err instanceof Error ? err.message : "unknown error");
    return last ? { kind: "stale", data: last } : { kind: "error" };
  }
}
