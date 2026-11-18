import { getVercelOidcToken } from "@vercel/oidc";
import { ExternalAccountClient, type BaseExternalAccountClient } from "google-auth-library";

/*
  The Google Ads report Sheet (/ads-report?view=google-ads): a Google Ads Script writes it 3 times a day; the site only
  reads it, server side, limited to spreadsheets.readonly. Keyless sign-in (the Google org blocks service account keys):
  the deployment's Vercel OIDC token is exchanged through Workload Identity Federation for a short-lived token of the
  ads-report-reader service account (https://vercel.com/docs/oidc/gcp). Works on Vercel deployments only.
  Off unless ADS_REPORT_SHEET_ID and the four GCP_* variables are set. Only the tabs in TABS are ever requested:
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

function config() {
  const e = process.env;
  const id = e.ADS_REPORT_SHEET_ID, project = e.GCP_PROJECT_NUMBER, serviceAccount = e.GCP_SERVICE_ACCOUNT_EMAIL;
  const pool = e.GCP_WORKLOAD_IDENTITY_POOL_ID, provider = e.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID;
  return id && project && serviceAccount && pool && provider ? { id, project, serviceAccount, pool, provider } : null;
}
type Config = NonNullable<ReturnType<typeof config>>;

export const googleAdsConfigured = () => !!config();

let client: BaseExternalAccountClient | null = null;

/** The federated client; it keeps the access token and renews it when it expires. */
function authClient(c: Config): BaseExternalAccountClient {
  client ??= ExternalAccountClient.fromJSON({
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${c.project}/locations/global/workloadIdentityPools/${c.pool}/providers/${c.provider}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${c.serviceAccount}:generateAccessToken`,
    // No custom audience: the provider allows the team URL, the token's default audience.
    subject_token_supplier: { getSubjectToken: () => getVercelOidcToken() },
    scopes: [SCOPE],
  });
  if (!client) throw new Error("external account client not created");
  return client;
}

async function accessToken(c: Config): Promise<string> {
  const { token } = await authClient(c).getAccessToken();
  if (!token) throw new Error("no access token from Workload Identity Federation");
  return token;
}

/** Whether this deployment gets a Vercel OIDC token (OIDC federation on in the project). Logs "present" or "missing" only. */
async function oidcPresent(): Promise<boolean> {
  try {
    await getVercelOidcToken();
    console.info("Vercel OIDC token: present");
    return true;
  } catch {
    console.warn("Vercel OIDC token: missing");
    return false;
  }
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
  // Without a Vercel OIDC token (local runs, or OIDC federation off in the project) there is no way in: "not connected".
  if (!(await oidcPresent())) return last ? { kind: "stale", data: last } : { kind: "off" };
  try {
    inflight ??= fetchSheet(c).finally(() => (inflight = null));
    last = await inflight;
    return { kind: "ok", data: last };
  } catch (err) {
    lastFail = Date.now();
    // The error message only, cut short: never a token.
    console.error("Google Ads sheet unreachable:", err instanceof Error ? err.message.slice(0, 200) : "unknown error");
    return last ? { kind: "stale", data: last } : { kind: "error" };
  }
}
