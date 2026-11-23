import type { CountryCode } from "libphonenumber-js";

/*
  The WhatsApp number country picker: its list, labels and messages. No phone library here (type only), so a page
  can show the picker without loading libphonenumber-js; lib/phone adds the number check on top.
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

/** The picker's short option text: "+971 UAE", "+91 India", "Other". */
export const phoneCountryLabel = (c: (typeof PHONE_COUNTRIES)[number]): string =>
  c.code === "OTHER" ? "Other" : `${c.dial} ${c.code === "AE" ? "UAE" : c.code === "GB" ? "UK" : c.code === "US" ? "US" : c.name}`;

/** The number field's placeholder for the chosen country. */
export const phonePlaceholder = (c: PhoneCountry): string => (c === "AE" ? "50 123 4567" : c === "OTHER" ? "+44 20 7946 0000" : "Mobile number");

/** The message under a number that is not valid for the chosen country. */
export function phoneErrorText(c: PhoneCountry): string {
  if (c === "OTHER") return "Please type the full number with its country code, for example +44 20 7946 0000.";
  return `Please check the number. It does not look like a ${PHONE_COUNTRIES.find((x) => x.code === c)?.name ?? ""} mobile number.`;
}

