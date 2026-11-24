import { NextResponse, type NextRequest } from "next/server";

/*
  Three jobs, all keeping the query string (gclid, gbraid, wbraid, UTMs) so attribution survives:
  - /xservicesx and /xservicesx/ 301 to /services in one hop (the Services page was built at /xservicesx).
  - Trailing slashes: next.config sets skipTrailingSlashRedirect, so this does Next's usual 308 to the URL without the
    slash. Without that, /xservicesx/ would go 308 to /xservicesx, then 301 to /services: a chain.
  - /cost-calculator used to switch language from ?lang=ar|fr|ru|zh (and en). The page is English only since the
    Google Ads compliance rewrite (Nov 2026), so those URLs 301 to the English page; only ?lang is dropped.
*/
export function proxy(request: NextRequest) {
  // A plain URL: nextUrl keeps the incoming trailing slash and would put it back on the redirect target.
  const url = new URL(request.url);
  if (url.pathname === "/xservicesx" || url.pathname === "/xservicesx/") {
    url.pathname = "/services";
    return NextResponse.redirect(url, 301);
  }
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return NextResponse.redirect(url, 308);
  }
  if (url.pathname === "/cost-calculator" && url.searchParams.has("lang")) {
    url.searchParams.delete("lang");
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

export const config = {
  // Every page path; not Next's own files or files with an extension (images, robots.txt, the .csv export).
  matcher: "/((?!_next/|.*\\.[a-zA-Z0-9]+$).*)",
};
