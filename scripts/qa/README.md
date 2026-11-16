# QA scripts

Browser checks run before every merge. They drive a local Chrome with puppeteer-core, which is not a project
dependency, so install it without saving:

```
npm i --no-save puppeteer-core@24
```

Build and start the site, then run the checks against it:

```
npm run build
npx next start -p 3010
node scripts/qa/strict-scan.mjs     # Google Ads wording: banned words, strict words, claims, prices
node scripts/qa/cloak.mjs           # same text for a browser, Googlebot and AdsBot-Google on every route
node scripts/qa/forms-mock.mjs      # lead forms: nothing on an empty submit, one form_submit after a valid one
```

Each script takes an optional base URL (default `http://localhost:3010`) and exits with 1 when anything fails.
Set `CHROME_PATH` if Chrome is not at `C:/Program Files/Google/Chrome/Application/chrome.exe`.

Rules every run follows:

- Every tag host is blocked (`TAG_HOSTS` in `common.mjs`: Stape `marktmen.best-solution.ae`, `googletagmanager.com`,
  `google-analytics.com`, `googleadservices.com`, `doubleclick.net`, `connect.facebook.net`, Clarity, Bing). Never run
  a test against production without these blocks.
- Lead APIs are answered inside the test browser by `forms-mock.mjs`, so nothing reaches the ERP or the lead sheet.
- Test data only: name `TEST AUDIT - DELETE`, email `test-audit@xerebo.com`, phone `+971500000000`.
- `strict-scan.mjs` allows the corporate tax threshold "AED 375,000" and reports `/privacy` and `/terms` as
  "pending legal" (not counted) while `LEGAL_V2` is `false` in `src/content/legal.ts`.
