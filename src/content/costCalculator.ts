/*
  /cost-calculator ("Plan your budget") copy. English only: the page used to ship Arabic, French, Russian and Chinese
  translations of the old configurator; they were dropped with it. Advice and consultation only: no prices, timelines
  or offers to obtain government documents (Google Ads, Government documents and services policy).
*/

export const CC_URL = "https://business.best-solution.ae/cost-calculator";

export const CC_WA_TEXT = "Hello, I would like advice on planning my UAE company budget.";

export const CC_HERO = {
  kicker: "Budget planning",
  title: "Plan your UAE company budget",
  accent: "with an advisor at your side.",
  lead: "Before you commit to anything, it helps to know what a company in the UAE will cost to run. We explain the main cost areas, help you compare your options and review your plans with you in a consultation.",
};

export type CcCard = { title: string; body: string; link?: { href: string; label: string } };

export const CC_PLAN: CcCard[] = [
  {
    title: "Workspace",
    body: "A flexi desk suits founders who work mostly online or on the road. A shared office suits small teams who want a fixed place to meet clients. A private office suits teams who need their own space every day. We help you match the space to how you work.",
  },
  {
    title: "Team size",
    body: "How many people will work in the company, now and as it grows? Team size shapes the workspace you need and many of your yearly costs, so it is worth planning early.",
  },
  {
    title: "Yearly running costs",
    body: "A company has costs every year, not only in its first year: workspace, staff, insurance, bank charges and professional fees. We help you list the ones that apply to you, so your budget covers the whole year.",
  },
  {
    title: "Bookkeeping and accounts",
    body: "Every UAE company needs to keep proper books, and some need audited accounts. Plan for this from day one. We explain what applies to your activity.",
    link: { href: "/accounting", label: "About accounting support" },
  },
  {
    title: "Corporate tax",
    body: "Most UAE companies fall under UAE Corporate Tax and file a yearly return. Plan for the return and the records behind it.",
    link: { href: "/corporate-tax", label: "About corporate tax" },
  },
];

export const CC_STRUCTURES: [title: string, body: string][] = [
  ["Mainland", "Trade across the UAE, including with local customers. Usually needs a physical workspace."],
  ["Free zone", "Suits international trade and services. Each free zone sets its own activities and workspace options, and trade in the local market can be limited."],
  ["Offshore", "Used to hold assets or investments. It does not trade in the UAE and has no office or staff here."],
];

export const CC_STEPS: [title: string, body: string][] = [
  ["Tell us about your plans", "Share what your business does, who your customers are and how many people will work with you."],
  ["Review your options", "Your advisor walks you through workspace, team, yearly costs and the structure that fits, and answers your questions."],
  ["Decide your next steps", "You leave with a clear list of the cost areas to budget for, and decide what to do next in your own time."],
];

/** Visible FAQ and its FAQPage JSON-LD: one source, so they always match. */
export const CC_FAQ: [q: string, a: string][] = [
  [
    "Why is there no price on this page?",
    "Costs depend on your activity, your team, your workspace and the structure you choose, and some are set by the authorities and can change. Rather than show figures that may not fit you, your advisor reviews your plans with you and explains the costs that apply.",
  ],
  [
    "What should I prepare for a consultation?",
    "A short description of your business activity, where your customers are, how many people will work in the company and the kind of workspace you have in mind. Rough answers are fine.",
  ],
  [
    "Do I need an office?",
    "That depends on the structure and your activity. Some companies can use a flexi desk, others need their own office. Your advisor explains which workspace types fit your plans.",
  ],
  [
    "Should I choose mainland, free zone or offshore?",
    "It depends on where your customers are, what your company does and whether you need staff in the UAE. Your advisor compares the three with you.",
  ],
  [
    "Does corporate tax apply to my company?",
    "Most UAE companies fall under UAE Corporate Tax and file a yearly return. Your advisor explains how it applies to your company and what records to keep.",
  ],
  [
    "Is Best Solution part of the government?",
    "No. Best Solution is a private business consultancy. We advise and explain; official decisions are made only by the relevant UAE authorities.",
  ],
];
