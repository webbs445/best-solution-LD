import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

/*
  WhatsApp number capture: the country picker and E.164 normalisation. This module uses the compact
  metadata (fine for the browser); the API re-validates with the full metadata in lib/phoneServer.ts.
*/

export * from "./phoneCountries";
import type { PhoneCountry } from "./phoneCountries";

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
