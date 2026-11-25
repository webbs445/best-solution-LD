import { AC_SERVICE_ENQUIRED, CT_SERVICE_ENQUIRED, SPV_SERVICE_ENQUIRED } from "@/lib/lead";
import { XS_CONFIG as C, type TopicId } from "@/content/xservicesx.config";

/*
  /xservicesx copy, from the design files (design/xservicesx) with the landing page copy rules applied: no "free"
  outside "free zone", no start/renewal/cheapest, "Get my written plan" for every plan button, and the fees-in-writing
  lines only while XS_CONFIG.feesInWritingConfirmed is true. Facts come from XS_CONFIG; a null fact drops its words.
*/

export type { TopicId };
export const TOPIC_IDS: TopicId[] = ["new_company", "fz_or_mainland", "holding", "bookkeeping", "corporate_tax", "not_sure"];
export const isTopic = (v: unknown): v is TopicId => (TOPIC_IDS as unknown[]).includes(v);

/** One name per topic everywhere (select, chips, plan rows, ERP notes, WhatsApp text); label and short are the same. */
export const TOPICS: Record<TopicId, { label: string; short: string }> = {
  new_company: { label: "New company", short: "New company" },
  fz_or_mainland: { label: "Free zone or mainland", short: "Free zone or mainland" },
  holding: { label: "Holding assets", short: "Holding assets" },
  bookkeeping: { label: "Monthly books", short: "Monthly books" },
  corporate_tax: { label: "Corporate Tax", short: "Corporate Tax" },
  not_sure: { label: "Not sure yet", short: "Not sure yet" },
};

/** The ERP "Service Enquired" option per topic (exact Select options; undefined = the ERP default "Business Setup"). */
export const TOPIC_SERVICE: Record<TopicId, string | undefined> = {
  new_company: undefined,
  fz_or_mainland: undefined,
  holding: SPV_SERVICE_ENQUIRED,
  bookkeeping: AC_SERVICE_ENQUIRED,
  corporate_tax: CT_SERVICE_ENQUIRED,
  not_sure: undefined,
};

export const PLAN_CTA = "Get my written plan";
export const CTA_NOTE = "2 minutes · no obligation";
export const FEES_NEUTRAL = "We agree our fees with you before any work begins.";
export const DISCLAIMER =
  "Best Solution is a private business consultancy in Business Bay, Dubai. We are not a government office or a free zone authority.";

/** wa.me link with the topic only in the message (never a name, number or email). */
export const waLink = (topic?: TopicId | null) =>
  `https://wa.me/${C.whatsappNumber}${topic ? `?text=${encodeURIComponent(`Hi, I'd like advice on: ${TOPICS[topic].label}`)}` : ""}`;

/**
 * S8 ask bar: the visitor's own question after "Hi, my question: ", else the topic message. Email addresses and
 * phone numbers typed into it are dropped, so none ends up in the link.
 */
export const askLink = (text: string, topic?: TopicId | null) => {
  const q = text.replace(/\S+@\S+/g, "").replace(/\+?\d[\d\s().-]{6,}\d/g, "").replace(/\s+/g, " ").trim().slice(0, 300);
  return q ? `https://wa.me/${C.whatsappNumber}?text=${encodeURIComponent(`Hi, my question: ${q}`)}` : waLink(topic);
};

const advisorName = C.advisors[0]?.name ?? null;

/* ─── Hero plan card ─── */
export type PlanRow = { label: string; text?: string; bar?: number; pre?: string; post?: string };
const B = (label: string, bar: number, pre = "", post = ""): PlanRow => ({ label, bar, pre, post });
const T = (label: string, text: string): PlanRow => ({ label, text });
export const HERO_PLANS: Record<TopicId, { rows: PlanRow[]; cta: string }> = {
  new_company: { rows: [T("Right structure", "Matched to your activity"), B("Year one", 92, "AED "), B("Every year after", 76, "AED "), B("Timeline", 44, "", " weeks")], cta: PLAN_CTA },
  fz_or_mainland: { rows: [B("Free zones that allow your activity", 60), B("Mainland, for your customers", 60), B("Year one, each option", 92, "AED "), T("Our recommendation", "With the reasons")], cta: "Compare my options" },
  holding: { rows: [B("Structure that fits", 96), B("What it keeps separate", 84), B("First-year and yearly cost", 80, "AED "), B("Timeline", 44, "", " weeks")], cta: PLAN_CTA },
  bookkeeping: { rows: [B("Monthly fee", 70, "AED "), T("Each month", "Entries, bank matching, reports"), T("Your software", "Zoho, QuickBooks, Tally"), B("Can begin in", 44, "", " days")], cta: "Get my written quote" },
  corporate_tax: { rows: [B("Does it apply to you", 70), B("Your next deadline", 84), T("What to prepare", "A simple checklist"), B("Our fee", 70, "AED ")], cta: "Check my position" },
  not_sure: { rows: [B("Where to begin", 96), B("First step", 84), B("Rough budget", 80, "AED "), B("Timeline", 44, "", " weeks")], cta: PLAN_CTA },
};
export const HERO_PREPARED = { by: `Prepared by ${advisorName ?? "a Best Solution advisor"}`, to: "Sent to your WhatsApp" };
export const HERO_NOTE = "Example layout. Your plan depends on your activity and team.";
export const HERO_TRUST = ["Office in Business Bay", "In person or by video", ...(C.feesInWritingConfirmed ? ["Fees in writing first"] : [])];

/* ─── S2 worries: desktop and phone wording ─── */
export const WORRIES: { text: string; textShort: string; lead: string; rest: string; leadShort: string; restShort: string; tag: string }[] = [
  { text: "I've never done this before. Where do I even begin?", textShort: "I've never done this before. Where do I begin?", lead: "A clear first step,", rest: "in plain words, so you know exactly what to do next.", leadShort: "A clear first step,", restShort: "in plain words.", tag: "Where do I begin?" },
  { text: "Three consultants gave me three different prices. Which one is right?", textShort: "Three consultants gave me three different prices.", lead: "One clear cost, in writing,", rest: "so you can compare it with any quote you already have.", leadShort: "One clear cost,", restShort: "in writing, to compare with any quote.", tag: "Which price is right?" },
  { text: "Free zone or mainland? I've read ten articles and I'm still not sure.", textShort: "Free zone or mainland? I'm still not sure.", lead: "Free zone or mainland, decided with you,", rest: "based on your activity and your customers.", leadShort: "Free zone or mainland,", restShort: "decided with you.", tag: "Free zone or mainland?" },
  { text: "Does a free zone even allow my activity?", textShort: "Does a free zone allow my activity?", lead: "Your activity checked", rest: "against the zones that allow it, before you pay anything.", leadShort: "Your activity checked", restShort: "against the zones that allow it.", tag: "Is my activity allowed?" },
  { text: "What costs show up in year two that nobody mentioned?", textShort: "What costs show up in year two?", lead: "Year one and every year after,", rest: "shown upfront, before you commit.", leadShort: "Year one and after,", restShort: "shown upfront.", tag: "What will year two cost?" },
  { text: "Something else. I'll tell the advisor.", textShort: "Something else. I'll tell the advisor.", lead: "Tell us in your own words,", rest: "in the form or on WhatsApp, and an advisor gives you a clear answer.", leadShort: "Tell us in your own words,", restShort: "and get a clear answer.", tag: "Something else" },
];
export const S2_ADVISOR_LINE = `${advisorName ?? "Best Solution advisors"} answer${advisorName ? "s" : ""} these every day`;

/* ─── S3 situations ─── */
export const S3_BIG = {
  title: "I'm planning a new company",
  text: "For founders in the UAE or abroad with a business idea and a budget.",
  /** Phones: the one line under the title (the list shows from 768 px). */
  textShort: "Where to base it, what it costs, what to prepare.",
  points: ["Where to base it: free zone or mainland", "Year one and yearly costs, in writing", "What to prepare, as a simple checklist"],
  pointsShort: ["Where to base it", "Year one and yearly costs, in writing", "What to prepare"],
};
export const S3_CARDS: { topic: TopicId; ctaId: string; icon: IconName; title: string; titleShort: string; what: string; page: string; cta: string; ctaShort: string }[] = [
  { topic: "fz_or_mainland", ctaId: "s3_fz_or_mainland", icon: "arrowLeftRight", title: "Free zone or mainland?", titleShort: "Free zone or mainland?", what: "What each one allows, what each costs, and which fits your activity.", page: "Free zone or mainland", cta: "Compare my options", ctaShort: "Compare" },
  { topic: "holding", ctaId: "s3_plan_structure", icon: "layers", title: "Own several companies or property?", titleShort: "Several companies?", what: "Whether a holding structure fits, and what it keeps separate.", page: "Holding assets", cta: "Plan my structure", ctaShort: "See options" },
  { topic: "bookkeeping", ctaId: "s3_bookkeeping", icon: "book", title: "Monthly books", titleShort: "Monthly books", what: "Clean monthly books, matched bank statements, reports you can read.", page: "Monthly books", cta: "Get my written quote", ctaShort: "Get a quote" },
  { topic: "corporate_tax", ctaId: "s3_corporate_tax", icon: "percent", title: "Corporate Tax questions", titleShort: "Corporate Tax", what: "Whether it applies to you, your deadlines, and help with your return.", page: "Corporate Tax", cta: "Check my position", ctaShort: "Check" },
];

/* ─── S4 outcomes ─── */
export const OUTCOMES: { title: string; sub: string; subShort: string }[] = [
  { title: "Which structure fits", sub: "and why the others don't", subShort: "and why the others don't" },
  { title: "What it costs", sub: "year one, and every year after", subShort: "year one, and every year after" },
  { title: "What to prepare", sub: "as a simple checklist", subShort: "as a simple checklist" },
  { title: "How long it takes", sub: "realistically, step by step", subShort: "realistically, step by step" },
  C.feesInWritingConfirmed
    ? { title: "What our help costs", sub: "confirmed in writing before any work begins", subShort: "in writing, before any work" }
    : { title: "What our help costs", sub: "agreed with you before any work begins", subShort: "agreed before any work" },
];
/** "What decides your cost": under the five outcomes. */
export const COST_FACTORS: { icon: IconName; lead: string; rest: string }[] = [
  { icon: "file", lead: "Your activity:", rest: "what you'll sell or offer" },
  { icon: "user", lead: "Your team:", rest: "how many people will work with you" },
  { icon: "pin", lead: "Your office:", rest: "shared desk, office or none yet" },
  { icon: "arrowLeftRight", lead: "Where you base it:", rest: "free zone or mainland" },
];
export const COST_FACTORS_NOTE = "Your plan puts real numbers on each one.";
export const S4_FEES_LINE = C.feesInWritingConfirmed ? "Confirmed in writing, before any work" : "Agreed with you, before any work";
export const S4_DELIVERY = C.planDelivery ? `Sent to your WhatsApp within ${C.planDelivery} of the call` : null;
export const S4_DELIVERY_SHORT = C.planDelivery ? `Sent within ${C.planDelivery}` : null;

/* ─── S5 how it works ─── */
export const S5_TITLE = { a: "From first message to a clear plan,", b: "the same day you ask." };
export const S5_SUB = C.feesInWritingConfirmed ? "No surprises. Nothing is charged until you agree in writing." : `No surprises. ${FEES_NEUTRAL}`;
/** The example timeline's three labels. */
export const S5_LABELS = ["YOU · 2 MINUTES", "WE CALL YOU · THE SAME DAY", "WE SEND IT · AFTER THE CALL"] as const;
/** Each step's one line (desktop and phone). */
export const S5_LINES = [
  "Use the form or WhatsApp. A few lines is enough.",
  "Your advisor calls, by video or in person. Ask anything.",
  "Your plan comes to your WhatsApp and email. Decide in your own time.",
] as const;
export const S5_YOUR_CALL = C.feesInWritingConfirmed
  ? "Go ahead with us, with fees agreed in writing first. Or take the plan and do it yourself."
  : "Go ahead with us, and we agree our fees with you before any work begins. Or take the plan and do it yourself.";
export const S5_CHIPS: { topic: TopicId; label: string }[] = [
  { topic: "new_company", label: "New company" },
  { topic: "fz_or_mainland", label: "Free zone or mainland" },
  { topic: "holding", label: "Holding assets" },
  { topic: "bookkeeping", label: "Monthly books" },
  { topic: "corporate_tax", label: "Corporate Tax" },
  { topic: "not_sure", label: "Not sure yet" },
];
/** Step 2's advisor row: the first advisor, or the team until advisors are confirmed. */
export const S5_ADVISOR = C.advisors[0]
  ? { name: C.advisors[0].name, meta: `${C.advisors[0].role} · ${C.advisors[0].languages}` }
  : { name: "Best Solution advisors", meta: "Video call or our Business Bay office" };
export const MODE_NOTE = { video: "We send you a link. Join from anywhere.", office: "Coffee at our office in Business Bay." };

/* ─── S6 ─── */
export const NO_PREF = `The first available advisor calls you${C.replyTime ? ` ${C.replyTime}` : ""}, in office hours.`;
export const OFFICE_LINE = C.officeAddress ?? "Business Bay, Dubai";

/* ─── S8 questions (also the FAQPage JSON-LD) ─── */
export const FAQ_GROUPS: { label: string; qs: { id: string; q: string; qShort: string; preview: string; a: string; aShort: string }[] }[] = [
  {
    label: "COSTS",
    qs: [
      {
        id: "pay_consultation",
        q: "Do I pay for the consultation?",
        qShort: "Do I pay for the consultation?",
        preview: "No. The call and your written plan cost nothing.",
        a: "No. The call and your written plan cost you nothing. If you want our help after that, we agree our fees with you before any work begins.",
        aShort: "No. The call and your written plan cost you nothing. If you want our help after that, we agree our fees with you before any work begins.",
      },
      {
        id: "costs_least",
        q: "Which free zone costs the least?",
        qShort: "Which free zone costs the least?",
        preview: "The smallest number on paper isn't always the smallest bill.",
        a: "The smallest number on paper isn't always the smallest bill by year two. It depends on your activity and your team. Your written plan compares the options for your case, side by side.",
        aShort: "The smallest number on paper isn't always the smallest bill by year two. Your plan compares the options for your case.",
      },
      {
        id: "what_decides_cost",
        q: "What decides my cost?",
        qShort: "What decides my cost?",
        preview: "Your activity, team, office and where you base it.",
        a: "Your activity, your team size, the office you need, and where you base it. Your written plan puts real numbers on each one, for year one and every year after.",
        aShort: "Your activity, your team size, the office you need, and where you base it. Your written plan puts real numbers on each one, for year one and every year after.",
      },
    ],
  },
  {
    label: "PROCESS",
    qs: [
      {
        id: "how_long",
        q: "How long does it all take?",
        qShort: "How long does it all take?",
        preview: "It depends. Your plan shows every step.",
        a: "It depends on your activity and the authority. Your written plan gives you a realistic timeline, step by step, so you can plan around it.",
        aShort: "It depends on your activity and the authority. Your plan shows a realistic timeline, step by step.",
      },
      {
        id: "existing_company",
        q: "I already have a company. Can you still help?",
        qShort: "I already have a company. Can you help?",
        preview: "Yes. Books, Corporate Tax and holding structures.",
        a: "Yes. We advise existing companies on monthly books, Corporate Tax and holding structures. Same first call, same answer in writing.",
        aShort: "Yes. Monthly books, Corporate Tax and holding structures. Same first call, same answer in writing.",
      },
      {
        id: "outside_uae",
        q: "Can I do this from outside the UAE?",
        qShort: "Can I do this from outside the UAE?",
        preview: "Yes, by video or WhatsApp from anywhere.",
        a: "Yes, the consultation works by video or WhatsApp from anywhere. Your plan tells you if and when anything needs you here in person.",
        aShort: "Yes, the consultation works by video or WhatsApp from anywhere. Your plan tells you if and when anything needs you here in person.",
      },
      {
        id: "after_form",
        q: "What happens after I send the form?",
        qShort: "What happens after I send the form?",
        preview: "An advisor calls you the same day.",
        a: "An advisor calls you the same day, in office hours. After the call, your written plan comes to your WhatsApp and email.",
        aShort: "An advisor calls you the same day, in office hours. After the call, your written plan comes to your WhatsApp and email.",
      },
    ],
  },
  {
    label: "ABOUT US",
    qs: [
      {
        id: "government_office",
        q: "Are you a government office?",
        qShort: "Are you a government office?",
        preview: "No. We're a private consultancy.",
        a: "No. We're a private consultancy in Business Bay. We advise you on your options, costs and next steps. The authorities make the final decisions.",
        aShort: "No. We're a private consultancy in Business Bay. The authorities make the final decisions.",
      },
      {
        id: "my_details",
        q: "What happens to my details?",
        qShort: "What happens to my details?",
        preview: "Used only to reply to you.",
        a: "We use them only to reply to you about your plan. We never sell or share them.",
        aShort: "We use them only to reply to you. We never sell or share them.",
      },
      // Hidden until the team's languages are confirmed (XS_CONFIG.teamLanguages).
      ...(C.teamLanguages
        ? [{ id: "languages", q: "Which languages do you speak?", qShort: "Which languages do you speak?", preview: C.teamLanguages, a: `Our advisors speak ${C.teamLanguages}.`, aShort: `Our advisors speak ${C.teamLanguages}.` }]
        : []),
    ],
  },
];
export const FAQS = FAQ_GROUPS.flatMap((g) => g.qs);
export const CHAT_TITLE = advisorName ? `${advisorName} · Best Solution` : "Best Solution";
export const CHAT_GREETING = advisorName ? `Hi, I'm ${advisorName}. Ask me anything about your company plan.` : "Hi. Ask us anything about your company plan.";

/* ─── S9 ─── */
export const S9_MICRO = `No obligation${C.replyTime ? ` · we reply ${C.replyTime}, in office hours` : ""}.`;
export const thanksBody = (who: string | null, pref: "whatsapp" | "call") =>
  `${who ?? "An advisor"} will ${pref === "whatsapp" ? "WhatsApp" : "call"} you${C.replyTime ? ` ${C.replyTime}` : ""}, in office hours. Your written plan follows after the call.`;
export const THANKS_PREP = { title: "Before your call, have these ready:", items: ["What you'll sell or offer", "Who your customers are, and where", "How many people will work with you"] };

/* Line icons (lucide shapes, stroke 2). */
export type IconName =
  | "arrowRight" | "arrowLeftRight" | "layers" | "book" | "percent" | "help" | "check" | "lock" | "phone" | "whatsapp" | "pin"
  | "clock" | "mail" | "send" | "user" | "file" | "plus" | "chevronLeft" | "chevronRight" | "hand" | "star" | "play" | "pause";
