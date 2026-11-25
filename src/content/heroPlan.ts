import { AC_SERVICE_ENQUIRED, CT_SERVICE_ENQUIRED, SPV_SERVICE_ENQUIRED } from "@/lib/lead";
import type { IconName } from "@/content/xservicesx";

/*
  The /services hero plan builder (components/xservicesx/HeroPlanCard): questions, copy, the step flow, and what a
  lead from it carries to the ERP. Pure data and functions, shared by the card and /api/services-plan (which checks
  every value again, so nothing from the browser is trusted).
*/

export type Question = "situation" | "base" | "need" | "based" | "timing";
export type Situation = "new" | "existing" | "several" | "not_sure";
export type Base = "free_zone" | "mainland" | "help_decide";
export type Need = "books" | "tax" | "both" | "changes";
export type Based = "uae" | "abroad";
export type Timing = "this_month" | "one_to_three" | "exploring";
export interface Answers {
  situation?: Situation;
  base?: Base;
  need?: Need;
  based?: Based;
  timing?: Timing;
}
export type Screen = Question | "contact" | "done";

interface Option<T extends string> {
  id: T;
  title: string;
  sub: string;
  icon: IconName;
  /** Short label for the answer tags and the ERP note. */
  tag: string;
}

export const QUESTIONS: { [Q in Question]: { title: string; help: string; options: Option<string>[] } } = {
  situation: {
    title: "Where are you right now?",
    help: "Pick the one closest to you.",
    options: [
      { id: "new", title: "I'm planning a new company", sub: "Your first UAE company, or another one", icon: "plus", tag: "New company" },
      { id: "existing", title: "I already have a company", sub: "Books, Corporate Tax or changes", icon: "book", tag: "Existing company" },
      { id: "several", title: "Several companies or property", sub: "A structure that keeps them separate", icon: "layers", tag: "Several companies" },
      { id: "not_sure", title: "Not sure yet", sub: "We help you work it out", icon: "help", tag: "Not sure yet" },
    ],
  },
  base: {
    title: "Do you know where to base it?",
    help: "Not sure is fine. That's what the call is for.",
    options: [
      { id: "free_zone", title: "Free zone", sub: "Trade internationally, from a free zone office", icon: "arrowLeftRight", tag: "Free zone" },
      { id: "mainland", title: "Mainland", sub: "Trade directly with customers across the UAE", icon: "pin", tag: "Mainland" },
      { id: "help_decide", title: "Help me decide", sub: "We compare both for your activity", icon: "help", tag: "Help me decide" },
    ],
  },
  need: {
    title: "What do you need help with?",
    help: "Pick the main one. You can add more on the call.",
    options: [
      { id: "books", title: "Monthly books", sub: "Bookkeeping, bank matching, monthly reports", icon: "book", tag: "Monthly books" },
      { id: "tax", title: "Corporate Tax", sub: "What applies to you, and your next deadline", icon: "percent", tag: "Corporate Tax" },
      { id: "both", title: "Books and tax together", sub: "One team handles both", icon: "layers", tag: "Books and tax" },
      { id: "changes", title: "Changes to my company", sub: "Add an activity, move, a second company", icon: "file", tag: "Changes" },
    ],
  },
  based: {
    title: "Where are you based?",
    help: "So we match you with the right advisor.",
    options: [
      { id: "uae", title: "In the UAE", sub: "You live here or own a UAE company", icon: "pin", tag: "In the UAE" },
      { id: "abroad", title: "Outside the UAE", sub: "You invest or own from abroad", icon: "arrowLeftRight", tag: "Outside the UAE" },
    ],
  },
  timing: {
    title: "When are you planning?",
    help: "So your advisor knows how much detail you need.",
    options: [
      { id: "this_month", title: "This month", sub: "Ready to move soon", icon: "clock", tag: "This month" },
      { id: "one_to_three", title: "In 1 to 3 months", sub: "Planning ahead", icon: "clock", tag: "In 1 to 3 months" },
      { id: "exploring", title: "Just exploring", sub: "Comparing options for now", icon: "help", tag: "Just exploring" },
    ],
  },
};

/** The question after the situation: each path has its own, and "Not sure yet" goes straight to the timing. */
const SECOND: Record<Situation, Question> = { new: "base", existing: "need", several: "based", not_sure: "timing" };

/** The next screen once `answered` is answered. */
export function nextScreen(answered: Question, a: Answers): Screen {
  if (answered === "situation") return a.situation ? SECOND[a.situation] : "situation";
  if (answered === "timing") return "contact";
  return "timing";
}

/** Steps on this path: 3 for "Not sure yet" (situation, timing, contact), else 4. */
export const stepCount = (a: Answers) => (a.situation === "not_sure" ? 3 : 4);

/** Position of a screen on the path (1-based); the contact step is the last one. */
export function stepNumber(screen: Screen, a: Answers): number {
  if (screen === "situation") return 1;
  if (screen === "contact" || screen === "done") return stepCount(a);
  if (screen === "timing") return stepCount(a) - 1;
  return 2;
}

/** The pill: "Step 2 of 4", "Last step" on the contact step, "Sent" when done. */
export function stepPill(screen: Screen, a: Answers): string {
  if (screen === "done") return "Sent";
  if (screen === "contact") return "Last step";
  return `Step ${stepNumber(screen, a)} of ${stepCount(a)}`;
}

/** The step number for events (plan_step) and form_abandon (plan_last_step): situation 1, second question 2, timing 3. */
export const eventStep = (q: Question): 1 | 2 | 3 => (q === "situation" ? 1 : q === "timing" ? 3 : 2);

/** The live plan title. */
export function planTitle(a: Answers): string {
  switch (a.situation) {
    case "new":
      return `New company${a.base === "free_zone" ? " in a free zone" : a.base === "mainland" ? " on the mainland" : a.base === "help_decide" ? ": free zone or mainland?" : ""}`;
    case "existing":
      return a.need === "books"
        ? "Your company: monthly books"
        : a.need === "tax"
          ? "Your company: corporate tax"
          : a.need === "both"
            ? "Your company: books and tax together"
            : a.need === "changes"
              ? "Changes to your company"
              : "Your existing company";
    case "several":
      return `A structure for your companies${a.based === "uae" ? ", UAE based" : a.based === "abroad" ? ", from abroad" : ""}`;
    case "not_sure":
      return "Where to begin";
    default:
      return "Your answers build it here";
  }
}

const tagOf = (q: Question, id: string | undefined) => QUESTIONS[q].options.find((o) => o.id === id)?.tag;

/** Answer tags from steps 2 and 3, in order (empty before any). */
export const answerTags = (a: Answers): string[] =>
  [tagOf("base", a.base), tagOf("need", a.need), tagOf("based", a.based), tagOf("timing", a.timing)].filter((t): t is string => !!t);

/** "Your plan will cover": three lines for the path. */
export function coverLines(a: Answers): [string, string, string] {
  if (a.situation === "new") {
    if (a.base === "mainland") return ["What mainland needs for your activity", "Year one and every year after, in AED", "Your timeline, step by step"];
    if (a.base === "help_decide") return ["Free zone and mainland, side by side", "The cost of each, in AED", "Our recommendation, with the reasons"];
    return ["Free zones that allow your activity", "Year one and every year after, in AED", "Your timeline, step by step"];
  }
  if (a.situation === "existing") {
    if (a.need === "books") return ["What a month of books includes", "Software that fits your company", "Our monthly fee, in writing"];
    if (a.need === "changes") return ["What the change involves", "Cost and timeline", "What to prepare"];
    return ["Whether Corporate Tax applies to you", "Your next deadline", "What to prepare, as a checklist"];
  }
  if (a.situation === "several") return ["A structure that fits your assets", "What it keeps separate", "Cost and timeline"];
  return ["Where to begin, for your situation", "Your first step", "A rough budget, in AED"];
}

/* ─── Leads from the card (server side: /api/services-plan) ─── */

const IDS: { [Q in Question]: readonly string[] } = {
  situation: ["new", "existing", "several", "not_sure"],
  base: ["free_zone", "mainland", "help_decide"],
  need: ["books", "tax", "both", "changes"],
  based: ["uae", "abroad"],
  timing: ["this_month", "one_to_three", "exploring"],
};

/** The browser's answers, kept only when they are known values on a real path; anything else is dropped. */
export function cleanAnswers(raw: unknown): Answers | null {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const ok = (q: Question) => (typeof r[q] === "string" && IDS[q].includes(r[q] as string) ? (r[q] as string) : undefined);
  const situation = ok("situation") as Situation | undefined;
  if (!situation) return null;
  const second = SECOND[situation];
  const a: Answers = { situation, timing: ok("timing") as Timing | undefined };
  if (second !== "timing") (a as Record<string, string | undefined>)[second] = ok(second);
  return a;
}

/** The ERP "Service Enquired" option (undefined = the ERP default, Business Setup). */
export function planService(a: Answers): string | undefined {
  if (a.situation === "existing") return a.need === "books" ? AC_SERVICE_ENQUIRED : a.need === "changes" ? SPV_SERVICE_ENQUIRED : CT_SERVICE_ENQUIRED;
  if (a.situation === "several") return SPV_SERVICE_ENQUIRED;
  return undefined;
}

/**
 * The ERP note, one line: "Situation: … · Base: … · Need: … · Based: … · Timing: …" (empty parts skipped). Returned as
 * a [key, value] row because the ERP writes each row as "key: value".
 */
export function planNoteRow(a: Answers): [string, string] {
  const title = (q: Question, id?: string) => QUESTIONS[q].options.find((o) => o.id === id)?.title;
  const parts: [string, string | undefined][] = [
    ["Base", title("base", a.base)],
    ["Need", title("need", a.need)],
    ["Based", title("based", a.based)],
    ["Timing", title("timing", a.timing)],
  ];
  const rest = parts.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
  return ["Situation", [title("situation", a.situation) ?? "", ...rest].join(" · ")];
}

/** The path for events, e.g. new_free_zone_this_month. */
export const planPath = (a: Answers): string => [a.situation, a.base ?? a.need ?? a.based, a.timing].filter(Boolean).join("_");

/** The page topic a card lead counts as (for the existing lead parameters: topic, generate_lead). */
export function planTopic(a: Answers): "new_company" | "fz_or_mainland" | "holding" | "bookkeeping" | "corporate_tax" | "not_sure" {
  if (a.situation === "new") return a.base === "help_decide" ? "fz_or_mainland" : "new_company";
  if (a.situation === "existing") return a.need === "books" ? "bookkeeping" : a.need === "changes" ? "not_sure" : "corporate_tax";
  if (a.situation === "several") return "holding";
  return "not_sure";
}
