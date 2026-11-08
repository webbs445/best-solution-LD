import { describe, expect, it } from "vitest";
import { DATA } from "./pricing";
import { chosenOption, leadAnswers, PLAN_OPTIONS, planAnswerLabel, planOrder } from "./setupPlan";

describe("setupPlan", () => {
  it("uses the same option ids as the server rate card, in every jurisdiction", () => {
    for (const j of ["mainland", "freezone", "offshore"] as const) {
      expect(PLAN_OPTIONS[j].map((o) => o.id).sort()).toEqual(DATA[j].map((o) => o.id).sort());
    }
  });

  it("carries no prices or government department names", () => {
    const text = JSON.stringify(PLAN_OPTIONS);
    expect(text).not.toMatch(/AED|price|\bDED\b|\bDET\b|SEDD|licen[cs]e|visa|residen/i);
  });

  it("asks only the questions that apply", () => {
    expect(planOrder({})).toEqual(["jurisdiction", "option", "team", "workspace"]);
    expect(planOrder({ jurisdiction: "undecided" })).toEqual(["jurisdiction", "team", "workspace"]);
    expect(planOrder({ jurisdiction: "offshore" })).toEqual(["jurisdiction", "option"]);
  });

  it("describes the choices and sends them without residency", () => {
    const a = { jurisdiction: "freezone" as const, option: "f1", team: 3, workspace: "flexi" as const };
    expect(chosenOption(a)?.name).toBe("Meydan Free Zone");
    expect(planAnswerLabel("team", a)).toBe("3 people");
    expect(planAnswerLabel("option", { ...a, option: "recommend" })).toBe("Recommend one for me");
    expect(leadAnswers(a)).toEqual({ jurisdiction: "freezone", option: "f1", residency: 0, workspace: "flexi", bank: "no" });
  });
});
