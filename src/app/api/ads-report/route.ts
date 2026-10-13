import { ADS_SIGN_OUT_COOKIE, adsSessionState, adsSignIn } from "@/lib/adsAuth";
import { adsLoginHtml, adsReportHtml, REPORT_START } from "@/lib/adsReport";
import { readAdsSheet } from "@/lib/adsSheet";
import { listLeads } from "@/lib/erp";
import { clientIp, rateLimit } from "@/lib/rateLimit";

/* /ads-report: the team's dashboard of new Google Ads leads, live from the ERP. Signs in with the CSV's username and
   password (lib/adsAuth) and stays signed in for 30 days on that browser. */
export const dynamic = "force-dynamic";

const PRIVATE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
const html = (body: string, status = 200, extra: Record<string, string> = {}) =>
  new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", ...PRIVATE, ...extra } });
const back = (cookie: string) => new Response(null, { status: 303, headers: { Location: "/ads-report", "Set-Cookie": cookie, ...PRIVATE } });

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  if (query.has("signout")) return back(ADS_SIGN_OUT_COOKIE);
  const state = adsSessionState(request);
  if (state === "off") return new Response("Not found", { status: 404 });
  if (state === "out") return html(adsLoginHtml(), 401);

  // ERP down: the page still loads and says so (null leads). The sheet adds the leads the ERP hides.
  const [leads, sheet] = await Promise.all([listLeads(REPORT_START), readAdsSheet()]);
  return html(adsReportHtml(leads, sheet, query));
}

/** The sign-in form (10 tries per 15 minutes per IP) and the sign-out button. */
export async function POST(request: Request) {
  if (adsSessionState(request) === "off") return new Response("Not found", { status: 404 });
  const form = await request.formData().catch(() => null);
  if (form?.get("action") === "signout") return back(ADS_SIGN_OUT_COOKIE);
  if (!rateLimit(`ads-login:${clientIp(request)}`, 10, 15 * 60_000)) return html(adsLoginHtml("Too many tries. Please wait 15 minutes."), 429);
  const cookie = adsSignIn(String(form?.get("user") ?? ""), String(form?.get("pass") ?? ""));
  return cookie ? back(cookie) : html(adsLoginHtml("That username or password is not right."), 401);
}
