/*
  The /services hub: one entry per service page, the "how we help" steps and the FAQ. Advice and consultation only
  (Google Ads government documents policy): no prices, timings, licences, visas, registration or government visits.
*/

/** The team block stays hidden until photo consent for landing pages is confirmed. */
export const SHOW_TEAM = false;

/** Mainland advice has no page of its own: it opens the home page's planning section. Change this one line when it has. */
export const MAINLAND_HREF = "/#calculator";

export type ServiceId = "setup" | "freezone" | "accounting" | "tax" | "spv" | "calculator";

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
    id: "setup",
    name: "Mainland advice",
    line: "Whether a mainland company suits how you plan to trade in the UAE.",
    href: MAINLAND_HREF,
    big: true,
    photo: "/images/main.webp",
    tool: { text: "Planning guide", href: "/cost-calculator" },
  },
  {
    id: "freezone",
    name: "Free zone advice",
    line: "Compare UAE free zones by activity and office type with an advisor.",
    href: "/freezone",
    big: true,
    photo: "/images/free-zone-business-park-office.webp",
    tool: { text: "Zone planner", href: "/freezone#planner" },
  },
  {
    id: "accounting",
    name: "Bookkeeping and accounts",
    line: "Bookkeeping, bank reconciliation and financial statements.",
    href: "/accounting",
    tool: { text: "Ask about your books", href: "/accounting#contact" },
  },
  {
    id: "tax",
    name: "Corporate tax support",
    line: "Understand your obligations and deadlines, with support for your return.",
    href: "/corporate-tax",
    tool: { text: "Try the tax checker", href: "/corporate-tax#estimate" },
  },
  {
    id: "spv",
    name: "Holding and SPV structures",
    line: "Advice on holding property, shares and investments in the right structure.",
    href: "/spv",
    tool: { text: "Try the structure finder", href: "/spv#fit" },
  },
  {
    id: "calculator",
    name: "Plan your budget",
    line: "What to plan for: workspace, team size, yearly running costs and bookkeeping.",
    href: "/cost-calculator",
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
    a: "Your advisor explains our fees for the work you need and confirms them in writing before any work begins.",
  },
  { q: "Who will handle my enquiry?", a: "A dedicated consultant from our Business Bay office." },
  {
    q: "Is Best Solution a government entity?",
    a: "No. Best Solution is a private business consultancy and is not affiliated with any government entity or free zone authority. Official decisions are made only by the relevant UAE authorities.",
  },
];

/* Current team members as shown on www.best-solution.ae/about-us/. The founder's surname is spelt "Harthi". */
export const TEAM: { name: string; role: string; photo: string }[] = [
  { name: "Essa Al Harthi", role: "Founder and Chief Executive Officer", photo: "/team/essa.webp" },
  { name: "Vipin Kumar", role: "General Manager", photo: "/team/vipin.webp" },
];
