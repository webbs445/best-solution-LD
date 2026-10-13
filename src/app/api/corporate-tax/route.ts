import { LEAD_RULES, CT_ESTIMATE_FORM_ID, CT_FORM_ID, CT_SERVICE_ENQUIRED, clickIdRows } from "@/lib/lead";
import { emailIsReal } from "@/lib/emailCheck";
import { withLeadLog } from "@/lib/leadLog";
import { createErpLead } from "@/lib/erp";
import { str, trackingFields } from "@/lib/calculatorLead";
import { isPhoneCountry } from "@/lib/phone";
import { validatePhoneServer } from "@/lib/phoneServer";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { CT_BUSINESS, CT_HELP, CT_REVENUE } from "@/content/corporateTax";

/*
  The /corporate-tax free tax review: creates a Lead in the ERP (name, email and phone are all required for
  Website leads). Honeypot, then about 5 valid submissions per IP per hour; the number is re-validated with
  full metadata and stored in E.164, the email lowercased. The visitor's answers (and their estimate, if they
  used the estimator) go into the lead's requirement notes. "Service Enquired" is "VAT & Tax Services".
*/

const HOUR = 60 * 60 * 1000;
/* Only values the form offers are passed on; anything else is dropped. */
const oneOf = (v: unknown, list: readonly string[]) => (typeof v === "string" && list.includes(v) ? v : "");
/* "Dec 2026", "2026" or "Not sure", as the form builds it. */
const yearEnd = (v: unknown) => {
  const s = str(v, 20);
  return /^((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) )?20\d\d$|^Not sure$/.test(s) ? s : "";
};

export const POST = withLeadLog("corporate-tax", async (request, log) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  // Honeypot: real visitors never fill this in. Pretend success so bots move on.
  if (str(body.website)) return Response.json({ ok: true });

  const country = str(body.country, 8);
  const mobile = validatePhoneServer(str(body.mobile_no, 40), isPhoneCountry(country) ? country : "OTHER");
  const lead_name = str(body.lead_name, 120);
  const email_id = str(body.email_id, 200).toLowerCase();
  const invalid = [
    ...(LEAD_RULES.lead_name(lead_name) ? [] : ["lead_name"]),
    ...((await emailIsReal(email_id)) ? [] : ["email_id"]),
    ...(mobile ? [] : ["mobile_no"]),
  ];
  if (invalid.length) return Response.json({ error: "invalid_fields", fields: invalid }, { status: 422 });

  if (!rateLimit(`corporate-tax:${clientIp(request)}`, 5, HOUR)) return Response.json({ error: "rate_limited" }, { status: 429 });

  const yearEndText = yearEnd(body.year_end);
  const estimate = str(body.estimate, 300);
  const details: [string, string][] = [
    ["Business type", oneOf(body.business_type, CT_BUSINESS) || "Not sure"],
    ...(yearEndText ? ([["Financial year end", yearEndText]] as [string, string][]) : []),
    ["Annual revenue", oneOf(body.revenue, CT_REVENUE) || "Prefer not to say"],
    ...(oneOf(body.help, CT_HELP) ? ([["Needs help with", oneOf(body.help, CT_HELP)]] as [string, string][]) : []),
    ...(estimate ? ([["Tax estimator", estimate]] as [string, string][]) : []),
    ...clickIdRows(body),
  ];

  // The estimator's pop-up (details to see the estimate) or the review form.
  const fromEstimate = body.source === "estimate";
  const result = await createErpLead({
    lead_name,
    email_id,
    mobile_no: mobile as string,
    ...trackingFields(body),
    form_id: fromEstimate ? CT_ESTIMATE_FORM_ID : CT_FORM_ID,
    form_name: fromEstimate ? "Corporate Tax Estimate" : "Corporate Tax Review",
    service_enquired: CT_SERVICE_ENQUIRED,
    button_name: fromEstimate ? "Show my tax estimate" : "Book my free tax review",
    answers: {},
    estimate: null,
    details,
  });

  if (result.ok) log.erp_id = result.name;
  else log.erp_status = result.status;
  if (!result.ok) return Response.json({ error: result.reason }, { status: result.reason === "not_configured" ? 503 : 502 });
  return Response.json({ ok: true });
});
