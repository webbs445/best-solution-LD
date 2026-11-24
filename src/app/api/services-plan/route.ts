import { SERVICES_PLAN_FORM_ID, clickIdRows, trapped } from "@/lib/lead";
import { emailIsReal } from "@/lib/emailCheck";
import { withLeadLog } from "@/lib/leadLog";
import { createErpLead, leadReply } from "@/lib/erp";
import { str, trackingFields } from "@/lib/calculatorLead";
import { isPhoneCountry } from "@/lib/phone";
import { validatePhoneServer } from "@/lib/phoneServer";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { isPreviewDeployment, previewLeadId } from "@/lib/preview";
import { choiceRows, nameOk } from "@/lib/servicesPlan";
import { LEAD_RULES } from "@/lib/lead";
import { TOPIC_SERVICE, isTopic } from "@/content/xservicesx";

/*
  The /services form (section 9, "Send me my plan"): creates a Lead in the ERP, form "Services Plan", source page
  /services. Name, WhatsApp number and email are required (the ERP needs all three for Website leads). What the
  visitor picked on the page (topic, questions, advisor, reply method, meeting mode) goes into the lead's requirement
  notes as labelled lines; every value is checked against the page's own lists, so the browser cannot write free text
  there. Honeypot, field checks, preview guard (a mock lead, nothing outside), then about 5 per IP per hour. ERP
  failures go to the lead log's Fallback tab (createErpLead).
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
  // A preview checks the email format only: the real check looks up the domain's mail servers (DNS).
  const emailOk = isPreviewDeployment() ? LEAD_RULES.email_id(email_id) : LEAD_RULES.email_id(email_id) && (await emailIsReal(email_id));
  const invalid = [...(nameOk(lead_name) ? [] : ["lead_name"]), ...(mobile_no ? [] : ["mobile_no"]), ...(emailOk ? [] : ["email_id"])];
  if (invalid.length || !mobile_no) return Response.json({ error: "invalid_fields", fields: invalid }, { status: 422 });

  // Preview deployments answer with a mock lead and call nothing outside (lib/preview).
  if (isPreviewDeployment()) {
    log.erp_id = previewLeadId();
    return Response.json({ ok: true, created: true, lead_id: log.erp_id, preview: true });
  }

  if (!rateLimit(`services-plan:${clientIp(request)}`, 5, HOUR)) return Response.json({ error: "rate_limited" }, { status: 429 });

  const topic = isTopic(body.topic) ? body.topic : "not_sure";
  const result = await createErpLead({
    lead_name,
    email_id,
    mobile_no,
    ...trackingFields(body),
    source_page: "/services",
    form_id: SERVICES_PLAN_FORM_ID,
    form_name: "Services Plan",
    service_enquired: TOPIC_SERVICE[topic],
    button_name: "Send me my plan",
    answers: {},
    estimate: null,
    details: [...choiceRows(body), ...clickIdRows(body)],
  });

  return leadReply(result, log);
});
