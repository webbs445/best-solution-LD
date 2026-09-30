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
