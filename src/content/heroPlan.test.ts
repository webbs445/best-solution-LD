import { describe, expect, it } from "vitest";
import {
  QUESTIONS,
  answerTags,
  cleanAnswers,
  coverLines,
  eventStep,
  nextScreen,
  planNoteRow,
  planPath,
  planService,
  planTitle,
  planTopic,
  stepCount,
  stepNumber,
  stepPill,
  type Answers,
  type Question,
  type Screen,
} from "./heroPlan";

/** Walk a path the way the card does: each answer, then the next screen. Returns every screen seen. */
function walk(answers: [Question, string][]): { screens: Screen[]; a: Answers } {
  const a: Answers = {};
  const screens: Screen[] = ["situation"];
  for (const [q, v] of answers) {
    (a as Record<string, string>)[q] = v;
    screens.push(nextScreen(q, a));
  }
  return { screens, a };
}

describe("hero plan card: flow", () => {
  it("new company: situation, base, timing, contact (4 steps)", () => {
    const { screens, a } = walk([["situation", "new"], ["base", "free_zone"], ["timing", "this_month"]]);
    expect(screens).toEqual(["situation", "base", "timing", "contact"]);
    expect(screens.map((s) => stepPill(s, a))).toEqual(["Step 1 of 4", "Step 2 of 4", "Step 3 of 4", "Last step"]);
    expect(stepPill("done", a)).toBe("Sent");
  });

  it("existing company asks the need, several companies asks where they are based", () => {
    expect(walk([["situation", "existing"], ["need", "books"], ["timing", "exploring"]]).screens).toEqual(["situation", "need", "timing", "contact"]);
    expect(walk([["situation", "several"], ["based", "abroad"], ["timing", "one_to_three"]]).screens).toEqual(["situation", "based", "timing", "contact"]);
  });

  it("not sure yet: straight to the timing, 3 steps", () => {
    const { screens, a } = walk([["situation", "not_sure"], ["timing", "this_month"]]);
    expect(screens).toEqual(["situation", "timing", "contact"]);
    expect(stepCount(a)).toBe(3);
    expect(screens.map((s) => stepPill(s, a))).toEqual(["Step 1 of 3", "Step 2 of 3", "Last step"]);
  });

  it("before any answer the card shows step 1 of 4", () => {
    expect(stepPill("situation", {})).toBe("Step 1 of 4");
    expect(stepNumber("contact", { situation: "new" })).toBe(4);
  });

  it("event steps: situation 1, the path's own question 2, timing 3", () => {
    expect((["situation", "base", "need", "based", "timing"] as Question[]).map(eventStep)).toEqual([1, 2, 2, 2, 3]);
  });
});

describe("hero plan card: titles, tags and cover lines", () => {
  it("builds the live title from the answers", () => {
    expect(planTitle({})).toBe("Your answers build it here");
    expect(planTitle({ situation: "new" })).toBe("New company");
    expect(planTitle({ situation: "new", base: "free_zone" })).toBe("New company in a free zone");
    expect(planTitle({ situation: "new", base: "mainland" })).toBe("New company on the mainland");
    expect(planTitle({ situation: "new", base: "help_decide" })).toBe("New company: free zone or mainland?");
    expect(planTitle({ situation: "existing" })).toBe("Your existing company");
    expect(planTitle({ situation: "existing", need: "books" })).toBe("Your company: monthly books");
    expect(planTitle({ situation: "existing", need: "tax" })).toBe("Your company: corporate tax");
    expect(planTitle({ situation: "existing", need: "both" })).toBe("Your company: books and tax together");
    expect(planTitle({ situation: "existing", need: "changes" })).toBe("Changes to your company");
    expect(planTitle({ situation: "several", based: "uae" })).toBe("A structure for your companies, UAE based");
    expect(planTitle({ situation: "several", based: "abroad" })).toBe("A structure for your companies, from abroad");
    expect(planTitle({ situation: "not_sure", timing: "exploring" })).toBe("Where to begin");
  });

  it("tags come from steps 2 and 3 only", () => {
    expect(answerTags({ situation: "new" })).toEqual([]);
    expect(answerTags({ situation: "new", base: "free_zone", timing: "this_month" })).toEqual(["Free zone", "This month"]);
  });

  it("cover lines follow the table", () => {
    expect(coverLines({ situation: "new", base: "free_zone" })[0]).toBe("Free zones that allow your activity");
    expect(coverLines({ situation: "new", base: "mainland" })[0]).toBe("What mainland needs for your activity");
    expect(coverLines({ situation: "new", base: "help_decide" })).toEqual(["Free zone and mainland, side by side", "What each option will cost", "Our recommendation, with the reasons"]);
    expect(coverLines({ situation: "existing", need: "books" })[2]).toBe("Our monthly fee, in writing");
    expect(coverLines({ situation: "existing", need: "tax" })).toEqual(coverLines({ situation: "existing", need: "both" }));
    expect(coverLines({ situation: "existing", need: "changes" })).toEqual(["What the change involves", "Cost and timeline", "What to prepare"]);
    expect(coverLines({ situation: "several", based: "uae" })[0]).toBe("A structure that fits your assets");
    expect(coverLines({ situation: "not_sure" })).toEqual(["Where to begin, for your situation", "Your first step", "A rough budget"]);
  });

  it("every option has a title, a sub line and a tag", () => {
    for (const q of Object.values(QUESTIONS)) for (const o of q.options) expect(o.title && o.sub && o.tag).toBeTruthy();
  });
});

describe("hero plan card: the lead", () => {
  it("maps the answers to the ERP Service Enquired option", () => {
    expect(planService({ situation: "new", base: "mainland" })).toBeUndefined(); // Business Setup (the ERP default)
    expect(planService({ situation: "not_sure" })).toBeUndefined();
    expect(planService({ situation: "existing", need: "books" })).toBe("Accounting & Bookkeeping Services");
    expect(planService({ situation: "existing", need: "tax" })).toBe("VAT & Tax Services");
    expect(planService({ situation: "existing", need: "both" })).toBe("VAT & Tax Services");
    expect(planService({ situation: "existing", need: "changes" })).toBe("Other Services");
    expect(planService({ situation: "several", based: "abroad" })).toBe("Other Services");
  });

  it("writes the one-line note, skipping empty parts", () => {
    const [k, v] = planNoteRow({ situation: "new", base: "free_zone", timing: "this_month" });
    expect(`${k}: ${v}`).toBe("Situation: I'm planning a new company · Base: Free zone · Timing: This month");
    const [k2, v2] = planNoteRow({ situation: "not_sure", timing: "exploring" });
    expect(`${k2}: ${v2}`).toBe("Situation: Not sure yet · Timing: Just exploring");
  });

  it("keeps only known answers on a real path", () => {
    expect(cleanAnswers({ situation: "new", base: "free_zone", need: "books", timing: "this_month" })).toEqual({ situation: "new", base: "free_zone", timing: "this_month" });
    expect(cleanAnswers({ situation: "hack", base: "free_zone" })).toBeNull();
    expect(cleanAnswers({ situation: "existing", need: "<script>", timing: "soon" })).toEqual({ situation: "existing", need: undefined, timing: undefined });
    expect(cleanAnswers(null)).toBeNull();
  });

  it("names the path for events and picks the page topic", () => {
    expect(planPath({ situation: "new", base: "free_zone", timing: "this_month" })).toBe("new_free_zone_this_month");
    expect(planPath({ situation: "not_sure", timing: "exploring" })).toBe("not_sure_exploring");
    expect(planTopic({ situation: "existing", need: "books" })).toBe("bookkeeping");
    expect(planTopic({ situation: "several" })).toBe("holding");
  });
});
