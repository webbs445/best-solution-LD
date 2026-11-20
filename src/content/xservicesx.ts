import { AC_SERVICE_ENQUIRED, CT_SERVICE_ENQUIRED, SPV_SERVICE_ENQUIRED } from "@/lib/lead";
import { SITE } from "@/content/site";

/*
  /xservicesx (Services page v2, brief: docs/briefs/xservicesx-page-brief.md). Copy is the brief's, word for word.
  XS_FACTS holds every [bracketed] fact in the brief. null = not confirmed: the element is left out of the HTML, or
  the brief's fallback wording is used. Fill a value only once Best Solution confirms it.
*/
export const XS_FACTS: {
  /** e.g. "within 1 working hour" (section 1 facts, FAQ, form line, success message) */
  replyTime: string | null;
  /** e.g. "30-minute" (section 5, step 2) */
  consultLength: string | null;
  /** Section 6 advisor card and its WhatsApp link. photo: a path under /public. */
  advisor: { photo: string; name: string; role: string; languages: string; sentence: string } | null;
  /** Michael's Google review, 15 words or fewer, word for word (section 1 proof line). */
  heroQuote: string | null;
  /** e.g. "Rated 4.8 out of 5 from 200 Google reviews" (section 7 line) */
  rating: string | null;
  /** Section 7 client story. */
  clientStory: { situation: string; advice: string; result: string } | null;
  /** e.g. "Emirati-owned, advising since 2014" (section 6 trust list) */
  emiratiOwnedSince: string | null;
  /** Section 8 call link: the site's number (content/site SITE.phone). */
  callNumber: { display: string; href: string } | null;
} = {
  replyTime: null,
  consultLength: null,
  advisor: null,
  heroQuote: null,
  rating: null,
  clientStory: null,
  emiratiOwnedSince: null,
  callNumber: SITE.phone,
};

/** The form's "Need" options, in the brief's order. Also the value a card pre-fills and the lead's service interest. */
export const NEEDS = [
  "Starting a new company",
  "Free zone or mainland",
  "Holding or several companies",
  "Bookkeeping",
  "Corporate Tax",
  "Not sure yet",
] as const;
export type Need = (typeof NEEDS)[number];
export const isNeed = (v: unknown): v is Need => (NEEDS as readonly unknown[]).includes(v);

/** The ERP "Service Enquired" option for each need (exact Select options; undefined = the ERP default "Business Setup"). */
export const NEED_SERVICE: Record<Need, string | undefined> = {
  "Starting a new company": undefined,
  "Free zone or mainland": undefined,
  "Holding or several companies": SPV_SERVICE_ENQUIRED,
  Bookkeeping: AC_SERVICE_ENQUIRED,
  "Corporate Tax": CT_SERVICE_ENQUIRED,
  "Not sure yet": undefined,
};

export const XS_DISCLAIMER = "Best Solution is a private business consultancy, not a government office or a free zone authority.";
export const XS_FOOTER_LEGAL =
  "Best Solution is a private business consultancy and is not affiliated with any government entity or free zone authority. Free zone names identify the zones we advise on and do not imply any partnership. Final decisions are made only by the relevant UAE authorities.";
export const SAFETY_LINE = "Free · 2 minutes · no obligation";

export const FORM_COPY = {
  title: "Get your free plan",
  line: XS_FACTS.replyTime ? `Takes 2 minutes. We reply on WhatsApp ${XS_FACTS.replyTime}.` : "Takes 2 minutes. We reply on WhatsApp.",
  button: "Get my free plan",
  consent: "Free and no obligation. By sending this, you agree we can contact you about your request by WhatsApp, phone or email.",
};

/** Field errors; the phone message names the chosen country (lib/servicesPlan planPhoneError). */
export const PLAN_ERRORS = {
  name: "Please add your name.",
  need: "Please pick where you are right now.",
  email: "Please check your email, or leave it empty.",
  send: `Sorry, that didn't go through. Message us on WhatsApp or call ${SITE.phone.display} and we'll help straight away.`,
} as const;

export const successText = (firstName: string) =>
  `Thanks, ${firstName}. Your request is in. An advisor will message you on WhatsApp ${XS_FACTS.replyTime ? `${XS_FACTS.replyTime} ` : ""}(${SITE.hours.long}) to agree a time.`;

export const WORRIES = [
  "Three consultants gave you three different prices, and you can't tell which is right.",
  "You've read ten articles and you're still not sure: free zone or mainland?",
  "You don't know if a free zone allows your activity.",
  "You're worried about costs that only show up in year two.",
];

export type IconId = "setup" | "freezone" | "spv" | "accounting" | "tax" | "help";
export const CARDS: { icon: IconId; title: string; who: string; get: string; button: string; need: Need; links: { href: string; label: string }[] }[] = [
  {
    icon: "setup",
    title: "I'm starting a new company",
    who: "Founders in the UAE or abroad with a business idea and a budget",
    get: "Where to base it, what year one and renewal will cost, and what to prepare",
    button: "Get my free plan",
    need: "Starting a new company",
    links: [{ href: "/cost-calculator", label: "More details" }],
  },
  {
    icon: "freezone",
    title: "Free zone or mainland?",
    who: "Anyone comparing where to base their company",
    get: "What each one allows, what each costs, and which fits your activity and customers",
    button: "Get my free plan",
    need: "Free zone or mainland",
    links: [
      { href: "/freezone", label: "Free zone details" },
      { href: "/mainland", label: "Mainland details" },
    ],
  },
  {
    icon: "spv",
    title: "I want to hold assets or own several companies",
    who: "Owners of property, shares or more than one business",
    get: "Whether a holding or offshore structure fits, and how it would work for you",
    button: "Get my free plan",
    need: "Holding or several companies",
    links: [
      { href: "/spv", label: "Holding details" },
      { href: "/offshore", label: "Offshore details" },
    ],
  },
  {
    icon: "accounting",
    title: "I need my books done every month",
    who: "Running companies behind on bookkeeping, or tired of chasing it",
    get: "Clean monthly books, matched bank statements and reports you can actually read",
    button: "Get my free quote",
    need: "Bookkeeping",
    links: [{ href: "/accounting", label: "More details" }],
  },
  {
    icon: "tax",
    title: "I have Corporate Tax questions",
    who: "Companies unsure what applies to them or when their return is due",
    get: "Whether it applies, your deadlines, and help preparing your return",
    button: "Get my free plan",
    need: "Corporate Tax",
    links: [{ href: "/corporate-tax", label: "More details" }],
  },
  {
    icon: "help",
    title: "I'm not sure yet",
    who: "Anyone with a plan but no clear next step",
    get: "An advisor reads your plan and tells you where to start",
    button: "Get my free plan",
    need: "Not sure yet",
    links: [],
  },
];

export const OUTCOMES: [string, string][] = [
  ["Which structure fits", ", and why the others don't"],
  ["What it costs", ": year one and every year after"],
  ["What to prepare", ", as a simple checklist"],
  ["How long it takes", ", realistically"],
  ["What our help costs", ", confirmed in writing before any work starts"],
];

export const STEPS: [string, string][] = [
  ["Tell us your plan.", "Use the form or WhatsApp. It takes 2 minutes."],
  [
    "Talk it through.",
    `A ${XS_FACTS.consultLength ? `${XS_FACTS.consultLength} ` : ""}call by video, or a coffee at our Business Bay office.`,
  ],
  ["Get it in writing.", "Your plan, costs and timeline, written down. Decide in your own time."],
];

export const TRUST: [string, string][] = [
  ["An office you can visit", " in Business Bay, Dubai"],
  ["Fees in writing first.", " You know what our help costs before we start"],
  ["Plain answers.", " Your options explained simply, so you can compare them yourself"],
  ...(XS_FACTS.emiratiOwnedSince ? ([[XS_FACTS.emiratiOwnedSince, ""]] as [string, string][]) : []),
];

export const XS_FAQS: { q: string; a: string }[] = [
  { q: "Is the first consultation really free?", a: "Yes. No fee, no obligation, and no pressure to buy anything afterwards." },
  { q: "Will you push me into a package?", a: "No. We recommend what fits your plan and confirm any fee in writing first. You decide, in your own time." },
  {
    q: "Are you a government office or a free zone authority?",
    a: "No. We're a private business consultancy. Final decisions on any application are made by the relevant UAE authorities.",
  },
  { q: "I'm not in the UAE yet. Can you still help?", a: "Yes. Many clients plan their company from abroad. We meet by video and send everything in writing." },
  {
    q: "How much will my company cost?",
    a: "It depends on your activity, where you base it and your team. After the first conversation you get a written breakdown for year one and the years after.",
  },
  {
    q: "How fast will you reply?",
    a: XS_FACTS.replyTime
      ? `${XS_FACTS.replyTime[0].toUpperCase()}${XS_FACTS.replyTime.slice(1)}, Monday to Friday, 9am to 6pm. After hours, we reply the next working morning.`
      : "Monday to Friday, 9am to 6pm. After hours, we reply the next working morning.",
  },
];
