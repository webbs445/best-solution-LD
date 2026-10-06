"use client";

import { forwardRef, useRef, useState, type FormEvent } from "react";
import { SITE } from "@/content/site";
import { ArrowIcon } from "@/components/ui/Icons";
import { genEventId, getClid, pushFormSubmit } from "@/lib/analytics";
import { FZ_FORM_ID, LEAD_ERRORS, LEAD_RULES, type LeadField } from "@/lib/lead";
import type { PlannerInput } from "@/lib/freezone";

/*
  "Request this estimate in writing": the main site's lead flow (same rules, honeypot, event id and
  form_submit conversion) posting the planner's selections to /api/lead, which re-prices them on the server.
*/

const FIELDS: { name: LeadField; id: string; label: string; type: string; autoComplete: string; inputMode?: "email" | "tel"; placeholder?: string }[] = [
  { name: "lead_name", id: "leadName", label: "Full name", type: "text", autoComplete: "name" },
  { name: "email_id", id: "leadEmail", label: "Email", type: "email", autoComplete: "email", inputMode: "email" },
  { name: "mobile_no", id: "leadPhone", label: "WhatsApp number", type: "tel", autoComplete: "tel", inputMode: "tel", placeholder: "+971 50 000 0000" },
];

const THANK_YOU_URL = process.env.NEXT_PUBLIC_THANK_YOU_URL || "";

export const FzLeadForm = forwardRef<HTMLInputElement, { planner: PlannerInput }>(function FzLeadForm({ planner }, firstInput) {
  const [values, setValues] = useState<Record<LeadField, string>>({ lead_name: "", email_id: "", mobile_no: "" });
  const [errors, setErrors] = useState<Partial<Record<LeadField, boolean>>>({});
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const inputs = useRef<Partial<Record<LeadField, HTMLInputElement | null>>>({});
  const honeypot = useRef<HTMLInputElement>(null);

  const setValue = (name: LeadField, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    // While typing, only clear an error; never raise one mid-word.
    if (LEAD_RULES[name](value)) setErrors((e) => ({ ...e, [name]: false }));
  };

  const onBlur = (name: LeadField) => {
    if (values[name]) setErrors((e) => ({ ...e, [name]: !LEAD_RULES[name](values[name]) }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const bad = FIELDS.map((f) => f.name).filter((n) => !LEAD_RULES[n](values[n]));
    setErrors(Object.fromEntries(FIELDS.map((f) => [f.name, bad.includes(f.name)])));
    if (bad.length) {
      inputs.current[bad[0]]?.focus();
      return;
    }

    const qs = new URLSearchParams(window.location.search);
    // One id for the dataLayer conversion and the ERP lead, so offline conversions can be matched later.
    const eventId = genEventId();
    const [firstName, ...rest] = values.lead_name.trim().split(/\s+/);
    setSending(true);
    setStatus("Sending your details...");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_name: values.lead_name.trim(),
          email_id: values.email_id.trim(),
          mobile_no: values.mobile_no.trim(),
          utm_source: qs.get("utm_source") || "",
          utm_medium: qs.get("utm_medium") || "",
          utm_campaign: qs.get("utm_campaign") || "",
          utm_content: qs.get("utm_content") || "",
          utm_term: qs.get("utm_term") || "",
          // Consent-gated click-id cookies, as on the main site (gclid > fbclid > li_fat_id).
          click_id: getClid(),
          event_id: eventId,
          landing_page: window.location.href.split("#")[0],
          submission_timestamp: new Date().toISOString(),
          website: honeypot.current?.value || "",
          planner,
        }),
      });

      if (res.status === 503) {
        setStatus("This form is not connected yet. Set ERPNEXT_URL, ERPNEXT_API_KEY and ERPNEXT_API_SECRET to start receiving enquiries.");
        setSending(false);
        return;
      }
      if (!res.ok) throw new Error("Request failed");

      pushFormSubmit({
        formId: FZ_FORM_ID,
        formType: "calculator",
        serviceInterest: "free_zone",
        email: values.email_id,
        phone: values.mobile_no,
        firstName,
        lastName: rest.join(" "),
        eventId,
      });
      if (THANK_YOU_URL) {
        window.location.href = THANK_YOU_URL;
        return;
      }
      setSent(true);
      setStatus("Thank you. Your advisor will send your written estimate within 24 hours.");
    } catch {
      setStatus(`We could not send your details. Please try again, or call ${SITE.phone.display}.`);
    }
    setSending(false);
  };

  return (
    <form className="fz-form" id="leadForm" data-track={FZ_FORM_ID} noValidate onSubmit={onSubmit}>
      <div className="fz-form-row">
        {FIELDS.map((f, i) => {
          const invalid = !!errors[f.name];
          const errId = `${f.id}-error`;
          return (
            <div key={f.name}>
              <label htmlFor={f.id}>{f.label}</label>
              <input
                ref={(el) => {
                  inputs.current[f.name] = el;
                  if (i === 0 && firstInput) {
                    if (typeof firstInput === "function") firstInput(el);
                    else firstInput.current = el;
                  }
                }}
                id={f.id}
                name={f.name}
                type={f.type}
                autoComplete={f.autoComplete}
                inputMode={f.inputMode}
                placeholder={f.placeholder}
                required
                value={values[f.name]}
                disabled={sent}
                aria-invalid={invalid}
                aria-describedby={invalid ? errId : undefined}
                onChange={(e) => setValue(f.name, e.target.value)}
                onBlur={() => onBlur(f.name)}
              />
              {invalid && (
                <p className="err" id={errId}>
                  {LEAD_ERRORS[f.name]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Spam trap: invisible to people, tempting to bots. */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="leadWebsite">Website</label>
        <input ref={honeypot} id="leadWebsite" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {!sent && (
        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? "Sending..." : "Request My Estimate"} <ArrowIcon />
        </button>
      )}
      <p className="fz-micro">
        By sending, you agree that Best Solution may contact you about this estimate by phone, WhatsApp or email. No
        obligation.{" "}
        <a href={SITE.privacy} target="_blank" rel="noopener">
          Privacy policy
        </a>
      </p>
      <p className="fz-status" role="status" hidden={!status}>
        {status}
      </p>
    </form>
  );
});
