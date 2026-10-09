import { describe, expect, it } from "vitest";
import { toE164Phone } from "./phone";
import { validatePhoneServer } from "./phoneServer";

describe("WhatsApp number validation", () => {
  it("normalises UAE numbers to E.164 with or without the leading 0", () => {
    expect(toE164Phone("050 123 4567", "AE")).toBe("+971501234567");
    expect(toE164Phone("501234567", "AE")).toBe("+971501234567");
    expect(validatePhoneServer("050 123 4567", "AE")).toBe("+971501234567");
  });

  it("reads a number typed with its own + code as international", () => {
    expect(toE164Phone("+44 7911 123456", "AE")).toBe("+447911123456");
    expect(validatePhoneServer("+91 98765 43210", "OTHER")).toBe("+919876543210");
  });

  it("validates per country and rejects numbers that do not fit", () => {
    expect(validatePhoneServer("050 123 4567", "QA")).toBeNull();
    expect(validatePhoneServer("12345", "AE")).toBeNull();
    expect(validatePhoneServer("", "AE")).toBeNull();
    expect(validatePhoneServer("0501234567", "OTHER")).toBeNull();
  });
});
