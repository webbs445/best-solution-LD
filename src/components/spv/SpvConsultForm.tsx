"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { SITE } from "@/content/site";
import { SPV_ASSETS, SPV_CONTACT, SPV_GOALS, SPV_PREFILL_EVENT, type SpvAssets, type SpvGoal, type SpvPrefill } from "@/content/spv";
import { genEventId, pushFormSubmit, pushGenerateLead } from "@/lib/analytics";
import { attributionFields } from "@/lib/attribution";
import { LEAD_RULES, SPV_FORM_ID } from "@/lib/lead";
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, toE164Phone, type PhoneCountry } from "@/lib/phone";

/*
  The /spv consultation form: name, WhatsApp/phone and email (the ERP needs all three), what they want
  to structure, where the assets are, contact preference and a note. Posts to /api/spv; form_submit and
  generate_lead fire once, only after the API confirms the lead. The fit finder and the "Plan a …" links
  pre-fill it through SPV_PREFILL_EVENT. form_start comes from AnalyticsInit (data-track).
*/

type Field = "name" | "phone" | "email";

export function SpvConsultForm() {
  const [country, setCountry] = useState<PhoneCountry>(DEFAULT_PHONE_COUNTRY);
  const [goal, setGoal] = useState<SpvGoal>("Not sure yet");
  const [assets, setAssets] = useState<SpvAssets>("In the UAE");
  const [bad, setBad] = useState<Partial<Record<Field, boolean>>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const fit = useRef("");
  const counted = useRef(false);

  useEffect(() => {
    const onPrefill = (e: Event) => {
      const d = (e as CustomEvent<SpvPrefill>).detail || {};
      if (d.goal) setGoal(d.goal);
      if (d.assets) setAssets(d.assets);
      if (d.fit) fit.current = d.fit;
    };
    window.addEventListener(SPV_PREFILL_EVENT, onPrefill);
    return () => window.removeEventListener(SPV_PREFILL_EVENT, onPrefill);
  }, []);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const f = e.currentTarget.elements as unknown as Record<string, HTMLInputElement>;
    const name = f.name.value.trim();
    const email = f.email.value.trim().toLowerCase();
    const phone = toE164Phone(f.phone.value, country);
    const fails = { name: !LEAD_RULES.lead_name(name), phone: !phone, email: !LEAD_RULES.email_id(email) };
    setBad(fails);
    const first = (["name", "phone", "email"] as const).find((k) => fails[k]);
    if (first) {
      f[first].focus();
      return;
    }
    setError("");
    setSending(true);
    const eventId = genEventId();
    try {
      const res = await fetch("/api/spv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_name: name,
          email_id: email,
          mobile_no: phone,
          country,
          goal,
          assets,
          contact_pref: f.contact_pref.value,
          message: f.message.value.trim(),
          fit_finder: fit.current,
          ...attributionFields(),
          event_id: eventId,
          landing_page: window.location.href.split("#")[0],
          website: f.website.value,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fields?: string[] };
      if (!res.ok || !json.ok) {
        if (json.error === "invalid_fields") {
          setBad({ name: !!json.fields?.includes("lead_name"), phone: !!json.fields?.includes("mobile_no"), email: !!json.fields?.includes("email_id") });
        } else {
          setError(
            json.error === "rate_limited"
              ? "Too many tries from this connection. Please message us on WhatsApp instead."
              : `We could not send your request right now. Please message us on WhatsApp or call ${SITE.phone.display}.`,
          );
        }
        setSending(false);
        return;
      }
      if (!counted.current) {
        counted.current = true;
        const [firstName, ...rest] = name.split(/\s+/);
        pushFormSubmit({ formId: SPV_FORM_ID, formType: "consultation", serviceInterest: goal, email, phone: phone as string, firstName, lastName: rest.join(" "), value: 100, eventId });
        pushGenerateLead({ formId: SPV_FORM_ID, service: goal, email, phone: phone as string });
      }
      setDone(true);
    } catch {
      setError(`We could not send your request right now. Please message us on WhatsApp or call ${SITE.phone.display}.`);
    }
    setSending(false);
  };

  const clear = (k: Field) => () => bad[k] && setBad((b) => ({ ...b, [k]: false }));

  return (
    <div className={`fm${done ? " done" : ""}`} id="fm">
      <form id="form" noValidate onSubmit={onSubmit} data-track={SPV_FORM_ID} aria-busy={sending}>
        <h3>Book your free consultation</h3>
        <p className="fm-sub">Takes a few moments. We only use your details to contact you.</p>
        <div className="fg">
          <div className={`fl${bad.name ? " bad" : ""}`}>
            <input id="fName" name="name" placeholder=" " autoComplete="name" required aria-invalid={!!bad.name} onInput={clear("name")} />
            <label htmlFor="fName">Full name</label>
            <span className="err">Please enter your full name.</span>
          </div>
          <div className={`fl tel${bad.phone ? " bad" : ""}`}>
            <div className="telbox">
              <select id="fCC" aria-label="Country code" value={country} onChange={(e) => setCountry(e.target.value as PhoneCountry)}>
                {PHONE_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code === "OTHER" ? "Other" : c.dial}
                  </option>
                ))}
              </select>
              <input id="fPhone" name="phone" type="tel" inputMode="tel" placeholder=" " autoComplete="tel" required aria-invalid={!!bad.phone} onInput={clear("phone")} />
              <label htmlFor="fPhone">Phone or WhatsApp</label>
            </div>
            <span className="err">
              {country === "OTHER" ? "Please type the full number with its country code." : "Please enter a valid mobile number."}
            </span>
          </div>
          <div className={`fl full${bad.email ? " bad" : ""}`}>
            <input id="fEmail" name="email" type="email" inputMode="email" placeholder=" " autoComplete="email" required aria-invalid={!!bad.email} onInput={clear("email")} />
            <label htmlFor="fEmail">Email</label>
            <span className="err">Please enter a valid email address.</span>
          </div>
        </div>
        <p className="chips-l" id="goalLabel">
          What would you like to structure?
        </p>
        <div className="chips" id="goalChips" role="radiogroup" aria-labelledby="goalLabel">
          {SPV_GOALS.map((g) => (
            <label key={g}>
              <input type="radio" name="goal" value={g} checked={goal === g} onChange={() => setGoal(g)} />
              <span>{g}</span>
            </label>
          ))}
        </div>
        <div className="fg">
          <div className="fl">
            <select id="fWhere" name="assets" value={assets} onChange={(e) => setAssets(e.target.value as SpvAssets)}>
              {SPV_ASSETS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <label htmlFor="fWhere">Where are the assets?</label>
          </div>
          <div className="fl">
            <select id="fPref" name="contact_pref" defaultValue={SPV_CONTACT[0]}>
              {SPV_CONTACT.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <label htmlFor="fPref">Preferred contact</label>
          </div>
          <div className="fl full">
            <textarea id="fMsg" name="message" placeholder=" " maxLength={1500} />
            <label htmlFor="fMsg">Anything we should know? (optional)</label>
          </div>
        </div>
        <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        {error ? (
          <p className="err-all" role="alert">
            {error}
          </p>
        ) : null}
        <button className="btn btn-cu" type="submit" disabled={sending}>
          {sending ? "Sending..." : "Book my free consultation"}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
        <p className="consent">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Private and confidential. By sending, you agree that Best Solution may contact you by phone, WhatsApp or email.{" "}
          <a href={SITE.privacy} target="_blank" rel="noopener">
            Privacy policy
          </a>
        </p>
      </form>
      <div className="sent" role="status">
        {done ? (
          <>
            <span className="tick">
              <svg className="tk" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12l5 5 9-10" />
              </svg>
            </span>
            <h3>Thank you. We have your request.</h3>
            <p>An advisor from our structuring team will contact you to arrange your consultation.</p>
            <a className="btn btn-nv" href={SITE.whatsapp} target="_blank" rel="noopener" data-area="SPV Success">
              Message us on WhatsApp
            </a>
          </>
        ) : null}
      </div>
    </div>
  );
}
