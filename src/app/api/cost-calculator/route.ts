import { LEAD_RULES, CC_PRICE_FORM_ID, CC_QUOTE_FORM_ID, clickIdRows } from "@/lib/lead";
import { emailIsReal } from "@/lib/emailCheck";
import { withLeadLog } from "@/lib/leadLog";
import { createErpLead } from "@/lib/erp";
import { str, trackingFields } from "@/lib/calculatorLead";
import { isPhoneCountry } from "@/lib/phone";
import { validatePhoneServer } from "@/lib/phoneServer";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { estimate } from "@/lib/pricing";
import { activityLabel, ccAnswersFrom, toAnswers } from "@/lib/costCalculator";

/*
  The /cost-calculator leads: the price pop-up ("Show my price", which opens the visitor's prices) and the written
  quote form. Creates a Lead in the ERP (name, email and phone are all required for Website leads). Honeypot, then
  about 5 valid submissions per IP per hour; the number is re-validated with full metadata and stored in E.164, the
  email lowercased. The configured setup is re-checked against the rate card and its estimate recomputed here, so
  the lead's requirement notes carry the itemised figure. "Service Enquired" is the ERP default, "Business Setup".
*/

const HOUR = 60 * 60 * 1000;
const LANGUAGES: Record<string, string> = { en: "English", ar: "Arabic", fr: "French", ru: "Russian", zh: "Chinese" };

export const POST = withLeadLog("cost-calculator", async (request, log) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  // Honeypot: real visitors never fill this in. Pretend success so bots move on.
  if (str(body.website)) return Response.json({ ok: true, created: false });

  const country = str(body.country, 8);
  const mobile = validatePhoneServer(str(body.mobile_no, 40), isPhoneCountry(country) ? country : "OTHER");
  const lead_name = str(body.lead_name, 120);
  const email_id = str(body.email_id, 200).toLowerCase();
  const invalid = [
    ...(LEAD_RULES.lead_name(lead_name) ? [] : ["lead_name"]),
    ...((await emailIsReal(email_id)) ? [] : ["email_id"]),
    ...(mobile ? [] : ["mobile_no"]),
  ];
  if (invalid.length) return Response.json({ error: "invalid_fields", fields: invalid }, { status: 422 });

  if (!rateLimit(`cost-calculator:${clientIp(request)}`, 5, HOUR)) return Response.json({ error: "rate_limited" }, { status: 429 });

  // The visitor may send their details before choosing anything; then the lead carries no estimate.
  const cc = ccAnswersFrom(body.answers);
  const answers = cc ? toAnswers(cc) : {};
  let est = null;
  try {
    est = cc ? estimate(answers) : null;
  } catch {
    est = null;
  }
  const fromPrice = body.source === "price";
  const details: [string, string][] = [
    ...(cc?.activity ? ([["Business activity", activityLabel(cc.activity)]] as [string, string][]) : []),
    ["Page language", LANGUAGES[str(body.language, 4)] ?? "English"],
    ...(fromPrice && body.whatsapp_optin === true ? ([["WhatsApp", "Send the breakdown on WhatsApp"]] as [string, string][]) : []),
    ...clickIdRows(body),
  ];

  const result = await createErpLead({
    lead_name,
    email_id,
    mobile_no: mobile as string,
    ...trackingFields(body),
    form_id: fromPrice ? CC_PRICE_FORM_ID : CC_QUOTE_FORM_ID,
    form_name: fromPrice ? "Cost Calculator Price" : "Cost Calculator Quote",
    button_name: fromPrice ? "Show my price" : "Send me my written quote",
    answers,
    estimate: est,
    details,
  });

  if (result.ok) log.erp_id = result.name;
  else log.erp_status = result.status;
  if (!result.ok) return Response.json({ error: result.reason }, { status: result.reason === "not_configured" ? 503 : 502 });
  return Response.json({ ok: true, created: !!result.name?.trim() });
});
