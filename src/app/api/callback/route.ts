import { LEAD_RULES } from "@/lib/lead";
import { createErpLead } from "@/lib/erp";
import type { JurisdictionChoice } from "@/lib/pricing";

/*
  Receives "Request a callback" leads from the footer popup and creates a Lead in the ERP.
  Name, WhatsApp number and email are required (the ERP needs an email for Website leads);
  the visitor's interest is passed on as their jurisdiction.
*/

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const INTERESTS: Record<string, JurisdictionChoice> = {
  mainland: "mainland",
  freezone: "freezone",
  offshore: "offshore",
  not_sure: "undecided",
};

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
  const mobile_no = str(body.mobile_no, 40);
  const email_id = str(body.email_id, 200);
  const invalid = [
    ...(LEAD_RULES.lead_name(lead_name) ? [] : ["lead_name"]),
    ...(LEAD_RULES.mobile_no(mobile_no) ? [] : ["mobile_no"]),
    ...(LEAD_RULES.email_id(email_id) ? [] : ["email_id"]),
  ];
  if (invalid.length) return Response.json({ error: "invalid_fields", fields: invalid }, { status: 422 });

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
    landing_page: str(body.landing_page, 1000),
    form_id: "bs_footer_callback",
    form_name: "Callback Request",
    button_name: "Request a Callback",
    submission_timestamp: new Date().toISOString(),
    answers: { jurisdiction: INTERESTS[str(body.interest, 20)] ?? "undecided" },
    estimate: null,
  });

  if (!result.ok) return Response.json({ error: result.reason }, { status: result.reason === "not_configured" ? 503 : 502 });
  return Response.json({ ok: true });
}
