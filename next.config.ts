import type { NextConfig } from "next";

/* Google Ads sitelink paths. Each serves the landing page itself (HTTP 200, no redirect, URL and
   query string kept); SectionDeepLink then opens the matching section. */
const SITELINK_PATHS = ["calculator", "mainland", "free-zone", "offshore", "consultation", "reviews"] as const;

const nextConfig: NextConfig = {
  // The dashboard reads its page template at run time.
  outputFileTracingIncludes: { "/api/ads-report": ["./src/lib/adsReportPage.html"] },
  async rewrites() {
    return [
      ...SITELINK_PATHS.map((path) => ({ source: `/${path}`, destination: "/" })),
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
