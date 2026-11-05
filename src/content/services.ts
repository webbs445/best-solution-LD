import { DATA } from "@/lib/pricing";
import { AC_CLAIMS } from "@/content/accounting";
import { ZONES } from "@/content/freezone";
import { FAQS } from "@/content/site";

/*
  The /services hub: one entry per service page. Prices come from the same sources the service pages use
  (pricing.ts rate card, accounting claims), so the hub never shows a different figure from the page it links to.
*/

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
  tool: { label: string; tag: ToolTag; href: string };
  /** Larger tile in the grid: the services that bring the most leads. */
  big?: boolean;
}

export const SERVICES: Service[] = [
  {
    id: "setup",
    name: "Company setup",
    line: "A mainland company to trade directly across the UAE.",
    href: MAINLAND_HREF,
    // The Dubai mainland LLC: the same "from" the home page calculator shows (the E-Trader licence suits few setups).
    from: DATA.mainland.find((o) => o.id === "m0")!.price,
    tool: { label: "Setup cost calculator", tag: "calculator", href: MAINLAND_HREF },
    big: true,
  },
  {
    id: "freezone",
    name: "Free zone company",
    line: `Compare ${ZONES.length} free zones by activity, office and first-year cost.`,
    href: "/freezone",
    // The /freezone page's own rate card (its entry price differs slightly from the home calculator's list).
    from: Math.min(...ZONES.map((z) => z.price)),
    tool: { label: "Free zone planner", tag: "planner", href: "/freezone#planner" },
    big: true,
  },
  {
    id: "accounting",
    name: "Accounting & bookkeeping",
    line: "Bookkeeping, bank reconciliation and financial statements.",
    href: "/accounting",
    from: AC_CLAIMS.prices.bookkeeping,
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
    priceNote: "Written fee after a free review",
    tool: { label: "Tax estimator", tag: "estimator", href: "/corporate-tax#estimate" },
  },
  {
    id: "spv",
    name: "SPV & structuring",
    line: "Hold property, shares and investments in the right structure.",
    href: "/spv",
    // The SPV page publishes no fee: a written breakdown follows the consultation.
    from: null,
    priceNote: "Written breakdown after your consultation",
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

/** The hero picker's goals, in display order. "unsure" opens the 3-question helper. */
export const GOALS: { id: ServiceId | "unsure"; label: string }[] = [
  { id: "setup", label: "Start a company" },
  { id: "freezone", label: "Free zone" },
  { id: "accounting", label: "Keep my books" },
  { id: "tax", label: "Corporate tax" },
  { id: "spv", label: "Protect my assets (SPV)" },
  { id: "unsure", label: "Not sure" },
];

/** "Your business journey": each stage opens the page that serves it. Visa & bank goes to setup until it has a page. */
export const JOURNEY: { title: string; body: string; href: string }[] = [
  { title: "Setup", body: "Choose mainland or a free zone and get licensed.", href: MAINLAND_HREF },
  { title: "Visa & bank", body: "Residency visas and a corporate bank account.", href: MAINLAND_HREF },
  { title: "Accounting", body: "Books kept up to date from the first month.", href: "/accounting" },
  { title: "Corporate tax", body: "Registration and returns, on time.", href: "/corporate-tax" },
  { title: "Structuring", body: "Holding companies and SPVs as you grow.", href: "/spv" },
];

/** The free tools strip: one tap opens each tool on its page. */
export const TOOLS = (["calculator", "freezone", "tax", "accounting"] as const).map((id) => {
  const s = serviceById(id);
  return { ...s.tool, service: s.name };
});

/*
  Six general questions. Cost, consultation, enquiry and government answers are this site's own (content/site FAQS);
  timing and "do I need to be in the UAE" are from www.best-solution.ae's home page FAQ.
*/
const siteFaq = (q: string) => FAQS.find((f) => f.q === q)!;
export const HUB_FAQS: { q: string; a: string }[] = [
  siteFaq("How much does a UAE company cost?"),
  {
    q: "How long does company formation take?",
    a: "Usually 2 to 5 working days. Some free zones approve on the same day, and mainland licences take 3 to 5 days. Activities that need special approvals can take 2 to 3 weeks.",
  },
  {
    q: "Do I need to be in the UAE to start a company?",
    a: "No. You can complete formation remotely and we handle the government visits. You only need to visit the UAE if you need a residence visa: one trip for visa stamping and your Emirates ID.",
  },
  siteFaq("Is there a charge for the consultation?"),
  siteFaq("Who will handle my enquiry?"),
  siteFaq("Is Best Solution a government entity?"),
];

/* Current team members as shown on www.best-solution.ae/about-us/ (names, roles and photos as published there). */
export const TEAM: { name: string; role: string; photo: string }[] = [
  { name: "Essa Al Harthi", role: "Founder and Chief Executive Officer", photo: "/team/essa.webp" },
  { name: "Vipin Kumar", role: "General Manager", photo: "/team/vipin.webp" },
];
