"use client";

import { useRef, useState, type FormEvent } from "react";
import { ADVICE_FORM_ID, LEAD_RULES } from "@/lib/lead";
import { SITE } from "@/content/site";
import { CONSULT_ERRORS, CONSULT_TOPICS } from "@/content/consult";
import { genEventId, isConfirmedLeadResponse, pushFormSubmit, pushGenerateLead } from "@/lib/analytics";
import { attributionFields } from "@/lib/attribution";

type Field = keyof typeof CONSULT_ERRORS;
type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error" };

/*
  The /consult "Book a consultation" form. Same flow as the callback form: the same field rules, attribution and
  consent fields, and form_submit (with an evt_ id shared with the ERP lead) only after the API confirms a new lead.
  form_start / form_error / form_abandon come from AnalyticsInit through data-track.
*/
export function ConsultForm() {
  const [errors, setErrors] = useState<Partial<Record<Field, boolean>>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const success = useRef<HTMLDivElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) || "").trim();
    const name = v("lead_name"), phone = v("mobile_no"), email = v("email_id"), topic = v("topic"), message = v("message");
    const next: Partial<Record<Field, boolean>> = {
      name: !LEAD_RULES.lead_name(name),
      phone: !LEAD_RULES.mobile_no(phone),
      email: !LEAD_RULES.email_id(email),
      topic: !(CONSULT_TOPICS as readonly string[]).includes(topic),
    };
    setErrors(next);
    const first = (Object.keys(next) as Field[]).find((k) => next[k]);
    if (first) return (e.currentTarget.elements.namedItem(first === "name" ? "lead_name" : first === "phone" ? "mobile_no" : first === "email" ? "email_id" : "topic") as HTMLElement | null)?.focus();

    // One id for the dataLayer conversion and the ERP lead, so offline conversions can be matched later.
    const eventId = genEventId();
    const [firstName, ...rest] = name.split(/\s+/);
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_name: name,
          mobile_no: phone,
          email_id: email,
          topic,
          message,
          ...attributionFields(),
          event_id: eventId,
          landing_page: window.location.href.split("#")[0],
          website: honeypot.current?.value || "",
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json().catch(() => ({}))) as { created?: unknown };
      setStatus({ kind: "sent" });
      // The thank-you replaces the form; bring it into view on phones.
      requestAnimationFrame(() => success.current?.scrollIntoView({ block: "center" }));
      if (!isConfirmedLeadResponse(body)) return;
      pushFormSubmit({ formId: ADVICE_FORM_ID, formType: "consultation", serviceInterest: topic, email, phone, firstName, lastName: rest.join(" "), eventId });
      pushGenerateLead({ formId: ADVICE_FORM_ID, service: topic, email, phone });
    } catch {
      setStatus({ kind: "error" });
    }
  };

  if (status.kind === "sent") {
    return (
      <div className="ad-success" ref={success} role="status" tabIndex={-1}>
        <span aria-hidden="true">✓</span>
        <p>Thank you. An advisor will contact you soon.</p>
      </div>
    );
  }

  const err = (k: Field) => (errors[k] ? <p className="ad-err" id={`ad-${k}-err`}>{CONSULT_ERRORS[k]}</p> : null);
  const aria = (k: Field) => ({ "aria-invalid": errors[k] || undefined, "aria-describedby": errors[k] ? `ad-${k}-err` : undefined });

  return (
    <form className="ad-form" onSubmit={submit} noValidate data-track={ADVICE_FORM_ID}>
      <div className="ad-field">
        <label htmlFor="ad-name">Full name</label>
        <input id="ad-name" name="lead_name" type="text" autoComplete="name" required {...aria("name")} />
        {err("name")}
      </div>
      <div className="ad-field">
        <label htmlFor="ad-phone">Phone with country code</label>
        <input id="ad-phone" name="mobile_no" type="tel" inputMode="tel" autoComplete="tel" placeholder="050 123 4567" required {...aria("phone")} />
        {err("phone")}
      </div>
      <div className="ad-field">
        <label htmlFor="ad-email">Email</label>
        <input id="ad-email" name="email_id" type="email" inputMode="email" autoComplete="email" placeholder="you@company.com" required {...aria("email")} />
        {err("email")}
      </div>
      <div className="ad-field">
        <label htmlFor="ad-topic">What would you like advice on?</label>
        <select id="ad-topic" name="topic" required defaultValue="" {...aria("topic")}>
          <option value="" disabled>
            Choose one
          </option>
          {CONSULT_TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {err("topic")}
      </div>
      <div className="ad-field">
        <label htmlFor="ad-message">
          Message <span>(optional)</span>
        </label>
        <textarea id="ad-message" name="message" rows={3} maxLength={1000} />
      </div>
      {/* Spam trap: invisible to people, tempting to bots. */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="ad-website">Website</label>
        <input ref={honeypot} id="ad-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {status.kind === "error" && (
        <p className="ad-err" role="alert">
          We could not send your details. Please try again, or call {SITE.phone.display}.
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-block ad-submit" disabled={status.kind === "sending"}>
        {status.kind === "sending" ? "Sending..." : "Book a Consultation"}
      </button>
      <p className="ad-privacy">
        By sending, you agree that Best Solution may contact you by phone, WhatsApp or email. No obligation.{" "}
        <a href={SITE.privacy} target="_blank" rel="noopener">
          Privacy policy
        </a>
      </p>
    </form>
  );
}
