import { STEPS } from "@/content/calculator";
import { DATA, formatAED, type Answers, type Estimate, type Jurisdiction } from "@/lib/pricing";

/*
  Creates a Lead in Best Solution's ERPNext (POST /api/resource/Lead), mapped to its Lead doctype.
  Server-only: the API key and secret come from environment variables and never reach the browser.
  Select and Link values below match the options configured in that ERP; change them together.
*/

export interface LeadInput {
  lead_name: string;
  email_id: string;
  mobile_no: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  click_id: string;
  /** The dataLayer form_submit event_id, kept on the lead to match offline conversion uploads. */
  event_id?: string;
  landing_page: string;
  form_id: string;
  submission_timestamp: string;
  answers: Answers;
  estimate: Estimate | null;
  /** Which website form sent the lead. Defaults to the calculator. */
  form_name?: string;
  button_name?: string;
  /** Extra label/value rows for the requirement, e.g. the free zone planner's choices. */
  details?: [string, string][];
}

export type LeadResult = { ok: true; name?: string } | { ok: false; reason: "not_configured" | "upstream_failed" | "upstream_unreachable" };

/* Values that must match the ERP's Select options and Link records exactly. */
const SERVICE_ENQUIRED = "Business Setup";
const PREFERRED_CONTACT = "Whatsapp";
const DEFAULT_SOURCE = "Website";
const FORM_NAME = "Setup Cost Calculator";
const BUTTON_NAME = "Send My Breakdown";

const aed = (n: number) => `AED ${formatAED(n)}`;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const optionTitle = (step: "profile" | "jurisdiction" | "workspace" | "bank", value?: string) =>
  STEPS[step].options?.find(([v]) => v === value)?.[1] ?? value;

function setupName(a: Answers): string | undefined {
  if (!a.jurisdiction || a.jurisdiction === "undecided") return undefined;
  if (a.option === "recommend") return "Consultant to recommend";
  return DATA[a.jurisdiction as Jurisdiction].find((o) => o.id === a.option)?.name ?? a.option;
}

/** The visitor's answers as label/value pairs, skipping questions they were not asked. */
function answerRows(a: Answers): [string, string][] {
  const rows: [string, string | number | undefined][] = [
    ["Profile", optionTitle("profile", a.profile)],
    ["Jurisdiction", optionTitle("jurisdiction", a.jurisdiction)],
    ["Setup", setupName(a)],
    ["People needing residency", a.jurisdiction === "offshore" ? undefined : a.residency],
    ["Workspace", optionTitle("workspace", a.workspace)],
    ["Bank account help", optionTitle("bank", a.bank)],
  ];
  return rows.filter((r): r is [string, string | number] => r[1] !== undefined && r[1] !== "").map(([k, v]) => [k, String(v)]);
}

/** Full calculator run for "Client Profile and Requirement" (a Text Editor field, so HTML). */
function requirementHtml(input: LeadInput): string {
  const { answers, estimate: est } = input;
  const li = (items: string[]) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
  const parts = [`<p><strong>${esc(input.form_name ?? FORM_NAME)} enquiry</strong></p>`];
  parts.push(li([...answerRows(answers), ...(input.details ?? [])].map(([k, v]) => `${esc(k)}: ${esc(v)}`)));
  if (est) {
    parts.push(`<p><strong>Estimate: ${esc(est.name)}</strong>${est.basis ? `<br>${esc(est.basis)}` : ""}</p>`);
    parts.push(
      li(
        est.lines.map((l) => {
          const value = l.amount !== undefined ? aed(l.amount) : l.text || "";
          return `${esc(l.label)}${l.note ? ` (${esc(l.note)})` : ""}: ${esc(value)}`;
        }),
      ),
    );
    parts.push(
      `<p>First-year estimate: <strong>${est.from ? "from " : ""}${aed(est.total)}</strong><br>Year-two renewal: ${aed(est.renewal)}</p>`,
    );
  }
  const tracking = [
    ["Landing page", input.landing_page],
    ["UTM medium", input.utm_medium],
    ["Event ID", input.event_id],
    ["Submitted", input.submission_timestamp],
  ].filter((row): row is [string, string] => !!row[1]);
  parts.push(`<p>${tracking.map(([k, v]) => `${k}: ${esc(v)}`).join("<br>")}</p>`);
  return parts.join("");
}

/** One-line summary for "Remarks", visible at a glance in list views. */
function remarks(input: LeadInput): string {
  const form = input.form_name ?? FORM_NAME;
  const est = input.estimate;
  if (input.form_name && !est) return `${form}: callback requested`;
  if (!est) return `${form}: estimate not available`;
  return `${form}: ${est.name}, first year ${est.from ? "from " : ""}${aed(est.total)}`;
}

function toLead(input: LeadInput) {
  const [first_name, ...rest] = input.lead_name.split(/\s+/);
  return {
    first_name,
    last_name: rest.join(" ") || undefined,
    lead_name: input.lead_name,
    email_id: input.email_id || undefined,
    mobile_no: input.mobile_no,
    whatsapp_no: input.mobile_no,
    source: process.env.ERPNEXT_LEAD_SOURCE || DEFAULT_SOURCE,
    custom_service_enquired: SERVICE_ENQUIRED,
    custom_preferred_contact_method: PREFERRED_CONTACT,
    custom_client_profile_and_requirement: requirementHtml(input),
    custom_remarks: remarks(input),
    custom_platform: input.utm_source || undefined,
    custom_campaign: input.utm_campaign || undefined,
    custom_ad_set_name: input.utm_term || undefined,
    custom_ad_name: input.utm_content || undefined,
    custom_clid: input.click_id || undefined,
    custom_form_name: input.form_name ?? FORM_NAME,
    custom_button_name: input.button_name ?? BUTTON_NAME,
  };
}

export async function createErpLead(input: LeadInput): Promise<LeadResult> {
  const base = process.env.ERPNEXT_URL?.replace(/\/+$/, "");
  const key = process.env.ERPNEXT_API_KEY;
  const secret = process.env.ERPNEXT_API_SECRET;
  if (!base || !key || !secret) return { ok: false, reason: "not_configured" };

  try {
    const res = await fetch(`${base}/api/resource/Lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `token ${key}:${secret}`,
      },
      body: JSON.stringify(toLead(input)),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      // ERPNext explains the failure (missing permission, duplicate email, bad option) in the body.
      console.error(`ERPNext lead create failed: ${res.status}`, (await res.text()).slice(0, 1000));
      return { ok: false, reason: "upstream_failed" };
    }
    const json = (await res.json().catch(() => null)) as { data?: { name?: string } } | null;
    return { ok: true, name: json?.data?.name };
  } catch (err) {
    console.error("ERPNext unreachable", err);
    return { ok: false, reason: "upstream_unreachable" };
  }
}
