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

/* ---------- Diagnosis: which stage failed, shown on the "not connected" / error card (signed-in users only) ---------- */

export const ENV_NAMES = ["ADS_REPORT_SHEET_ID", "GCP_PROJECT_NUMBER", "GCP_SERVICE_ACCOUNT_EMAIL", "GCP_WORKLOAD_IDENTITY_POOL_ID", "GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID"] as const;
export const STAGES = ["Env vars", "Vercel OIDC token", "Google STS exchange", "Service account impersonation", "Sheets read"] as const;
export interface Diagnosis {
  /** Each variable's name and whether it is set (never its value). */
  env: { name: string; set: boolean }[];
  /** The stage that failed (1-5), or 0 when every stage passed. */
  failed: number;
  status: number | null;
  code: string;
  message: string;
}

/** A failure at one stage, with Google's HTTP status and short error code / message. */
export class StageError extends Error {
  constructor(readonly stage: number, readonly status: number | null, readonly code: string, message: string) {
    super(message);
  }
}

/** Google's text, cut short, with anything shaped like a token blanked out (it never should contain one). */
export const clean = (s: unknown) => String(s ?? "").replace(/ey[\w-]{10,}\.[\w-]+\.[\w-]*|ya29\.[\w.-]+|Bearer\s+\S+/g, "[hidden]").slice(0, 240);

/**
 * Stage, status and code from an auth library error: it keeps the HTTP response of the failing call, so the URL tells
 * STS (3) from impersonation (4). STS answers {error, error_description}; IAM answers {error: {code, status, message}}.
 */
export function authStage(err: unknown): StageError {
  const e = err as { config?: { url?: unknown }; response?: { status?: number; data?: unknown; config?: { url?: unknown } }; message?: string } | null;
  const url = String(e?.config?.url ?? e?.response?.config?.url ?? "");
  const d = e?.response?.data as { error?: string | { status?: string; code?: number; message?: string }; error_description?: string } | undefined;
  const code = typeof d?.error === "string" ? d.error : (d?.error?.status ?? (d?.error?.code ? String(d.error.code) : ""));
  const message = typeof d?.error === "string" ? d.error_description : (d?.error?.message ?? e?.message);
  return new StageError(url.includes("iamcredentials.") ? 4 : 3, e?.response?.status ?? null, clean(code), clean(message));
}

const diagnose = (failed: number, status: number | null = null, code = "", message = ""): Diagnosis => ({
  env: ENV_NAMES.map((name) => ({ name, set: !!process.env[name] })),
  failed,
  status,
  code,
  message,
});

/* ---------- Sign-in and read ---------- */

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
  let token: string | null | undefined;
  try {
    ({ token } = await authClient(c).getAccessToken());
  } catch (err) {
    throw authStage(err);
  }
  if (!token) throw new StageError(4, null, "", "No access token returned.");
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
    const res = await fetch(url, { headers: auth, cache: "no-store", signal: AbortSignal.timeout(20_000) }).catch((e: unknown) => {
      throw new StageError(5, null, "", clean(e instanceof Error ? e.message : "no answer"));
    });
    if (!res.ok) {
      // Google's error body: {error: {code, status: "PERMISSION_DENIED", message}}.
      const d = (await res.json().catch(() => null)) as { error?: { status?: string; message?: string } } | null;
      throw new StageError(5, res.status, clean(d?.error?.status), clean(d?.error?.message || `Sheets answered ${res.status}`));
    }
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

export type SheetRead = { kind: "off" | "error"; diagnosis: Diagnosis } | { kind: "ok" | "stale"; data: SheetData };

/**
 * The Sheet, from memory when under 15 minutes old. `force` (the Refresh button) reads it now. When Google doesn't
 * answer: the last copy as "stale", or "error" with none. Without env vars or an OIDC token: "off". Never throws.
 */
export async function readGoogleAdsSheet(force = false): Promise<SheetRead> {
  const c = config();
  if (!c) return { kind: "off", diagnosis: diagnose(1) };
  const now = Date.now();
  if (!force && last && now - last.fetchedAt < CACHE_MS) return { kind: "ok", data: last };
  // Right after a failure, don't ask Google again on every page load.
  if (!force && last && now - lastFail < RETRY_MS) return { kind: "stale", data: last };
  // Without a Vercel OIDC token (local runs, or OIDC federation off in the project) there is no way in: "not connected".
  if (!(await oidcPresent())) return last ? { kind: "stale", data: last } : { kind: "off", diagnosis: diagnose(2) };
  try {
    inflight ??= fetchSheet(c).finally(() => (inflight = null));
    last = await inflight;
    return { kind: "ok", data: last };
  } catch (err) {
    lastFail = Date.now();
    const s = err instanceof StageError ? err : new StageError(5, null, "", clean(err instanceof Error ? err.message : "unknown error"));
    const d = diagnose(s.stage, s.status, s.code, s.message);
    // Stage, status and Google's short code only: never a token or header.
    console.error(`Google Ads sheet unreachable: stage ${s.stage} (${STAGES[s.stage - 1]}) ${s.status ?? ""} ${s.code}`.trim());
    return last ? { kind: "stale", data: last } : { kind: "error", diagnosis: d };
  }
}
