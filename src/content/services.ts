import { ZONES } from "@/content/freezone";
import { FAQS } from "@/content/site";

/* The /services hub: one entry per service page, the hero picker's goals, the journey, the FAQ and the team. */

/**
 * Every price and timing the hub shows, in one place: change them here only. They are set by hand on purpose, and
 * other pages keep their own figures (sources and conflicts: services hub report, Nov 2026).
 */
export const HUB_PRICES = {
  /** Dubai mainland LLC, as on the home page calculator. */
  setup: 13000,
  /** Ajman Nu Venture, as on the /freezone page. */
  freezone: 4898,
  /** Bookkeeping, per month, as on /accounting. */
  accounting: 800,
};
/** Setup timings as published on www.best-solution.ae. */
export const HUB_TIMING = {
  setup: "3 to 10 working days",
  freezone: "3 to 7 working days",
};

/** The team block stays hidden until photo consent for landing pages is confirmed. */
export const SHOW_TEAM = false;

/**
 * Company setup has no page of its own yet: it opens the home page calculator. When /mainland ships, change this
 * one line.
 */
export const MAINLAND_HREF = "/#calculator";

export type ServiceId = "setup" | "freezone" | "accounting" | "tax" | "spv" | "calculator";
export type ToolTag = "calculator" | "planner" | "quote" | "estimator";

export interface Service {
  id: ServiceId;
  name: string;
  line: string;
  href: string;
  /** "from" price in AED, or null when the service page publishes no price (then `priceNote` is shown). */
  from: number | null;
  /** Shown after the price ("/month"), or instead of it when `from` is null. */
  priceNote?: string;
  timing?: string;
  tool: { label: string; tag: ToolTag; href: string };
  /** Larger tile in the grid: the services that bring the most leads. They carry a photo. */
  big?: boolean;
  photo?: string;
}

export const SERVICES: Service[] = [
  {
    id: "setup",
    name: "Company setup",
    line: "A mainland company to trade directly across the UAE.",
    href: MAINLAND_HREF,
    from: HUB_PRICES.setup,
    timing: HUB_TIMING.setup,
    tool: { label: "Setup cost calculator", tag: "calculator", href: MAINLAND_HREF },
    big: true,
    photo: "/images/mainland-dubai-economy-tourism.webp",
  },
  {
    id: "freezone",
    name: "Free zone company",
    line: `Compare ${ZONES.length} free zones by activity, office and first-year cost.`,
    href: "/freezone",
    from: HUB_PRICES.freezone,
    timing: HUB_TIMING.freezone,
    tool: { label: "Free zone planner", tag: "planner", href: "/freezone#planner" },
    big: true,
    photo: "/images/free-zone-business-park-office.webp",
  },
  {
    id: "accounting",
    name: "Accounting & bookkeeping",
    line: "Bookkeeping, bank reconciliation and financial statements.",
    href: "/accounting",
    from: HUB_PRICES.accounting,
    priceNote: "/month",
    tool: { label: "Accounting quote", tag: "quote", href: "/accounting#contact" },
  },
  {
    id: "tax",
    name: "Corporate tax & VAT",
    line: "Registration, returns and deadlines handled for you.",
    href: "/corporate-tax",
    // The corporate tax page publishes no fee: a written fee follows a free review.
    from: null,
    priceNote: "Fee after a free review",
    tool: { label: "Tax estimator", tag: "estimator", href: "/corporate-tax#estimate" },
  },
  {
    id: "spv",
    name: "SPV & structuring",
    line: "Hold property, shares and investments in the right structure.",
    href: "/spv",
    // The SPV page publishes no fee: a written breakdown follows the consultation.
    from: null,
    priceNote: "Priced after a consultation",
    tool: { label: "Structure finder", tag: "planner", href: "/spv#fit" },
  },
  {
    id: "calculator",
    name: "Cost calculator",
    line: "An itemised company setup estimate across mainland, free zone and offshore.",
    href: "/cost-calculator",
    from: null,
    priceNote: "Free to use",
    tool: { label: "Cost calculator", tag: "calculator", href: "/cost-calculator#calculator" },
  },
];

export const serviceById = (id: ServiceId): Service => SERVICES.find((s) => s.id === id)!;

/** "Your business journey": each stage opens the page that serves it. Visa & bank goes to setup until it has a page. */
export const JOURNEY: { title: string; body: string; href: string }[] = [
  { title: "Setup", body: "Choose mainland or a free zone and get licensed.", href: MAINLAND_HREF },
  { title: "Visa & bank", body: "Residency visas and a corporate bank account.", href: MAINLAND_HREF },
  { title: "Accounting", body: "Books kept up to date from the first month.", href: "/accounting" },
  { title: "Corporate tax", body: "Registration and returns, on time.", href: "/corporate-tax" },
  { title: "Structuring", body: "Holding companies and SPVs as you grow.", href: "/spv" },
];

/*
  Six general questions. Cost, consultation, enquiry and government answers are this site's own (content/site FAQS);
  timing and "do I need to be in the UAE" are from www.best-solution.ae.
*/
const siteFaq = (q: string) => FAQS.find((f) => f.q === q)!;
export const HUB_FAQS: { q: string; a: string }[] = [
  siteFaq("How much does a UAE company cost?"),
  {
    q: "How long does company formation take?",
    a: `A company setup usually takes ${HUB_TIMING.setup}, and a free zone company ${HUB_TIMING.freezone}, once your documents are complete. Activities that need extra approvals can take longer.`,
  },
  {
    q: "Do I need to be in the UAE to start a company?",
    a: "No. You can complete formation remotely and we handle the government visits. You only need to visit the UAE if you need a residence visa: one trip for visa stamping and your Emirates ID.",
  },
  siteFaq("Is there a charge for the consultation?"),
  siteFaq("Who will handle my enquiry?"),
  siteFaq("Is Best Solution a government entity?"),
];

/* Current team members as shown on www.best-solution.ae/about-us/. The founder's surname is spelt "Harthi". */
export const TEAM: { name: string; role: string; photo: string }[] = [
  { name: "Essa Al Harthi", role: "Founder and Chief Executive Officer", photo: "/team/essa.webp" },
  { name: "Vipin Kumar", role: "General Manager", photo: "/team/vipin.webp" },
];
