"use client";

import { useRef, useState, type FormEvent } from "react";
import { SERVICES_PLAN_FORM_ID, TRAP_FIELD } from "@/lib/lead";
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, type PhoneCountry } from "@/lib/phoneCountries";
import { maskPhone, nameOk, type PlanField } from "@/lib/servicesPlan";
import { genEventId, isConfirmedLeadResponse } from "@/lib/analytics";
import { attributionFields } from "@/lib/attribution";
import { pushXsLead } from "@/lib/xsAnalytics";
import { PhoneCountrySelect } from "@/components/ui/PhoneCountrySelect";
import { DISCLAIMER, S9_MICRO, TOPICS, TOPIC_IDS, WORRIES, thanksBody, waLink, type TopicId } from "@/content/xservicesx";
import { XS_CONFIG as C } from "@/content/xservicesx.config";
import { setXs, useXs, xsTrack } from "./store";
import { BtnArrow, Icon } from "./ui";
import { XsWhatsApp } from "./XsCta";

type Status = "idle" | "sending" | "sent" | "error";
type Checker = typeof import("@/lib/servicesPlanCheck");
/** The number check needs libphonenumber-js (about 30 KB): loaded when the visitor reaches the form, not with the page. */
const loadChecker = () => import("@/lib/servicesPlanCheck");
const FIELD_ID: Record<PlanField, string> = { name: "xs-name", phone: "xs-phone", email: "xs-email" };
const RING = 182.2;

/*
  Section 9, id="plan": the page's one form. The tilted plan on the left fills live from the shared state (topic,
  questions, advisor, reply method) and from what is typed (name, masked number). The thank-you, the green ring and
  the "REQUEST SENT" stamp appear only after the server confirms a new lead; any other answer shows the error.
*/
export function PlanSection() {
  const s = useXs();
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Partial<Record<PlanField, string>>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState<PhoneCountry>(DEFAULT_PHONE_COUNTRY);
  const [picking, setPicking] = useState(false);
  const [checker, setChecker] = useState<Checker | null>(null);
  const getChecker = async () => checker ?? loadChecker().then((m) => (setChecker(m), m));
  const started = useRef(false);
  const sentOnce = useRef(false);
  const honeypot = useRef<HTMLInputElement>(null);
  const thanks = useRef<HTMLDivElement>(null);

  const sent = status === "sent";
  const firstName = name.trim().split(/\s+/)[0] ?? "";
  const nameValid = nameOk(name);
  const phoneValid = !!checker && !checker.checkPlan({ name: "", phone, email: "" }, country).errors.phone;
  const pct = sent ? 1 : 0.6 + (nameValid ? 0.2 : 0) + (phoneValid ? 0.2 : 0);
  const dial = PHONE_COUNTRIES.find((c) => c.code === country)?.dial ?? "";
  const masked = maskPhone(phone, dial);
  const advisor = s.advisor && s.advisor !== "any" ? C.advisors.find((a) => a.id === s.advisor) : undefined;
  const showTopicChips = !sent && (picking || !s.topic);

  const chooseTopic = (t: TopicId) => {
    setXs({ topic: t });
    setPicking(false);
    xsTrack("xs_topic_select", { topic: t, source: "s9" });
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending" || sent) return;
    const { errors: bad, e164 } = (await getChecker()).checkPlan({ name, phone, email }, country);
    setErrors(bad);
    const fields = Object.keys(bad) as PlanField[];
    if (fields.length || !e164) {
      fields.forEach((f) => xsTrack("xs_form_error", { field: f }));
      document.getElementById(FIELD_ID[fields[0] ?? "phone"])?.focus();
      return;
    }
    const eventId = genEventId();
    const topic = s.topic ?? "not_sure";
    setStatus("sending");
    try {
      const res = await fetch("/api/services-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_name: name.trim(),
          mobile_no: e164,
          country,
          email_id: email.trim().toLowerCase(),
          topic,
          worries: s.worries,
          advisor_pref: s.advisor ?? "any",
          contact_pref: s.contactPref,
          consult_mode: s.consultMode,
          form_location: "s9",
          page: "/xservicesx",
          ...attributionFields(),
          event_id: eventId,
          landing_page: window.location.href.split("#")[0],
          form_id: SERVICES_PLAN_FORM_ID,
          [TRAP_FIELD]: honeypot.current?.value || "",
        }),
      });
      const responseBody = await res.json().catch(() => ({}));
      if (!res.ok || !isConfirmedLeadResponse(responseBody)) throw new Error(String(res.status));
      setStatus("sent");
      requestAnimationFrame(() => thanks.current?.focus());
      if (sentOnce.current) return;
      sentOnce.current = true;
      pushXsLead({ eventId, topic, contactPref: s.contactPref });
    } catch {
      setStatus("error");
    }
  };

  const field = (k: PlanField) => ({
    id: FIELD_ID[k],
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `${FIELD_ID[k]}-err` : undefined,
  });
  const err = (k: PlanField) =>
    errors[k] ? (
      <p className="xs-err" id={`${FIELD_ID[k]}-err`}>
        {errors[k]}
      </p>
    ) : null;

  return (
    <section className="xs-sec xs-s9" id="plan" aria-labelledby="xsS9">
      <span className="xs-glow" aria-hidden="true" />
      <div className="xs-wrap">
        <div className="xs-s9-head">
          <span className="xs-eyebrow xs-on-navy">ONE LAST STEP</span>
          <h2 id="xsS9">
            Your plan is almost ready. <span className="xs-copper-l">Tell us where to send it.</span>
          </h2>
          <p className="d-only">We&apos;ve kept what you picked on this page. Add your name and WhatsApp, and an advisor takes it from here.</p>
        </div>

        <div className="xs-s9-grid">
          <div className="xs-paper-stage">
            <div className="xs-pile">
            <span className="xs-paper-back d-only" aria-hidden="true" />
            <div className="xs-paper">
              <div className="xs-paper-head">
                <span>
                  <b>Best Solution · Written plan</b>
                  <span className={firstName ? "is-set" : undefined}>For: {name.trim() || "your name"}</span>
                </span>
                <span className="xs-ring d-only" aria-label={`Plan ${Math.round(pct * 100)}% ready`} role="img">
                  <svg width="68" height="68" viewBox="0 0 68 68" aria-hidden="true">
                    <circle cx="34" cy="34" r="29" fill="none" stroke="#F3E4D8" strokeWidth="6" />
                    <circle cx="34" cy="34" r="29" fill="none" stroke={sent ? "#1F6B45" : "#B9714B"} strokeWidth="6" strokeLinecap="round" strokeDasharray={RING} strokeDashoffset={RING * (1 - pct)} transform="rotate(-90 34 34)" />
                  </svg>
                  <span>
                    <b>{Math.round(pct * 100)}%</b>
                    <small>ready</small>
                  </span>
                </span>
                <span className={`xs-ready m-only${sent ? " is-sent" : ""}`}>{Math.round(pct * 100)}% ready</span>
              </div>

              <div className="xs-paper-rows">
                <span className="xs-k">ABOUT</span>
                <span className="xs-about">
                  {s.topic && !picking ? (
                    <>
                      <strong key={s.topic}>{TOPICS[s.topic].short}</strong>
                      {!sent && (
                        <button type="button" className="xs-change" onClick={() => setPicking(true)}>
                          Change
                        </button>
                      )}
                    </>
                  ) : sent ? (
                    <strong>{TOPICS.not_sure.short}</strong>
                  ) : (
                    showTopicChips && (
                      <span className="xs-about-chips" role="group" aria-label="What your plan is about">
                        {TOPIC_IDS.map((t) => (
                          <button key={t} type="button" aria-pressed={s.topic === t} onClick={() => chooseTopic(t)}>
                            {TOPICS[t].short}
                          </button>
                        ))}
                      </span>
                    )
                  )}
                </span>
                {s.worries.length > 0 && (
                  <>
                    <span className="xs-k">
                      <span className="d-only">YOUR QUESTIONS</span>
                      <span className="m-only">QUESTIONS</span>
                    </span>
                    <span className="xs-qtags">
                      {[...s.worries].sort((a, b) => a - b).map((i) => (
                        <span key={i}>{WORRIES[i].tag}</span>
                      ))}
                    </span>
                  </>
                )}
                {C.advisors.length > 0 && (
                  <>
                    <span className="xs-k">
                      <span className="d-only">YOUR ADVISOR</span>
                      <span className="m-only">ADVISOR</span>
                    </span>
                    <span className="xs-v">{advisor?.name ?? "First available advisor"}</span>
                  </>
                )}
                <span className="xs-k">SEND TO</span>
                <span className={`xs-v${masked ? "" : " is-muted"}`}>
                  {s.contactPref === "whatsapp" ? "WhatsApp" : "Phone call"} · {masked ?? "your number"}
                </span>
              </div>

              <div className="xs-inside d-only">
                <span className="xs-inside-h">
                  <span>INSIDE YOUR PLAN</span>
                  <i />
                </span>
                {["Recommended structure", "Year one and after", "What to prepare", "Timeline"].map((t, i) => (
                  <span key={t} className="xs-locked">
                    <Icon name="lock" size={14} strokeWidth={2.4} />
                    <span>{t}</span>
                    <i className={i % 2 ? "alt" : undefined} />
                  </span>
                ))}
              </div>
              <span className="xs-paper-foot">
                <Icon name="lock" size={12} strokeWidth={2.4} className="m-only" />
                <span className="d-only">Written by your advisor after your call.</span>
                <span className="m-only">Structure, costs, checklist and timeline: written after your call.</span>
              </span>
              {sent && <span className="xs-stamp">REQUEST SENT</span>}
            </div>
            </div>
          </div>

          <div className="xs-formcard">
            {!sent ? (
              <form
                className="xs-form"
                onSubmit={submit}
                noValidate
                data-track={SERVICES_PLAN_FORM_ID}
                onFocus={() => {
                  if (started.current) return;
                  void getChecker();
                  started.current = true;
                  xsTrack("xs_form_start");
                }}
              >
                <h3 className="d-only">Where should we send it?</h3>
                <div className="xs-field">
                  <label htmlFor="xs-name">Your name</label>
                  <input {...field("name")} name="lead_name" type="text" autoComplete="name" placeholder="First name is fine" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
                  {err("name")}
                </div>
                <div className="xs-field">
                  <label htmlFor="xs-phone">WhatsApp number</label>
                  <div className="xs-tel">
                    <PhoneCountrySelect
                      value={country}
                      onChange={(e) => {
                        setCountry(e.target.value as PhoneCountry);
                        setErrors((x) => ({ ...x, phone: undefined }));
                      }}
                    />
                    <input {...field("phone")} name="mobile_no" type="tel" inputMode="tel" autoComplete="tel" placeholder={country === "AE" ? "50 123 4567" : "Mobile number"} value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>
                  {err("phone")}
                </div>
                <div className="xs-field">
                  <label htmlFor="xs-email">
                    Email <span>(we send your written plan here too)</span>
                  </label>
                  <input {...field("email")} name="email_id" type="email" inputMode="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  {err("email")}
                </div>
                <div className="xs-seg xs-seg-form" role="group" aria-label="How should we reply?">
                  {(["whatsapp", "call"] as const).map((p) => (
                    <button key={p} type="button" aria-pressed={s.contactPref === p} onClick={() => setXs({ contactPref: p })}>
                      {p === "whatsapp" ? "Reply on WhatsApp" : "Call me"}
                    </button>
                  ))}
                </div>
                {/* Spam trap: invisible to people, tempting to bots. */}
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="xs-hp">Leave this field empty</label>
                  <input ref={honeypot} id="xs-hp" name={TRAP_FIELD} type="text" tabIndex={-1} autoComplete="off" />
                </div>
                {status === "error" && (
                  <p className="xs-err xs-err-send" role="alert">
                    Something went wrong. Please try again, or{" "}
                    <a href={waLink(s.topic)} target="_blank" rel="noopener">
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
                      Send me my plan
                      <BtnArrow />
                    </>
                  )}
                </button>
                <p className="xs-form-micro">
                  {S9_MICRO}
                  <span className="d-only">
                    <br />
                    Your details are used only to reply to you.{" "}
                    <a href={C.privacyUrl} target="_blank" rel="noopener">
                      Privacy policy
                    </a>
                  </span>
                </p>
              </form>
            ) : (
              <div className="xs-thanks" ref={thanks} tabIndex={-1} role="status">
                <span className="xs-thanks-tick" aria-hidden="true">
                  <Icon name="check" size={28} strokeWidth={2.6} />
                </span>
                <b>{firstName ? `Thanks, ${firstName}.` : "Thanks."}</b>
                <p>{thanksBody(advisor?.name ?? null, s.contactPref)}</p>
                <XsWhatsApp location="s9_thanks" className="xs-thanks-wa">
                  Prefer to chat now? WhatsApp us →
                </XsWhatsApp>
              </div>
            )}
            <p className="xs-formcard-foot">
              Prefer to chat?{" "}
              <XsWhatsApp location="s9" className="xs-inline-wa">
                WhatsApp us
              </XsWhatsApp>
            </p>
          </div>
        </div>

        <p className="xs-s9-disc" data-legal>
          {DISCLAIMER}
          <span className="d-only"> Final decisions and government fees are set by the relevant authorities.</span>
        </p>
      </div>
    </section>
  );
}
