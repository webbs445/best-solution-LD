import { LEAD_RULES } from "@/lib/lead";
import { PHONE_COUNTRIES, toE164Phone, type PhoneCountry } from "@/lib/phone";
import { TOPICS, WORRIES, isTopic } from "@/content/xservicesx";
import { XS_CONFIG } from "@/content/xservicesx.config";

/* The /xservicesx form's field rules, shared by the form (instant feedback) and /api/services-plan (checked again there). */

export type PlanField = "name" | "phone" | "email";
export interface PlanValues {
  name: string;
  phone: string;
  email: string;
}

/** 2 to 60 characters: letters (any alphabet), spaces, apostrophes, hyphens and dots, starting with a letter. */
export const NAME_RE = /^\p{L}[\p{L}\p{M} '.\-]{1,59}$/u;
export const nameOk = (v: string) => NAME_RE.test(v.trim());

export const PLAN_ERRORS = {
  nameEmpty: "Please add your name.",
  nameBad: "Please use letters only (2 to 60), for example Sara Ahmed.",
  phoneEmpty: "Please add your WhatsApp number.",
  emailEmpty: "Please add your email.",
  emailBad: "Please check your email, for example name@company.com.",
} as const;

/** The number in plain words for the chosen country. */
export function planPhoneError(c: PhoneCountry): string {
  const name = PHONE_COUNTRIES.find((x) => x.code === c && c !== "OTHER")?.name;
  return name
    ? `This doesn't look like a ${name} mobile number. Check it, or change the country.`
    : "This doesn't look like a full number with its country code. Check it, or change the country.";
}

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

/** "+971 50 ••• 67": the country code, the first two and the last two digits of what was typed. */
export function maskPhone(raw: string, dial: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 4) return null;
  const intl = raw.trim().startsWith("+") || raw.trim().startsWith("00");
  const local = intl ? digits.replace(/^00/, "") : digits.replace(/^0/, "");
  const code = intl ? "+" : dial ? `${dial} ` : "";
  return `${code}${local.slice(0, 2)} ••• ${local.slice(-2)}`;
}


/** The visitor's page choices as ERP note rows, labels from the page's own lists. */
export function choiceRows(body: Record<string, unknown>): [string, string][] {
  const topic = isTopic(body.topic) ? body.topic : "not_sure";
  const worries = (Array.isArray(body.worries) ? body.worries : [])
    .filter((i): i is number => Number.isInteger(i) && i >= 0 && i < WORRIES.length)
    .map((i) => WORRIES[i].tag);
  const advisor = XS_CONFIG.advisors.find((a) => a.id === body.advisor_pref)?.name ?? "Any";
  const reply = body.contact_pref === "call" ? "Phone call" : "WhatsApp";
  const mode = body.consult_mode === "office" ? "Business Bay office" : body.consult_mode === "video" ? "Video call" : "";
  return [
    ["Topic", TOPICS[topic].label],
    ...(worries.length ? ([["Questions", [...new Set(worries)].join("; ")]] as [string, string][]) : []),
    ["Advisor", advisor],
    ["Reply by", reply],
    ...(mode ? ([["Meeting", mode]] as [string, string][]) : []),
    ["Form location", "s9"],
  ];
}
