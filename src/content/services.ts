import { CLAIMS } from "@/content/site";

/*
  The /services hub: one entry per service page, the "how we help" steps and the FAQ. Advice and consultation only
  (Google Ads government documents policy): no prices, timings, licences, visas, registration or government visits.
*/

/**
  The site menu, in this order: Services (the hub), then each service page. Short labels; the /services header
  dropdown and phone menu show it.
*/
export const SITE_MENU: { id: ServiceId | "hub"; label: string; line: string; href: string }[] = [
  { id: "hub", label: "Services", line: "Every service on one page", href: "/services" },
  { id: "freezone", label: "Free zone", line: "Compare free zones with an advisor", href: "/freezone" },
  { id: "setup", label: "Mainland", line: "How a mainland business works", href: "/mainland" },
  { id: "offshore", label: "Offshore", line: "When an offshore structure fits", href: "/offshore" },
  { id: "calculator", label: "Plan your budget", line: "What to plan for before you decide", href: "/cost-calculator" },
  { id: "spv", label: "SPV", line: "Holding and SPV structures", href: "/spv" },
  { id: "tax", label: "Corporate tax", line: "Your obligations and deadlines", href: "/corporate-tax" },
  { id: "accounting", label: "Accounting", line: "Bookkeeping and accounts", href: "/accounting" },
];

/** The link back to the /services hub, in every page's header menu and footer. */
export const ALL_SERVICES = { href: "/services", label: "All services" };

/** The team block stays hidden until photo consent for landing pages is confirmed. */
export const SHOW_TEAM = false;

/** The /mainland advice page. */
export const MAINLAND_HREF = "/mainland";

export type ServiceId = "setup" | "freezone" | "offshore" | "accounting" | "tax" | "spv" | "calculator";

export interface Service {
  id: ServiceId;
  name: string;
  line: string;
  href: string;
  /** Larger tile in the grid: the services that bring the most leads. They carry a photo. */
  big?: boolean;
  photo?: string;
  /** The tool on the tile: a chip on the large tiles, a text link on the others. */
  tool?: { text: string; href: string };
}

export const SERVICES: Service[] = [
  {
    id: "freezone",
    name: "Free zone advice",
    line: "Understand what a free zone means for your business and compare options.",
    href: "/freezone",
    big: true,
    photo: "/images/free-zone-business-park-office.webp",
    tool: { text: "Zone planner", href: "/freezone#planner" },
  },
  {
    id: "setup",
    name: "Mainland advice",
    line: "See how a mainland business works across the UAE.",
    href: MAINLAND_HREF,
    big: true,
    photo: "/images/main.webp",
  },
  {
    id: "offshore",
    name: "Offshore advice",
    line: "Learn when an offshore structure fits your plans.",
    href: "/offshore",
  },
  {
    id: "spv",
    name: "Holding and SPV structures",
    line: "Talk through structuring options with an advisor.",
    href: "/spv",
    tool: { text: "Try the structure finder", href: "/spv#fit" },
  },
  {
    id: "tax",
    name: "Corporate tax support",
    line: "Understand your obligations and deadlines.",
    href: "/corporate-tax",
    tool: { text: "Try the tax checker", href: "/corporate-tax#estimate" },
  },
  {
    id: "accounting",
    name: "Bookkeeping and accounts",
    line: "Ongoing support for businesses already running.",
    href: "/accounting",
    big: true,
    tool: { text: "Books health check", href: "/accounting#check" },
  },
  {
    id: "calculator",
    name: "Plan your budget",
    line: "See what to plan for before you decide.",
    href: "/cost-calculator",
    big: true,
    tool: { text: "Budget planner", href: "/cost-calculator#calculator" },
  },
];

/** "How we help": each stage opens the page that serves it. */
export const JOURNEY: { title: string; body: string; href: string }[] = [
  { title: "Choose where to base", body: "Mainland or a free zone, compared for your activity.", href: MAINLAND_HREF },
  { title: "Plan your budget", body: "What to plan for before you commit.", href: "/cost-calculator" },
  { title: "Bookkeeping", body: "Books kept up to date every month.", href: "/accounting" },
  { title: "Corporate tax", body: "Your obligations and deadlines explained.", href: "/corporate-tax" },
  { title: "Structuring", body: "Holding companies and SPVs as you grow.", href: "/spv" },
];

/* General questions, advice only. */
export const HUB_FAQS: { q: string; a: string }[] = [
  {
    q: "What happens in a consultation?",
    a: "You share your plans and questions. An advisor explains your options in plain terms so you can decide your next step.",
  },
  {
    q: "Which service do I need?",
    a: "Tell us what you are planning. Your advisor suggests where to begin and which of our services fit.",
  },
  {
    q: "Can I talk to you without coming to the office?",
    a: "Yes. You can meet us in Business Bay or book a video call at a time that suits you.",
  },
  {
    q: "How are your fees set?",
    a: CLAIMS.writtenFees
      ? "Your advisor explains our fees for the work you need and confirms them in writing before any work begins."
      : "Your advisor explains our fees for the work you need before any work begins.",
  },
  {
    q: "Is Best Solution a government entity?",
    a: "No. Best Solution is a private business consultancy. We are not a government entity and do not act on behalf of any government authority. Official decisions are made only by the relevant UAE authorities.",
  },
];

/* Current team members as shown on www.best-solution.ae/about-us/. The founder's surname is spelt "Harthi". */
export const TEAM: { name: string; role: string; photo: string }[] = [
  { name: "Essa Al Harthi", role: "Founder and Chief Executive Officer", photo: "/team/essa.webp" },
  { name: "Vipin Kumar", role: "General Manager", photo: "/team/vipin.webp" },
];
