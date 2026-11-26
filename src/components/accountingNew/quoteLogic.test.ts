import { describe, expect, it } from "vitest";
import { EMPTY_ANSWERS, contactErrors, contactPhone, stepComplete, volumeLine } from "./quoteLogic";

describe("/accounting-new quote form rules", () => {
  it("step 1 needs one of the six needs", () => {
    expect(stepComplete(1, EMPTY_ANSWERS)).toBe(false);
    expect(stepComplete(1, { ...EMPTY_ANSWERS, need: "Something else" })).toBe(false);
    expect(stepComplete(1, { ...EMPTY_ANSWERS, need: "Catch up on past months" })).toBe(true);
  });

  it("step 2 needs all three rows answered", () => {
    const a = { ...EMPTY_ANSWERS, need: "Not sure yet", volume: "Under 50", software: "Not sure" };
    expect(stepComplete(2, a)).toBe(false);
    expect(stepComplete(2, { ...a, books: "Not sure" })).toBe(true);
    expect(stepComplete(2, { ...a, books: "Up to date", volume: "" })).toBe(false);
  });

  it("words the paper's volume line as the design does", () => {
    expect(volumeLine("")).toBe("");
    expect(volumeLine("200 to 500")).toBe("200 to 500 payments and invoices");
    expect(volumeLine("Not sure")).toBe("Not sure");
  });

  it("accepts a UAE mobile typed locally or with +971, and an international number with its code", () => {
    expect(contactPhone("050 000 0000")).toBe("+971500000000");
    expect(contactPhone("+971 50 000 0000")).toBe("+971500000000");
    expect(contactPhone("+44 7911 123456")).toBe("+447911123456");
    expect(contactPhone("12")).toBeNull();
    expect(contactPhone("")).toBeNull();
  });

  it("returns one inline error per bad field and none for a good contact", () => {
    expect(Object.keys(contactErrors({ name: "", phone: "12", email: "nope" }))).toEqual(["name", "phone", "email"]);
    expect(contactErrors({ name: "TEST AUDIT - DELETE", phone: "500000000", email: "test-audit@xerebo.com" })).toEqual({});
  });
});
