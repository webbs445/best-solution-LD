"use client";

import { forwardRef, useEffect, useRef, useState, type FormEvent } from "react";
import { SITE } from "@/content/site";
import { ArrowIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { genEventId, getClid, pushFormSubmit } from "@/lib/analytics";
import { FZ_FORM_ID, LEAD_ERRORS, LEAD_RULES, type LeadField } from "@/lib/lead";
import type { PlannerInput } from "@/lib/freezone";
import styles from "./FzLeadForm.module.css";

/*
  "Request this estimate in writing": the main site's lead flow (same rules, honeypot, event id and
  form_submit conversion) posting the planner's selections to /api/lead, which re-prices them on the server.
  States: ready → sending (button spinner, locked fields, progress line) → sent (success card), or error.
*/

const FIELDS: { name: LeadField; id: string; label: string; type: string; autoComplete: string; inputMode?: "email" | "tel"; placeholder?: string }[] = [
  { name: "lead_name", id: "leadName", label: "Full name", type: "text", autoComplete: "name" },
  { name: "email_id", id: "leadEmail", label: "Email", type: "email", autoComplete: "email", inputMode: "email" },
  { name: "mobile_no", id: "leadPhone", label: "WhatsApp number", type: "tel", autoComplete: "tel", inputMode: "tel", placeholder: "+971 50 000 0000" },
];

const THANK_YOU_URL = process.env.NEXT_PUBLIC_THANK_YOU_URL || "";

/** The sending state stays up at least this long, so its animation reads as progress rather than a flicker. */
const MIN_SENDING_MS = 900;

const NEXT_STEPS = [
  "Your advisor reviews your selections",
  "They contact you on WhatsApp to confirm the details",
  "Your written estimate arrives within 24 hours",
];

type Phase = { kind: "ready" } | { kind: "sending" } | { kind: "sent"; firstName: string } | { kind: "error"; text: string };

export interface FzLeadFormProps {
  planner: PlannerInput;
  /** Prefix for element ids when the form appears twice on the page. */
  idPrefix?: string;
  /** One line describing what is being requested, shown on the success card (zone · people · total). */
  summary?: string;
  /** Called once the lead is saved (e.g. so a popup can hide its other content). */
  onSent?: () => void;
  /** Shows a "Done" button on the success card (e.g. to close a popup). */
  onDone?: () => void;
}

export const FzLeadForm = forwardRef<HTMLInputElement, FzLeadFormProps>(function FzLeadForm(
  { planner, idPrefix = "", summary, onSent, onDone },
  firstInput,
) {
  const [values, setValues] = useState<Record<LeadField, string>>({ lead_name: "", email_id: "", mobile_no: "" });
  const [errors, setErrors] = useState<Partial<Record<LeadField, boolean>>>({});
  const [phase, setPhase] = useState<Phase>({ kind: "ready" });
  const inputs = useRef<Partial<Record<LeadField, HTMLInputElement | null>>>({});
  const honeypot = useRef<HTMLInputElement>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const sending = phase.kind === "sending";

  // Move focus to the success message so screen readers and keyboard users land on it.
  useEffect(() => {
    if (phase.kind === "sent") successHeading.current?.focus();
  }, [phase.kind]);

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
    setPhase({ kind: "sending" });

    try {
      const [res] = await Promise.all([
        fetch("/api/lead", {
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
        }),
        new Promise((r) => setTimeout(r, MIN_SENDING_MS)),
      ]);

      if (res.status === 503) {
        setPhase({
          kind: "error",
          text: "This form is not connected yet. Set ERPNEXT_URL, ERPNEXT_API_KEY and ERPNEXT_API_SECRET to start receiving enquiries.",
        });
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
      setPhase({ kind: "sent", firstName });
      onSent?.();
    } catch {
      setPhase({ kind: "error", text: `We could not send your details. Please try again, or call ${SITE.phone.display}.` });
    }
  };

  if (phase.kind === "sent") {
    return (
      <div className={styles.success}>
        <div className={styles.badge} aria-hidden="true">
          <span className={styles.ring} />
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} className={styles.spark} style={{ ["--a" as string]: `${i * 45}deg` }} />
          ))}
          <svg viewBox="0 0 52 52">
            <circle className={styles.circle} cx="26" cy="26" r="24" />
            <path className={styles.tick} d="M15 27.5l7 7 15-16" />
          </svg>
        </div>
        <h3 ref={successHeading} tabIndex={-1} className={styles.title}>
          Request received
        </h3>
        <p className={styles.lede} role="status">
          Thank you{phase.firstName ? `, ${phase.firstName}` : ""}. Your advisor will send your written estimate within 24
          hours.
        </p>
        {summary && <p className={styles.chip}>{summary}</p>}
        <ol className={styles.steps}>
          {NEXT_STEPS.map((s, i) => (
            <li key={s} style={{ ["--i" as string]: i }}>
              <b>{i + 1}</b>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <div className={styles.actions}>
          {onDone && (
            <button type="button" className="btn btn-primary" onClick={onDone}>
              Done
            </button>
          )}
          <a className={styles.wa} href={SITE.whatsapp} target="_blank" rel="noopener">
            <WhatsAppIcon />
            Chat on WhatsApp now
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      className={`fz-form ${styles.form}${sending ? ` ${styles.sending}` : ""}`}
      id={`${idPrefix}leadForm`}
      data-track={FZ_FORM_ID}
      noValidate
      aria-busy={sending}
      onSubmit={onSubmit}
    >
      <span className={styles.progress} aria-hidden="true" />
      <div className="fz-form-row">
        {FIELDS.map((f, i) => {
          const invalid = !!errors[f.name];
          const fid = `${idPrefix}${f.id}`;
          const errId = `${fid}-error`;
          return (
            <div key={f.name}>
              <label htmlFor={fid}>{f.label}</label>
              <input
                ref={(el) => {
                  inputs.current[f.name] = el;
                  if (i === 0 && firstInput) {
                    if (typeof firstInput === "function") firstInput(el);
                    else firstInput.current = el;
                  }
                }}
                id={fid}
                name={f.name}
                type={f.type}
                autoComplete={f.autoComplete}
                inputMode={f.inputMode}
                placeholder={f.placeholder}
                required
                value={values[f.name]}
                readOnly={sending}
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
        <label htmlFor={`${idPrefix}leadWebsite`}>Website</label>
        <input ref={honeypot} id={`${idPrefix}leadWebsite`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={sending}>
        {sending ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            Sending your request
            <span className={styles.dots} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </>
        ) : (
          <>
            Request My Estimate <ArrowIcon />
          </>
        )}
      </button>
      <p className="fz-micro">
        By sending, you agree that Best Solution may contact you about this estimate by phone, WhatsApp or email. No
        obligation.{" "}
        <a href={SITE.privacy} target="_blank" rel="noopener">
          Privacy policy
        </a>
      </p>
      <p className="sr-only" role="status">
        {sending ? "Sending your request" : ""}
      </p>
      {phase.kind === "error" && (
        <p className={styles.error} role="alert">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5.5M12 16.5v.5" />
          </svg>
          {phase.text}
        </p>
      )}
    </form>
  );
});
