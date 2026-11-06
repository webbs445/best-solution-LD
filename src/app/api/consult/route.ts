import { ADVICE_FORM_ID, AC_SERVICE_ENQUIRED, CONSULT_FORMS, LEAD_RULES, clickIdRows, leadConsent, withUaeCode } from "@/lib/lead";
import { emailIsReal } from "@/lib/emailCheck";
import { withLeadLog } from "@/lib/leadLog";
import { createErpLead } from "@/lib/erp";
import { isPreviewDeployment, previewLeadId } from "@/lib/preview";
import { CONSULT_TOPICS, type ConsultTopic } from "@/content/consult";

/*
  Receives "Book a consultation" leads from the /consult advice page and creates a Lead in the ERP (which also adds
  Google Ads leads to the lead log sheet). Name, phone, email and the advice topic are required; the message is
  optional. Same checks, honeypot and preview safeguard as /api/callback.
*/

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export const POST = withLeadLog("consult", async (request, log) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  // Honeypot: real visitors never fill this in. Pretend success so bots move on.
  if (str(body.website)) return Response.json({ ok: true, created: false });

  const lead_name = str(body.lead_name, 120);
  // A local UAE number ("050 123 4567") is stored as +971.
  const mobile_no = withUaeCode(str(body.mobile_no, 40));
  const email_id = str(body.email_id, 200);
  const topic = str(body.topic, 60) as ConsultTopic;
  const message = str(body.message, 1000);
  const formId = str(body.form_id, 60) || ADVICE_FORM_ID;
  const form = Object.hasOwn(CONSULT_FORMS, formId) ? CONSULT_FORMS[formId] : undefined;
  const invalid = [
    ...(LEAD_RULES.lead_name(lead_name) ? [] : ["lead_name"]),
    ...(LEAD_RULES.mobile_no(mobile_no) ? [] : ["mobile_no"]),
    // A preview checks the email format only: the real check looks up the domain's mail servers (DNS).
    ...((isPreviewDeployment() ? LEAD_RULES.email_id(email_id) : await emailIsReal(email_id)) ? [] : ["email_id"]),
    ...(CONSULT_TOPICS.includes(topic) ? [] : ["topic"]),
    ...(form ? [] : ["form_id"]),
  ];
  if (invalid.length || !form) return Response.json({ error: "invalid_fields", fields: invalid }, { status: 422 });

  // Preview deployments answer with a mock lead and call nothing outside (lib/preview).
  if (isPreviewDeployment()) {
    log.erp_id = previewLeadId();
    return Response.json({ ok: true, created: true, lead_id: log.erp_id, preview: true });
  }

  const result = await createErpLead({
    lead_name,
    email_id,
    mobile_no,
    utm_source: str(body.utm_source, 200),
    utm_medium: str(body.utm_medium, 200),
    utm_campaign: str(body.utm_campaign, 200),
    utm_content: str(body.utm_content, 200),
    utm_term: str(body.utm_term, 200),
    click_id: str(body.click_id, 500),
    consent: leadConsent(body.consent),
    event_id: str(body.event_id, 60),
    landing_page: str(body.landing_page, 1000),
    form_id: formId,
    form_name: form.form_name,
    button_name: "Book a Consultation",
    // The ERP's "Service Enquired" is an exact Select option: bookkeeping goes to accounting, the rest to setup advice.
    service_enquired: topic === "Bookkeeping and accounts" ? AC_SERVICE_ENQUIRED : undefined,
    submission_timestamp: new Date().toISOString(),
    answers: {},
    estimate: null,
    details: [
      ["Advice on", topic],
      ...(message ? ([["Message", message]] as [string, string][]) : []),
      ["Source page", form.page],
      ...clickIdRows(body),
    ],
  });

  if (result.ok) log.erp_id = result.name;
  else log.erp_status = result.status;
  if (!result.ok) return Response.json({ error: result.reason }, { status: result.reason === "not_configured" ? 503 : 502 });
  return Response.json({ ok: true, created: !!result.name?.trim() });
});
