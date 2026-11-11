import { ASK_FEES, CLAIMS, statTile } from "@/content/site";
/* ============================================================
   /accounting page content, from BestSolution_Accounting_LandingPage.html.
   Google Ads (UAE): no "start/setup/register/documents/fast/guarantee" style words in visitor-facing
   text, and never a price and a speed or time promise in the same block. The footer disclaimer is
   the only place that mentions registrations or government documents.
   ============================================================ */

/*
  [CONFIRM] Accounting fees: a business decision for Best Solution. While false, the page shows NO fee figures and
  no package saving anywhere (left out of the HTML at build time and folded out of the production JS). Set it to
  true only once the fees below are confirmed; every figure then reads "From AED x <unit>, plus VAT".
  Business claims (rating, years, team size, ownership) come only from CLAIMS in content/site.ts.
*/
export const AC_FEES_CONFIRMED = false;
// ponytail: the dev bundle still holds these bare numbers (no "AED" beside them); production minification drops them while the flag is false.
export const AC_FEES = AC_FEES_CONFIRMED
  ? {
      bookkeeping: { amount: 800, unit: "per month" },
      reconciliation: { amount: 1200, unit: "per reconciliation" },
      statements: { amount: 1500, unit: "per set" },
    }
  : null;

export const aed = (n: number) => `AED ${n.toLocaleString("en-US")}`;
/** "From AED 800 per month, plus VAT". Only used while AC_FEES is set. */
export const feeLine = (f: { amount: number; unit: string }) => `From ${aed(f.amount)} ${f.unit}, plus VAT`;

/*
  Stats band. Every number is a claim: shown only once Best Solution confirms it (content/site CLAIMS), as a final
  value, never counted up. Until then each tile shows plain, true text in the same style.
*/
export const AC_STATS: { value: string; label: string }[] = [
  statTile(CLAIMS.businesses, "Businesses supported", "office"),
  statTile(CLAIMS.team, "In-house professionals", "meet"),
  statTile(CLAIMS.countries, "Client nationalities", "explain"),
  statTile(null, "", "support"),
];

/* The page's single offer. */
/** "Get a written quote" only once the written quote is confirmed (content/site CLAIMS.writtenQuote). */
export const AC_OFFER = CLAIMS.writtenQuote ? "Get a written quote" : "Get a quote";

export type ServiceKey = "bookkeeping" | "reconciliation" | "statements" | "complete" | "not_sure";

/* Quote form options (step 1). */
export const SERVICE_OPTIONS: { v: ServiceKey; name: string; note: string; icon: string }[] = [
  { v: "bookkeeping", name: "Bookkeeping", note: AC_FEES ? feeLine(AC_FEES.bookkeeping) : "Monthly records", icon: '<path d="M4 4h12l4 4v12H4z"/><path d="M8 10h8M8 14h8"/>' },
  { v: "reconciliation", name: "Bank reconciliation", note: AC_FEES ? feeLine(AC_FEES.reconciliation) : "Every bank account", icon: '<path d="M3 10l9-6 9 6M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18"/>' },
  { v: "statements", name: "Financial statements", note: AC_FEES ? feeLine(AC_FEES.statements) : "P&L, Balance Sheet, Cash Flow", icon: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>' },
  { v: "complete", name: "Complete package", note: "All three together", icon: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>' },
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
  ["Do your bank balances match your records?", "Unmatched lines often hide missed income, bank fees or duplicate payments.", "Flags unmatched lines", '<path d="M3 10l9-6 9 6M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18"/>', "reconciliation"],
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
    a: `${
      AC_FEES
        ? `Bookkeeping is ${feeLine(AC_FEES.bookkeeping).toLowerCase()}, bank reconciliation ${feeLine(AC_FEES.reconciliation).toLowerCase()} and financial statements ${feeLine(AC_FEES.statements).toLowerCase()}. `
        : ""
    }Your fee depends on transaction volume, the number of bank accounts and how up to date your records are. An accountant reviews your details${CLAIMS.writtenQuote ? " and confirms the fee in a written quote before work begins." : `. ${ASK_FEES}`} Fees exclude VAT.`,
  },
  {
    q: "My books are behind by several months. Can you still help?",
    a: "Yes. Most new clients come to us with incomplete or late records. We begin with a review of what you have, agree a catch-up plan for the missing months, then move you onto a regular monthly routine.",
  },
  {
    q: "Do you help with VAT and corporate tax?",
    a: "We keep your books in a VAT-ready format and prepare the figures your VAT returns and corporate tax position rely on, then review them with you. Assessments and decisions remain with the Federal Tax Authority.",
  },
  {
    q: "Is my financial data kept confidential?",
    a: "Yes. Your records are handled by your assigned accounting team and kept confidential.",
  },
];

export const AC_NAV = [
  { href: "#services", label: "Services", long: AC_FEES ? "Services and pricing" : "Services" },
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
