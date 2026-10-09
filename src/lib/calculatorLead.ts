import { estimate, type Answers, type Estimate } from "@/lib/pricing";
import { FORM_ID, FZ_FORM_ID, clickIdRows } from "@/lib/lead";
import { cleanPlanner, plannerEstimate, type PlannerInput } from "@/lib/freezone";
import { ACT_LABEL, PRIORITIES } from "@/content/freezone";
import { STEPS } from "@/content/calculator";

/*
  What a calculator lead carries besides the contact details, built on the server from the request body:
  the home calculator sends `answers`, the /freezone planner sends `planner`. The estimate is always
  recomputed here, so the figure the team receives cannot be edited in the browser.
*/

export const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

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

export function calculatorLeadContext(body: Record<string, unknown>) {
  const fz = body.planner && typeof body.planner === "object" ? freezoneLead(body.planner as Partial<PlannerInput>) : null;
  const base = fz ? fz.answers : ((body.answers && typeof body.answers === "object" ? body.answers : {}) as Answers);
  // "What describes you" (optional chips on the capture's second step), kept only if it is a known option.
  const profile = str(body.profile, 40);
  const answers: Answers = STEPS.profile.options?.some(([v]) => v === profile) ? { ...base, profile } : base;
  let computed: Estimate | null = fz ? fz.estimate : null;
  if (!fz) {
    try {
      computed = estimate(answers);
    } catch {
      computed = null;
    }
  }
  return {
    isFreezone: !!fz,
    formId: fz ? FZ_FORM_ID : FORM_ID,
    formName: fz ? "Free Zone Planner" : undefined,
    answers,
    estimate: computed,
    details: [...(fz ? fz.details : []), ...clickIdRows(body)],
  };
}

/** The tracking fields every lead route passes to the ERP. */
export function trackingFields(body: Record<string, unknown>) {
  return {
    utm_source: str(body.utm_source, 200),
    utm_medium: str(body.utm_medium, 200),
    utm_campaign: str(body.utm_campaign, 200),
    utm_content: str(body.utm_content, 200),
    utm_term: str(body.utm_term, 200),
    click_id: str(body.click_id, 500),
    event_id: str(body.event_id, 60),
    landing_page: str(body.landing_page, 1000),
    submission_timestamp: str(body.submission_timestamp, 40) || new Date().toISOString(),
  };
}
