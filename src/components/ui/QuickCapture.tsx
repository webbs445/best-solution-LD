"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { SITE } from "@/content/site";
import { genEventId, pushFormSubmit, pushGenerateLead } from "@/lib/analytics";
import { attributionFields } from "@/lib/attribution";
import { LEAD_ERRORS, LEAD_RULES } from "@/lib/lead";
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, toE164Phone, type PhoneCountry } from "@/lib/phone";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { markLeadSent } from "@/components/ui/LockedFigure";
import styles from "./QuickCapture.module.css";

/*
  Lead capture for a calculator estimate (home calculator, /freezone planner and zone popup): full name,
  WhatsApp number with country code (checked with libphonenumber-js) and email in one form, sent as ONE
  lead to /api/lead (the ERP needs all three for Website leads). Events: form_start on first focus
  (AnalyticsInit); form_submit + generate_lead once, only after the API confirms a NEW lead (the same
  number again in this visit updates that lead instead). Only the server's signed lead reference is kept
  for the visit (sessionStorage), never a contact detail; it also unlocks the blurred estimate figures.
*/

const REF_KEY = "bs_lead_ref";
const readRef = () => {
  try {
    return sessionStorage.getItem(REF_KEY) || "";
  } catch {
    return "";
  }
};
const saveRef = (ref: string) => {
  try {
    sessionStorage.setItem(REF_KEY, ref);
  } catch {
    // Storage blocked: the server's own short memory still catches the same number again.
  }
};

const PLACEHOLDER: Partial<Record<PhoneCountry, string>> = { AE: "50 123 4567", OTHER: "+44 20 7946 0000" };
const shortName = (c: (typeof PHONE_COUNTRIES)[number]) =>
  c.code === "OTHER" ? "Other" : `${c.dial} ${c.code === "AE" ? "UAE" : c.code === "GB" ? "UK" : c.code === "US" ? "US" : c.name}`;

type Field = "name" | "phone" | "email";

export interface QuickCaptureProps {
  /** Existing form id (FORM_ID / FZ_FORM_ID). */
  formId: string;
  /** generate_lead service, e.g. "mainland" or "free_zone". */
  service: string;
  /** The calculator's selections for the API: { answers, estimate } or { planner }. */
  payload: () => Record<string, unknown>;
  /** The selections (and, once unlocked, the estimate) in words, for the WhatsApp message and the success card. */
  summary: string;
  /** "dark" on the navy result panel, "light" in the /freezone popups. */
  tone?: "dark" | "light";
  /** Called once the lead is saved (e.g. so a popup can close or reveal its figures). */
  onSent?: () => void;
  /** Shows a "Done" button on the success view (e.g. to close a popup). */
  onDone?: () => void;
}

export function QuickCapture({ formId, service, payload, summary, tone = "dark", onSent, onDone }: QuickCaptureProps) {
  const id = useId().replace(/:/g, "");
  const [country, setCountry] = useState<PhoneCountry>(DEFAULT_PHONE_COUNTRY);
  const [values, setValues] = useState<Record<Field, string>>({ name: "", phone: "", email: "" });
  const [bad, setBad] = useState<Partial<Record<Field, boolean>>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<{ name: string; phone: string } | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const counted = useRef(false);

  const countryName = PHONE_COUNTRIES.find((c) => c.code === country)?.name ?? "";
  const waHref = `${SITE.whatsapp}?text=${encodeURIComponent(`Hi, my estimate: ${summary}. Please send the breakdown.`)}`;
  const phoneMsg =
    country === "OTHER"
      ? "Please type the full number with its country code, for example +44 20 7946 0000."
      : `Please check the number. It does not look like a ${countryName} mobile number.`;

  const check = (f: Field, v: string) =>
    f === "name" ? LEAD_RULES.lead_name(v.trim()) : f === "email" ? LEAD_RULES.email_id(v.trim()) : !!toE164Phone(v, country);

  const setValue = (f: Field, v: string) => {
    setValues((x) => ({ ...x, [f]: v }));
    if (bad[f] && check(f, v)) setBad((b) => ({ ...b, [f]: false }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const fails = { name: !check("name", values.name), phone: !check("phone", values.phone), email: !check("email", values.email) };
    setBad(fails);
    const first = (["name", "phone", "email"] as const).find((f) => fails[f]);
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    const name = values.name.trim();
    const email = values.email.trim().toLowerCase();
    const phone = toE164Phone(values.phone, country) as string;
    setError("");
    setSending(true);
    const eventId = genEventId();
    try {
      const [res] = await Promise.all([
        fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_name: name,
            email_id: email,
            mobile_no: phone,
            country,
            ref: readRef(),
            ...payload(),
            // First-touch UTMs and Google click IDs for the visit; click_id falls back to the consented ad cookies.
            ...attributionFields(),
            event_id: eventId,
            form_id: formId,
            landing_page: window.location.href.split("#")[0],
            submission_timestamp: new Date().toISOString(),
            website: honeypot.current?.value || "",
          }),
        }),
        new Promise((r) => setTimeout(r, 600)),
      ]);
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; created?: boolean; ref?: string | null; error?: string; fields?: string[] };
      if (!res.ok || !json.ok) {
        if (json.error === "invalid_fields") {
          setBad({
            name: !!json.fields?.includes("lead_name"),
            phone: !!json.fields?.includes("mobile_no"),
            email: !!json.fields?.includes("email_id"),
          });
        } else {
          setError(
            json.error === "rate_limited"
              ? "Too many tries from this connection. Please message us on WhatsApp instead."
              : `We could not send your details right now. Please message us on WhatsApp or call ${SITE.phone.display}.`,
          );
        }
        setSending(false);
        return;
      }
      if (json.ref) saveRef(json.ref);
      // form_submit + generate_lead once per lead: only for a newly created lead, never for the same number again.
      if (json.created && !counted.current) {
        counted.current = true;
        const [firstName, ...rest] = name.split(/\s+/);
        pushFormSubmit({ formId, formType: "calculator", serviceInterest: service, email, phone, firstName, lastName: rest.join(" "), eventId });
        pushGenerateLead({ formId, service, email, phone });
      }
      setSent({ name: name.split(/\s+/)[0], phone });
      markLeadSent();
      onSent?.();
    } catch {
      setError(`We could not send your details right now. Please message us on WhatsApp or call ${SITE.phone.display}.`);
    }
    setSending(false);
  };

  const wrap = `${styles.qc} ${tone === "light" ? styles.light : styles.dark}`;

  if (sent) {
    return (
      <div className={`${wrap} ${styles.okWrap}`} role="status">
        <div className={styles.okHead}>
          <span className={styles.tick} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <div>
            <h4>Thank you, {sent.name}.</h4>
            <p>
              Your advisor will send the itemised breakdown to <b>{sent.phone}</b> on WhatsApp.
            </p>
          </div>
        </div>
        {onDone ? (
          <button type="button" className={`btn btn-primary btn-block ${styles.done}`} onClick={onDone}>
            Done
          </button>
        ) : null}
      </div>
    );
  }

  const err = (f: Field, text: string) =>
    bad[f] ? (
      <p className={styles.err} id={`${id}-${f}err`}>
        {text}
      </p>
    ) : null;

  return (
    <form className={wrap} data-track={formId} noValidate onSubmit={onSubmit} aria-busy={sending}>
      <div className={styles.field}>
        <label htmlFor={`${id}-name`}>Full name</label>
        <input
          id={`${id}-name`}
          name="lead_name"
          type="text"
          autoComplete="name"
          required
          value={values.name}
          aria-invalid={!!bad.name}
          aria-describedby={bad.name ? `${id}-nameerr` : undefined}
          readOnly={sending}
          onChange={(e) => setValue("name", e.target.value)}
        />
        {err("name", LEAD_ERRORS.lead_name)}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${id}-phone`}>WhatsApp number</label>
        <div className={styles.row}>
          <select
            className={styles.cc}
            aria-label="Country code"
            value={country}
            disabled={sending}
            onChange={(e) => {
              setCountry(e.target.value as PhoneCountry);
              setBad((b) => ({ ...b, phone: false }));
            }}
          >
            {PHONE_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {shortName(c)}
              </option>
            ))}
          </select>
          <input
            id={`${id}-phone`}
            name="mobile_no"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder={PLACEHOLDER[country] ?? "Mobile number"}
            value={values.phone}
            aria-invalid={!!bad.phone}
            aria-describedby={bad.phone ? `${id}-phoneerr` : undefined}
            readOnly={sending}
            onChange={(e) => setValue("phone", e.target.value)}
          />
        </div>
        {err("phone", phoneMsg)}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${id}-email`}>Email</label>
        <input
          id={`${id}-email`}
          name="email_id"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={values.email}
          aria-invalid={!!bad.email}
          aria-describedby={bad.email ? `${id}-emailerr` : undefined}
          readOnly={sending}
          onChange={(e) => setValue("email", e.target.value)}
        />
        {err("email", LEAD_ERRORS.email_id)}
      </div>

      {error ? (
        <p className={styles.err} role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className={`btn btn-primary btn-block ${styles.send}`} disabled={sending}>
        {sending ? <span className={styles.spin} aria-hidden="true" /> : null}
        {sending ? "Sending..." : "Send my breakdown"}
      </button>

      <a className={styles.waLink} href={waHref} target="_blank" rel="noopener" data-cta-location="Calculator Result">
        <WhatsAppIcon /> Prefer WhatsApp? Message us now
      </a>

      <p className={styles.note}>
        We use your details only to send your estimate and follow up. No spam.{" "}
        <a href={SITE.privacy} target="_blank" rel="noopener">
          Privacy policy
        </a>
      </p>

      {/* Spam trap: invisible to people, tempting to bots. */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input ref={honeypot} id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
    </form>
  );
}
