/*
  Section 3 books check: state transitions and the result, as pure functions (mirrors the S3Report design script).
  Line 00 is "Is your company trading yet?" (true = Trading, false = Not yet); lines 01 to 05 are a[0..4].
*/
export type Answer = boolean | null;
export type CheckState = { trading: Answer; a: Answer[] };

export const QUESTIONS = [
  "My books are updated every month",
  "Every payment in and out of my bank has a matching record",
  "I could see last month's profit today",
  "I could send statements to my bank or auditor tomorrow",
  "I know when my VAT and Corporate Tax returns are due",
];

const FIXES = [
  "Your books updated every month",
  "Every bank payment matched to a record",
  "Last month's profit on one page",
  "Statements ready for your bank or auditor",
  "Your VAT and Corporate Tax dates tracked for you",
];

export type ResultLabel = "Day one" | "On track" | "Slipping" | "At risk";
export type CheckResult = { title: ResultLabel; text: string; cta: string; color: string; fixes: string[] };

export const EMPTY: CheckState = { trading: null, a: [null, null, null, null, null] };

/** Ticking any of lines 01 to 05 also answers line 00 as Trading, unless it was already answered. */
export function answerLine(s: CheckState, k: number, v: boolean): CheckState {
  const a = s.a.slice();
  a[k] = v;
  return { a, trading: s.trading === null ? true : s.trading };
}

export function setTrading(s: CheckState, v: boolean): CheckState {
  return { ...s, trading: v };
}

export function reset(): CheckState {
  return EMPTY;
}

export function answeredCount(s: CheckState): number {
  return s.a.filter((v) => v !== null).length;
}

export function getResult(s: CheckState): CheckResult | null {
  if (s.trading === false)
    return { title: "Day one", text: "You're early, which is the best time to get this right.", cta: "Get my quote today", color: "#14213D", fixes: [] };
  if (s.trading !== true || answeredCount(s) < 5) return null;
  const yes = s.a.filter((v) => v).length;
  const fixes = FIXES.filter((_, i) => !s.a[i]);
  if (yes === 5) return { title: "On track", text: "Your books are in good shape. A monthly check keeps them there.", cta: "Get my quote today", color: "#14213D", fixes };
  if (yes >= 3)
    return { title: "Slipping", text: "Small gaps now become big problems at year end. Your first fixes are on the report.", cta: "Get my fix plan today", color: "#A8623E", fixes };
  return {
    title: "At risk",
    text: "More common than you think, and fixable. We catch up the missing months first, then keep them current.",
    cta: "Get my fix plan today",
    color: "#9B2C2C",
    fixes,
  };
}
