import { allowedOrigin, countBeacon, kvConfigured, parseBeacon } from "@/lib/adLandings";

/*
  Ad landing counter (components/analytics/AdLandingCounter). Adds to today's aggregate totals only. The Origin header
  is the one thing read from the request (only beacons from our own pages count); no IP, cookies or click ID values.
  Capped at DAILY_CAP beacons per path per day. Always 204, so the beacon never retries or errors.
*/
export async function POST(request: Request) {
  if (!allowedOrigin(request.headers.get("origin"))) return new Response(null, { status: 204 });
  const beacon = parseBeacon(await request.text());
  if (beacon && kvConfigured()) {
    try {
      await countBeacon(beacon);
    } catch {
      // A lost count is fine; the page never waits on this.
    }
  }
  return new Response(null, { status: 204 });
}
