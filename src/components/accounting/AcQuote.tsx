"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AC_OFFER_EXTRA, AC_WHATSAPP, BOOK_STATES, SERVICE_NAMES, SERVICE_OPTIONS, SOFTWARE, VOLUMES, type ServiceKey } from "@/content/accounting";
import { SITE } from "@/content/site";
import { genEventId, pushFormSubmit, trackEvent } from "@/lib/analytics";
import { attributionFields } from "@/lib/attribution";
import { AC_FORM_ID, LEAD_ERRORS, LEAD_RULES } from "@/lib/lead";
import { LeadSuccess } from "@/components/ui/LeadSuccess";
import f from "@/components/ui/LeadForm.module.css";
import { AC_HEALTH_EVENT, type HealthResult } from "./AcHealthCheck";

/*
  "Your fixed monthly quote, in writing": a three-step quote builder (service, details, contact). On phones
  and tablets the form sits straight under the heading, with the explainer and contact links after it.
  Posts to /api/accounting (ERP lead) and reports form_step / form_submit to GTM. Any [data-service]
  link on the page pre-selects its service; the health check's result is attached to the lead.
*/

const HEADS: Record<number, [string, string]> = {
  1: ["What do you need?", "Pick one. You can change it later."],
  2: ["A bit about your books", "Optional, but it helps us price accurately."],
  3: ["Where should we send it?", "An accountant replies by WhatsApp or email."],
};
const NEXT_STEPS = [
  "An accountant reviews your details",
  "They reply on WhatsApp or email",
  "You get a fixed monthly quote in writing",
];
const MIN_SENDING_MS = 900;
const THANK_YOU_URL = process.env.NEXT_PUBLIC_THANK_YOU_URL || "";
const ARROW = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 10h12M11 5l5 5-5 5" />
  </svg>
);

type Phase = { kind: "ready" } | { kind: "sending" } | { kind: "sent"; firstName: string } | { kind: "error"; text: string };
type Field = "name" | "phone" | "email";

function Choices({ name, label, options, value, onPick }: { name: string; label: string; options: string[]; value: string; onPick: (v: string) => void }) {
  return (
    <div className="grp">
      <b>{label}</b>
      <div className="chs">
        {options.map((o) => (
          <label key={o}>
            <input type="radio" name={name} value={o} checked={value === o} onChange={() => onPick(o)} />
            <span>{o}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function AcQuote() {
  const [step, setStep] = useState(1);
  const [service, setService] = useState<ServiceKey>("not_sure");
  const [volume, setVolume] = useState("");
  const [software, setSoftware] = useState("");
  const [state, setState] = useState("");
  const [values, setValues] = useState<Record<Field, string>>({ name: "", phone: "", email: "" });
  const [bad, setBad] = useState<Partial<Record<Field, boolean>>>({});
  const [phase, setPhase] = useState<Phase>({ kind: "ready" });
  const health = useRef<HealthResult | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const inputs = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});
  const sending = phase.kind === "sending";
  const stepRef = useRef(1);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // [data-service] links anywhere on the page pre-select their service; keep the health check result.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-service]");
      const v = el?.getAttribute("data-service");
      if (v && v in SERVICE_NAMES) setService(v as ServiceKey);
    };
    const onHealth = (e: Event) => {
      health.current = (e as CustomEvent<HealthResult>).detail;
    };
    document.addEventListener("click", onClick);
    window.addEventListener(AC_HEALTH_EVENT, onHealth);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener(AC_HEALTH_EVENT, onHealth);
    };
  }, []);

  const go = (n: number) => {
    setStep(n);
    trackEvent("form_step", { form_name: "accounting_quote", step: n });
    if (n === 3) window.setTimeout(() => nameInput.current?.focus({ preventScroll: true }), 350);
  };

  const pickService = (v: ServiceKey) => {
    setService(v);
    // Picking a service moves on to the details step after a short beat.
    window.setTimeout(() => {
      if (stepRef.current === 1) go(2);
    }, 260);
  };

  const rules: Record<Field, (v: string) => boolean> = {
    name: LEAD_RULES.lead_name,
    phone: LEAD_RULES.mobile_no,
    email: LEAD_RULES.email_id,
  };
  const errors: Record<Field, string> = { name: LEAD_ERRORS.lead_name, phone: LEAD_ERRORS.mobile_no, email: LEAD_ERRORS.email_id };

  const submit = async () => {
    const fails = (Object.keys(rules) as Field[]).filter((k) => !rules[k](values[k]));
    setBad(Object.fromEntries((Object.keys(rules) as Field[]).map((k) => [k, fails.includes(k)])));
    if (fails.length) {
      inputs.current[fails[0]]?.focus();
      return;
    }
    const eventId = genEventId();
    const [firstName, ...rest] = values.name.trim().split(/\s+/);
    setPhase({ kind: "sending" });
    try {
      const [res] = await Promise.all([
        fetch("/api/accounting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_name: values.name.trim(),
            email_id: values.email.trim(),
            mobile_no: values.phone.trim(),
            service,
            volume,
            software,
            books_state: state,
            health_check: health.current?.summary ?? "",
            // First-touch UTMs and Google click IDs for the visit (lib/attribution); click_id falls back to the consented ad cookies.
            ...attributionFields(),
            event_id: eventId,
            landing_page: window.location.href.split("#")[0],
            website: honeypot.current?.value || "",
          }),
        }),
        new Promise((r) => setTimeout(r, MIN_SENDING_MS)),
      ]);
      if (res.status === 503) {
        // The ERP is not configured (ERPNEXT_URL / ERPNEXT_API_KEY / ERPNEXT_API_SECRET).
        setPhase({ kind: "error", text: `We could not send your details right now. Please call ${SITE.phone.display} or message us on WhatsApp.` });
        return;
      }
      if (!res.ok) throw new Error("Request failed");
      pushFormSubmit({
        formId: AC_FORM_ID,
        formType: "quote",
        serviceInterest: "accounting",
        email: values.email,
        phone: values.phone,
        firstName,
        lastName: rest.join(" "),
        eventId,
      });
      if (THANK_YOU_URL) {
        window.location.assign(THANK_YOU_URL);
        return;
      }
      setPhase({ kind: "sent", firstName });
    } catch {
      setPhase({ kind: "error", text: `We could not send your details. Please try again, or call ${SITE.phone.display}.` });
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    if (step < 3) go(step + 1);
    else void submit();
  };

  const field = (k: Field, id: string, label: string, type: string, autoComplete: string, inputMode?: "tel" | "email") => (
    <div className="fl">
      <input
        ref={(el) => {
          inputs.current[k] = el;
          if (k === "name") nameInput.current = el;
        }}
        id={id}
        name={k}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder=" "
        required
        value={values[k]}
        readOnly={sending}
        className={bad[k] ? "bad" : undefined}
        aria-invalid={!!bad[k]}
        aria-describedby={bad[k] ? `${id}-err` : undefined}
        onChange={(e) => {
          const v = e.target.value;
          setValues((x) => ({ ...x, [k]: v }));
          if (rules[k](v)) setBad((b) => ({ ...b, [k]: false }));
        }}
      />
      <label htmlFor={id}>{label}</label>
      <span className="err" id={`${id}-err`}>
        {errors[k]}
      </span>
    </div>
  );

  return (
    <section className="sheet s-navy dark-zone" id="contact">
      <div className="wrap qt-grid">
        <div className="qt-head rv">
          <span className="kicker">Get a quote</span>
          <h2 style={{ marginTop: 16 }}>
            Your fixed monthly quote, <span className="grad-text">in writing.</span>
          </h2>
          <p className="lede">
            Tell us what you need. An accountant reviews it and sends a written quote. No obligation.
            {AC_OFFER_EXTRA && ` ${AC_OFFER_EXTRA}`}
          </p>
        </div>

        <div className="qb-wrap rv d1">
          <div className="qb">
            {phase.kind === "sent" ? (
              <LeadSuccess
                firstName={phase.firstName}
                message="An accountant will review your details and reply with your written quote."
                summary={SERVICE_NAMES[service]}
                steps={NEXT_STEPS}
              />
            ) : (
              <form id="leadForm" noValidate data-track={AC_FORM_ID} aria-busy={sending} className={`${f.form}${sending ? ` ${f.sending}` : ""}`} onSubmit={onSubmit}>
                <span className={f.progress} aria-hidden="true" />
                <div className="stepper">
                  {["Service", "Details", "Contact"].map((s, i) => (
                    <span key={s} className={i === step - 1 ? "on" : i < step - 1 ? "ok" : undefined}>
                      <i>{i < step - 1 ? "✓" : i + 1}</i>
                      {s}
                    </span>
                  ))}
                </div>
                <h3>{HEADS[step][0]}</h3>
                <p className="hint">{HEADS[step][1]}</p>
                <div className="panes">
                  <div className={`pane${step === 1 ? " on" : ""}`}>
                    <div className="tiles">
                      {SERVICE_OPTIONS.map((o) => (
                        <label key={o.v} className={o.v === "not_sure" ? "full" : undefined}>
                          <input type="radio" name="service" value={o.v} checked={service === o.v} onChange={() => pickService(o.v)} />
                          <span className="tile">
                            <span className="ti">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.9"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                dangerouslySetInnerHTML={{ __html: o.icon }}
                              />
                            </span>
                            <span>
                              <b>{o.name}</b>
                              <small>{o.note}</small>
                            </span>
                            <span className="dot" />
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className={`pane${step === 2 ? " on" : ""}`}>
                    <Choices name="volume" label="Transactions per month" options={VOLUMES} value={volume} onPick={setVolume} />
                    <Choices name="software" label="Current software" options={SOFTWARE} value={software} onPick={setSoftware} />
                    <Choices name="state" label="How up to date are your books?" options={BOOK_STATES} value={state} onPick={setState} />
                  </div>
                  <div className={`pane${step === 3 ? " on" : ""}`}>
                    {field("name", "f-name", "Full name", "text", "name")}
                    <div className="two">
                      {field("phone", "f-phone", "WhatsApp number", "tel", "tel", "tel")}
                      {field("email", "f-email", "Email", "email", "email", "email")}
                    </div>
                    <div className="safe" style={{ marginTop: 4 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="10" width="16" height="11" rx="2" />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>
                      Used only to prepare your quote. Never shared.
                    </div>
                  </div>
                </div>
                <div className="hp" aria-hidden="true">
                  <label htmlFor="f-website">Website</label>
                  <input ref={honeypot} id="f-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                </div>
                <div className="qnav">
                  {step > 1 && (
                    <button type="button" className="btn back" aria-label="Back" disabled={sending} onClick={() => go(step - 1)}>
                      {ARROW}
                    </button>
                  )}
                  <button type="submit" className={`btn btn-copper ${f.submit}`} disabled={sending}>
                    {sending ? (
                      <>
                        <span className={f.spinner} aria-hidden="true" />
                        Sending your request
                        <span className={f.dots} aria-hidden="true">
                          <i />
                          <i />
                          <i />
                        </span>
                      </>
                    ) : (
                      <>
                        {step === 3 ? "Send my quote request" : "Continue"} {ARROW}
                      </>
                    )}
                  </button>
                </div>
                <p className="safe">
                  <span>
                    By sending, you agree that Best Solution may contact you by phone, WhatsApp or email.{" "}
                    <a href={SITE.privacy} target="_blank" rel="noopener">
                      Privacy policy
                    </a>
                  </span>
                </p>
                <p className="sr-only" role="status">
                  {sending ? "Sending your request" : ""}
                </p>
                {phase.kind === "error" && (
                  <p className={f.error} role="alert">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7.5v5.5M12 16.5v.5" />
                    </svg>
                    {phase.text}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        <div className="qt-more rv">
          <ol className="next">
            {[
              ["Tell us about your books", "Service, volume and software. A few short questions."],
              ["An accountant reviews it", "We reply by WhatsApp or email."],
              ["You get a fixed quote in writing", "Monthly fee and scope agreed before any work begins."],
            ].map(([b, p], i) => (
              <li key={b}>
                <span className="nn">{i + 1}</span>
                <div>
                  <b>{b}</b>
                  <p>{p}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="quick">
            <a href={SITE.phone.href}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
              </svg>
              Call us
            </a>
            <a href={AC_WHATSAPP.quote} target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.5-4.3A8.5 8.5 0 1 1 20.5 11.6z" />
              </svg>
              WhatsApp
            </a>
            <a href={`mailto:${SITE.email}?subject=Accounting%20quote`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              Email
            </a>
          </div>
          <p className="hours">
            {SITE.hours.short} ·{" "}
            <a href="https://www.google.com/maps/search/?api=1&query=Best+Solution+Business+Setup+Consultancy+Business+Bay+Dubai" target="_blank" rel="noopener">
              Business Bay, Dubai
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
