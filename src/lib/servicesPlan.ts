import { LEAD_RULES } from "@/lib/lead";
import { PHONE_COUNTRIES, toE164Phone, type PhoneCountry } from "@/lib/phone";
import { isNeed } from "@/content/xservicesx";

/* The /xservicesx form's field rules, shared by the form (instant feedback) and /api/services-plan (re-checked there). */

export type PlanField = "name" | "phone" | "need" | "email";
export interface PlanValues {
  name: string;
  phone: string;
  need: string;
  /** Optional: empty is fine, anything typed must look like a real address. */
  email: string;
}

/** The fields with a problem, in form order, and the number in E.164 when it is valid. */
export function checkPlan(v: PlanValues, country: PhoneCountry): { bad: PlanField[]; e164: string | null } {
  const e164 = toE164Phone(v.phone, country);
  const bad: PlanField[] = [];
  if (!LEAD_RULES.lead_name(v.name)) bad.push("name");
  if (!e164) bad.push("phone");
  if (!isNeed(v.need)) bad.push("need");
  if (v.email.trim() && !LEAD_RULES.email_id(v.email)) bad.push("email");
  return { bad, e164 };
}

/** "This doesn't look like a United Arab Emirates mobile number. …" (the brief's wording; "Other" asks for the country code). */
export function planPhoneError(c: PhoneCountry): string {
  const name = PHONE_COUNTRIES.find((x) => x.code === c && c !== "OTHER")?.name;
  return name
    ? `This doesn't look like a ${name} mobile number. Check it, or change the country.`
    : "This doesn't look like a full number with its country code. Check it, or change the country.";
}
