import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/max";
import type { PhoneCountry } from "./phone";

/*
  Server-side number check with the full metadata (validates digit patterns, not just length).
  Same rules as toE164Phone in lib/phone.ts.
*/
export function validatePhoneServer(raw: string, country: PhoneCountry): string | null {
  const v = raw.trim();
  if (!v || v.length > 40) return null;
  const intl = v.startsWith("+") || v.startsWith("00") || country === "OTHER";
  const text = v.startsWith("00") ? "+" + v.slice(2) : intl && !v.startsWith("+") ? "+" + v : v;
  const p = intl ? parsePhoneNumberFromString(text) : parsePhoneNumberFromString(text, country as CountryCode);
  return p && p.isValid() ? p.number : null;
}
