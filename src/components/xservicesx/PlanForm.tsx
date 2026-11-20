"use client";

import { useRef, useState, type FormEvent } from "react";
import { SERVICES_PLAN_FORM_ID, TRAP_FIELD } from "@/lib/lead";
import { DEFAULT_PHONE_COUNTRY, phonePlaceholder, type PhoneCountry } from "@/lib/phone";
import { checkPlan, planPhoneError, type PlanField } from "@/lib/servicesPlan";
import { genEventId, isConfirmedLeadResponse, pushFormSubmit, pushGenerateLead } from "@/lib/analytics";
import { attributionFields } from "@/lib/attribution";
import { PhoneCountrySelect } from "@/components/ui/PhoneCountrySelect";
import { SITE } from "@/content/site";
import { FORM_COPY, NEEDS, PLAN_ERRORS, successText } from "@/content/xservicesx";
import "@/components/consult/consult-form.css";

type Status = "idle" | "sending" | "sent" | "error";
const FIELD_NAME: Record<PlanField, string> = { name: "lead_name", phone: "mobile_no", need: "need", email: "email_id" };

/*
  The /xservicesx form: hero, pop-up and closing form. Same flow as the consultation form (components/consult): the
  country picker, attribution and consent fields, the spam trap, and form_submit + generate_lead (sharing an evt_ id
  with the ERP lead) only once the API confirms a new lead. form_start / form_error / form_abandon come from AnalyticsInit.
*/
export function PlanForm({ idPrefix, need: startNeed = "" }: { idPrefix: string; need?: string }) {
  const [errors, setErrors] = useState<Partial<Record<PlanField, boolean>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [country, setCountry] = useState<PhoneCountry>(DEFAULT_PHONE_COUNTRY);
  const [firstName, setFirstName] = useState("");
  const success = useRef<HTMLDivElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) || "").trim();
    const values = { name: v("lead_name"), phone: v("mobile_no"), need: v("need"), email: v("email_id") };
    const { bad, e164 } = checkPlan(values, country);
    setErrors(Object.fromEntries(bad.map((k) => [k, true])));
    if (bad.length || !e164) return (e.currentTarget.elements.namedItem(FIELD_NAME[bad[0]]) as HTMLElement | null)?.focus();

    // One id for the dataLayer conversion and the ERP lead, so offline conversions can be matched later.
    const eventId = genEventId();
    const [first, ...rest] = values.name.split(/\s+/);
    setStatus("sending");
    try {
      const res = await fetch("/api/services-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_name: values.name,
          mobile_no: e164,
          country,
          email_id: values.email,
          need: values.need,
          ...attributionFields(),
          event_id: eventId,
          landing_page: window.location.href.split("#")[0],
          form_id: SERVICES_PLAN_FORM_ID,
          [TRAP_FIELD]: honeypot.current?.value || "",
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const responseBody = await res.json().catch(() => ({}));
      setFirstName(first);
      setStatus("sent");
      requestAnimationFrame(() => success.current?.focus());
      if (!isConfirmedLeadResponse(responseBody)) return;
      pushFormSubmit({ formId: SERVICES_PLAN_FORM_ID, formName: "Services Plan", formType: "consultation", serviceInterest: values.need, email: values.email, phone: e164, firstName: first, lastName: rest.join(" "), eventId });
      pushGenerateLead({ formId: SERVICES_PLAN_FORM_ID, service: values.need, email: values.email, phone: e164 });
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="ad-cf xs-success" ref={success} role="status" tabIndex={-1}>
        <span aria-hidden="true">✓</span>
        <p>
          {successText(firstName)} Want to start now?{" "}
          <a href={SITE.whatsapp} target="_blank" rel="noopener" data-cta-location="XS Form Success - Open WhatsApp">
            Open WhatsApp
          </a>
        </p>
      </div>
    );
  }

  const id = (k: string) => `${idPrefix}-${k}`;
  const err = (k: PlanField) =>
    errors[k] ? (
      <p className="ad-err" id={id(`${k}-err`)}>
        {k === "phone" ? planPhoneError(country) : PLAN_ERRORS[k]}
      </p>
    ) : null;
  const aria = (k: PlanField) => ({ "aria-invalid": errors[k] || undefined, "aria-describedby": errors[k] ? id(`${k}-err`) : undefined });

  return (
    <form className="ad-cf ad-form xs-form" onSubmit={submit} noValidate data-track={SERVICES_PLAN_FORM_ID}>
      <div className="ad-field">
        <label htmlFor={id("name")}>Your name</label>
        <input id={id("name")} name="lead_name" type="text" autoComplete="name" placeholder="e.g. Sara Ahmed" required {...aria("name")} />
        {err("name")}
      </div>
      <div className="ad-field">
        <label htmlFor={id("phone")}>WhatsApp number</label>
        <div className="ad-tel">
          <PhoneCountrySelect
            value={country}
            onChange={(e) => {
              setCountry(e.target.value as PhoneCountry);
              setErrors((x) => ({ ...x, phone: false }));
            }}
          />
          <input id={id("phone")} name="mobile_no" type="tel" inputMode="tel" autoComplete="tel" placeholder={country === "AE" ? "e.g. 50 123 4567" : phonePlaceholder(country)} required {...aria("phone")} />
        </div>
        {err("phone")}
      </div>
      <div className="ad-field">
        <label htmlFor={id("need")}>Where are you right now?</label>
        <select id={id("need")} name="need" required defaultValue={startNeed} {...aria("need")}>
          <option value="" disabled>
            Choose one
          </option>
          {NEEDS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        {err("need")}
      </div>
      <div className="ad-field">
        <label htmlFor={id("email")}>
          Email <span>(optional)</span>
        </label>
        <input id={id("email")} name="email_id" type="email" inputMode="email" autoComplete="email" placeholder="name@company.com" {...aria("email")} />
        {err("email")}
      </div>
      {/* Spam trap: invisible to people, tempting to bots. */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={id("hp")}>Leave this field empty</label>
        <input ref={honeypot} id={id("hp")} name={TRAP_FIELD} type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {status === "error" && (
        <p className="ad-err" role="alert">
          {PLAN_ERRORS.send}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-block ad-submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : FORM_COPY.button}
      </button>
      <p className="ad-privacy">
        {FORM_COPY.consent}{" "}
        <a href={SITE.privacy} target="_blank" rel="noopener">
          Privacy policy
        </a>
      </p>
    </form>
  );
}
