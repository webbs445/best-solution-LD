"use client";

import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { AC_WHATSAPP } from "@/content/accounting";
import { AN_BOOK_STATES, AN_NEEDS, AN_SOFTWARE, AN_VOLUMES } from "@/content/accountingNew";
import { TRAP_FIELD } from "@/lib/lead";
import { accTrack } from "./track";
import { nextStep, stepComplete, type ContactField, type QuoteAnswers, type QuoteStep } from "./quoteLogic";
import { getQuote, go, pick, setField, submitQuote, useQuote } from "./quoteStore";

/*
  The quote form, used by the quote section (AnQuote) and the pop-up (AnQuoteDialog). No stylesheet import on purpose:
  its styles are an-s9.css, loaded with the page by AnQuote, so the lazy pop-up does not split an-s9.css out into an
  extra render-blocking file.
*/

const STEP_NAMES = ["", "What you need", "Your books", "Your details"];
const HEADS = ["", "What do you need most?", "A little about your books.", "Where should we send your quote?"];
export const DONE_LINE = "An accountant reviews your answers and sends your quote the same day, Monday to Friday.";

export const Tick = ({ size = 12, width = 3 }: { size?: number; width?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12 5 5 9-10" />
  </svg>
);

/** The three-step form on the shared quote state. prefix keeps ids unique (the section and the pop-up both render
 * it); only the active copy moves focus. */
export function QuoteForm({ prefix, active, titleId, inPopup = false }: { prefix: string; active: boolean; titleId: string; inPopup?: boolean }) {
  const { step, answers, contact, errors, failure, phase } = useQuote();
  const heading = useRef<HTMLHeadingElement>(null);
  const doneHeading = useRef<HTMLHeadingElement>(null);
  const inputs = useRef<Partial<Record<ContactField, HTMLInputElement | null>>>({});
  const honeypot = useRef<HTMLInputElement>(null);
  const moved = useRef(false);
  // Read inside the effects (not a dependency): opening or closing the pop-up must not move focus by itself.
  const live = useRef(active);
  useEffect(() => {
    live.current = active;
  }, [active]);

  // Focus follows Next and Back to the new step's heading (not on first render), in the copy being used.
  useEffect(() => {
    if (moved.current && live.current) heading.current?.focus({ preventScroll: false });
  }, [step]);
  useEffect(() => {
    if (phase === "sent" && live.current) doneHeading.current?.focus();
  }, [phase]);

  const move = (n: QuoteStep) => {
    moved.current = true;
    go(n);
  };
  const submit = async () => {
    const bad = await submitQuote(honeypot.current?.value || "", inPopup ? getQuote().source : 9);
    if (bad) inputs.current[bad]?.focus();
  };
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phase !== "ready") return;
    if (step < 3) {
      if (stepComplete(step, answers)) move(nextStep(step, answers));
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
  const field = (k: ContactField, label: string, type: string, autoComplete: string, placeholder?: string) => (
    <div className="s9-field">
      <label htmlFor={`${prefix}-${k}`}>{label}</label>
      <input
        ref={(el) => {
          inputs.current[k] = el;
        }}
        id={`${prefix}-${k}`}
        name={k}
        type={type}
        autoComplete={autoComplete}
        inputMode={type === "tel" ? "tel" : type === "email" ? "email" : undefined}
        placeholder={placeholder}
        value={contact[k]}
        aria-invalid={errors[k] ? true : undefined}
        aria-describedby={errors[k] ? `${prefix}-${k}-err` : undefined}
        onChange={(e) => setField(k, e.target.value)}
      />
      {errors[k] && (
        <p className="s9-err" id={`${prefix}-${k}-err`}>
          {errors[k]}
        </p>
      )}
    </div>
  );

  return (
    <form className="s9-card" noValidate onSubmit={onSubmit} aria-labelledby={titleId}>
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
              <div role="group" aria-labelledby={`${prefix}-vol`}>
                <p className="s9-lab2" id={`${prefix}-vol`}>
                  Payments and invoices per month
                </p>
                <div className="s9-chips s">{AN_VOLUMES.map((v) => chip("volume", v, false))}</div>
              </div>
              <div role="group" aria-labelledby={`${prefix}-soft`}>
                <p className="s9-lab2" id={`${prefix}-soft`}>
                  Software you use, if any
                </p>
                <div className="s9-chips s">{AN_SOFTWARE.map((v) => chip("software", v, false))}</div>
              </div>
              <div role="group" aria-labelledby={`${prefix}-upd`}>
                <p className="s9-lab2" id={`${prefix}-upd`}>
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
                <label htmlFor={`${prefix}-hp`}>Leave this field empty</label>
                <input ref={honeypot} id={`${prefix}-hp`} name={TRAP_FIELD} type="text" tabIndex={-1} autoComplete="off" />
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
              <button type="button" className="s9-back" disabled={phase === "sending"} onClick={() => move((step - 1) as QuoteStep)}>
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
  );
}

