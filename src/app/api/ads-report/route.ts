import { ADS_SIGN_OUT_COOKIE, adsSessionState, adsSignIn } from "@/lib/adsAuth";
import { adsLoginHtml, adsReportHtml, REPORT_START } from "@/lib/adsReport";
import { readAdsSheet } from "@/lib/adsSheet";
import { listLeads } from "@/lib/erp";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { adLandingsResponse } from "@/lib/adLandingsView";
import { googleAdsResponse } from "@/lib/googleAdsView";

/* /ads-report: the team's dashboard of new Google Ads leads, live from the ERP. Signs in with the CSV's username and
   password (lib/adsAuth) and stays signed in for 30 days on that browser. */
export const dynamic = "force-dynamic";

const PRIVATE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow, noarchive" };
const html = (body: string, status = 200, extra: Record<string, string> = {}) =>
  new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", ...PRIVATE, ...extra } });
/* After signing in or out, back to the view the form was on (from the Referer; only the known view names). */
const VIEWS = ["erp", "landings", "google-ads"];
const back = (cookie: string, request: Request) => {
  let view = "";
  try {
    view = new URL(request.headers.get("referer") ?? "").searchParams.get("view") ?? "";
  } catch {
    // No or bad Referer: the default view.
  }
  const location = VIEWS.includes(view) ? `/ads-report?view=${view}` : "/ads-report";
  return new Response(null, { status: 303, headers: { Location: location, "Set-Cookie": cookie, ...PRIVATE } });
};

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  if (query.has("signout")) return back(ADS_SIGN_OUT_COOKIE, request);
  const state = adsSessionState(request);
  if (state === "off") return new Response("Not found", { status: 404 });
  if (state === "out") return html(adsLoginHtml(), 401);
  // The old "Google leads" view (a setup checklist for a Google Ads API that was never connected) is gone: its links
  // land on the default view, with the same range.
  if (query.get("view") === "google") {
    const rest = new URLSearchParams(query);
    rest.delete("view");
    return new Response(null, { status: 307, headers: { Location: `/ads-report${rest.size ? `?${rest}` : ""}`, ...PRIVATE } });
  }
  // Third view: ad landings and cookie banner choices (server-rendered, same sign-in and look).
  if (query.get("view") === "landings") return adLandingsResponse(query);
  // Fourth view: Google Ads performance from the report Sheet (read only).
  if (query.get("view") === "google-ads") return googleAdsResponse(query);

  // ERP down: the page still loads and says so (null leads). The sheet adds the leads the ERP hides.
  const [leads, sheet] = await Promise.all([listLeads(REPORT_START), readAdsSheet()]);
  return html(adsReportHtml(leads, sheet, query));
}

/** The sign-in form (10 tries per 15 minutes per IP) and the sign-out button. */
export async function POST(request: Request) {
  if (adsSessionState(request) === "off") return new Response("Not found", { status: 404 });
  const form = await request.formData().catch(() => null);
  if (form?.get("action") === "signout") return back(ADS_SIGN_OUT_COOKIE, request);
  if (!rateLimit(`ads-login:${clientIp(request)}`, 10, 15 * 60_000)) return html(adsLoginHtml("Too many tries. Please wait 15 minutes."), 429);
  const cookie = adsSignIn(String(form?.get("user") ?? ""), String(form?.get("pass") ?? ""));
  return cookie ? back(cookie, request) : html(adsLoginHtml("Wrong username or password. Check both and try again."), 401);
}
