import { AN_BOOK_STATES, AN_NEEDS, AN_SOFTWARE, AN_VOLUMES } from "@/content/accountingNew";
import { LEAD_ERRORS, LEAD_RULES } from "@/lib/lead";
import { toE164Phone } from "@/lib/phone";

/* /accounting-new quote form rules (section 9), kept free of React so they are tested on their own. */

export type QuoteStep = 1 | 2 | 3;
export type QuoteAnswers = { need: string; volume: string; software: string; books: string };
export type ContactField = "name" | "phone" | "email";
export type Contact = Record<ContactField, string>;

export const EMPTY_ANSWERS: QuoteAnswers = { need: "", volume: "", software: "", books: "" };

/** Whether "Next" may be pressed on this step. Step 3 is checked on submit instead (inline errors). */
export function stepComplete(step: QuoteStep, a: QuoteAnswers): boolean {
  if (step === 1) return (AN_NEEDS as readonly string[]).includes(a.need);
  if (step === 2) return AN_VOLUMES.includes(a.volume) && AN_SOFTWARE.includes(a.software) && AN_BOOK_STATES.includes(a.books);
  return true;
}

/** The paper's "Each month" line, as the design words it. */
export function volumeLine(volume: string): string {
  return !volume ? "" : volume === "Not sure" ? "Not sure" : `${volume} payments and invoices`;
}

/** The WhatsApp number in E.164: a UAE number as typed locally (050 …) or any country with its + code. */
export const contactPhone = (raw: string) => toE164Phone(raw, "AE");

/** One message per field that fails, in field order. Uses the site's lead pipeline rules and wording. */
export function contactErrors(c: Contact): Partial<Record<ContactField, string>> {
  const out: Partial<Record<ContactField, string>> = {};
  if (!LEAD_RULES.lead_name(c.name)) out.name = LEAD_ERRORS.lead_name;
  if (!contactPhone(c.phone)) out.phone = LEAD_ERRORS.mobile_no;
  if (!LEAD_RULES.email_id(c.email)) out.email = LEAD_ERRORS.email_id;
  return out;
}

/** The server's field names (422 response) mapped back to the form's fields. */
export const SERVER_FIELD: Record<string, ContactField> = { lead_name: "name", mobile_no: "phone", email_id: "email" };
