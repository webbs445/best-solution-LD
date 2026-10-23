import type { MetadataRoute } from "next";

/*
  /robots.txt. This subdomain is ad landing pages and team tools, never meant for search results: every page and file
  says noindex (layout metadata and the X-Robots-Tag header in next.config). Crawling stays allowed on purpose, because
  a crawler that is blocked never reads that noindex and can still list the bare URL; Google Ads' landing page checks
  need it too. Only the form endpoints and the team dashboard are closed. No sitemap: nothing here should be indexed.
  /ads-conversions.csv stays open for Google Ads' nightly upload.
*/
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/ads-report"] }],
  };
}
