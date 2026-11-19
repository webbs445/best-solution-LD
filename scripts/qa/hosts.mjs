// Hosts no automated test may reach: the QA browser scripts (common.mjs) abort them, and the unit tests
// (vitest.setup.mjs) make fetch throw for them. One list, so the two can't drift apart.

/** Tags: no test hit ever reaches GA4, Google Ads, Stape, Meta, Clarity or Bing. */
export const TAG_HOSTS = /marktmen\.best-solution\.ae|googletagmanager\.com|google-analytics\.com|analytics\.google\.com|googleadservices\.com|doubleclick\.net|connect\.facebook\.net|facebook\.com\/tr|clarity\.ms|bat\.bing/;

/** Google: the Sheets and Cloud APIs, and the Apps Script bridge the Google Ads view reads (and its redirect target). */
export const GOOGLE_API_HOSTS = /sts\.googleapis\.com|iamcredentials\.googleapis\.com|sheets\.googleapis\.com|script\.google\.com|script\.googleusercontent\.com/;

export const BLOCKED_HOSTS = new RegExp(`${TAG_HOSTS.source}|${GOOGLE_API_HOSTS.source}`);
