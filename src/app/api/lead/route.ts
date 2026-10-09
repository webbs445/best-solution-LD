import { LEAD_RULES, type LeadField } from "@/lib/lead";
import { createErpLead, leadEstimateFields, updateErpLead } from "@/lib/erp";
import { calculatorLeadContext, str, trackingFields } from "@/lib/calculatorLead";
import { LEAD_REF_TTL_MS, phoneHash, signLeadRef, verifyLeadRef } from "@/lib/leadRef";
import { isPhoneCountry } from "@/lib/phone";
import { validatePhoneServer } from "@/lib/phoneServer";
import { clientIp, rateLimit } from "@/lib/rateLimit";

/*
  Calculator leads from the home page and /freezone (the two-step capture: WhatsApp number, then name and
  email). Creates ONE Lead in the ERP; the ERP needs name, email and phone for Website leads.
  - Honeypot, then about 5 valid submissions per IP per hour.
  - The number is re-validated with full metadata and stored in E.164; the email is trimmed and lowercased.
  - Same number again in this visit (a signed reference from the earlier submission, or this server's 2-hour
    memory): the existing lead is updated with the latest details and estimate instead of creating a second
    one (if the ERP refuses the edit, the lead is left as it was), and the response says created: false so
    the page does not count it again.
  Keeping the ERP call on the server means the API key is never shipped to visitors.
*/

const HOUR = 60 * 60 * 1000;
/** This instance's memory of recent leads: phone hash -> lead, for the same-number protection. */
const recent = new Map<string, { lead: string; exp: number }>();

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  // Honeypot: real visitors never fill this in. Pretend success so bots move on.
  if (str(body.website)) return Response.json({ ok: true, created: true });

  const country = str(body.country, 8);
  const mobile = validatePhoneServer(str(body.mobile_no, 40), isPhoneCountry(country) ? country : "OTHER");
  const fields = {
    lead_name: str(body.lead_name, 120),
    email_id: str(body.email_id, 200).toLowerCase(),
    mobile_no: mobile ?? "",
  };
  const invalid = (Object.keys(fields) as LeadField[]).filter((k) => !LEAD_RULES[k](fields[k]));
  if (!mobile && !invalid.includes("mobile_no")) invalid.push("mobile_no");
  if (invalid.length) return Response.json({ error: "invalid_fields", fields: invalid }, { status: 422 });

  if (!rateLimit(`lead:${clientIp(request)}`, 5, HOUR)) return Response.json({ error: "rate_limited" }, { status: 429 });

  const ctx = calculatorLeadContext(body);
  const input = {
    ...fields,
    ...trackingFields(body),
    form_id: ctx.formId,
    answers: ctx.answers,
    estimate: ctx.estimate,
    ...(ctx.isFreezone ? { form_name: ctx.formName } : null),
    button_name: "Send to my WhatsApp",
    details: ctx.details,
  };

  // Same number again in this visit: update that lead, never create a second one.
  const ph = phoneHash(fields.mobile_no);
  const prior = verifyLeadRef(str(body.ref, 600));
  const remembered = recent.get(ph);
  const existing = prior && prior.phone === ph ? prior.lead : remembered && remembered.exp > Date.now() ? remembered.lead : null;
  if (existing) {
    const [first, ...rest] = fields.lead_name.split(/\s+/);
    const upd = await updateErpLead(existing, {
      ...leadEstimateFields(input),
      first_name: first,
      last_name: rest.join(" "),
      lead_name: fields.lead_name,
      email_id: fields.email_id,
    });
    // Only a lead that is gone (deleted in the ERP) is created again. Any other failure, e.g. the API user
    // not being allowed to edit leads, keeps the existing lead as it is: never a second lead for one number.
    if (upd.ok || upd.status !== 404) return Response.json({ ok: true, created: false, ref: signLeadRef(existing, fields.mobile_no) });
  }

  const result = await createErpLead(input);
  if (!result.ok) return Response.json({ error: result.reason }, { status: result.reason === "not_configured" ? 503 : 502 });
  if (result.name) recent.set(ph, { lead: result.name, exp: Date.now() + LEAD_REF_TTL_MS });
  return Response.json({ ok: true, created: true, ref: result.name ? signLeadRef(result.name, fields.mobile_no) : null });
}
