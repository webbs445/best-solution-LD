import { AC_FORM_ID, AC_SERVICE_ENQUIRED, LEAD_RULES, clickIdRows } from "@/lib/lead";
import { createErpLead } from "@/lib/erp";
import { BOOK_STATES, SERVICE_NAMES, SOFTWARE, VOLUMES, type ServiceKey } from "@/content/accounting";

/*
  Receives the /accounting page's quote request and creates a Lead in the ERP.
  Same validation and honeypot as /api/lead and /api/callback. The visitor's answers (service,
  volume, software, how up to date the books are, health check result) go into the lead's
  requirement notes. "Service Enquired" is the ERP's accounting option (AC_SERVICE_ENQUIRED).
*/

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
/* Only values the form offers are passed on; anything else is dropped. */
const oneOf = (v: unknown, list: string[]) => (typeof v === "string" && list.includes(v) ? v : "");

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  // Honeypot: real visitors never fill this in. Pretend success so bots move on.
  if (str(body.website)) return Response.json({ ok: true });

  const lead_name = str(body.lead_name, 120);
  const email_id = str(body.email_id, 200);
  const mobile_no = str(body.mobile_no, 40);
  const invalid = [
    ...(LEAD_RULES.lead_name(lead_name) ? [] : ["lead_name"]),
    ...(LEAD_RULES.email_id(email_id) ? [] : ["email_id"]),
    ...(LEAD_RULES.mobile_no(mobile_no) ? [] : ["mobile_no"]),
  ];
  if (invalid.length) return Response.json({ error: "invalid_fields", fields: invalid }, { status: 422 });

  const service = (str(body.service, 20) in SERVICE_NAMES ? str(body.service, 20) : "not_sure") as ServiceKey;
  const volume = oneOf(body.volume, VOLUMES);
  const software = oneOf(body.software, SOFTWARE);
  const state = oneOf(body.books_state, BOOK_STATES);
  const health = str(body.health_check, 200);

  const details: [string, string][] = [
    ["Service", SERVICE_NAMES[service]],
    ...(volume ? ([["Transactions per month", volume]] as [string, string][]) : []),
    ...(software ? ([["Current software", software]] as [string, string][]) : []),
    ...(state ? ([["Books today", state]] as [string, string][]) : []),
    ...(health ? ([["Health check", health]] as [string, string][]) : []),
    ...clickIdRows(body),
  ];

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
    event_id: str(body.event_id, 60),
    landing_page: str(body.landing_page, 1000),
    form_id: AC_FORM_ID,
    form_name: "Accounting Quote",
    service_enquired: AC_SERVICE_ENQUIRED,
    button_name: "Send my quote request",
    submission_timestamp: new Date().toISOString(),
    answers: {},
    estimate: null,
    details,
  });

  if (!result.ok) return Response.json({ error: result.reason }, { status: result.reason === "not_configured" ? 503 : 502 });
  return Response.json({ ok: true });
}
