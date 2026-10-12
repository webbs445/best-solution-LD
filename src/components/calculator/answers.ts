import { STEPS } from "@/content/calculator";
import { maxResidents, pick, type Answers, type StepId } from "@/lib/pricing";

/** An answered step in words, for the answer tags and the result's "change" buttons. */
export function answerLabel(id: StepId, a: Answers): string {
  if (id === "residency") {
    const n = Math.min(a.residency ?? 0, maxResidents(a));
    return n === 0 ? "No residency" : n + (n === 1 ? " person" : " people");
  }
  if (id === "option") {
    const p = pick(a);
    return p && p.chosen ? p.opt.name : "Recommend one for me";
  }
  const opt = STEPS[id].options?.find((o) => o[0] === a[id]);
  return opt ? opt[1] : "";
}
