import { LEAD_RULES } from "@/lib/lead";
import { toE164Phone, type PhoneCountry } from "@/lib/phone";
import { PLAN_ERRORS, nameOk, planPhoneError, type PlanField, type PlanValues } from "@/lib/servicesPlan";

/* The /xservicesx form's full check. Its own module because it needs libphonenumber-js, which the page loads only once the visitor reaches the form. */

/** Each field's error message (empty when fine), and the number in E.164 when it is valid. */
export function checkPlan(v: PlanValues, country: PhoneCountry): { errors: Partial<Record<PlanField, string>>; e164: string | null } {
  const e164 = toE164Phone(v.phone, country);
  const errors: Partial<Record<PlanField, string>> = {};
  if (!v.name.trim()) errors.name = PLAN_ERRORS.nameEmpty;
  else if (!nameOk(v.name)) errors.name = PLAN_ERRORS.nameBad;
  if (!v.phone.trim()) errors.phone = PLAN_ERRORS.phoneEmpty;
  else if (!e164) errors.phone = planPhoneError(country);
  if (!v.email.trim()) errors.email = PLAN_ERRORS.emailEmpty;
  else if (!LEAD_RULES.email_id(v.email)) errors.email = PLAN_ERRORS.emailBad;
  return { errors, e164 };
}
