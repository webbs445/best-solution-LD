import { describe, expect, it } from "vitest";
import { phoneErrorText, toE164Phone, type PhoneCountry } from "./phone";
import { bodyPhone, validatePhoneServer } from "./phoneServer";

/*
  Every format from the landing page audit (2026-11-20), through the browser check (toE164Phone), the server check
  (validatePhoneServer) and the route helper (bodyPhone). Synthetic all-zero numbers only.
*/
const ACCEPTED: [input: string, picker: PhoneCountry, e164: string][] = [
  ["+971 50 000 0000", "AE", "+971500000000"],
  ["+971500000000", "AE", "+971500000000"],
  ["050 000 0000", "AE", "+971500000000"],
  ["0500000000", "AE", "+971500000000"],
  ["00971500000000", "AE", "+971500000000"],
  ["00971 50 000 0000", "AE", "+971500000000"],
  ["50 000 0000", "AE", "+971500000000"], // no leading 0
  ["500000000", "AE", "+971500000000"],
  ["971500000000", "AE", "+971500000000"], // 971 without the plus
  ["971 50 000 0000", "AE", "+971500000000"],
  ["  050-000-0000 ", "AE", "+971500000000"], // dashes and stray spaces
  ["+91 90000 00000", "AE", "+919000000000"], // its own + code wins over the picker
  ["90000 00000", "IN", "+919000000000"], // local Indian number with the India picker
  ["+92 300 0000000", "AE", "+923000000000"],
  ["0300 0000000", "PK", "+923000000000"], // local Pakistani number with the Pakistan picker
  ["+92 300 0000000", "OTHER", "+923000000000"],
];

const REJECTED: [input: string, picker: PhoneCountry][] = [
  ["09000000000", "AE"], // a local Indian number while the picker says UAE: the message names the country
  ["90000 00000", "AE"],
  ["03000000000", "AE"],
  ["0500000000", "OTHER"], // "Other" needs the full international number
  ["12345", "AE"],
  ["", "AE"],
];

describe("every number format from the audit", () => {
  it.each(ACCEPTED)("accepts %s (picker %s) as %s in the browser, on the server and in the route", (input, picker, e164) => {
    expect(toE164Phone(input, picker)).toBe(e164);
    expect(validatePhoneServer(input, picker)).toBe(e164);
    expect(bodyPhone({ mobile_no: input, country: picker })).toBe(e164);
  });

  it.each(REJECTED)("rejects %s (picker %s) everywhere", (input, picker) => {
    expect(toE164Phone(input, picker)).toBeNull();
    expect(validatePhoneServer(input, picker)).toBeNull();
    expect(bodyPhone({ mobile_no: input, country: picker })).toBe("");
  });

  it("reads a request without a picker value as UAE (pages cached from before the picker)", () => {
    expect(bodyPhone({ mobile_no: "050 000 0000" })).toBe("+971500000000");
    expect(bodyPhone({ mobile_no: "050 000 0000", country: "XX" })).toBe("+971500000000");
    expect(bodyPhone({ mobile_no: 500000000 })).toBe("");
  });

  it("names the chosen country in the error message", () => {
    expect(phoneErrorText("AE")).toContain("United Arab Emirates");
    expect(phoneErrorText("IN")).toContain("India");
    expect(phoneErrorText("OTHER")).toContain("country code");
  });
});

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
