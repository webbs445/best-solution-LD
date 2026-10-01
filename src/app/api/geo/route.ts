import { NextRequest, NextResponse } from "next/server";

/*
  Per-visitor geo lookup for the cookie banner and page_data, ported from best-solution.ae.
  Never cached: it must answer per visitor. Reads Cloudflare's headers when the site sits behind
  Cloudflare, otherwise Vercel's.
*/
export const dynamic = "force-dynamic";

// GDPR-style consent applies here: EU27 + EEA + UK + Switzerland. These visitors get a banner with a
// real reject option; everyone else gets the accept-to-enter wall (same as the main site).
const EU_CONSENT_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE", // EU27
  "IS", "LI", "NO", // EEA / EFTA
  "GB", // UK GDPR
  "CH", // Swiss FADP
]);

export async function GET(req: NextRequest) {
  const country = (req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || "").toUpperCase();

  // City/region/postal/timezone need Cloudflare's "Add visitor location headers" transform, or Vercel.
  // All are IP-derived approximations.
  const vercelCity = req.headers.get("x-vercel-ip-city");
  const city = req.headers.get("cf-ipcity") || (vercelCity ? decodeURIComponent(vercelCity) : "") || null;
  const region = req.headers.get("cf-region") || req.headers.get("x-vercel-ip-country-region") || null;
  const postal_code = req.headers.get("cf-postal-code") || null;
  const timezone = req.headers.get("cf-timezone") || req.headers.get("x-vercel-ip-timezone") || null;

  // Unknown or anonymised (XX, T1 = Tor): treat as EU, i.e. err toward the reject-capable banner.
  const eu = !country || country === "XX" || country === "T1" || EU_CONSENT_COUNTRIES.has(country);

  return NextResponse.json(
    { eu, country: country || null, city, region, postal_code, timezone },
    { headers: { "Cache-Control": "no-store" } },
  );
}
