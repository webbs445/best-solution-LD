import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/*
  Access to the Google Ads lead file and the lead dashboard, with ADS_EXPORT_USER / ADS_EXPORT_PASSWORD.
  Google's fetcher uses basic auth. Both also accept a 30-day sign-in cookie, set by the
  dashboard's sign-in form, so the team is not asked again every time the browser restarts. Changing the password signs everyone out.
*/

const digest = (v: string) => createHash("sha256").update(v).digest();
const same = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

export const ADS_SESSION_COOKIE = "bs_ads_session";
const SESSION_DAYS = 30;

function credentials() {
  const user = process.env.ADS_EXPORT_USER;
  const pass = process.env.ADS_EXPORT_PASSWORD;
  return user && pass ? { user, pass } : null;
}

const notFound = () => new Response("Not found", { status: 404 });
const sessionToken = (c: { user: string; pass: string }) => createHmac("sha256", c.pass).update(`ads-report:${c.user}`).digest("hex");

function basicOk(request: Request, c: { user: string; pass: string }): boolean {
  const [scheme, token] = (request.headers.get("authorization") || "").split(" ");
  const given = scheme === "Basic" && token ? Buffer.from(token, "base64").toString() : "";
  return same(given, `${c.user}:${c.pass}`);
}

function cookieOk(request: Request, c: { user: string; pass: string }): boolean {
  const cookie = (request.headers.get("cookie") || "").match(new RegExp(`(?:^|;\\s*)${ADS_SESSION_COOKIE}=([a-f0-9]+)`))?.[1] ?? "";
  return same(cookie, sessionToken(c));
}

/** The CSV: basic auth (Google), or the dashboard sign-in cookie (the team). The response to send when refused, or null when the request may go on. */
export function adsAuthFailure(request: Request): Response | null {
  const c = credentials();
  // Without both set, the links are off.
  if (!c) return notFound();
  if (basicOk(request, c) || cookieOk(request, c)) return null;
  return new Response("Unauthorized", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="ads-export"' } });
}

/** The dashboard: "off" when not configured, "in" with a valid sign-in cookie or basic auth, else "out". */
export function adsSessionState(request: Request): "off" | "in" | "out" {
  const c = credentials();
  if (!c) return "off";
  return cookieOk(request, c) || basicOk(request, c) ? "in" : "out";
}

/** The Set-Cookie value after a correct sign-in, or null when the username or password is wrong. */
export function adsSignIn(user: string, pass: string): string | null {
  const c = credentials();
  if (!c || !(same(user, c.user) && same(pass, c.pass))) return null;
  return `${ADS_SESSION_COOKIE}=${sessionToken(c)}; Path=/; Max-Age=${SESSION_DAYS * 86_400}; HttpOnly; Secure; SameSite=Lax`;
}

/** Clears the sign-in cookie. */
export const ADS_SIGN_OUT_COOKIE = `${ADS_SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
