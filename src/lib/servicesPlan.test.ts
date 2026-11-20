import { describe, expect, it } from "vitest";
import { checkPlan, planPhoneError } from "./servicesPlan";
import { CARDS, NEEDS, NEED_SERVICE, XS_FACTS, isNeed } from "@/content/xservicesx";

const ok = { name: "Test", phone: "50 000 0000", need: "Not sure yet", email: "" };

describe("/xservicesx form rules", () => {
  it("accepts name, a UAE number typed the local way and a need, with email left empty", () => {
    expect(checkPlan(ok, "AE")).toEqual({ bad: [], e164: "+971500000000" });
  });

  it("flags each missing or bad field, in form order", () => {
    expect(checkPlan({ name: "", phone: "12", need: "", email: "nope" }, "AE").bad).toEqual(["name", "phone", "need", "email"]);
  });

  it("refuses a need that is not one of the six options", () => {
    expect(checkPlan({ ...ok, need: "Get me a licence" }, "AE").bad).toEqual(["need"]);
  });

  it("checks an email only when one is typed", () => {
    expect(checkPlan({ ...ok, email: "test.lead@example.com" }, "AE").bad).toEqual([]);
    expect(checkPlan({ ...ok, email: "test@mailinator.com" }, "AE").bad).toEqual(["email"]);
  });

  it("reads the number for the chosen country", () => {
    expect(checkPlan({ ...ok, phone: "50 000 0000" }, "GB").bad).toEqual(["phone"]);
    expect(planPhoneError("AE")).toBe("This doesn't look like a United Arab Emirates mobile number. Check it, or change the country.");
    expect(planPhoneError("OTHER")).toMatch(/country code/);
  });
});

describe("Need mapping", () => {
  it("has the brief's six options in order, each with a card that pre-fills it", () => {
    expect(NEEDS).toEqual(["Starting a new company", "Free zone or mainland", "Holding or several companies", "Bookkeeping", "Corporate Tax", "Not sure yet"]);
    expect(CARDS.map((c) => c.need)).toEqual([...NEEDS]);
    expect(isNeed("Bookkeeping")).toBe(true);
    expect(isNeed("bookkeeping")).toBe(false);
  });

  it("files each need under an exact ERP Service Enquired option (undefined = Business Setup)", () => {
    expect(NEED_SERVICE).toEqual({
      "Starting a new company": undefined,
      "Free zone or mainland": undefined,
      "Holding or several companies": "Other Services",
      Bookkeeping: "Accounting & Bookkeeping Services",
      "Corporate Tax": "VAT & Tax Services",
      "Not sure yet": undefined,
    });
  });

  it("keeps every unconfirmed fact null (the call number comes from SITE)", () => {
    const { callNumber, ...rest } = XS_FACTS;
    expect(Object.values(rest).every((v) => v === null)).toBe(true);
    expect(callNumber?.display).toBe("+971 52 233 0011");
  });
});
