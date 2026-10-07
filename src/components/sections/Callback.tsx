"use client";

import { useEffect, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { CALLBACK_FORM_ID, LEAD_ERRORS, LEAD_RULES } from "@/lib/lead";
import { SITE } from "@/content/site";
import { genEventId, jurisdictionLabel, pushFormSubmit } from "@/lib/analytics";
import { attributionFields } from "@/lib/attribution";
import { ArrowIcon } from "@/components/ui/Icons";
import styles from "./Callback.module.css";

const INTERESTS = [
  ["mainland", "Mainland"],
  ["freezone", "Free zone"],
  ["offshore", "Offshore"],
  ["not_sure", "Not sure yet"],
] as const;

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; text: string };

/** Dispatch this on window to open the callback popup from anywhere (e.g. the /consultation sitelink). */
export const OPEN_CALLBACK = "open-callback";

/* "Book a Callback" button plus its popup. A native <dialog> gives focus trapping, Escape to close and the top layer. */
export function CallbackButton({
  className,
  children,
  defaultInterest = "not_sure",
  ctaLocation = "LP Footer — Book a Callback",
}: {
  className: string;
  children: ReactNode;
  /** The interest preselected in the popup, e.g. "freezone" on the free zone page. */
  defaultInterest?: (typeof INTERESTS)[number][0];
  ctaLocation?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<{ name?: boolean; phone?: boolean; email?: boolean }>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const open = () => {
    dialog.current?.showModal();
    document.documentElement.classList.add(styles.locked);
  };

  const close = () => dialog.current?.close();

  useEffect(() => {
    const openFromEvent = () => {
      if (!dialog.current || dialog.current.open) return;
      dialog.current.showModal();
      document.documentElement.classList.add(styles.locked);
    };
    window.addEventListener(OPEN_CALLBACK, openFromEvent);
    return () => window.removeEventListener(OPEN_CALLBACK, openFromEvent);
  }, []);

  // Clicks on the dialog element itself land on the backdrop; clicks on the card land on its children.
  const onDialogClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) close();
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = nameRef.current?.value.trim() ?? "";
    const phone = phoneRef.current?.value.trim() ?? "";
    const email = emailRef.current?.value.trim() ?? "";
    const next = {
      name: !LEAD_RULES.lead_name(name),
      phone: !LEAD_RULES.mobile_no(phone),
      email: !LEAD_RULES.email_id(email),
    };
    setErrors(next);
    if (next.name) return nameRef.current?.focus();
    if (next.phone) return phoneRef.current?.focus();
    if (next.email) return emailRef.current?.focus();

    const interest = (new FormData(form).get("interest") as string) || "not_sure";
    // One id for the dataLayer conversion and the ERP lead, so offline conversions can be matched later.
    const eventId = genEventId();
    const [firstName, ...rest] = name.split(/\s+/);
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_name: name,
          mobile_no: phone,
          email_id: email,
          interest,
          // First-touch UTMs and Google click IDs for the visit (lib/attribution); click_id falls back to the consented ad cookies.
          ...attributionFields(),
          event_id: eventId,
          landing_page: window.location.href.split("#")[0],
          website: honeypot.current?.value || "",
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus({ kind: "sent" });
      pushFormSubmit({
        formId: CALLBACK_FORM_ID,
        formType: "callback",
        serviceInterest: interest === "not_sure" ? undefined : jurisdictionLabel(interest),
        email,
        phone,
        firstName,
        lastName: rest.join(" "),
        eventId,
      });
    } catch {
      setStatus({
        kind: "error",
        text: `We could not send your details. Please try again, or call ${SITE.phone.display}.`,
      });
    }
  };

  return (
    <>
      <button type="button" className={className} onClick={open} aria-controls="cbModal" data-cta-location={ctaLocation}>
        {children}
      </button>

      <dialog
        ref={dialog}
        id="cbModal"
        className={styles.dialog}
        aria-labelledby="cb-title"
        onClick={onDialogClick}
        onClose={() => document.documentElement.classList.remove(styles.locked)}
      >
        <div className={styles.card}>
          <button type="button" className={styles.close} aria-label="Close" onClick={close}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <span className={styles.live}>
            <i aria-hidden="true" />
            Consultants available
          </span>
          <h3 id="cb-title">Request a callback</h3>
          <p className={styles.lede}>
            Leave your number. We&apos;ll call you back.
          </p>

          <form className={styles.form} onSubmit={submit} noValidate data-track={CALLBACK_FORM_ID}>
            <div className={styles.row}>
              <div>
                <label htmlFor="cb-name">Full name</label>
                <input
                  ref={nameRef}
                  id="cb-name"
                  type="text"
                  autoComplete="name"
                  required
                  autoFocus
                  aria-invalid={errors.name || undefined}
                  aria-describedby={errors.name ? "cb-name-err" : undefined}
                />
                {errors.name && (
                  <p className={styles.err} id="cb-name-err">
                    {LEAD_ERRORS.lead_name}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="cb-phone">WhatsApp number</label>
                <input
                  ref={phoneRef}
                  id="cb-phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+971 50 000 0000"
                  required
                  aria-invalid={errors.phone || undefined}
                  aria-describedby={errors.phone ? "cb-phone-err" : undefined}
                />
                {errors.phone && (
                  <p className={styles.err} id="cb-phone-err">
                    {LEAD_ERRORS.mobile_no}
                  </p>
                )}
              </div>
              <div className={styles.full}>
                <label htmlFor="cb-email">Email</label>
                <input
                  ref={emailRef}
                  id="cb-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@company.com"
                  required
                  aria-invalid={errors.email || undefined}
                  aria-describedby={errors.email ? "cb-email-err" : undefined}
                />
                {errors.email && (
                  <p className={styles.err} id="cb-email-err">
                    {LEAD_ERRORS.email_id}
                  </p>
                )}
              </div>
            </div>

            <fieldset className={styles.pick}>
              <legend>I&apos;m interested in</legend>
              {INTERESTS.map(([value, label]) => (
                <label key={value}>
                  <input type="radio" name="interest" value={value} defaultChecked={value === defaultInterest} />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>

            {/* Spam trap: invisible to people, tempting to bots. */}
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="cb-website">Website</label>
              <input ref={honeypot} id="cb-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            {status.kind !== "sent" && (
              <button type="submit" className="btn btn-primary btn-block" disabled={status.kind === "sending"}>
                {status.kind === "sending" ? "Sending..." : "Request a Callback"} <ArrowIcon />
              </button>
            )}
            <p className={styles.micro}>
              By sending, you agree that Best Solution may contact you by phone, WhatsApp or email. No obligation.{" "}
              <a href={SITE.privacy} target="_blank" rel="noopener">
                Privacy policy
              </a>
            </p>
            <p className={styles.status} role="status" hidden={status.kind === "idle" || status.kind === "sending"}>
              {status.kind === "sent" && "Thank you. A consultant will call you back."}
              {status.kind === "error" && status.text}
            </p>
          </form>
        </div>
      </dialog>
    </>
  );
}
