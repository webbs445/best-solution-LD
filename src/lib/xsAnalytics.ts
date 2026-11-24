import { pushEvent, pushFormSubmit } from "@/lib/analytics";
import { LEAD_CURRENCY, LEAD_VALUES } from "@/lib/leadValues";
import { SERVICES_PLAN_FORM_ID } from "@/lib/lead";

/*
  The /xservicesx conversion, once per server-confirmed lead: form_submit (the event GTM's Google Ads lead tag fires on:
  lead_conversion_eligible plus the evt_ id shared with the ERP lead) and generate_lead with the page's own parameters.
  Neither carries a name, number or email: user_data stays empty on this page.
*/
export function pushXsLead(args: { eventId: string; topic: string; contactPref: "whatsapp" | "call"; location?: "s9" | "popup" }): void {
  pushFormSubmit({ formId: SERVICES_PLAN_FORM_ID, formName: "Services Plan", formType: "consultation", serviceInterest: args.topic, eventId: args.eventId });
  pushEvent("generate_lead", {
    form_id: SERVICES_PLAN_FORM_ID,
    lead_type: "form",
    page: "/services",
    service: args.topic,
    topic: args.topic,
    contact_pref: args.contactPref,
    form_location: args.location ?? "s9",
    value: LEAD_VALUES.form,
    currency: LEAD_CURRENCY,
  });
}
