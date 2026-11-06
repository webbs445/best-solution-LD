/* /corporate-tax page content shared by the page, its script and /api/corporate-tax. */

/** Shown as the FAQ list and as FAQPage structured data. */
export const CT_FAQS: { q: string; a: string }[] = [
  {
    q: "Who has to pay UAE Corporate Tax?",
    a: "Generally, mainland and free zone companies, and individuals whose business turnover is above AED 1 million in a calendar year, fall within Corporate Tax. Taxable profit up to AED 375,000 is taxed at 0% and profit above it at 9%. Each business generally files an annual return. Your advisor confirms what applies to you.",
  },
  {
    q: "My free zone company expects 0%. Do I still need to file?",
    a: "Generally, yes. A free zone company files a return every year, even when it expects 0% on qualifying income. To keep the 0% rate it generally also needs audited financial statements and must meet the substance and qualifying income conditions. Your advisor confirms what applies to you.",
  },
  {
    q: "What is Small Business Relief?",
    a: "Generally, if your revenue is AED 3 million or less, you can elect to be treated as having no taxable income, for tax periods ending on or before 31 December 2029, as long as your revenue has stayed at or below AED 3 million in each earlier tax period. You elect it in your return each year. Losses cannot be used in a year you elect it, so it is worth checking with your advisor first.",
  },
  {
    q: "When is my Corporate Tax return due?",
    a: "Generally, your return and any tax due are both due within nine months of the end of your tax period. For a 31 December year end, that is 30 September of the following year. Your advisor confirms the dates that apply to you.",
  },
  {
    q: "What happens if I miss a deadline?",
    a: "Late filing and late payment can lead to penalties set by the FTA. Your advisor explains what applies to you.",
  },
  {
    q: "Do I need audited financial statements?",
    a: "Generally, audited statements are required for Qualifying Free Zone Persons and for businesses with revenue above AED 50 million. Businesses generally keep proper accounts and records for seven years. Your advisor confirms what applies to you.",
  },
  {
    q: "How much does your service cost?",
    a: "It depends on the size of your business and the state of your books. After your review call you receive a written fee breakdown, before any work begins.",
  },
];

/** The review form's choices; /api/corporate-tax passes on only these exact values. */
export const CT_BUSINESS = ["Mainland company", "Free zone company", "Freelancer or sole trader", "Holding company", "Not sure"] as const;
export const CT_REVENUE = ["Up to AED 1 million", "AED 1M to 3M", "AED 3M to 50M", "Above AED 50M", "Prefer not to say"] as const;
export const CT_HELP = ["Understanding my obligations", "Preparing my return", "Checking reliefs and exemptions", "Free zone 0% review", "Not sure yet"] as const;

/*
  Trust details. Fill only with real, verified facts; anything left empty stays hidden on the page.
  rating: from the Google Business Profile, e.g. { score: "4.9", count: 120, url: "https://g.page/r/..." }.
  ftaAgent: true only if the team are registered FTA tax agents. reviews: real, approved quotes.
*/
export const CT_TRUST: {
  rating: { score: string; count: number; url?: string } | null;
  since: number | null;
  ftaAgent: boolean;
  reviews: { quote: string; name: string; company?: string; type?: string }[];
} = { rating: null, since: null, ftaAgent: false, reviews: [] };
