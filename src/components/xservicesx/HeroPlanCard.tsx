"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  QUESTIONS,
  answerTags,
  coverLines,
  eventStep,
  nextScreen,
  planPath,
  planTitle,
  planTopic,
  stepCount,
  stepNumber,
  stepPill,
  type Answers,
  type Question,
  type Screen,
} from "@/content/heroPlan";
import { waLink } from "@/content/xservicesx";
import { XS_CONFIG as C } from "@/content/xservicesx.config";
import { SERVICES_PLAN_FORM_ID, TRAP_FIELD } from "@/lib/lead";
import { DEFAULT_PHONE_COUNTRY, type PhoneCountry } from "@/lib/phoneCountries";
import type { PlanField } from "@/lib/servicesPlan";
import { genEventId, isConfirmedLeadResponse } from "@/lib/analytics";
import { attributionFields } from "@/lib/attribution";
import { pushXsLead } from "@/lib/xsAnalytics";
import { PhoneCountrySelect } from "@/components/ui/PhoneCountrySelect";
import { getChecker } from "./PlanForm";
import { reducedMotion, xsTrack } from "./store";
import { BtnArrow, Icon } from "./ui";

/*
  The /services hero card: a tap-by-tap plan builder (content/heroPlan). Step 1 is server rendered; each tap turns the
  option copper for ~320 ms, then the next step comes in and focus moves to its heading. Answers live only in this
  card's state; name, number and email are never stored. The whole card is one data-track form, so the site-wide
  tracking (AnalyticsInit) sends form_start, form_error and form_abandon (with data-plan-step) for it.
*/
const PICK_MS = 320;

export function HeroPlanCard() {
  const [screen, setScreen] = useState<Screen>("situation");
  const [answers, setAnswers] = useState<Answers>({});
  const [history, setHistory] = useState<Screen[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", phone: "", email: "", country: DEFAULT_PHONE_COUNTRY as PhoneCountry });
  const [errors, setErrors] = useState<Partial<Record<PlanField, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [firstName, setFirstName] = useState("");
  // Set by the first step change: the live region and the focus move only follow a visitor's own action.
  const [stepped, setStepped] = useState(false);
  const locked = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);

  // After a step change (not on first paint): focus the new heading; on phones bring the card back into view.
  useEffect(() => {
    if (!stepped) return;
    heading.current?.focus({ preventScroll: true });
    const top = root.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) window.scrollTo({ top: window.scrollY + top - 84, behavior: reducedMotion() ? "auto" : "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs on step changes only
  }, [screen]);

  const go = (next: Screen, a: Answers) => {
    setStepped(true);
    setHistory((h) => [...h, screen]);
    setAnswers(a);
    setScreen(next);
  };

  const pick = (q: Question, id: string) => {
    if (locked.current) return;
    locked.current = true;
    setPicked(id);
    xsTrack("topic_select", { plan_step: eventStep(q), plan_question: q, plan_answer: id });
    window.setTimeout(() => {
      // A new situation drops the other paths' answers; the timing is shared by every path.
      const base: Answers = q === "situation" && id !== answers.situation ? { timing: answers.timing } : answers;
      const a = { ...base, [q]: id } as Answers;
      go(nextScreen(q, a), a);
      setPicked(null);
      locked.current = false;
    }, PICK_MS);
  };

  const back = () => {
    const prev = history[history.length - 1];
    if (!prev || locked.current) return;
    setStepped(true);
    setHistory((h) => h.slice(0, -1));
    // Answers are kept, so the step shows what was picked there; a new situation clears the rest in pick().
    setScreen(prev);
    setStatus("idle");
  };

  const field = (k: PlanField) => ({
    id: `pb-${k}`,
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": [k === "email" && "pb-email-hint", errors[k] && `pb-${k}-err`].filter(Boolean).join(" ") || undefined,
  });
  const err = (k: PlanField) =>
    errors[k] ? (
      <p className="xs-err" id={`pb-${k}-err`}>
        {errors[k]}
      </p>
    ) : null;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (screen !== "contact" || status === "sending") return;
    const { errors: found, e164 } = (await getChecker()).checkPlan({ name: f.name, phone: f.phone, email: f.email }, f.country);
    setErrors(found);
    const bad = (["name", "phone", "email"] as const).find((k) => found[k]);
    if (bad || !e164) return void document.getElementById(`pb-${bad ?? "phone"}`)?.focus();
    const eventId = genEventId();
    const topic = planTopic(answers);
    setStatus("sending");
    try {
      const res = await fetch("/api/services-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_name: f.name.trim(),
          mobile_no: e164,
          country: f.country,
          email_id: f.email.trim().toLowerCase(),
          topic,
          contact_pref: "whatsapp",
          form_location: "hero",
          plan: answers,
          page: "/services",
          ...attributionFields(),
          event_id: eventId,
          landing_page: window.location.href.split("#")[0],
          form_id: SERVICES_PLAN_FORM_ID,
          [TRAP_FIELD]: honeypot.current?.value || "",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !isConfirmedLeadResponse(body)) throw new Error(String(res.status));
      setFirstName(f.name.trim().split(/\s+/)[0] ?? "");
      setStatus("idle");
      go("done", answers);
      pushXsLead({ eventId, topic, contactPref: "whatsapp", location: "hero", planPath: planPath(answers) });
    } catch {
      setStatus("error");
    }
  }

  const total = stepCount(answers);
  const n = screen === "done" ? total : stepNumber(screen, answers);
  const tags = answerTags(answers);
  const q = screen === "contact" || screen === "done" ? null : QUESTIONS[screen];
  const cover = coverLines(answers);
  const announce = screen === "done" ? "Sent" : screen === "contact" ? "Last step" : `Step ${n} of ${total}`;

  return (
    <div className="xs-hcard-wrap" ref={root}>
      <div className="xs-hcard xs-pb">
        <form className="xs-pb-form" data-cta="" data-track={SERVICES_PLAN_FORM_ID} data-plan-step={screen === "contact" ? "contact" : q ? String(eventStep(screen as Question)) : undefined} onSubmit={submit} noValidate>
          <div className="xs-pb-head">
            <div className="xs-pb-top">
              <span className="xs-eyebrow">YOUR WRITTEN PLAN</span>
              <span className={`xs-pb-pill${screen === "done" ? " is-sent" : ""}`}>{stepPill(screen, answers)}</span>
            </div>
            <p className="xs-pb-title">{planTitle(answers)}</p>
            <div className="xs-pb-bar" aria-hidden="true">
              {Array.from({ length: total }, (_, i) => (
                <i key={i} className={i < n ? "is-on" : undefined} />
              ))}
            </div>
            <div className="xs-pb-tags">
              {tags.length ? tags.map((t) => <span key={t}>{t}</span>) : <span className="is-empty">Each answer adds to your plan</span>}
            </div>
          </div>
          <p className="sr-only" aria-live="polite">
            {stepped ? announce : ""}
          </p>

          <div className="xs-pb-body" key={screen}>
            {q && (
              <div role="group" aria-labelledby="pb-heading" className="xs-pb-step">
                <h3 id="pb-heading" ref={heading} tabIndex={-1}>
                  {q.title}
                </h3>
                <p className="xs-pb-help">{q.help}</p>
                <div className="xs-pb-opts">
                  {q.options.map((o) => {
                    const on = answers[screen as Question] === o.id;
                    return (
                      <button key={o.id} type="button" className={`xs-pb-opt${picked === o.id ? " is-picked" : ""}`} aria-pressed={on || picked === o.id} onClick={() => pick(screen as Question, o.id)}>
                        {screen === "situation" ? (
                          <span className="xs-pb-ico" aria-hidden="true">
                            <Icon name={o.icon} size={20} />
                          </span>
                        ) : (
                          <span className="xs-pb-mark" aria-hidden="true" />
                        )}
                        <span className="xs-pb-txt">
                          <b>{o.title}</b>
                          <small>{o.sub}</small>
                        </span>
                        <Icon name="arrowRight" size={16} strokeWidth={2.2} className="xs-pb-arr" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {screen === "contact" && (
              <div role="group" aria-labelledby="pb-heading" className="xs-pb-step">
                <h3 id="pb-heading" ref={heading} tabIndex={-1}>
                  Your plan is ready to write. Where should we send it?
                </h3>
                <Cover title="YOUR PLAN WILL COVER" lines={cover} />
                <div className="xs-pb-fields">
                  <div className="xs-field">
                    <label htmlFor="pb-name">Your name</label>
                    <input {...field("name")} name="lead_name" type="text" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={60} required />
                    {err("name")}
                  </div>
                  <div className="xs-field">
                    <label htmlFor="pb-phone">WhatsApp number</label>
                    <div className="xs-tel">
                      <PhoneCountrySelect value={f.country} onChange={(e) => (setF({ ...f, country: e.target.value as PhoneCountry }), setErrors({ ...errors, phone: undefined }))} />
                      <input {...field("phone")} name="mobile_no" type="tel" inputMode="tel" autoComplete="tel" placeholder={f.country === "AE" ? "50 123 4567" : "Mobile number"} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} required />
                    </div>
                    {err("phone")}
                  </div>
                  <div className="xs-field">
                    <label htmlFor="pb-email">Email</label>
                    <input {...field("email")} name="email_id" type="email" inputMode="email" autoComplete="email" placeholder="you@company.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
                    <p className="xs-pb-hint" id="pb-email-hint">
                      For your copy of the plan.
                    </p>
                    {err("email")}
                  </div>
                </div>
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="pb-hp">Leave this field empty</label>
                  <input ref={honeypot} id="pb-hp" name={TRAP_FIELD} type="text" tabIndex={-1} autoComplete="off" />
                </div>
                {status === "error" && (
                  <p className="xs-err xs-err-send" role="alert">
                    Something went wrong. Please try again, or{" "}
                    <a href={waLink(planTopic(answers))} target="_blank" rel="noopener">
                      message us on WhatsApp
                    </a>
                    .
                  </p>
                )}
                <button type="submit" className="xs-btn xs-primary xs-block" disabled={status === "sending"} aria-busy={status === "sending"}>
                  {status === "sending" ? (
                    <>
                      <span className="xs-spin" aria-hidden="true" />
                      Sending…
                    </>
                  ) : (
                    <>
                      Get my written plan
                      <BtnArrow />
                    </>
                  )}
                </button>
                <p className="xs-pb-fine">
                  An advisor calls you on WhatsApp the same day, in office hours. No obligation.{" "}
                  <a href={C.privacyUrl} target="_blank" rel="noopener">
                    Privacy policy
                  </a>
                </p>
              </div>
            )}

            {screen === "done" && (
              <div role="group" aria-labelledby="pb-heading" className="xs-pb-step xs-pb-done">
                <span className="xs-pb-tick" aria-hidden="true">
                  <Icon name="check" size={24} strokeWidth={2.6} />
                </span>
                <h3 id="pb-heading" ref={heading} tabIndex={-1}>
                  {firstName ? `Thanks, ${firstName}. Your request is in.` : "Thanks. Your request is in."}
                </h3>
                <p className="xs-pb-help">An advisor calls you on WhatsApp the same day, Monday to Friday, 9am to 6pm. Your written plan follows after the call.</p>
                <Cover title="WHAT YOUR ADVISOR WILL COVER" lines={cover} />
              </div>
            )}

            {history.length > 0 && screen !== "done" && (
              <button type="button" className="xs-pb-back" onClick={back}>
                <Icon name="chevronLeft" size={16} strokeWidth={2.4} />
                Back
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Cover({ title, lines }: { title: string; lines: readonly string[] }) {
  return (
    <div className="xs-pb-cover">
      <span>{title}</span>
      <ul>
        {lines.map((l) => (
          <li key={l}>
            <Icon name="check" size={14} strokeWidth={2.6} />
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}
