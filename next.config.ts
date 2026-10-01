import type { NextConfig } from "next";

/* Google Ads sitelink paths. Each serves the landing page itself (HTTP 200, no redirect, URL and
   query string kept); SectionDeepLink then opens the matching section. */
const SITELINK_PATHS = ["calculator", "mainland", "free-zone", "offshore", "consultation", "reviews"] as const;

const nextConfig: NextConfig = {
  async rewrites() {
    return SITELINK_PATHS.map((path) => ({ source: `/${path}`, destination: "/" }));
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
