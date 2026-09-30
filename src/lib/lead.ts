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

export const FORM_ID = "bs_setup_cost_calculator";
