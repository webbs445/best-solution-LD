# QA scripts

Browser checks run before every merge. They drive a local Chrome with puppeteer-core.

## Setup (once per machine)

puppeteer-core is not in `package.json` (the site doesn't need it), so install it in the repo folder without saving:

```
npm i --no-save puppeteer-core@24
```

Run this again after any `npm ci` or `npm install`, which removes packages that aren't in `package.json`.

## Run

Build and start the site, then run the checks against it:

```
npm run build
npx next start -p 3010
node scripts/qa/strict-scan.mjs     # Google Ads wording: banned words, strict words, claims, prices
node scripts/qa/cloak.mjs           # same text for a browser, Googlebot and AdsBot-Google on every route
node scripts/qa/forms-mock.mjs      # lead forms: nothing on an empty submit, one form_submit after a valid one
node scripts/qa/xservicesx.mjs      # /services (the old /xservicesx 301s there): widths 320 to 1920, page state, buttons to the form, errors, success, sticky bar, axe
```

Each script takes an optional base URL (default `http://localhost:3010`) and exits with 1 when anything fails.
Set `CHROME_PATH` if Chrome is not at `C:/Program Files/Google/Chrome/Application/chrome.exe`.

Rules every run follows:

- Every tag host is blocked (`TAG_HOSTS` in `hosts.mjs`: Stape `marktmen.best-solution.ae`, `googletagmanager.com`,
  `google-analytics.com`, `googleadservices.com`, `doubleclick.net`, `connect.facebook.net`, Clarity, Bing). Never run
  a test against production without these blocks.
- Every Google host is blocked too (`GOOGLE_API_HOSTS` in `hosts.mjs`: `sts.googleapis.com`,
  `iamcredentials.googleapis.com`, `sheets.googleapis.com`, and the Apps Script bridge the Google Ads view reads,
  `script.google.com` with its redirect target `script.googleusercontent.com`), so no test reaches Google or the real
  bridge. This applies to every automated test: the browser scripts abort these hosts (`blockTags`), the unit tests
  get a `fetch` that throws for them (`vitest.setup.mjs`), and a local server mock answers them itself and never
  passes a request through.
- Lead APIs are answered inside the test browser by `forms-mock.mjs`, so nothing reaches the ERP or the lead sheet.
- Test data only: name `TEST AUDIT - DELETE`, email `test-audit@xerebo.com`, phone `+971500000000`.
- `strict-scan.mjs` allows the corporate tax threshold "AED 375,000" everywhere, and on `/corporate-tax` any AED amount
  as a tax fact unless fee(s), price, pricing, cost, package, "from AED" or "starting at" is within about 6 words. It reports `/privacy` and `/terms` as
  "pending legal" (not counted) while `LEGAL_V2` is `false` in `src/content/legal.ts`.

## Google Ads view

`google-ads-view.mjs` uses the view the way the team does (phone and desktop tasks, number checks against the
fixture, keyboard, tap targets, timing, screenshots). The site runs against `google-ads-mock.mjs`, which answers as the
Sheet bridge, the ERP and the landing counter from `fixtures/googleAdsFixture.mjs`, so nothing reaches the real ones:

```
npm run build
# PowerShell: set these, then start (sign-in values are local only)
$env:ADS_SHEET_BRIDGE_URL="http://127.0.0.1:4799/bridge"; $env:ADS_SHEET_BRIDGE_TOKEN="qa-bridge-token"
$env:ERPNEXT_URL="http://127.0.0.1:4799"; $env:ERPNEXT_API_KEY="qa"; $env:ERPNEXT_API_SECRET="qa"
$env:KV_REST_API_URL="http://127.0.0.1:4799/kv"; $env:KV_REST_API_TOKEN="qa"
$env:ADS_EXPORT_USER="qa"; $env:ADS_EXPORT_PASSWORD="qa-local-only"
# The fixture's dates are written for one day: the server's clock starts there (local QA server only)
$env:NODE_OPTIONS="--import=./scripts/qa/fixed-clock.mjs"
npx next start -p 3010
node scripts/qa/google-ads-view.mjs http://localhost:3010 qa-out   # starts the mock itself; same ADS_EXPORT_* set
node scripts/qa/google-ads-boxes.mjs http://localhost:3010 qa-out  # nothing outside its card at 375/1024/1280/1440
node scripts/qa/robots-headers.mjs http://localhost:3010           # report routes noindex, nofollow, noarchive; landing pages noindex only
node scripts/qa/google-ads-stream.mjs http://localhost:3010 qa-out # loading shell first, then the view (needs a server started after a fresh mock)
node scripts/qa/google-ads-timing.mjs http://localhost:3010 3      # first byte, whole page and Server-Timing per load (no browser)
```

The mock keeps the Sheet cache (`gads:sheet:v1`) in memory for as long as it runs. `MOCK_BRIDGE_MS` and `MOCK_ERP_MS`
make the bridge and the ERP answer that much later, like the real ones.

Without the `ERPNEXT_*` values the view runs on Google conversions, as on Vercel Preview; run the box check that way too.

Requests may leave only for the site and Google Fonts; anything else is aborted and listed in the report.
