"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { AC_WHATSAPP } from "@/content/accounting";
import { AN_BOOK_STATES, AN_NEED_SERVICE, AN_NEEDS, AN_SOFTWARE, AN_VOLUMES } from "@/content/accountingNew";
import { SITE } from "@/content/site";
import { genEventId, isConfirmedLeadResponse, pushFormSubmit, pushGenerateLead } from "@/lib/analytics";
import { attributionFields } from "@/lib/attribution";
import { AC_FORM_ID, TRAP_FIELD } from "@/lib/lead";
import { useInView } from "./motion";
import { accTrack } from "./track";
import {
  EMPTY_ANSWERS,
  SERVER_FIELD,
  contactErrors,
  contactPhone,
  stepComplete,
  volumeLine,
  type Contact,
  type ContactField,
  type QuoteAnswers,
  type QuoteStep,
} from "./quoteLogic";
import "./an-s9.css";

/*
  Section 9, "Next month, know your numbers": a three-step quote form beside a quote paper that fills in as answers
  are picked. Posts to /api/accounting (the accounting lead route: same validation, honeypot and click IDs as the
  other forms). After a confirmed lead the paper gets its "QUOTE TODAY" stamp and the card shows "Request received."
  The acc_* events carry only step numbers and the fixed option labels, never contact details; the confirmed lead's
  form_submit and generate_lead carry user_data for enhanced conversions, exactly as the old /accounting form did.
*/

const STEP_NAMES = ["", "What you need", "Your books", "Your details"];
const HEADS = ["", "What do you need most?", "A little about your books.", "Where should we send your quote?"];
const DONE_LINE = "An accountant reviews your answers and sends your quote the same day, Monday to Friday.";
const MIN_SENDING_MS = 700;

/* Decorative drifting ledger figures. Each column repeats its list twice so a -50% drift loops without a jump. */
const FIGS = ["148,200", "22,600", "139,600", "212,640", "276,940", "9,850", "18,400", "186,910", "29,530", "142 / 142", "0.00", "64,300", "227,750", "(118,670)", "2,150", "(113,870)", "7,410", "(49,190)"];
const col = (start: number) => {
  const list = [...FIGS.slice(start), ...FIGS.slice(0, start)];
  return [...list, ...list];
};
const Figs = ({ className, starts }: { className: string; starts: number[] }) => (
  <div className={`s9-figs ${className}`} aria-hidden="true">
    {starts.map((s, i) => (
      <div className="s9-fc" key={i}>
        {col(s).map((n, j) => (
          <span key={j}>{n}</span>
        ))}
      </div>
    ))}
  </div>
);

const Tick = ({ size = 12, width = 3 }: { size?: number; width?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12 5 5 9-10" />
  </svg>
);

type Phase = "ready" | "sending" | "sent";

export function AnQuote() {
  const [ref, seen, visible] = useInView<HTMLElement>(0.15);
  const [step, setStep] = useState<QuoteStep>(1);
  const [answers, setAnswers] = useState<QuoteAnswers>(EMPTY_ANSWERS);
  const [contact, setContact] = useState<Contact>({ name: "", phone: "", email: "" });
  const [errors, setErrors] = useState<Partial<Record<ContactField, string>>>({});
  const [failure, setFailure] = useState("");
  const [phase, setPhase] = useState<Phase>("ready");
  const heading = useRef<HTMLHeadingElement>(null);
  const doneHeading = useRef<HTMLHeadingElement>(null);
  const inputs = useRef<Partial<Record<ContactField, HTMLInputElement | null>>>({});
  const honeypot = useRef<HTMLInputElement>(null);
  const moved = useRef(false);
  const started = useRef(false);

  // Focus follows Next and Back to the new step's heading (not on first render).
  useEffect(() => {
    if (moved.current) heading.current?.focus({ preventScroll: false });
  }, [step]);
  useEffect(() => {
    if (phase === "sent") doneHeading.current?.focus();
  }, [phase]);

  const go = (n: QuoteStep) => {
    moved.current = true;
    setStep(n);
    if (n > step) accTrack("acc_quote_step", { step: n });
  };
  const pick = (k: keyof QuoteAnswers, v: string) => {
    if (!started.current) {
      started.current = true;
      accTrack("acc_quote_step", { step: 1 });
    }
    setAnswers((a) => ({ ...a, [k]: v }));
  };
  const setField = (k: ContactField, v: string) => {
    setContact((c) => ({ ...c, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = async () => {
    const bad = contactErrors(contact);
    setErrors(bad);
    setFailure("");
    const first = (["name", "phone", "email"] as ContactField[]).find((k) => bad[k]);
    if (first) {
      inputs.current[first]?.focus();
      return;
    }
    const eventId = genEventId();
    setPhase("sending");
    try {
      const [res] = await Promise.all([
        fetch("/api/accounting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_name: contact.name.trim(),
            email_id: contact.email.trim(),
            mobile_no: contactPhone(contact.phone),
            country: "AE",
            // The service the old /accounting form would send (the server applies the same map), and the answer itself.
            service: AN_NEED_SERVICE[answers.need as (typeof AN_NEEDS)[number]],
            need: answers.need,
            volume: answers.volume,
            software: answers.software,
            books_state: answers.books,
            // First-touch UTMs and Google click IDs for the visit, as on every other form (lib/attribution).
            ...attributionFields(),
            event_id: eventId,
            landing_page: window.location.href.split("#")[0],
            [TRAP_FIELD]: honeypot.current?.value || "",
          }),
        }),
        new Promise((r) => setTimeout(r, MIN_SENDING_MS)),
      ]);
      if (res.status === 422) {
        const body = (await res.json().catch(() => ({}))) as { fields?: string[] };
        const fields = (body.fields ?? []).map((f) => SERVER_FIELD[f]).filter(Boolean);
        const all = contactErrors({ name: "", phone: "", email: "" });
        setErrors(Object.fromEntries(fields.map((f) => [f, all[f]])));
        setPhase("ready");
        if (fields[0]) inputs.current[fields[0]]?.focus();
        return;
      }
      if (!res.ok) throw new Error("Request failed");
      const body = await res.json().catch(() => ({}));
      if (isConfirmedLeadResponse(body)) {
        // Same conversion pushes as the old /accounting quote form (enhanced conversions: user_data via the shared
        // helpers, which normalise it; GTM hashes it under the page's consent state). The acc_* events stay free of it.
        const [firstName, ...rest] = contact.name.trim().split(/\s+/);
        const phone = contactPhone(contact.phone) ?? contact.phone;
        pushFormSubmit({ formId: AC_FORM_ID, formType: "quote", serviceInterest: "accounting", email: contact.email, phone, firstName, lastName: rest.join(" "), eventId });
        // service: the mapped CRM key, the same kind of value the old form sent; the need label rides on acc_quote_submit.
        pushGenerateLead({ formId: AC_FORM_ID, service: AN_NEED_SERVICE[answers.need as (typeof AN_NEEDS)[number]], email: contact.email, phone });
        accTrack("acc_quote_submit", { need: answers.need });
      }
      setPhase("sent");
    } catch {
      setPhase("ready");
      setFailure(`We could not send your details. Please try again, or call ${SITE.phone.display}.`);
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phase !== "ready") return;
    if (step < 3) {
      if (stepComplete(step, answers)) go((step + 1) as QuoteStep);
    } else void submit();
  };

  const sent = phase === "sent";
  const ok = stepComplete(step, answers);
  const chip = (k: keyof QuoteAnswers, v: string, radio: boolean) => {
    const on = answers[k] === v;
    return (
      <button
        key={v}
        type="button"
        className={on ? "s9-c on" : "s9-c"}
        {...(radio ? { role: "radio", "aria-checked": on, tabIndex: on || (!answers[k] && v === AN_NEEDS[0]) ? 0 : -1 } : { "aria-pressed": on })}
        onClick={() => pick(k, v)}
      >
        {radio && <span className="s9-rd" aria-hidden="true" />}
        {v}
      </button>
    );
  };
  // Arrow keys move through the step 1 radio group, as a radiogroup should.
  const onRadioKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const i = AN_NEEDS.indexOf(answers.need as (typeof AN_NEEDS)[number]);
    const next = AN_NEEDS[(Math.max(i, 0) + keys[e.key] + AN_NEEDS.length) % AN_NEEDS.length];
    pick("need", next);
    const btns = e.currentTarget.querySelectorAll<HTMLButtonElement>("button");
    btns[AN_NEEDS.indexOf(next)]?.focus();
  };
  const row = (label: string, value: string, wait: string, last = false) => (
    <div className={last ? "s9-pl last" : "s9-pl"}>
      <span>{label}</span>
      {value ? <b>{value}</b> : <i>{wait}</i>}
    </div>
  );
  const field = (k: ContactField, label: string, type: string, autoComplete: string, placeholder?: string) => (
    <div className="s9-field">
      <label htmlFor={`an-q-${k}`}>{label}</label>
      <input
        ref={(el) => {
          inputs.current[k] = el;
        }}
        id={`an-q-${k}`}
        name={k}
        type={type}
        autoComplete={autoComplete}
        inputMode={type === "tel" ? "tel" : type === "email" ? "email" : undefined}
        placeholder={placeholder}
        value={contact[k]}
        aria-invalid={errors[k] ? true : undefined}
        aria-describedby={errors[k] ? `an-q-${k}-err` : undefined}
        onChange={(e) => setField(k, e.target.value)}
      />
      {errors[k] && (
        <p className="s9-err" id={`an-q-${k}-err`}>
          {errors[k]}
        </p>
      )}
    </div>
  );

  return (
    <section id="quote" ref={ref} className={`s9${seen ? " seen" : ""}${visible ? " live" : ""}`} aria-labelledby="an-q-title">
      <div className="s9-bg s9-glow" aria-hidden="true" />
      <div className="s9-bg s9-ruled" aria-hidden="true" />
      <div className="s9-bg s9-grain" aria-hidden="true" />
      <div className="s9-margin" aria-hidden="true" />
      <div className="s9-topline" aria-hidden="true" />
      <Figs className="s9-figs-r" starts={[0, 11]} />
      <Figs className="s9-figs-b" starts={[3, 9, 13]} />

      <div className="an-wrap s9-wrap">
        <div className="s9-left">
          <span className="s9-eyebrow">Your quote, the same day</span>
          <h2 className="an-h s9-h" id="an-q-title">
            Next month,
            <br />
            <span className="s9-gold">
              know your
              <br className="s9-m" /> numbers.
            </span>
          </h2>
          <p className="s9-lead">Three short steps. Your answers become the brief your accountant prices from.</p>
          <div className="s9-paper an-num" aria-live="polite">
            <div className="s9-ph">
              <b>QUOTE REQUEST</b>
              <span>Read by an accountant</span>
            </div>
            {row("Need", answers.need, "waiting for step 1")}
            {row("Each month", volumeLine(answers.volume), "waiting for step 2")}
            {row("Software", answers.software, "waiting for step 2")}
            {row("Books", answers.books, "waiting for step 2", true)}
            {sent && <span className="s9-stamp">QUOTE TODAY</span>}
          </div>
          <div className="s9-assure">
            <span className="s9-as">
              <i>
                <Tick />
              </i>
              Quote the same working day
            </span>
            <span className="s9-as">
              <i>
                <Tick />
              </i>
              Fee explained before any work
            </span>
          </div>
        </div>

        <div className="s9-bezel">
          <form className="s9-card" noValidate onSubmit={onSubmit} aria-labelledby="an-q-title">
            {!sent && (
              <div className="s9-prog">
                <div className="s9-steps" aria-hidden="true">
                  <span className="s9-sb on" />
                  <span className={step >= 2 ? "s9-sb on" : "s9-sb"} />
                  <span className={step >= 3 ? "s9-sb on" : "s9-sb"} />
                </div>
                <div className="s9-sl">
                  <span>
                    Step <b>{step}</b> of 3
                  </span>
                  <span>{STEP_NAMES[step]}</span>
                </div>
              </div>
            )}

            {!sent && (
              <div className="s9-body">
                <h3 className="s9-lab" ref={heading} tabIndex={-1}>
                  {HEADS[step]}
                </h3>
                {step === 1 && (
                  <div className="s9-chips" role="radiogroup" aria-label="What do you need most" onKeyDown={onRadioKey}>
                    {AN_NEEDS.map((v) => chip("need", v, true))}
                  </div>
                )}
                {step === 2 && (
                  <>
                    <div role="group" aria-labelledby="an-q-vol">
                      <p className="s9-lab2" id="an-q-vol">
                        Payments and invoices per month
                      </p>
                      <div className="s9-chips s">{AN_VOLUMES.map((v) => chip("volume", v, false))}</div>
                    </div>
                    <div role="group" aria-labelledby="an-q-soft">
                      <p className="s9-lab2" id="an-q-soft">
                        Software you use, if any
                      </p>
                      <div className="s9-chips s">{AN_SOFTWARE.map((v) => chip("software", v, false))}</div>
                    </div>
                    <div role="group" aria-labelledby="an-q-upd">
                      <p className="s9-lab2" id="an-q-upd">
                        How up to date are your books?
                      </p>
                      <div className="s9-chips s">{AN_BOOK_STATES.map((v) => chip("books", v, false))}</div>
                    </div>
                  </>
                )}
                {step === 3 && (
                  <>
                    {field("name", "Name", "text", "name")}
                    {field("phone", "WhatsApp", "tel", "tel", "+971")}
                    {field("email", "Email", "email", "email")}
                    <div className="s9-hp" aria-hidden="true">
                      <label htmlFor="an-q-hp">Leave this field empty</label>
                      <input ref={honeypot} id="an-q-hp" name={TRAP_FIELD} type="text" tabIndex={-1} autoComplete="off" />
                    </div>
                  </>
                )}
              </div>
            )}

            {sent && (
              <div className="s9-done">
                <span className="s9-done-ico">
                  <Tick size={22} />
                </span>
                <h3 className="s9-lab s9-done-h" ref={doneHeading} tabIndex={-1}>
                  Request received.
                </h3>
                <p>{DONE_LINE}</p>
              </div>
            )}

            {!sent && (
              <div className="s9-navwrap">
                <div className="s9-nav">
                  {step > 1 && (
                    <button type="button" className="s9-back" disabled={phase === "sending"} onClick={() => go((step - 1) as QuoteStep)}>
                      ← Back
                    </button>
                  )}
                  <span className="s9-gap" />
                  <button type="submit" className="an-btn1 s9-next" disabled={!ok || phase === "sending"} aria-busy={phase === "sending" || undefined}>
                    {step === 3 ? "Get my quote today" : "Next"}{" "}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
                {failure && (
                  <p className="s9-err" role="alert">
                    {failure}
                  </p>
                )}
                {step === 3 && <p className="s9-note">{DONE_LINE}</p>}
              </div>
            )}

            <div className="s9-foot">
              <span>
                Prefer WhatsApp? <span className="s9-hours">Monday to Friday, 9AM to 6PM</span>
              </span>
              <a className="s9-wa" href={AC_WHATSAPP.question} target="_blank" rel="noopener noreferrer" onClick={() => accTrack("acc_whatsapp_click", { section: 9 })}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B9714B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" />
                </svg>
                Ask an accountant there
              </a>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
