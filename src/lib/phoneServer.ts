import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/max";
import { DEFAULT_PHONE_COUNTRY, isPhoneCountry, type PhoneCountry } from "./phone";

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

/**
 * A lead request's number in E.164, read with its country picker value; "" when it is not a valid number.
 * Without a picker value (a page cached from before the picker) the number is read as UAE, as those forms did.
 */
export function bodyPhone(body: Record<string, unknown>): string {
  const raw = typeof body.mobile_no === "string" ? body.mobile_no : "";
  return validatePhoneServer(raw, isPhoneCountry(body.country) ? body.country : DEFAULT_PHONE_COUNTRY) ?? "";
}
