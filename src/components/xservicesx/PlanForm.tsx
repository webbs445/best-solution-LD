"use client";

import { useRef, useSyncExternalStore, type FormEvent } from "react";
import { SERVICES_PLAN_FORM_ID, TRAP_FIELD } from "@/lib/lead";
import { DEFAULT_PHONE_COUNTRY, type PhoneCountry } from "@/lib/phoneCountries";
import type { PlanField } from "@/lib/servicesPlan";
import { genEventId, isConfirmedLeadResponse } from "@/lib/analytics";
import { attributionFields } from "@/lib/attribution";
import { pushXsLead } from "@/lib/xsAnalytics";
import { PhoneCountrySelect } from "@/components/ui/PhoneCountrySelect";
import { S9_MICRO, THANKS_PREP, thanksBody, waLink } from "@/content/xservicesx";
import { XS_CONFIG as C } from "@/content/xservicesx.config";
import { getXs, setXs, useXs } from "./store";
import { BtnArrow, Icon } from "./ui";
import { XsWhatsApp } from "./XsCta";

/*
  The page's lead form, shown in section 9 and in the plan pop-up. Both copies share one store: what is typed in one
  shows in the other, and once the server confirms the lead both show the thank-you (a lead is sent once). The thank-you
  appears only after the server confirms a new lead; any other answer shows the error.
*/
type Status = "idle" | "sending" | "sent" | "error";
type Checker = typeof import("@/lib/servicesPlanCheck");
export interface FormState {
  name: string;
  phone: string;
  email: string;
  country: PhoneCountry;
  status: Status;
  errors: Partial<Record<PlanField, string>>;
  checker: Checker | null;
}

let form: FormState = { name: "", phone: "", email: "", country: DEFAULT_PHONE_COUNTRY, status: "idle", errors: {}, checker: null };
const listeners = new Set<() => void>();
const setForm = (patch: Partial<FormState>) => ((form = { ...form, ...patch }), listeners.forEach((l) => l()));
const SERVER_FORM = form;
export const useForm = () =>
  useSyncExternalStore(
    (l) => (listeners.add(l), () => void listeners.delete(l)),
    () => form,
    () => SERVER_FORM,
  );

let sentOnce = false;
/** The number check needs libphonenumber-js (about 30 KB): loaded when the visitor reaches a form, not with the page. */
export const getChecker = async () => form.checker ?? import("@/lib/servicesPlanCheck").then((m) => (setForm({ checker: m }), m));

const fieldId = (prefix: string, k: PlanField) => `${prefix}-${k}`;

async function submit(e: FormEvent<HTMLFormElement>, prefix: string, location: "s9" | "popup", honeypot: string) {
  e.preventDefault();
  if (form.status === "sending" || form.status === "sent") return;
  const { name, phone, email, country } = form;
  const { errors, e164 } = (await getChecker()).checkPlan({ name, phone, email }, country);
  setForm({ errors });
  const bad = Object.keys(errors) as PlanField[];
  // form_error and form_start come from the site-wide form tracking (components/analytics/AnalyticsInit, data-track).
  if (bad.length || !e164) {
    document.getElementById(fieldId(prefix, (["name", "email", "phone"] as const).find((k) => errors[k]) ?? "phone"))?.focus();
    return;
  }
  const s = getXs();
  const eventId = genEventId();
  const topic = s.topic ?? "not_sure";
  setForm({ status: "sending" });
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
        form_location: location,
        page: "/xservicesx",
        ...attributionFields(),
        event_id: eventId,
        landing_page: window.location.href.split("#")[0],
        form_id: SERVICES_PLAN_FORM_ID,
        [TRAP_FIELD]: honeypot,
      }),
    });
    const responseBody = await res.json().catch(() => ({}));
    if (!res.ok || !isConfirmedLeadResponse(responseBody)) throw new Error(String(res.status));
    setForm({ status: "sent" });
    requestAnimationFrame(() => (document.getElementById(`${prefix}-thanks`) as HTMLElement | null)?.focus());
    if (sentOnce) return;
    sentOnce = true;
    pushXsLead({ eventId, topic, contactPref: s.contactPref, location });
  } catch {
    setForm({ status: "error" });
  }
}

/** compact: the pop-up's tighter layout (name and email side by side from 768 px, one footer line), so it fits without scrolling. */
export function PlanForm({ prefix, location, heading, compact }: { prefix: string; location: "s9" | "popup"; heading?: string; compact?: boolean }) {
  const f = useForm();
  const s = useXs();
  const honeypot = useRef<HTMLInputElement>(null);
  const advisor = s.advisor && s.advisor !== "any" ? C.advisors.find((a) => a.id === s.advisor) : undefined;
  const firstName = f.name.trim().split(/\s+/)[0] ?? "";
  const id = (k: PlanField) => fieldId(prefix, k);
  const field = (k: PlanField) => ({
    id: id(k),
    "aria-invalid": f.errors[k] ? true : undefined,
    "aria-describedby": f.errors[k] ? `${id(k)}-err` : undefined,
  });
  const err = (k: PlanField) =>
    f.errors[k] ? (
      <p className="xs-err" id={`${id(k)}-err`}>
        {f.errors[k]}
      </p>
    ) : null;

  if (f.status === "sent")
    return (
      <div className="xs-thanks" id={`${prefix}-thanks`} tabIndex={-1} role="status">
        <span className="xs-thanks-tick" aria-hidden="true">
          <Icon name="check" size={28} strokeWidth={2.6} />
        </span>
        <b>{firstName ? `Thanks, ${firstName}.` : "Thanks."}</b>
        <p>{thanksBody(advisor?.name ?? null, s.contactPref)}</p>
        <div className="xs-prep">
          <span>{THANKS_PREP.title}</span>
          <ol>
            {THANKS_PREP.items.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        </div>
        <XsWhatsApp location={`${location}_thanks`} className="xs-thanks-wa">
          Prefer to chat now? WhatsApp us →
        </XsWhatsApp>
      </div>
    );

  return (
    <form
      className={`xs-form${compact ? " is-compact" : ""}`}
      onSubmit={(e) => submit(e, prefix, location, honeypot.current?.value || "")}
      noValidate
      data-track={SERVICES_PLAN_FORM_ID}
      onFocus={() => void getChecker()}
    >
      {heading && (
        <div className="xs-form-head">
          <h3>{heading}</h3>
          <span className="xs-2min">
            <Icon name="clock" size={13} strokeWidth={2.4} />2 minutes
          </span>
        </div>
      )}
      <div className="xs-frow">
        <div className="xs-field">
          <label htmlFor={id("name")}>Your full name</label>
          <span className="xs-in">
            <Icon name="user" size={18} className="xs-in-ico" />
            <input {...field("name")} name="lead_name" type="text" autoComplete="name" placeholder="e.g. Sara Ahmed" value={f.name} onChange={(e) => setForm({ name: e.target.value })} maxLength={60} required />
          </span>
          {err("name")}
        </div>
        <div className="xs-field">
          <label htmlFor={id("email")}>
            Email <span>(your plan comes here too)</span>
          </label>
          <span className="xs-in">
            <Icon name="mail" size={18} className="xs-in-ico" />
            <input {...field("email")} name="email_id" type="email" inputMode="email" autoComplete="email" placeholder="you@company.com" value={f.email} onChange={(e) => setForm({ email: e.target.value })} required />
          </span>
          {err("email")}
        </div>
      </div>
      <div className="xs-field">
        <label htmlFor={id("phone")}>WhatsApp number</label>
        <div className="xs-tel">
          <PhoneCountrySelect value={f.country} onChange={(e) => setForm({ country: e.target.value as PhoneCountry, errors: { ...f.errors, phone: undefined } })} />
          <span className="xs-in">
            <Icon name="whatsapp" size={18} className="xs-in-ico" />
            <input {...field("phone")} name="mobile_no" type="tel" inputMode="tel" autoComplete="tel" placeholder={f.country === "AE" ? "50 123 4567" : "Mobile number"} value={f.phone} onChange={(e) => setForm({ phone: e.target.value })} required />
          </span>
        </div>
        {err("phone")}
      </div>
      <div className="xs-seg xs-seg-form" role="group" aria-label="How should we reply?">
        {(["whatsapp", "call"] as const).map((p) => (
          <button key={p} type="button" aria-pressed={s.contactPref === p} onClick={() => setXs({ contactPref: p })}>
            <Icon name={p === "whatsapp" ? "whatsapp" : "phone"} size={16} />
            {p === "whatsapp" ? "Reply on WhatsApp" : "Call me"}
          </button>
        ))}
      </div>
      {/* Spam trap: invisible to people, tempting to bots. */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={`${prefix}-hp`}>Leave this field empty</label>
        <input ref={honeypot} id={`${prefix}-hp`} name={TRAP_FIELD} type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {f.status === "error" && (
        <p className="xs-err xs-err-send" role="alert">
          Something went wrong. Please try again, or{" "}
          <a href={waLink(s.topic)} target="_blank" rel="noopener">
            message us on WhatsApp
          </a>
          .
        </p>
      )}
      <button type="submit" className="xs-btn xs-primary xs-block" disabled={f.status === "sending"} aria-busy={f.status === "sending"}>
        {f.status === "sending" ? (
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
      <p className="xs-form-trust">
        <Icon name="lock" size={14} strokeWidth={2.4} />
        <span>
          {S9_MICRO} Used only to reply to you.{" "}
          <a href={C.privacyUrl} target="_blank" rel="noopener">
            Privacy policy
          </a>
        </span>
      </p>
    </form>
  );
}
