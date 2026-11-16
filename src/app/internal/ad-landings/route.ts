/* /internal/ad-landings moved into the ads dashboard as its third view: forward there with the same query. */
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  q.set("view", "landings");
  return new Response(null, { status: 308, headers: { Location: `/ads-report?${q}`, "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
}
