import type { Advisor, Review } from "@/content/xservicesx.config";

/*
  QA fixtures for the /xservicesx browser suite only (scripts/qa/xservicesx.mjs). Applied only when a local build sets
  NEXT_PUBLIC_XS_FIXTURE; never set on Vercel, so the live page always shows XS_CONFIG as written. The reviews say
  plainly that they are not real, in case one is ever seen.
*/
const review = (n: number, topic: Review["topic"]): Review => ({
  topic,
  text: `QA fixture review ${n}. Not a real review, used only by the local test build. It is long enough to test the three line clamp on the review card in the wall.`,
  firstNameInitial: `Tester ${String.fromCharCode(64 + n)}.`,
  stars: 5,
});
const reviews = (n: number) => Array.from({ length: n }, (_, i) => review(i + 1, i % 3 ? "bookkeeping" : null));
const advisor: Advisor = { id: "qa", name: "QA Advisor", role: "QA role", languages: "English", focusLabel: "New companies", topics: ["New companies"], quote: "QA fixture quote.", photo: null };

export const XS_FIXTURES: Record<string, { advisors?: Advisor[]; reviews?: Review[] }> = {
  reviews3: { reviews: reviews(3) },
  full: { advisors: [advisor], reviews: reviews(8) },
  wall: { reviews: reviews(8) },
};
