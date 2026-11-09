import { FOOTER_TAIL, SITE, statTile } from "@/content/site";
import { MAINLAND_FORM_ID, OFFSHORE_FORM_ID } from "@/lib/lead";
import type { HeroConfig } from "@/components/freezone/FzHero";
import type { BriefBlock, ClosingBlock, VsBand } from "@/components/freezone/FzSections";
import type { HowItWorksText } from "@/components/freezone/FzHowItWorks";

/*
  /mainland and /offshore: advice pages built from the /freezone page's sections. Advice only (Google Ads policy): no
  prices, licences, visas, residency, registration, timelines, authority names or logos.
  [CONFIRM] Lines marked FACT state how mainland and offshore companies generally work; Best Solution to confirm them.
*/

export interface AdvicePage {
  slug: "mainland" | "offshore";
  title: string;
  description: string;
  formId: typeof MAINLAND_FORM_ID | typeof OFFSHORE_FORM_ID;
  interest: "mainland" | "offshore";
  tag: string;
  waText: string;
  hero: HeroConfig;
  strip: { title: string; sub: string; items: { key: string; b: string; small: string }[] };
  think: BriefBlock;
  how: HowItWorksText;
  vs?: VsBand;
  faqs: { q: string; a: string }[];
  closing: ClosingBlock;
  nav: { href: string; label: string }[];
  blurb: string;
}

const wa = (text: string) => `${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
const PROOF = [statTile(null, "", "office"), statTile(null, "", "meet"), statTile(null, "", "explain")];

/* The same three questions on both pages, plus one about the page's topic. */
const COMMON_FAQS = [
  {
    q: "What happens in a consultation?",
    a: "You tell us about your plans. Your advisor explains the options that could fit, what to think about with each and what to plan for, so you can decide your next step.",
  },
  {
    q: "Are you a government office?",
    a: "No. Best Solution is a private business consultancy. We are not a government entity and do not act on behalf of any government authority. Official decisions are made only by the relevant UAE authorities.",
  },
  {
    q: "Can I talk to you without coming to the office?",
    a: "Yes. You can meet us in Business Bay, Dubai, or talk it through by video call, phone or WhatsApp.",
  },
];

const ML_WA = "Hi, I'd like advice on a mainland business (ML-AD)";
export const MAINLAND: AdvicePage = {
  slug: "mainland",
  title: "Mainland Business Advice in Dubai | Best Solution",
  description: "See how a mainland business works across the UAE, with clear advice from a private advisor in Business Bay.",
  formId: MAINLAND_FORM_ID,
  interest: "mainland",
  tag: "ML",
  waText: ML_WA,
  hero: {
    tag: "For business owners who sell to customers in the UAE",
    lead: "Is a mainland business ",
    accent: "right for you?",
    // FACT
    sub: "A mainland business can trade directly with customers across the UAE. We help you see if it fits your plans.",
    primary: { label: "Book a Consultation", location: "ML Hero - Book a Consultation" },
    secondary: { label: "WhatsApp an advisor", href: wa(ML_WA), location: "ML Hero - WhatsApp", external: true },
    proof: PROOF,
    trustline: "Private consultancy · Business Bay, Dubai",
    wall: [
      ["RT", "Retail", "Shops and showrooms"],
      ["TR", "Trading", "Goods across the UAE"],
      ["CS", "Consulting", "Professional services"],
      ["CN", "Contracting", "Building and fit-out"],
      ["FB", "Food and drink", "Restaurants and cafes"],
      ["HC", "Healthcare", "Clinics and care"],
      ["ED", "Education", "Training centres"],
      ["EV", "Events", "Events and hospitality"],
      ["MK", "Marketing", "Agencies"],
      ["IT", "Technology", "IT services"],
      ["LG", "Logistics", "Delivery and transport"],
      ["PR", "Property", "Real estate services"],
    ].map(([mono, title, sub]) => ({ key: mono, mono, title, sub })),
    // FACT: what a mainland business is often considered for.
    demo: [
      ["A shop in the UAE", "Mainland"],
      ["Selling to UAE customers", "Mainland"],
      ["A restaurant or cafe", "Mainland"],
      ["Contracting work", "Mainland"],
      ["Mostly international clients", "Compare with a free zone"],
    ],
    demoLabel: "Often considered for",
    demoTile: ["RT", "TR", "FB", "CN", "CS"],
    badge: { small: "Mainland advice", b: "Your advisor", span: "Advice in plain terms" },
  },
  strip: {
    title: "Mainland advice across the UAE",
    sub: "In every emirate, matched to your plans.",
    items: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"].map((e) => ({ key: e, b: e, small: "Mainland" })),
  },
  think: {
    id: "think",
    title: "What to think about",
    text: "Four questions shape whether a mainland business fits your plans. Your advisor goes through each one with you.",
    cta: { label: "Book a Consultation", location: "ML Think - Book a Consultation" },
    briefTitle: "Your mainland checklist",
    briefNote: "Talked through with your advisor",
    items: [
      { title: "Where your customers are", body: "In the UAE, abroad, or both. This is often the first thing to look at." },
      { title: "The kind of work your business does", body: "Your activity shapes which options may suit you." },
      { title: "Your office needs", body: "Whether you need a shop, an office or a small workspace to begin with." },
      { title: "Ongoing yearly costs", body: "What to plan for every year: workspace, team and professional fees." },
    ],
  },
  how: {
    title: "How we help",
    sub: "We explain how a mainland business works in plain terms and compare it with a free zone.",
    steps: [
      ["A short form", "Tell us your plans", "Share what your business does and where your customers are, in the form or on WhatsApp."],
      ["A conversation", "Consult", "Your advisor explains how a mainland business works, in person in Business Bay or by video call."],
      ["Your options", "Compare", "You compare mainland with a free zone for your activity, and what to plan for with each."],
      ["Your decision", "Decide in your own time", "You choose your next step when you are ready. Your advisor is there for any questions."],
    ],
    cta: { label: "Book a Consultation", location: "ML How We Help - Book a Consultation" },
  },
  vs: {
    id: "compare",
    title: "Mainland or free zone?",
    // FACT
    text: "Mainland may suit you when selling directly to UAE customers is central to your plans. A free zone can suit international and business-to-business work.",
    table: true,
    note: "Your advisor explains which may suit your activity and business model.",
    link: { label: "See the full comparison", href: "/freezone/vs-mainland", location: "ML Compare - Full comparison" },
    cta: { label: "Not sure? Ask an Advisor", location: "ML Compare - Ask an Advisor" },
  },
  faqs: [
    ...COMMON_FAQS,
    {
      q: "How is a mainland business different from a free zone?",
      // FACT
      a: "Generally, a mainland business can trade directly with customers anywhere in the UAE, while a free zone business often suits international and business-to-business work. Your advisor compares both for your activity.",
    },
  ],
  closing: {
    title: "Talk your mainland plans through",
    text: "Tell us about your business. Your advisor explains how a mainland business works and helps you plan your next step.",
    primary: { label: "Book a Consultation", location: "ML Closing - Book a Consultation" },
    secondary: { label: "WhatsApp an advisor", href: wa(ML_WA), location: "ML Closing - WhatsApp", external: true },
  },
  nav: [
    { href: "#think", label: "Checklist" },
    { href: "#process", label: "Process" },
    { href: "#compare", label: "Compare" },
    { href: "#faq", label: "FAQ" },
  ],
  blurb: `Mainland business advice from a private consultancy in Business Bay, Dubai.${FOOTER_TAIL}`,
};

const OFF_WA = "Hi, I'd like advice on an offshore structure (OFF-AD)";
export const OFFSHORE: AdvicePage = {
  slug: "offshore",
  title: "Offshore Structure Advice | Best Solution",
  description: "Learn when an offshore structure fits your plans, with clear advice from a private advisor in Business Bay.",
  formId: OFFSHORE_FORM_ID,
  interest: "offshore",
  tag: "OFF",
  waText: OFF_WA,
  hero: {
    tag: "For investors holding assets or trading internationally",
    lead: "Does an offshore structure ",
    accent: "fit your plans?",
    // FACT
    sub: "An offshore company is generally used for holding assets or international trade, not for trading inside the UAE.",
    primary: { label: "Book a Consultation", location: "OFF Hero - Book a Consultation" },
    secondary: { label: "WhatsApp an advisor", href: wa(OFF_WA), location: "OFF Hero - WhatsApp", external: true },
    proof: PROOF,
    trustline: "Private consultancy · Business Bay, Dubai",
    wall: [
      ["HC", "Holding company", "Owns shares"],
      ["AS", "Assets", "Investments"],
      ["PR", "Property", "Holding property"],
      ["IT", "International", "Trade outside the UAE"],
      ["IP", "Brands", "Rights and brands"],
      ["FM", "Family", "Succession planning"],
      ["JV", "Joint ventures", "Shared ownership"],
      ["TX", "Tax", "Questions to ask"],
      ["GR", "Groups", "Several companies"],
    ].map(([mono, title, sub]) => ({ key: mono, mono, title, sub })),
    // FACT: what an offshore structure is often considered for.
    demo: [
      ["Holding shares", "Offshore"],
      ["International trade", "Offshore"],
      ["Holding property", "Ask your advisor"],
      ["Selling inside the UAE", "Mainland or free zone"],
    ],
    demoLabel: "Often considered for",
    demoTile: ["HC", "IT", "PR", "GR"],
    badge: { small: "Offshore advice", b: "Your advisor", span: "Advice in plain terms" },
  },
  strip: {
    title: "What an offshore structure is often used for",
    sub: "Your advisor explains what may apply to your plans.",
    items: [
      ["Holding", "Shares"],
      ["Assets", "Investments"],
      ["Property", "Holding"],
      ["Trade", "International"],
      ["Brands", "Rights"],
      ["Family", "Succession"],
      ["Groups", "Several companies"],
      ["Ventures", "Shared ownership"],
    ].map(([b, small]) => ({ key: b, b, small })),
  },
  think: {
    id: "think",
    title: "What to think about",
    text: "Three questions shape whether an offshore structure fits your plans. Your advisor goes through each one with you.",
    cta: { label: "Book a Consultation", location: "OFF Think - Book a Consultation" },
    briefTitle: "Your offshore checklist",
    briefNote: "Talked through with your advisor",
    items: [
      { title: "What you want the structure to hold or do", body: "Shares, property, investments or international trade." },
      { title: "Where you and your customers are", body: "Inside the UAE, abroad, or both. This often decides between offshore and other options." },
      { title: "Ongoing yearly costs", body: "What to plan for every year, so there are fewer surprises later." },
    ],
  },
  how: {
    title: "How we help",
    sub: "We explain when offshore can make sense and when another option may suit you better.",
    steps: [
      ["A short form", "Tell us your plans", "Share what you want the structure to hold or do, in the form or on WhatsApp."],
      ["A conversation", "Consult", "Your advisor explains how an offshore structure works, in person in Business Bay or by video call."],
      ["Your options", "Compare", "You compare offshore with a mainland or free zone company, and what to plan for with each."],
      ["Your decision", "Decide in your own time", "You choose your next step when you are ready. Your advisor is there for any questions."],
    ],
    cta: { label: "Book a Consultation", location: "OFF How We Help - Book a Consultation" },
  },
  faqs: [
    ...COMMON_FAQS,
    {
      q: "Can an offshore company trade inside the UAE?",
      // FACT
      a: "Generally, no. An offshore company is usually used for holding assets or international trade. If you plan to sell inside the UAE, your advisor explains the mainland and free zone options.",
    },
  ],
  closing: {
    title: "Talk your offshore plans through",
    text: "Tell us what you want the structure to do. Your advisor explains when offshore can make sense and helps you plan your next step.",
    primary: { label: "Book a Consultation", location: "OFF Closing - Book a Consultation" },
    secondary: { label: "WhatsApp an advisor", href: wa(OFF_WA), location: "OFF Closing - WhatsApp", external: true },
  },
  nav: [
    { href: "#think", label: "Checklist" },
    { href: "#process", label: "Process" },
    { href: "#reviews", label: "Reviews" },
    { href: "#faq", label: "FAQ" },
  ],
  blurb: `Offshore structure advice from a private consultancy in Business Bay, Dubai.${FOOTER_TAIL}`,
};
