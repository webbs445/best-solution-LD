import { estimate, type Answers, type Estimate } from "@/lib/pricing";
import { FORM_ID, FZ_FORM_ID, LEAD_RULES, clickIdRows, type LeadField } from "@/lib/lead";
import { createErpLead } from "@/lib/erp";
import { cleanPlanner, plannerEstimate, type PlannerInput } from "@/lib/freezone";
import { ACT_LABEL, PRIORITIES } from "@/content/freezone";

/*
  Receives calculator leads from the browser (the home page calculator and the /freezone planner),
  validates them, and creates a Lead in the ERP.
  Keeping the ERP call on the server means the API key is never shipped to visitors.
*/

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/* Free zone planner selections, cleaned, priced on the server and described for the ERP. */
function freezoneLead(raw: Partial<PlannerInput>) {
  const p = cleanPlanner(raw);
  const answers: Answers = { jurisdiction: "freezone", option: p.zone, residency: p.res, bank: p.bank ? "yes" : "no" };
  const details: [string, string][] = [
    ["Business activities", p.acts.map((a) => ACT_LABEL[a]).join(", ") || "Not selected"],
    ["Priority", PRIORITIES.find((x) => x.v === p.pri)?.label ?? p.pri],
    ["Shareholders", String(p.sh)],
    ["Activities on licence", String(p.na)],
  ];
  return { answers, estimate: plannerEstimate(p), details };
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  // Honeypot: real visitors never fill this in. Pretend success so bots move on.
  if (str(body.website)) return Response.json({ ok: true });

  const fields = {
    lead_name: str(body.lead_name, 120),
    email_id: str(body.email_id, 200),
    mobile_no: str(body.mobile_no, 40),
  };
  const invalid = (Object.keys(fields) as LeadField[]).filter((k) => !LEAD_RULES[k](fields[k]));
  if (invalid.length) return Response.json({ error: "invalid_fields", fields: invalid }, { status: 422 });

  // The /freezone planner sends its selections as `planner`; the home calculator sends `answers`.
  const fz = body.planner && typeof body.planner === "object" ? freezoneLead(body.planner as Partial<PlannerInput>) : null;

  const answers = fz ? fz.answers : ((body.answers && typeof body.answers === "object" ? body.answers : {}) as Answers);
  // Recompute the estimate from the answers so the figure your team receives can't be edited in the browser.
  let computed: Estimate | null = fz ? fz.estimate : null;
  if (!fz) {
    try {
      computed = estimate(answers);
    } catch {
      computed = null;
    }
  }

  const result = await createErpLead({
    ...fields,
    utm_source: str(body.utm_source, 200),
    utm_medium: str(body.utm_medium, 200),
    utm_campaign: str(body.utm_campaign, 200),
    utm_content: str(body.utm_content, 200),
    utm_term: str(body.utm_term, 200),
    click_id: str(body.click_id, 500),
    event_id: str(body.event_id, 60),
    landing_page: str(body.landing_page, 1000),
    form_id: fz ? FZ_FORM_ID : FORM_ID,
    submission_timestamp: str(body.submission_timestamp, 40) || new Date().toISOString(),
    answers,
    estimate: computed,
    ...(fz ? { form_name: "Free Zone Planner", button_name: "Request My Estimate" } : null),
    details: [...(fz ? fz.details : []), ...clickIdRows(body)],
  });

  if (!result.ok) return Response.json({ error: result.reason }, { status: result.reason === "not_configured" ? 503 : 502 });
  return Response.json({ ok: true });
}
