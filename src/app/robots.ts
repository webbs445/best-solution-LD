import type { MetadataRoute } from "next";

/*
  /robots.txt. This subdomain is ad landing pages and team tools, never meant for search results: every page and file
  says noindex (layout metadata and the X-Robots-Tag header in next.config; the team dashboard, its CSV and the API
  also say nofollow, noarchive). Nothing is disallowed on purpose: a crawler that is blocked never reads that noindex
  and can still list the bare URL, and Google Ads' landing page checks need the pages open. No sitemap: nothing here
  should be indexed.
*/
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
  };
}
