import { LEAD_RULES, SPV_FORM_ID, SPV_SERVICE_ENQUIRED, clickIdRows } from "@/lib/lead";
import { createErpLead } from "@/lib/erp";
import { str, trackingFields } from "@/lib/calculatorLead";
import { isPhoneCountry } from "@/lib/phone";
import { validatePhoneServer } from "@/lib/phoneServer";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { SPV_ASSETS, SPV_CONTACT, SPV_GOALS } from "@/content/spv";

/*
  The /spv consultation request: creates a Lead in the ERP (name, email and phone are all required for
  Website leads). Honeypot, then about 5 valid submissions per IP per hour; the number is re-validated
  with full metadata and stored in E.164, the email lowercased. The visitor's choices go into the
  lead's requirement notes. "Service Enquired" is "Other Services" (the ERP has no structuring option).
*/

const HOUR = 60 * 60 * 1000;
/* Only values the form offers are passed on; anything else is dropped. */
const oneOf = (v: unknown, list: readonly string[]) => (typeof v === "string" && list.includes(v) ? v : "");

export async function POST(request: Request) {
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
    ...(LEAD_RULES.email_id(email_id) ? [] : ["email_id"]),
    ...(mobile ? [] : ["mobile_no"]),
  ];
  if (invalid.length) return Response.json({ error: "invalid_fields", fields: invalid }, { status: 422 });

  if (!rateLimit(`spv:${clientIp(request)}`, 5, HOUR)) return Response.json({ error: "rate_limited" }, { status: 429 });

  const goal = oneOf(body.goal, SPV_GOALS) || "Not sure yet";
  const assets = oneOf(body.assets, SPV_ASSETS);
  const contact = oneOf(body.contact_pref, SPV_CONTACT);
  const fit = str(body.fit_finder, 120);
  const message = str(body.message, 1500);
  const details: [string, string][] = [
    ["Wants to structure", goal],
    ...(assets ? ([["Assets", assets]] as [string, string][]) : []),
    ...(contact ? ([["Preferred contact", contact]] as [string, string][]) : []),
    ...(fit ? ([["Fit finder suggestion", fit]] as [string, string][]) : []),
    ...(message ? ([["Message", message]] as [string, string][]) : []),
    ...clickIdRows(body),
  ];

  const result = await createErpLead({
    lead_name,
    email_id,
    mobile_no: mobile as string,
    ...trackingFields(body),
    form_id: SPV_FORM_ID,
    form_name: "Structuring Consultation",
    service_enquired: SPV_SERVICE_ENQUIRED,
    button_name: "Book my free consultation",
    answers: {},
    estimate: null,
    details,
  });

  if (!result.ok) return Response.json({ error: result.reason }, { status: result.reason === "not_configured" ? 503 : 502 });
  return Response.json({ ok: true });
}
