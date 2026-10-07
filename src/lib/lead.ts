/* Lead field rules, shared by the form (instant feedback) and /api/lead (authoritative check). */

export const LEAD_RULES = {
  lead_name: (v: string) => v.trim().length > 1,
  email_id: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  mobile_no: (v: string) => /^\+\d[\d\s()-]{6,18}$/.test(v.trim()),
} as const;

export type LeadField = keyof typeof LEAD_RULES;

export const LEAD_ERRORS: Record<LeadField, string> = {
  lead_name: "Please enter your full name.",
  email_id: "Please enter a valid email address.",
  mobile_no: "Please include your country code, for example +971.",
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
