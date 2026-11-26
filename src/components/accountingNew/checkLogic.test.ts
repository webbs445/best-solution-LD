import { describe, expect, it } from "vitest";
import { EMPTY, answerLine, getResult, reset, setTrading, type CheckState } from "./checkLogic";

const fill = (answers: boolean[], s: CheckState = EMPTY) => answers.reduce((st, v, k) => answerLine(st, k, v), s);

describe("books check", () => {
  it("ticking a line sets line 00 to Trading when unanswered", () => {
    expect(answerLine(EMPTY, 2, false).trading).toBe(true);
    expect(answerLine(EMPTY, 0, true).trading).toBe(true);
  });

  it("does not overwrite line 00 once answered", () => {
    expect(answerLine(setTrading(EMPTY, false), 1, true).trading).toBe(false);
    expect(answerLine(setTrading(EMPTY, true), 1, false).trading).toBe(true);
  });

  it("has no result until all five lines are ticked", () => {
    expect(getResult(EMPTY)).toBeNull();
    expect(getResult(fill([true, true, true, true]))).toBeNull();
  });

  it("Not yet gives Day one", () => {
    expect(getResult(setTrading(EMPTY, false))?.title).toBe("Day one");
    expect(getResult(setTrading(fill([false, false, false, false, false]), false))?.title).toBe("Day one");
  });

  it("five yes is On track with no fixes", () => {
    const r = getResult(fill([true, true, true, true, true]));
    expect(r?.title).toBe("On track");
    expect(r?.fixes).toEqual([]);
  });

  it("three or four yes is Slipping, fixes list the no lines", () => {
    expect(getResult(fill([true, true, true, true, false]))?.title).toBe("Slipping");
    const r = getResult(fill([true, false, true, false, true]));
    expect(r?.title).toBe("Slipping");
    expect(r?.fixes).toEqual(["Every bank payment matched to a record", "Statements ready for your bank or auditor"]);
  });

  it("two or fewer yes is At risk", () => {
    expect(getResult(fill([true, true, false, false, false]))?.title).toBe("At risk");
    expect(getResult(fill([false, false, false, false, false]))?.fixes).toHaveLength(5);
  });

  it("reset clears every answer", () => {
    expect(reset()).toEqual({ trading: null, a: [null, null, null, null, null] });
  });

  it("transitions do not mutate the previous state", () => {
    answerLine(EMPTY, 0, true);
    expect(EMPTY.a[0]).toBeNull();
  });
});
