import { LEAD_RULES, SERVICES_PLAN_FORM_ID, clickIdRows, trapped } from "@/lib/lead";
import { emailIsReal } from "@/lib/emailCheck";
import { withLeadLog } from "@/lib/leadLog";
import { createErpLead, leadReply } from "@/lib/erp";
import { str, trackingFields } from "@/lib/calculatorLead";
import { isPhoneCountry } from "@/lib/phone";
import { validatePhoneServer } from "@/lib/phoneServer";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { isPreviewDeployment, previewLeadId } from "@/lib/preview";
import { NEED_SERVICE, isNeed } from "@/content/xservicesx";

/*
  The /xservicesx "Get my free plan" form: creates a Lead in the ERP, form "Services Plan", source page /xservicesx.
  Name, WhatsApp number and "Need" are required; email is optional. Honeypot, then the field checks, then the preview
  guard (a mock lead, nothing outside), then about 5 valid submissions per IP per hour. ERP failures go to the
  lead log's Fallback tab (createErpLead).
*/

const HOUR = 60 * 60 * 1000;

export const POST = withLeadLog("services-plan", async (request, log) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  // Honeypot: real visitors never fill this in. Pretend success so bots move on.
  if (trapped(body)) return Response.json({ ok: true, created: false });

  const country = str(body.country, 8);
  const mobile_no = validatePhoneServer(str(body.mobile_no, 40), isPhoneCountry(country) ? country : "AE");
  const lead_name = str(body.lead_name, 120);
  const email_id = str(body.email_id, 200).toLowerCase();
  const need = str(body.need, 60);
  // A preview checks the email format only: the real check looks up the domain's mail servers (DNS).
  const emailOk = !email_id || (isPreviewDeployment() ? LEAD_RULES.email_id(email_id) : await emailIsReal(email_id));
  const invalid = [
    ...(LEAD_RULES.lead_name(lead_name) ? [] : ["lead_name"]),
    ...(mobile_no ? [] : ["mobile_no"]),
    ...(isNeed(need) ? [] : ["need"]),
    ...(emailOk ? [] : ["email_id"]),
  ];
  if (invalid.length || !mobile_no || !isNeed(need)) return Response.json({ error: "invalid_fields", fields: invalid }, { status: 422 });

  // Preview deployments answer with a mock lead and call nothing outside (lib/preview).
  if (isPreviewDeployment()) {
    log.erp_id = previewLeadId();
    return Response.json({ ok: true, created: true, lead_id: log.erp_id, preview: true });
  }

  if (!rateLimit(`services-plan:${clientIp(request)}`, 5, HOUR)) return Response.json({ error: "rate_limited" }, { status: 429 });

  const result = await createErpLead({
    lead_name,
    email_id,
    mobile_no,
    ...trackingFields(body),
    source_page: "/xservicesx",
    form_id: SERVICES_PLAN_FORM_ID,
    form_name: "Services Plan",
    service_enquired: NEED_SERVICE[need],
    button_name: "Get my free plan",
    answers: {},
    estimate: null,
    details: [["Need", need], ...clickIdRows(body)],
  });

  return leadReply(result, log);
});
