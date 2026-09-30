import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
