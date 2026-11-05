import type { ServiceId } from "@/content/services";

/*
  The /services "Not sure" helper: three questions, one recommended service.
  1. stage: starting a new business, or already running a UAE company
  2. focus: new → where the customers are; running → what takes the time
  3. assets: also holding property, shares or investments in a separate company?
  Holding assets points to structuring; otherwise the focus decides.
*/
export type HelperAnswers = {
  stage?: "new" | "running";
  focus?: "uae" | "international" | "books" | "tax";
  assets?: "yes" | "no";
};

export const HELPER_QUESTIONS = [
  {
    key: "stage",
    q: "Where are you today?",
    options: [
      { v: "new", label: "Starting a new business" },
      { v: "running", label: "Already running a UAE company" },
    ],
  },
  {
    key: "focus",
    q: (a: HelperAnswers) => (a.stage === "running" ? "What takes up most of your time?" : "Where are most of your customers?"),
    options: (a: HelperAnswers) =>
      a.stage === "running"
        ? [
            { v: "books", label: "Keeping the books" },
            { v: "tax", label: "Tax registration and returns" },
          ]
        : [
            { v: "uae", label: "In the UAE" },
            { v: "international", label: "Abroad or online" },
          ],
  },
  {
    key: "assets",
    q: "Do you also want to hold property, shares or investments in a separate company?",
    options: [
      { v: "yes", label: "Yes" },
      { v: "no", label: "No" },
    ],
  },
] as const;

const BY_FOCUS: Record<NonNullable<HelperAnswers["focus"]>, ServiceId> = {
  uae: "setup",
  international: "freezone",
  books: "accounting",
  tax: "tax",
};

/** The one service to recommend, or null until all three questions are answered. */
export function recommend(a: HelperAnswers): ServiceId | null {
  if (!a.stage || !a.focus || !a.assets) return null;
  return a.assets === "yes" ? "spv" : BY_FOCUS[a.focus];
}
