"use client";

import { useSyncExternalStore } from "react";
import { AN_NEED_SERVICE, AN_NEEDS } from "@/content/accountingNew";
import { SITE } from "@/content/site";
import { genEventId, isConfirmedLeadResponse, pushFormSubmit, pushGenerateLead } from "@/lib/analytics";
import { attributionFields } from "@/lib/attribution";
import { AC_FORM_ID, TRAP_FIELD } from "@/lib/lead";
import { accTrack, type AnSection } from "./track";
import { EMPTY_ANSWERS, SERVER_FIELD, contactErrors, contactPhone, firstOpenStep, type Contact, type ContactField, type QuoteAnswers, type QuoteStep } from "./quoteLogic";

/*
  One quote request for the whole page. The quote section (9) and the pop-up both show this state, so answers picked
  anywhere (the services list, the books check, section 6) are the same answers, closing and reopening the pop-up keeps
  them, and the lead can be sent only once: submit() runs only from "ready", and after a confirmed lead the state stays
  "sent". form_submit and generate_lead are pushed here and nowhere else, once per confirmed lead, with the event_id
  sent to the ERP. Where the form was opened (source) goes only in the acc_* events.
*/

export type Phase = "ready" | "sending" | "sent";
export type QuoteState = {
  step: QuoteStep;
  answers: QuoteAnswers;
  services: string[];
  contact: Contact;
  errors: Partial<Record<ContactField, string>>;
  failure: string;
  phase: Phase;
  /** The section the pop-up was last opened from (9 = the quote section itself, never opened). */
  source: AnSection;
  open: boolean;
  /** Bumped on every open, so the pop-up can move focus even when it is already mounted. */
  opens: number;
  /** What the opening button was about, so the pop-up's header speaks to it (see AnQuoteDialog TOPICS). */
  topic: QuoteTopic;
  /** A fixed label from the opening section (the books check result), shown in the header. */
  note: string;
};
export type QuoteTopic = "quote" | "report" | "services" | "check" | "books" | "start" | "question";

const INITIAL: QuoteState = {
  step: 1,
  answers: EMPTY_ANSWERS,
  services: [],
  contact: { name: "", phone: "", email: "" },
  errors: {},
  failure: "",
  phase: "ready",
  source: 9,
  open: false,
  opens: 0,
  topic: "quote",
  note: "",
};

let state = INITIAL;
const subs = new Set<() => void>();
const subscribe = (f: () => void) => {
  subs.add(f);
  return () => subs.delete(f);
};
const set = (patch: Partial<QuoteState>) => {
  state = { ...state, ...patch };
  subs.forEach((f) => f());
};
export const getQuote = () => state;

export function useQuote(): QuoteState {
  return useSyncExternalStore(subscribe, getQuote, () => INITIAL);
}

let started = false;
let opener: HTMLElement | null = null;

/** The element that opened the pop-up, to give focus back on close. */
export const quoteOpener = () => opener;

export function pick(k: keyof QuoteAnswers, v: string) {
  if (!started) {
    started = true;
    accTrack("acc_quote_step", { step: 1, source: state.source });
  }
  set({ answers: { ...state.answers, [k]: v } });
}

export function toggleService(name: string) {
  set({ services: state.services.includes(name) ? state.services.filter((s) => s !== name) : [...state.services, name] });
}

export function go(n: QuoteStep) {
  if (n > state.step) accTrack("acc_quote_step", { step: n, source: state.source });
  set({ step: n });
}

export function setField(k: ContactField, v: string) {
  set({ contact: { ...state.contact, [k]: v }, errors: state.errors[k] ? { ...state.errors, [k]: undefined } : state.errors });
}

/**
 * Opens the pop-up from a section, with only what that section's answers prove (prefill), and starts at the first
 * question still open. Only ever called from a click.
 */
export function openQuote(source: AnSection, prefill: Partial<QuoteAnswers> = {}, el: HTMLElement | null = null, topic: QuoteTopic = "quote", note = "") {
  opener = el;
  if (state.phase === "sent") return set({ open: true, source, opens: state.opens + 1, topic, note });
  const answers = { ...state.answers, ...prefill };
  set({ answers, step: firstOpenStep(answers), open: true, source, opens: state.opens + 1, failure: "", topic, note });
  accTrack("acc_quote_open", { source });
}

export function closeQuote() {
  set({ open: false });
}

/**
 * Sends the lead. Returns the field to focus when one is wrong. Does nothing unless the form is ready.
 * source: the pop-up passes where it was opened; the quote section passes 9.
 */
export async function submitQuote(honeypot: string, source: AnSection): Promise<ContactField | undefined> {
  if (state.phase !== "ready") return;
  const { contact, answers, services } = state;
  const bad = contactErrors(contact);
  set({ errors: bad, failure: "" });
  const first = (["name", "phone", "email"] as ContactField[]).find((k) => bad[k]);
  if (first) return first;
  const eventId = genEventId();
  const service = AN_NEED_SERVICE[answers.need as (typeof AN_NEEDS)[number]];
  set({ phase: "sending" });
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
          service,
          need: answers.need,
          volume: answers.volume,
          software: answers.software,
          books_state: answers.books,
          // The services ticked in "What we do", if any.
          ...(services.length ? { services } : {}),
          // First-touch UTMs and Google click IDs for the visit, as on every other form (lib/attribution).
          ...attributionFields(),
          event_id: eventId,
          landing_page: window.location.href.split("#")[0],
          [TRAP_FIELD]: honeypot,
        }),
      }),
      new Promise((r) => setTimeout(r, 700)),
    ]);
    if (res.status === 422) {
      const body = (await res.json().catch(() => ({}))) as { fields?: string[] };
      const fields = (body.fields ?? []).map((f) => SERVER_FIELD[f]).filter(Boolean);
      const all = contactErrors({ name: "", phone: "", email: "" });
      set({ errors: Object.fromEntries(fields.map((f) => [f, all[f]])), phase: "ready" });
      return fields[0];
    }
    if (!res.ok) throw new Error("Request failed");
    const body = await res.json().catch(() => ({}));
    if (isConfirmedLeadResponse(body)) {
      // Enhanced conversions, as the old /accounting form: user_data via the shared helpers (normalised; GTM hashes it
      // under the page's consent state). The acc_* events stay free of it.
      const [firstName, ...rest] = contact.name.trim().split(/\s+/);
      const phone = contactPhone(contact.phone) ?? contact.phone;
      pushFormSubmit({ formId: AC_FORM_ID, formType: "quote", serviceInterest: "accounting", email: contact.email, phone, firstName, lastName: rest.join(" "), eventId });
      // service: the mapped CRM key, the same kind of value the old form sent; the need label rides on acc_quote_submit.
      pushGenerateLead({ formId: AC_FORM_ID, service, email: contact.email, phone });
      accTrack("acc_quote_submit", { need: answers.need, source });
    }
    set({ phase: "sent" });
  } catch {
    set({ phase: "ready", failure: `We could not send your details. Please try again, or call ${SITE.phone.display}.` });
  }
}
