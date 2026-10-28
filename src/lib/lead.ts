/* Lead field rules, shared by the form (instant feedback) and /api/lead (authoritative check). */

/* Throwaway inbox services and made-up addresses, refused in the form and on the server (which also checks
   that the domain can receive mail, lib/emailCheck). */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "yopmail.com", "tempmail.com", "temp-mail.org", "10minutemail.com", "guerrillamail.com",
  "sharklasers.com", "trashmail.com", "getnada.com", "maildrop.cc", "dispostable.com", "throwawaymail.com",
  "fakeinbox.com", "mintemail.com", "emailondeck.com", "mohmal.com", "tempr.email", "moakt.com",
  "burnermail.io", "mailnesia.com", "mytemp.email", "tempmailo.com", "inboxkitten.com", "spamgourmet.com",
  "test.com", "fake.com", "asdf.com", "domain.com",
]);
const FAKE_NAMES = new Set([
  "test", "testing", "asdf", "asd", "abc", "abcd", "qwerty", "aaa", "xxx", "fake", "none", "noemail", "no", "na", "null",
  "123", "1234", "12345",
]);

/** A throwaway or obviously made-up address (test@…, asdf@…, …@mailinator.com). */
export function emailLooksFake(v: string): boolean {
  const [name = "", domain = ""] = v.trim().toLowerCase().split("@");
  return FAKE_NAMES.has(name) || DISPOSABLE_DOMAINS.has(domain);
}

/** A UAE number typed the local way ("050 123 4567", "04 553 1546") gets +971; "00…" becomes "+…"; anything else is unchanged. */
export function withUaeCode(v: string): string {
  const d = v.trim().replace(/[\s()-]/g, "");
  if (/^0[1-9]\d{7,8}$/.test(d)) return "+971" + d.slice(1);
  if (/^00[1-9]\d{6,}$/.test(d)) return "+" + d.slice(2);
  return v.trim();
}

/** The visitor's cookie choice when they sent the lead ("Cookie choice" in the ERP notes, "Cookie consent" in the lead log). */
export const LEAD_CONSENT = ["Accepted all", "Rejected all", "Analytics only", "Marketing only", "No choice yet"] as const;
/** Only these leads may go in the Google Ads conversion upload: the privacy policy makes Marketing opt-in. */
export const MARKETING_ACCEPTED: ReadonlySet<string> = new Set(["Accepted all", "Marketing only"]);
/** A request's consent value, checked against LEAD_CONSENT; anything else is "Unknown". */
export const leadConsent = (v: unknown): string => ((LEAD_CONSENT as readonly unknown[]).includes(v) ? (v as string) : "Unknown");

export const LEAD_RULES = {
  lead_name: (v: string) => v.trim().length > 1,
  email_id: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) && !emailLooksFake(v),
  mobile_no: (v: string) => /^\+\d[\d\s()-]{6,18}$/.test(withUaeCode(v)),
} as const;

export type LeadField = keyof typeof LEAD_RULES;

export const LEAD_ERRORS: Record<LeadField, string> = {
  lead_name: "Please enter your full name.",
  email_id: "Please enter a real email address you check. Your written copy is sent there.",
  mobile_no: "Enter your WhatsApp number, for example 050 123 4567. Outside the UAE, start with your country code.",
};

/*
  Form and calculator ids in the dataLayer (form_data.form_id, calculator_data.calculator_id) and on
  each form's data-track attribute. Human-readable like the main site's ("Cost Calculator"), with an
  "LP" prefix so landing-page leads are separable from best-solution.ae leads in GA4 and Ads.
*/
export const FORM_ID = "LP Cost Calculator";
export const CALLBACK_FORM_ID = "LP Callback Request";
/** The /freezone page's planner ("Request My Estimate"). */
export const FZ_FORM_ID = "LP Free Zone Planner";
/** The /accounting page's quote builder ("Send my quote request"). */
export const AC_FORM_ID = "LP Accounting Quote";
/** The ERP "Service Enquired" option for every /accounting lead (an exact Select option in the ERP). */
export const AC_SERVICE_ENQUIRED = "Accounting & Bookkeeping Services";
/** The /spv page's consultation form (foundations, SPVs, holding and offshore companies). */
export const SPV_FORM_ID = "LP Structuring Consultation";
/** The ERP has no structuring option for "Service Enquired", so /spv leads use "Other Services". */
export const SPV_SERVICE_ENQUIRED = "Other Services";
/** The /corporate-tax page's free tax review form ("Book my free tax review"). */
export const CT_FORM_ID = "LP Corporate Tax Review";
/** The /corporate-tax estimator's pop-up: the visitor's details open their tax estimate ("Show my tax estimate"). */
export const CT_ESTIMATE_FORM_ID = "LP Corporate Tax Estimate";
/** The ERP "Service Enquired" option for every /corporate-tax lead (an exact Select option in the ERP). */
export const CT_SERVICE_ENQUIRED = "VAT & Tax Services";

/** The /cost-calculator page's price pop-up: the visitor's details open their price ("Show my price"). */
export const CC_PRICE_FORM_ID = "LP Cost Calculator Price";
/** The /cost-calculator page's written quote form ("Send me my written quote"). */
export const CC_QUOTE_FORM_ID = "LP Cost Calculator Quote";
/** calculator_id of the /cost-calculator configurator's events (the home page calculator uses FORM_ID). */
export const CC_CALCULATOR_ID = "LP Cost Calculator Page";

/** The "Google click IDs" row for the ERP notes, from a form's gclid / gbraid / wbraid (none when empty). */
export function clickIdRows(body: Record<string, unknown>): [string, string][] {
  const ids = (["gclid", "gbraid", "wbraid"] as const)
    .map((k) => [k, typeof body[k] === "string" ? body[k].trim().slice(0, 500) : ""] as const)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  return ids ? [["Google click IDs", ids]] : [];
}

