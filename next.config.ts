import type { NextConfig } from "next";

/* Old sitelink paths that used to serve the home page: each now goes to the page about that topic. 301 (not the
   308 that `permanent` gives) as the owner asked; Next keeps the query string (gclid, gbraid, wbraid, UTMs). */
const SITELINK_REDIRECTS = [
  { source: "/free-zone", destination: "/freezone" },
  { source: "/calculator", destination: "/cost-calculator" },
  { source: "/consultation", destination: "/consult" },
  { source: "/reviews", destination: "/services#reviews" },
];

const nextConfig: NextConfig = {
  // The dashboard reads its page template at run time.
  outputFileTracingIncludes: { "/api/ads-report": ["./src/lib/adsReportPage.html"] },
  // Nothing on this subdomain goes in search results: the header also covers images, PDFs and other files the
  // pages' noindex tag can't reach. Crawling stays allowed so it is seen (src/app/robots.ts).
  async headers() {
    // A later rule wins for the same header: the private dashboard and API also say nofollow (this replaces the route's own value).
    const noFollow = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
      { source: "/ads-report", headers: noFollow },
      { source: "/ads-conversions.csv", headers: noFollow },
      { source: "/api/:path*", headers: noFollow },
    ];
  },
  async redirects() {
    return SITELINK_REDIRECTS.map((r) => ({ ...r, statusCode: 301 as const }));
  },
  async rewrites() {
    return [
      // Google Ads only fetches scheduled uploads from a URL ending in .csv.
      { source: "/ads-conversions.csv", destination: "/api/ads-conversions" },
      // The same data as a readable page for the team.
      { source: "/ads-report", destination: "/api/ads-report" },
    ];
  },
  images: {
    // Remote photography used by the hero, "Why Best Solution" and jurisdiction panels.
    remotePatterns: [
      { protocol: "https", hostname: "www.best-solution.ae" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    qualities: [75, 85],
  },
};

export default nextConfig;
