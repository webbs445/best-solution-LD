import { AC_FORM_ID, AC_SERVICE_ENQUIRED, LEAD_RULES, clickIdRows, leadConsent, trapped } from "@/lib/lead";
import { emailIsReal } from "@/lib/emailCheck";
import { withLeadLog } from "@/lib/leadLog";
import { bodyPhone } from "@/lib/phoneServer";
import { createErpLead, leadReply } from "@/lib/erp";
import { clientIp, rateLimit } from "@/lib/rateLimit";

const HOUR = 60 * 60 * 1000;
import { SERVICE_NAMES, VOLUMES, type ServiceKey } from "@/content/accounting";
import { AN_BOOK_STATES, AN_BUTTON, AN_NEED_SERVICE, AN_NEEDS, AN_SERVICES, AN_SOFTWARE } from "@/content/accountingNew";

/*
  Receives the /accounting page's quote request and creates a Lead in the ERP.
  Same validation and honeypot as /api/lead and /api/callback. The visitor's answers (service,
  volume, software, how up to date the books are, health check result) go into the lead's
  requirement notes. "Service Enquired" is the ERP's accounting option (AC_SERVICE_ENQUIRED).
*/

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
/* Only values the form offers are passed on; anything else is dropped. */
const oneOf = (v: unknown, list: string[]) => (typeof v === "string" && list.includes(v) ? v : "");

export const POST = withLeadLog("accounting", async (request, log) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  // Honeypot: real visitors never fill this in. Pretend success so bots move on.
  if (trapped(body)) return Response.json({ ok: true, created: false });

  const lead_name = str(body.lead_name, 120);
  const email_id = str(body.email_id, 200);
  // A local UAE number ("050 123 4567") is stored as +971.
  const mobile_no = bodyPhone(body);
  const invalid = [
    ...(LEAD_RULES.lead_name(lead_name) ? [] : ["lead_name"]),
    ...((await emailIsReal(email_id)) ? [] : ["email_id"]),
    ...(mobile_no ? [] : ["mobile_no"]),
  ];
  if (invalid.length) return Response.json({ error: "invalid_fields", fields: invalid }, { status: 422 });

  // Same limit as /api/services-plan: five leads per IP per hour.
  if (!rateLimit(`accounting:${clientIp(request)}`, 5, HOUR)) return Response.json({ error: "rate_limited" }, { status: 429 });

  // /accounting-new sends "need" (its step 1). It is filed as the old form's service (AN_NEED_SERVICE), so leads sort
  // the same way, and on its own "Need" line.
  const need = oneOf(body.need, [...AN_NEEDS]) as (typeof AN_NEEDS)[number] | "";
  const service = need
    ? AN_NEED_SERVICE[need]
    : ((str(body.service, 20) in SERVICE_NAMES ? str(body.service, 20) : "not_sure") as ServiceKey);
  const volume = oneOf(body.volume, VOLUMES);
  // The lists are the old page's plus "Not sure" (sent only by /accounting-new).
  const software = oneOf(body.software, AN_SOFTWARE);
  const state = oneOf(body.books_state, AN_BOOK_STATES);
  const health = str(body.health_check, 200);
  // /accounting-new's optional "Your question": filed on the lead notes only.
  const question = str(body.question, 1000);
  // The services ticked in "What we do" (/accounting-new): known names only, each once, in the page's order.
  const picked = Array.isArray(body.services) ? AN_SERVICES.filter((s) => (body.services as unknown[]).includes(s)) : [];

  const details: [string, string][] = [
    ["Service", SERVICE_NAMES[service]],
    ...(need ? ([["Need", need]] as [string, string][]) : []),
    ...(picked.length ? ([["Services picked", picked.join(", ")]] as [string, string][]) : []),
    ...(volume ? ([["Transactions per month", volume]] as [string, string][]) : []),
    ...(software ? ([["Current software", software]] as [string, string][]) : []),
    ...(state ? ([["Books today", state]] as [string, string][]) : []),
    ...(health ? ([["Health check", health]] as [string, string][]) : []),
    ...(question ? ([["Question", question]] as [string, string][]) : []),
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
    consent: leadConsent(body.consent),
    event_id: str(body.event_id, 60),
    landing_page: str(body.landing_page, 1000),
    form_id: AC_FORM_ID,
    form_name: "Accounting Quote",
    service_enquired: AC_SERVICE_ENQUIRED,
    button_name: need ? AN_BUTTON : "Send my quote request",
    submission_timestamp: new Date().toISOString(),
    answers: {},
    estimate: null,
    details,
  });

  return leadReply(result, log);
});
