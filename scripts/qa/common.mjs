// Shared by the QA scripts: target URL, routes, the tag hosts every test must block, and the browser.
import puppeteer from "puppeteer-core";

/** First argument, or the local production build (npm run build && npx next start -p 3010). */
export const BASE = (process.argv[2] || "http://localhost:3010").replace(/\/$/, "");

/** Every test run blocks these, so no test hit ever reaches GA4, Google Ads, Stape, Meta, Clarity or Bing. */
export const TAG_HOSTS = /marktmen\.best-solution\.ae|googletagmanager\.com|google-analytics\.com|analytics\.google\.com|googleadservices\.com|doubleclick\.net|connect\.facebook\.net|facebook\.com\/tr|clarity\.ms|bat\.bing/;

export const ZONE_PATHS = ["dmcc", "meydan", "rakez", "shams", "ifza", "ajman", "spc", "dafza"].map((z) => `/freezone/${z}`);
export const ROUTES = [
  "/", "/services", "/mainland", "/offshore", "/freezone",
  ...["planner", "compare", "activity", "budget", "vs-mainland", "consultation", "dubai"].map((v) => `/freezone/${v}`),
  ...ZONE_PATHS,
  "/cost-calculator", "/corporate-tax", "/spv", "/accounting", "/consult", "/privacy", "/terms",
];

export const launch = () =>
  puppeteer.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, protocolTimeout: 300000 });

/** Abort every tag host on this page (call before the first goto). */
export async function blockTags(page, onRequest) {
  await page.setRequestInterception(true);
  page.on("request", (q) => {
    if (TAG_HOSTS.test(q.url())) return q.abort();
    if (onRequest && onRequest(q)) return;
    q.continue();
  });
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
