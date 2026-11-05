import type { GoalId, SetupOption } from "@/content/services";

/*
  The /services "I'm not sure yet" helper: three questions, one recommendation.
  1. stage: starting a new business, or already running a UAE company
  2. focus: new → where the customers are; running → what takes the time
  3. assets: also holding property, shares or investments in a separate company?
  Holding assets points to structuring; otherwise the focus decides. A new business is pointed at "Start a company"
  with the route that fits (UAE customers: mainland, abroad or online: free zone).
*/
export type HelperAnswers = {
  stage?: "new" | "running";
  focus?: "uae" | "international" | "books" | "tax";
  assets?: "yes" | "no";
};

export type Recommendation = { goal: GoalId; option?: SetupOption };

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

const BY_FOCUS: Record<NonNullable<HelperAnswers["focus"]>, Recommendation> = {
  uae: { goal: "setup", option: "mainland" },
  international: { goal: "setup", option: "freezone" },
  books: { goal: "accounting" },
  tax: { goal: "tax" },
};

/** The one goal to recommend (with the setup route for a new business), or null until all three are answered. */
export function recommend(a: HelperAnswers): Recommendation | null {
  if (!a.stage || !a.focus || !a.assets) return null;
  return a.assets === "yes" ? { goal: "spv" } : BY_FOCUS[a.focus];
}
