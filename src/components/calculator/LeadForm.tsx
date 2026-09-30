"use client";

import { useRef, useState, type FormEvent } from "react";
import { SITE } from "@/content/site";
import { ArrowIcon } from "@/components/ui/Icons";
import { track } from "@/lib/analytics";
import { FORM_ID, LEAD_ERRORS, LEAD_RULES, type LeadField } from "@/lib/lead";
import type { Answers, Estimate } from "@/lib/pricing";
import styles from "./Calculator.module.css";

export interface LeadState {
  values: Record<LeadField, string>;
  sent: boolean;
}

export const EMPTY_LEAD: LeadState = {
  values: { lead_name: "", email_id: "", mobile_no: "" },
  sent: false,
};

const FIELDS: { name: LeadField; id: string; label: string; type: string; autoComplete: string; inputMode?: "email" | "tel"; placeholder?: string }[] = [
  { name: "lead_name", id: "leadName", label: "Full name", type: "text", autoComplete: "name" },
  { name: "email_id", id: "leadEmail", label: "Email address", type: "email", autoComplete: "email", inputMode: "email" },
  { name: "mobile_no", id: "leadPhone", label: "WhatsApp number", type: "tel", autoComplete: "tel", inputMode: "tel", placeholder: "+971 50 000 0000" },
];

const THANK_YOU_URL = process.env.NEXT_PUBLIC_THANK_YOU_URL || "";

export function LeadForm({
  answers,
  result,
  lead,
  setLead,
}: {
  answers: Answers;
  result: Estimate;
  lead: LeadState;
  setLead: (updater: (prev: LeadState) => LeadState) => void;
}) {
  const [errors, setErrors] = useState<Partial<Record<LeadField, boolean>>>({});
  const [status, setStatus] = useState(lead.sent ? "Thank you. Your consultant will send your written estimate within 24 hours." : "");
  const [sending, setSending] = useState(false);
  const started = useRef(false);
  const inputs = useRef<Partial<Record<LeadField, HTMLInputElement | null>>>({});
  const honeypot = useRef<HTMLInputElement>(null);

  const setValue = (name: LeadField, value: string) => {
    setLead((prev) => ({ ...prev, values: { ...prev.values, [name]: value } }));
    // While typing, only clear an error; never raise one mid-word.
    if (LEAD_RULES[name](value)) setErrors((e) => ({ ...e, [name]: false }));
  };

  const onBlur = (name: LeadField) => {
    const v = lead.values[name];
    if (v) setErrors((e) => ({ ...e, [name]: !LEAD_RULES[name](v) }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const bad = FIELDS.map((f) => f.name).filter((n) => !LEAD_RULES[n](lead.values[n]));
    setErrors(Object.fromEntries(FIELDS.map((f) => [f.name, bad.includes(f.name)])));
    if (bad.length) {
      inputs.current[bad[0]]?.focus();
      return;
    }

    const qs = new URLSearchParams(window.location.search);
    setSending(true);
    setStatus("Sending your details...");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_name: lead.values.lead_name.trim(),
          email_id: lead.values.email_id.trim(),
          mobile_no: lead.values.mobile_no.trim(),
          utm_source: qs.get("utm_source") || "",
          utm_medium: qs.get("utm_medium") || "",
          utm_campaign: qs.get("utm_campaign") || "",
          utm_content: qs.get("utm_content") || "",
          utm_term: qs.get("utm_term") || "",
          click_id: qs.get("gclid") || qs.get("fbclid") || qs.get("msclkid") || "",
          landing_page: window.location.href.split("#")[0],
          form_id: FORM_ID,
          submission_timestamp: new Date().toISOString(),
          website: honeypot.current?.value || "",
          answers,
          estimate: result,
        }),
      });

      if (res.status === 503) {
        setStatus("This form is not connected yet. Set ERPNEXT_URL, ERPNEXT_API_KEY and ERPNEXT_API_SECRET to start receiving enquiries.");
        setSending(false);
        return;
      }
      if (!res.ok) throw new Error("Request failed");

      track("generate_lead", { form_id: FORM_ID, jurisdiction: answers.jurisdiction, setup: result.name, total: result.total });
      if (THANK_YOU_URL) {
        window.location.href = THANK_YOU_URL;
        return;
      }
      setLead((prev) => ({ ...prev, sent: true }));
      setStatus("Thank you. Your consultant will send your written estimate within 24 hours.");
    } catch {
      setStatus(`We could not send your details. Please try again, or call ${SITE.phone.display}.`);
    }
    setSending(false);
  };

  return (
    <form
      className={styles.lead}
      id="leadForm"
      noValidate
      onSubmit={onSubmit}
      onFocus={() => {
        if (!started.current) {
          started.current = true;
          track("form_start", { form_id: FORM_ID });
        }
      }}
    >
      <h4>Receive this estimate in writing</h4>
      <div className={styles.fields}>
        {FIELDS.map((f) => {
          const value = lead.values[f.name];
          const invalid = !!errors[f.name];
          const valid = LEAD_RULES[f.name](value);
          const errId = `${f.id}-error`;
          return (
            <div key={f.name}>
              <label htmlFor={f.id}>{f.label}</label>
              <input
                ref={(el) => {
                  inputs.current[f.name] = el;
                }}
                id={f.id}
                name={f.name}
                type={f.type}
                autoComplete={f.autoComplete}
                inputMode={f.inputMode}
                placeholder={f.placeholder}
                required
                value={value}
                disabled={lead.sent}
                className={valid ? styles.valid : undefined}
                aria-invalid={invalid}
                aria-describedby={invalid ? errId : undefined}
                onChange={(e) => setValue(f.name, e.target.value)}
                onBlur={() => onBlur(f.name)}
              />
              {invalid ? (
                <p className={styles.err} id={errId}>
                  {LEAD_ERRORS[f.name]}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Spam trap: invisible to people, tempting to bots. */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="leadWebsite">Website</label>
        <input ref={honeypot} id="leadWebsite" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {lead.sent ? null : (
        <button className="btn btn-primary btn-block" type="submit" disabled={sending}>
          {sending ? "Sending..." : "Send My Breakdown"} <ArrowIcon />
        </button>
      )}
      <p className={styles.micro}>
        By sending, you agree that Best Solution may contact you about this estimate by phone, WhatsApp or email. We
        respond within 24 hours. No obligation.{" "}
        <a href={SITE.privacy} rel="noopener" target="_blank">
          Privacy policy
        </a>
      </p>
      <p className={status ? styles.status : "sr-only"} role="status">
        {status}
      </p>
    </form>
  );
}
