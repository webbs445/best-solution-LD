import { describe, expect, it } from "vitest";
import { EMPTY_ANSWERS, contactErrors, contactPhone, firstOpenStep, needFromServices, prefillFromCheck, stepComplete, volumeLine } from "./quoteLogic";

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

describe("/accounting-new pop-up prefill", () => {
  const full = { need: "Not sure yet", volume: "Under 50", software: "Excel", books: "Up to date" };
  it("starts at the first open question", () => {
    expect(firstOpenStep(EMPTY_ANSWERS)).toBe(1);
    expect(firstOpenStep({ ...EMPTY_ANSWERS, need: "Not sure yet" })).toBe(2);
    expect(firstOpenStep({ ...full, software: "" })).toBe(2);
    expect(firstOpenStep(full)).toBe(3);
    // Book rows filled but no need: still step 1.
    expect(firstOpenStep({ ...full, need: "" })).toBe(1);
  });
  it("maps ticked services to a need only when they settle it", () => {
    expect(needFromServices([])).toBe("");
    expect(needFromServices(["Bookkeeping"])).toBe("Keep my books every month");
    expect(needFromServices(["Bank reconciliation", "VAT returns"])).toBe("Keep my books every month");
    expect(needFromServices(["Catch-up bookkeeping"])).toBe("Catch up on past months");
    expect(needFromServices(["VAT returns", "Corporate Tax return"])).toBe("File my VAT or Corporate Tax");
    expect(needFromServices(["Audit-ready records"])).toBe("Statements for my bank or auditor");
    expect(needFromServices(["VAT returns", "Financial statements"])).toBe("");
    expect(needFromServices(["Catch-up bookkeeping", "VAT returns"])).toBe("");
  });
  it("fills from the books check only what the answers prove", () => {
    expect(prefillFromCheck(true, true)).toEqual({ books: "Up to date" });
    expect(prefillFromCheck(true, false)).toEqual({});
    expect(prefillFromCheck(true, null)).toEqual({});
    expect(prefillFromCheck(false, null)).toEqual({ need: "My company is new" });
  });
  it("only uses the form's own options", () => {
    const p = prefillFromCheck(false, true);
    expect(stepComplete(1, { ...EMPTY_ANSWERS, need: p.need! })).toBe(true);
    expect(["Up to date"]).toContain(p.books);
  });
});
