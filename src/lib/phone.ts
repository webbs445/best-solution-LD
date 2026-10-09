import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

/*
  WhatsApp number capture: the country picker and E.164 normalisation. This module uses the compact
  metadata (fine for the browser); the API re-validates with the full metadata in lib/phoneServer.ts.
*/

export type PhoneCountry = CountryCode | "OTHER";

export const PHONE_COUNTRIES: { code: PhoneCountry; name: string; dial: string }[] = [
  { code: "AE", name: "United Arab Emirates", dial: "+971" },
  { code: "SA", name: "Saudi Arabia", dial: "+966" },
  { code: "OM", name: "Oman", dial: "+968" },
  { code: "QA", name: "Qatar", dial: "+974" },
  { code: "KW", name: "Kuwait", dial: "+965" },
  { code: "BH", name: "Bahrain", dial: "+973" },
  { code: "IN", name: "India", dial: "+91" },
  { code: "PK", name: "Pakistan", dial: "+92" },
  { code: "EG", name: "Egypt", dial: "+20" },
  { code: "PH", name: "Philippines", dial: "+63" },
  { code: "GB", name: "United Kingdom", dial: "+44" },
  { code: "US", name: "United States", dial: "+1" },
  { code: "OTHER", name: "Other", dial: "" },
];

export const DEFAULT_PHONE_COUNTRY: PhoneCountry = "AE";

export function isPhoneCountry(v: unknown): v is PhoneCountry {
  return typeof v === "string" && PHONE_COUNTRIES.some((c) => c.code === v);
}

/**
 * The number in E.164 (+971501234567), or null if it is not a valid number for the chosen country.
 * A number typed with its own "+" code is read as international whatever the picker says; "Other"
 * expects the full international number.
 */
export function toE164Phone(raw: string, country: PhoneCountry): string | null {
  const v = raw.trim();
  if (!v) return null;
  const intl = v.startsWith("+") || v.startsWith("00") || country === "OTHER";
  const text = v.startsWith("00") ? "+" + v.slice(2) : intl && !v.startsWith("+") ? "+" + v : v;
  const p = intl ? parsePhoneNumberFromString(text) : parsePhoneNumberFromString(text, country as CountryCode);
  return p && p.isValid() ? p.number : null;
}
