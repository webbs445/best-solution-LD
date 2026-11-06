import { NextResponse, type NextRequest } from "next/server";

/*
  /cost-calculator used to switch language from ?lang=ar|fr|ru|zh (and en). The page is English only since the Google
  Ads compliance rewrite (Nov 2026), so those URLs 301 to the English page. Only ?lang is dropped: gclid, gbraid,
  wbraid and UTMs stay on the URL so attribution still works. Runs on /cost-calculator only (matcher).
*/
export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  if (!url.searchParams.has("lang")) return NextResponse.next();
  url.searchParams.delete("lang");
  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: "/cost-calculator",
};
