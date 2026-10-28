import { describe, expect, it } from "vitest";
import { LEAD_RULES, MARKETING_ACCEPTED, leadConsent, withUaeCode } from "./lead";

describe("lead phone rule", () => {
  it("accepts a UAE number typed the local way and stores it with +971", () => {
    expect(withUaeCode("050 000 0000")).toBe("+971500000000");
    expect(withUaeCode("04 553 1546")).toBe("+97145531546");
    expect(withUaeCode("00971 50 000 0000")).toBe("+971500000000");
    expect(LEAD_RULES.mobile_no("050 000 0000")).toBe(true);
  });

  it("leaves international numbers alone and still refuses junk", () => {
    expect(withUaeCode("+44 7700 900123")).toBe("+44 7700 900123");
    expect(LEAD_RULES.mobile_no("+971 50 000 0000")).toBe(true);
    for (const bad of ["12", "0", "050", "hello", ""]) expect(LEAD_RULES.mobile_no(bad)).toBe(false);
  });
});

describe("lead consent", () => {
  it("keeps the five known cookie choices and marks anything else Unknown", () => {
    for (const v of ["Accepted all", "Rejected all", "Analytics only", "Marketing only", "No choice yet"]) expect(leadConsent(v)).toBe(v);
    for (const v of [undefined, "", "accepted all", "<script>", 1]) expect(leadConsent(v)).toBe("Unknown");
    expect([...MARKETING_ACCEPTED]).toEqual(["Accepted all", "Marketing only"]);
  });
});
