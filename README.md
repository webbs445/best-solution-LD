# Best Solution: UAE Business Setup Cost Calculator

A Next.js 16 (App Router, TypeScript) build of the Best Solution landing page and its guided cost calculator.

## Run it

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
npm test                     # pricing and validation tests
npm run lint && npm run typecheck
```

## Before going live

| Variable | Owner | Purpose |
| --- | --- | --- |
| `LEAD_ENDPOINT` | Anshad | Make.com webhook or Frappe URL that receives leads. Server-only: the browser posts to `/api/lead`, which validates the lead and forwards it. Until this is set, the form says it is not connected. |
| `NEXT_PUBLIC_GTM_ID` | Rizal | GTM container ID. Loads GTM (script and noscript) when set. |
| `NEXT_PUBLIC_THANK_YOU_URL` | Optional | Redirect after a successful submission. Empty = inline confirmation. |

The forwarded lead has the same JSON shape as the original page: `lead_name`, `email_id`, `mobile_no`, UTM fields, `landing_page`, `form_id`, `submission_timestamp`, `answers` and `estimate`. The estimate is recalculated on the server, so it can't be edited in the browser.

dataLayer events keep the original names: `calculator_step`, `calculator_complete`, `jurisdiction_view`, `cta_click`, `form_start`, `generate_lead`.

## Where things live

- `src/lib/pricing.ts`: **rate card** (`DATA`, `RATES`) and the pure `estimate()` / `stepOrder()` logic. Update prices here.
- `public/`: the logo (`brand/`), site photos (`images/`), free zone logos (`authorities/`) and testimonial photos and company logos (`testimonials/`).
- `src/content/site.ts`: contact details, header nav, footer columns and social links, authority list, reviews, FAQs (also used for the FAQ schema), jurisdiction copy and photos.
- `src/content/calculator.ts`: calculator questions and answer options.
- `src/components/*`: one folder per section; each has a CSS Module next to it. Design tokens are in `src/app/globals.css`.
- `src/app/api/lead/route.ts`: lead validation and forwarding (with a honeypot spam trap).

### `/freezone` (free zone planner landing page)

- `src/app/freezone/page.tsx`: the page, its metadata and FAQ schema. `freezone.css` holds its styles, all scoped under `.fz-page`.
- `src/content/freezone.ts`: **free zone rate card** (28 zones, package tables, package terms in `PK`), the activity search index and the page's FAQs. Update free zone prices here.
- `src/content/activity-icons.json`: icons for the activity search.
- `src/lib/freezone.ts`: the planner's pure estimate, ranking and search logic (tested in `freezone.test.ts`). `/api/lead` uses it to re-price planner leads on the server.
- `src/components/freezone/*`: the page's sections. The header and footer are this page's own; GTM, consent, the cookie banner and the callback popup are shared with the home page.
- `public/zones/`: free zone logos for the planner and zone explorer.

### `/accounting` (accounting and bookkeeping landing page)

- `src/app/accounting/page.tsx`: the page, its metadata and FAQ schema. `accounting.css` holds its styles, all scoped under `.ac-page` (converted from `BestSolution_Accounting_LandingPage.html`).
- `src/content/accounting.ts`: services and **from-prices**, the health check questions, reviews, FAQs and WhatsApp links.
  - `AC_CLAIMS`: every number and claim on the page (businesses, team size, rating, prices, package saving, Google profile link). **Confirm before going live.** Setting `freeReviewWithQuote` to true adds "Includes a free 15-minute review" to the offer.
  - `AC_TEAM`: the "Your accounting team" strip. Placeholders until `AC_TEAM_READY` is true; until then it shows only in `npm run dev`.
- Google Ads wording: no start/setup/register/documents/fast/guarantee style words in visitor text, and no price next to a speed or time promise. Registrations and government documents are mentioned only in the footer disclaimer.
- `src/components/accounting/*`: the page's sections (hero flow animation, pinned service cards, health check, timeline, report preview, reviews, FAQ, 3-step quote form, footer).
- `src/app/api/accounting/route.ts`: the quote request, validated and sent to the ERP as a lead (form id "LP Accounting Quote"), with the visitor's answers and health check result.
- GTM: the layout's container; the page adds `health_check_start` / `health_check_complete`, `service_card_view`, `report_tab`, `form_step` and the `form_submit` conversion.
