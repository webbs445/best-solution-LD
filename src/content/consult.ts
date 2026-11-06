/*
  /consult: the advice-only landing page for Google Ads. Copy is fixed by the brief: advice and consultation only,
  no prices, no timelines, no government services. Claims marked [CONFIRM] in the brief stay null here and are not
  shown until Best Solution confirms them; fill the value in to show it.
*/

export const CONSULT_URL = "https://business.best-solution.ae/consult";

export const CONSULT_CONTACT = {
  phone: { display: "+971 52 233 0011", href: "tel:+971522330011" },
  whatsapp: { display: "+971 4 553 1546", href: "https://wa.me/97145531546?text=Hi%2C%20I%27d%20like%20to%20book%20a%20consultation%20(ADV-AD)" },
  email: "connect@best-solution.ae",
};

/** [CONFIRM] items. null = not confirmed yet, so not shown. */
export const CONSULT_CONFIRM: {
  /** Step 3 body, e.g. "You receive a written summary of the options we discussed." */
  summaryStep: string | null;
  /** e.g. "Advising since 2014" */
  advisingSince: string | null;
  /** e.g. "Rated 4.8 from more than 200 Google reviews" (must match the live Google Business Profile on release day) */
  rating: string | null;
  /** e.g. "Advisors who speak English, Arabic, ..." */
  languages: string | null;
  /** The answer to "Is there a charge for the first consultation?" (must not use the word "free") */
  chargeAnswer: string | null;
  /** e.g. "within one working day", appended to the form sub line */
  replyTime: string | null;
} = {
  summaryStep: null,
  advisingSince: null,
  rating: null,
  languages: null,
  chargeAnswer: null,
  replyTime: null,
};

export const CONSULT_DISCLAIMER =
  "Best Solution is a private business consultancy. We are not affiliated with any government entity or free zone authority. Official decisions are made only by the relevant UAE authorities.";

export const CONSULT_HELP: { title: string; body: string; icon: string }[] = [
  {
    title: "Where to base your business",
    body: "Mainland, free zone or offshore, explained in plain terms so you can compare.",
    icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c3 3.2 3 16.8 0 20M12 2c-3 3.2-3 16.8 0 20",
  },
  {
    title: "Planning your budget",
    body: "What to plan for, so there are fewer surprises later.",
    icon: "M4 19V9M10 19V5M16 19v-6M22 19H2",
  },
  {
    title: "Office options",
    body: "Flexi desk, shared office or private office, and which suits how you work.",
    icon: "M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6",
  },
  {
    title: "Bookkeeping and accounts",
    body: "Ongoing support for businesses already running in the UAE.",
    icon: "M4 3h12l4 4v14H4zM8 9h8M8 13h8M8 17h5",
  },
];

export const CONSULT_STEPS: { title: string; body: string | null }[] = [
  { title: "Tell us about your plans", body: "A short form or a WhatsApp message." },
  { title: "Talk it through", body: "Meet an advisor in Business Bay or on a video call." },
  { title: "Leave with clarity", body: CONSULT_CONFIRM.summaryStep },
];

/** "Why people talk to us": the office line is a plain fact; the rest show only once confirmed. */
export const CONSULT_WHY: string[] = [
  "Office in Business Bay, Dubai",
  CONSULT_CONFIRM.advisingSince,
  CONSULT_CONFIRM.rating,
  CONSULT_CONFIRM.languages,
].filter((w): w is string => !!w);

/*
  Reviews: three real Google reviews, word for word, with first name and month/year. None is confirmed yet (the
  site's review list has no dates), so the section stays hidden until entries are added here.
*/
export const CONSULT_REVIEWS: { quote: string; name: string; date: string }[] = [];

export const CONSULT_FAQS: { q: string; a: string }[] = [
  {
    q: "What happens in a consultation?",
    a: "You share your plans and questions. An advisor explains your options in plain terms so you can decide your next step.",
  },
  { q: "Can I talk to you without coming to the office?", a: "Yes. You can meet us in Business Bay or book a video call." },
  ...(CONSULT_CONFIRM.chargeAnswer ? [{ q: "Is there a charge for the first consultation?", a: CONSULT_CONFIRM.chargeAnswer }] : []),
  {
    q: "Are you a government office?",
    a: "No. Best Solution is a private consultancy and is not affiliated with any government entity or free zone authority.",
  },
  { q: "Do you help businesses that are already running?", a: "Yes. We offer ongoing bookkeeping and accounts support." },
];

/** The form's "What would you like advice on?" options (also checked by /api/consult). */
export const CONSULT_TOPICS = ["Where to base my business", "Budget planning", "Office options", "Bookkeeping and accounts", "Something else"] as const;
export type ConsultTopic = (typeof CONSULT_TOPICS)[number];

/** Form field errors, worded for this page (the shared lead messages use words this page avoids). */
export const CONSULT_ERRORS = {
  name: "Please enter your full name.",
  phone: "Please enter your phone number with country code, for example 050 123 4567 or +44 20 1234 5678.",
  email: "Please enter an email address you check.",
  topic: "Please choose what you would like advice on.",
};
