import { createHash, timingSafeEqual } from "node:crypto";

/*
  Basic auth for the Google Ads lead file and its report page, with ADS_EXPORT_USER / ADS_EXPORT_PASSWORD.
  Returns the response to send when access is refused, or null when the request may go on.
*/

const digest = (v: string) => createHash("sha256").update(v).digest();
const same = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

export function adsAuthFailure(request: Request): Response | null {
  const user = process.env.ADS_EXPORT_USER;
  const pass = process.env.ADS_EXPORT_PASSWORD;
  // Without both set, the links are off.
  if (!user || !pass) return new Response("Not found", { status: 404 });
  const [scheme, token] = (request.headers.get("authorization") || "").split(" ");
  const given = scheme === "Basic" && token ? Buffer.from(token, "base64").toString() : "";
  if (same(given, `${user}:${pass}`)) return null;
  return new Response("Unauthorized", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="ads-export"' } });
}
