/* ============================================================
   /accounting page content, from BestSolution_Accounting_LandingPage.html.
   Google Ads (UAE): no "start/setup/register/documents/fast/guarantee" style words in visitor-facing
   text, and never a price and a speed or time promise in the same block. The footer disclaimer is
   the only place that mentions registrations or government documents.
   ============================================================ */

import { SITE } from "./site";

/*
  CLAIMS: CONFIRM BEFORE GOING LIVE.
  Every number and statement below is shown on /accounting and is still waiting on confirmation
  from Best Solution. Each one is used from here, so a change here updates the whole page.
  Opening hours come from SITE.hours (shared with the home page and /freezone) and are also unconfirmed.
*/
export const AC_CLAIMS = {
  businesses: 5000, // "5,000+ businesses supported", hero "5k"
  professionals: 50, // "50+ in-house professionals"
  accountingSpecialists: 12, // "12+ accounting specialists"
  nationalities: 80, // "80+ client nationalities"
  ownership: "Emirati-owned",
  founded: SITE.founded, // "since 2014", "more than a decade" (shared setting)
  rating: "4.8",
  reviewCount: 200, // "4.8 from 200+ Google reviews"
  packageSaving: 20, // "Save about 20%" on the complete package
  /** From-prices in AED, excluding VAT. */
  prices: { bookkeeping: 800, reconciliation: 1200, statements: 1500 },
  /** Google Business Profile URL. While empty, the review panel shows no Google logo or link. */
  googleProfileUrl: "",
  /** Set to true once every quote is confirmed to include a free 15-minute review (see AC_OFFER_EXTRA). */
  freeReviewWithQuote: false,
};

export const aed = (n: number) => `AED ${n.toLocaleString("en-US")}`;

/* The page's single offer. The free review line only appears once AC_CLAIMS.freeReviewWithQuote is true. */
export const AC_OFFER = "Get a fixed monthly quote";
export const AC_OFFER_EXTRA = AC_CLAIMS.freeReviewWithQuote ? "Includes a free 15-minute review." : "";

export type ServiceKey = "bookkeeping" | "reconciliation" | "statements" | "complete" | "not_sure";

/* Quote form options (step 1). */
export const SERVICE_OPTIONS: { v: ServiceKey; name: string; note: string; icon: string }[] = [
  { v: "bookkeeping", name: "Bookkeeping", note: `From ${aed(AC_CLAIMS.prices.bookkeeping)}/month`, icon: '<path d="M4 4h12l4 4v12H4z"/><path d="M8 10h8M8 14h8"/>' },
  { v: "reconciliation", name: "Bank reconciliation", note: `From ${aed(AC_CLAIMS.prices.reconciliation)}`, icon: '<path d="M3 10l9-6 9 6M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18"/>' },
  { v: "statements", name: "Financial statements", note: `From ${aed(AC_CLAIMS.prices.statements)}`, icon: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>' },
  { v: "complete", name: "Complete package", note: `About ${AC_CLAIMS.packageSaving}% less`, icon: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>' },
  { v: "not_sure", name: "Not sure yet", note: "An accountant will recommend one", icon: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2.2-2.4 3.7M12 17h.01"/>' },
];

/* Service labels for the ERP lead, the health check suggestion and the success card. */
export const SERVICE_NAMES: Record<ServiceKey, string> = {
  bookkeeping: "Monthly bookkeeping",
  reconciliation: "Bank reconciliation",
  statements: "Financial statements",
  complete: "Complete accounting package",
  not_sure: "Advice on the right service",
};

/* Quote form step 2 choices. The API accepts only these values. */
export const VOLUMES = ["Under 50", "50 to 200", "200 to 500", "500+", "Not sure"];
export const SOFTWARE = ["Zoho Books", "QuickBooks", "Tally", "Excel", "None yet"];
export const BOOK_STATES = ["Up to date", "1 to 3 months behind", "3+ months behind", "No books yet"];

/* Books health check: [question, why it matters, short benefit, icon, service suggested for a "no"]. */
export const HEALTH_QUESTIONS: [string, string, string, string, ServiceKey][] = [
  ["Are your books updated every month?", "Monthly entries keep your VAT figures and cash position accurate.", "Keeps VAT figures accurate", '<path d="M4 4h12l4 4v12H4z"/><path d="M8 10h8M8 14h8"/>', "bookkeeping"],
  ["Do your bank balances match your records?", "Unmatched lines often hide missed income, bank fees or duplicate payments.", "Finds missing money", '<path d="M3 10l9-6 9 6M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18"/>', "reconciliation"],
  ["Do you get a monthly profit and loss report?", "A monthly P&L shows where margin is gained or lost, while there is still time to act.", "Shows real profit", '<path d="M4 19V5M4 19h16M8 15l4-4 3 3 5-6"/>', "statements"],
  ["Are your year-end statements ready on time?", "Banks, auditors and business partners usually ask for them.", "Ready when asked", '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>', "statements"],
];

export const HEALTH_AREAS = [
  { title: "Monthly entries", note: "Books updated each month" },
  { title: "Bank matched", note: "Balances agree with records" },
  { title: "Monthly P&L", note: "Profit visible every month" },
  { title: "Year-end ready", note: "Statements on time" },
];

/* Hero typed rotator. */
export const TYPED_WORDS = ["bookkeeping", "bank reconciliation", "financial statements", "VAT-ready books", "month-end close"];

export const MARQUEE = [
  "Bookkeeping",
  "Bank reconciliation",
  "Profit and Loss",
  "Balance Sheet",
  "Cash Flow",
  "VAT-ready books",
  "Zoho Books",
  "QuickBooks",
  "Tally",
  "Catch-up bookkeeping",
  "Audit-ready records",
];

export const AC_STATS = [
  { to: AC_CLAIMS.businesses, label: "Businesses supported" },
  { to: AC_CLAIMS.professionals, label: "In-house professionals" },
  { to: AC_CLAIMS.nationalities, label: "Client nationalities" },
  { to: AC_CLAIMS.accountingSpecialists, label: "Accounting specialists" },
];

/*
  Reviews slider: verified Google reviews from Best Solution clients, wording as published (same as the
  home page). Photos are in public/testimonials. Real reviews only, up to 6; no anonymous entries.
*/
export const AC_REVIEWS: { quote: string; name: string; role: string; company: string; photo: string }[] = [
  {
    quote: "Everything became structured, professional, and stress-free after switching to Best Solution.",
    name: "Hadi Hamedi",
    role: "Chief Executive Officer",
    company: "Soft Miller",
    photo: "hadi-hamedi",
  },
  {
    quote: "25+ years in banking and corporate services, and Best Solution truly stands apart. From day one, I knew I was in safe hands.",
    name: "Michael Doherty",
    role: "Chief Executive Officer",
    company: "Doherty Capital",
    photo: "michael-doherty",
  },
];

export const AC_FAQS = [
  {
    q: "What is included in your monthly accounting service?",
    a: "Bookkeeping of your sales, purchases and expenses, reconciliation of every bank account against your records, and a monthly set of reports. With the complete package you also receive a Profit and Loss statement, Balance Sheet and Cash Flow statement for each reporting period.",
  },
  {
    q: "How much does accounting cost for a small business in Dubai?",
    a: `Bookkeeping is from ${aed(AC_CLAIMS.prices.bookkeeping)} a month, bank reconciliation from ${aed(AC_CLAIMS.prices.reconciliation)} and financial statements from ${aed(AC_CLAIMS.prices.statements)}. Taking all three as the complete package costs about ${AC_CLAIMS.packageSaving}% less than buying them separately. Your final quote depends on transaction volume, number of bank accounts and how up to date your records are, and we confirm it in writing before work begins.`,
  },
  {
    q: "What is the difference between bookkeeping and accounting?",
    a: "Bookkeeping is recording each transaction correctly. Accounting uses those records to check, reconcile and report, so you can see profit, cash position and what you owe. You need accurate bookkeeping before accounting reports mean anything.",
  },
  {
    q: "My books are behind by several months. Can you still help?",
    a: "Yes. Most new clients come to us with incomplete or late records. We begin with a review of what you have, agree a catch-up plan for the missing months, then move you onto a regular monthly routine.",
  },
  {
    q: "Which accounting software do you work with?",
    a: "We work with Zoho Books, QuickBooks and Tally, as well as spreadsheets for smaller businesses. If you do not use any software yet, we recommend one that suits your size and configure it with you.",
  },
  {
    q: "Do you help with VAT and corporate tax?",
    a: "We keep your books in a VAT-ready format and prepare the figures your VAT returns and corporate tax position rely on, then review them with you. Assessments and decisions remain with the Federal Tax Authority.",
  },
  {
    q: "How long do I need to keep accounting records in the UAE?",
    a: "UAE businesses are expected to keep proper accounting records, with the invoices and statements behind them, for several years. Under the UAE Corporate Tax law the period is seven years from the end of the relevant tax period. We keep your records organised so they are easy to produce when an auditor or bank asks.",
  },
  {
    q: "Is my financial data kept confidential?",
    a: "Yes. Your records are handled by your assigned accounting team and kept confidential.",
  },
];

export const AC_NAV = [
  { href: "#services", label: "Services", long: "Services and pricing" },
  { href: "#check", label: "Health check", long: "Books health check" },
  { href: "#process", label: "How it works", long: "How it works" },
  { href: "#reports", label: "Reports", long: "Monthly reports" },
  { href: "#faq", label: "FAQ", long: "FAQ" },
];

/* WhatsApp links with a prefilled message for each place on the page. */
const WA = "https://wa.me/97145531546?text=";
export const AC_WHATSAPP = {
  question: `${WA}Hi%2C%20I%20have%20a%20question%20about%20accounting%20services`,
  quote: `${WA}Hi%2C%20I%27d%20like%20a%20quote%20for%20accounting`,
  talk: `${WA}Hi%2C%20I%27d%20like%20to%20talk%20about%20accounting`,
  sent: `${WA}Hi%2C%20I%20just%20sent%20an%20accounting%20quote%20request`,
};
