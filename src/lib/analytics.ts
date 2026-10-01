/*
  GTM dataLayer helpers, ported from best-solution.ae (webbs445/bestsolution lib/analytics.ts) so this
  landing page sends the exact event names and payload shapes the shared container GTM-MLFW9XR expects.

  Differences from the main site, all deliberate:
  - Single English page: locale is always "en" and canonical_path equals the path.
  - No interest-scoring engine (it is built around the main site's page map).
  - After a conversion, `user_data` and `form_data` are cleared from GTM's data model (just before
    the next event, Google's recommended pattern) so later events' tags can't read the email and phone.
  - pushFormSubmit accepts a pre-generated event_id so the same id reaches the ERP lead.

  Consent: behaviour events always push (GTM + Consent Mode decide what is forwarded). Writing the
  click-id cookies is gated on the saved choice via readConsent().
*/

import { readConsent } from "./consent";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

const LOCALE = "en";

/* ─── Primitive utilities ─── */

/** Set by a conversion push; the next event clears the conversion's PII from GTM's data model first. */
let conversionPending = false;

/** Push an event onto the dataLayer. No-op on the server. */
export function pushEvent(event: string, payload: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  if (conversionPending) {
    // GTM merges every push into one data model, so without this the last form_submit's
    // user_data (email, phone) and form_data would ride along on every later event.
    window.dataLayer.push({ user_data: null, form_data: null });
    conversionPending = false;
  }
  window.dataLayer.push({ event, ...payload });
}

/** Unique id for a single conversion, used by Meta browser pixel + CAPI dedup (and stored on the ERP lead). */
export function genEventId(): string {
  return "evt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

/** Read a URL query param from the current location. */
export function getParam(name: string): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) || "";
}

/** Read a cookie value (decoded), or "" if absent. */
export function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match("(?:^|; )" + name + "=([^;]*)");
  return m ? decodeURIComponent(m[1]) : "";
}

/** Write a first-party cookie. Skips empty values. Adds Secure on https. */
export function setCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined" || value === "" || value == null) return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`;
}

/**
 * Normalise a phone number to E.164 for Enhanced Conversions / Meta CAPI matching. Numbers that already
 * carry a country code ("+…", "00…", "971…") keep it; local-looking numbers get the +971 default.
 */
export function toE164(raw: string): string {
  const trimmed = (raw || "").trim();
  let d = trimmed.replace(/\D/g, "");
  if (!d) return "";
  if (trimmed.startsWith("+")) return "+" + d;
  if (d.startsWith("00")) return "+" + d.slice(2);
  if (d.startsWith("971")) return "+" + d;
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length <= 9) return "+971" + d;
  // 10+ digits with no explicit prefix: assume the country code is included.
  return "+" + d;
}

/** Same topic buckets as the main site. This landing page is business setup throughout. */
export function getContentGroup(): string {
  return "business_setup";
}

/* ─── Click-ID attribution capture ─── */

const CLICK_ID_KEYS = ["gclid", "fbclid", "li_fat_id"] as const;

/** Persist ad click-ids from the landing URL to 90-day cookies (last click wins), only with marketing consent. */
export function captureClickIds(): void {
  if (!readConsent()?.marketing) return;
  CLICK_ID_KEYS.forEach((k) => {
    const v = getParam(k);
    if (v) setCookie(k, v, 90);
  });
}

/** The single attribution id forwarded to the CRM (gclid > fbclid > li_fat_id). */
export function getClid(): string {
  return getCookie("gclid") || getCookie("fbclid") || getCookie("li_fat_id");
}

export function getClickIds(): { gclid: string; fbclid: string; li_fat_id: string } {
  return { gclid: getCookie("gclid"), fbclid: getCookie("fbclid"), li_fat_id: getCookie("li_fat_id") };
}

/* ─── Visitor geo (fed by the consent banner's /api/geo call) ─── */

export interface VisitorGeo {
  country?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  timezone?: string | null;
}

let visitorGeo: VisitorGeo = {};

export function setVisitorGeo(geo: VisitorGeo | null | undefined): void {
  if (!geo) return;
  visitorGeo = { ...visitorGeo, ...geo, country: geo.country ? geo.country.toUpperCase() : visitorGeo.country };
}

/* ─── Nested category builders ─── */

function pagePath(): string {
  return typeof window !== "undefined" ? window.location.pathname : "";
}

/** `page_data` for every event. Geo fields are omitted until /api/geo resolves. */
function pageData(path?: string) {
  const p = path ?? pagePath();
  return {
    page_data: {
      page_location: p,
      canonical_path: p,
      content_group: getContentGroup(),
      // Language of the PAGE, not the browser. Map to a GA4 parameter such as page_language.
      language: LOCALE,
      country: visitorGeo.country || undefined,
      city: visitorGeo.city || undefined,
      region: visitorGeo.region || undefined,
      postal_code: visitorGeo.postal_code || undefined,
    },
  };
}

/** Persistent page context with NO `event` key, so no trigger can fire on it. */
export function pushPageContext(path?: string): void {
  if (typeof window === "undefined") return;
  const p = path ?? pagePath();
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    locale: LOCALE,
    language: document.documentElement.lang || LOCALE,
    dir: document.documentElement.dir || "ltr",
    canonical_path: p,
    page_path: p,
  });
}

function marketingData() {
  return { marketing_data: getClickIds() };
}

/* ─── Conversions ─── */

export interface FormSubmitArgs {
  formId: string;
  formName?: string;
  /** contact | quote | callback | demo | calculator | … */
  formType?: string;
  serviceInterest?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  nationality?: string;
  /** Lead value in AED. Defaults to 1 like the main site (never 0). */
  value?: number;
  /** Pass the id already sent to the ERP so both records share it. */
  eventId?: string;
}

/**
 * Emit the `form_submit` conversion. Call once, only after the lead is confirmed saved.
 * PII lives only under `user_data` (hashed server-side; must never reach GA4).
 */
export function pushFormSubmit({
  formId,
  formName,
  formType,
  serviceInterest,
  email,
  phone,
  firstName,
  lastName,
  nationality,
  value,
  eventId,
}: FormSubmitArgs): void {
  pushEvent("form_submit", {
    event_id: eventId ?? genEventId(),
    form_data: {
      form_id: formId,
      form_name: formName ?? formId,
      form_type: formType || undefined,
      service_interest: serviceInterest || undefined,
      lead_type: "sales",
      value: value ?? 1,
      currency: "AED",
    },
    user_data: {
      email: email?.trim().toLowerCase() || undefined,
      phone: phone ? toE164(phone) || undefined : undefined,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      nationality: nationality || undefined,
    },
    ...marketingData(),
    ...pageData(),
  });
  conversionPending = true;
}

/* ─── Calculator ─── */

export function trackCalculatorStart(calculatorId: string): void {
  pushEvent("calculator_start", { calculator_data: { calculator_id: calculatorId }, ...pageData() });
}

export function trackCalculatorStep(calculatorId: string, stepName: string, stepValue: string): void {
  pushEvent("calculator_step", {
    calculator_data: { calculator_id: calculatorId, step_name: stepName, step_value: stepValue },
    ...pageData(),
  });
}

export function trackCalculatorComplete(args: {
  calculatorId: string;
  jurisdiction?: string;
  activity?: string;
  visaCount?: number | string;
  estimatedCost?: number;
  currency?: string;
}): void {
  pushEvent("calculator_complete", {
    event_id: genEventId(),
    calculator_data: {
      calculator_id: args.calculatorId,
      jurisdiction: args.jurisdiction || undefined,
      activity: args.activity || undefined,
      visa_count: args.visaCount ?? undefined,
      estimated_cost: args.estimatedCost ?? undefined,
      currency: args.currency || "AED",
    },
    ...pageData(),
  });
}

/* ─── Intent ─── */

/** jurisdiction: mainland | free_zone | offshore | undecided. action: establish | compare. */
export function trackJurisdictionInterest(jurisdiction: string, action: string, extra: Record<string, unknown> = {}): void {
  pushEvent("jurisdiction_interest", { jurisdiction, action, ...extra, ...pageData() });
}

/** The main site's jurisdiction vocabulary ("free_zone", not this page's internal "freezone"). */
export function jurisdictionLabel(j: string | undefined): string | undefined {
  return j === "freezone" ? "free_zone" : j;
}

/** FAQ question opened. Truncated to 80 characters, as on the main site. */
export function trackFaqExpand(question: string): void {
  pushEvent("faq_expand", { faq_question: (question || "").slice(0, 80), ...pageData() });
}

export function trackConsultationCta(ctaLocation: string): void {
  pushEvent("consultation_cta_click", { cta_location: ctaLocation, ...pageData() });
}

/* ─── Engagement ─── */

export function trackContentView(path: string): void {
  pushEvent("content_view", { ...pageData(path) });
}

export function trackEngagedTime(seconds: number, threshold = seconds): void {
  pushEvent("engaged_time_on_topic", { seconds, threshold, ...pageData() });
}

export function trackScrollDepth(pct: number): void {
  pushEvent("scroll_depth", { percent: pct, ...pageData() });
}

export function trackFormStart(formId: string): void {
  pushEvent("form_start", { form_data: { form_id: formId }, ...pageData() });
}

export function trackFormAbandon(formId: string): void {
  pushEvent("form_abandon", { form_data: { form_id: formId }, ...pageData() });
}

/* ─── Contact and outbound clicks ─── */

export function trackPhoneClick(phoneNumber: string): void {
  pushEvent("phone_click", { phone_number: phoneNumber, ...pageData() });
}

export function trackWhatsappClick(): void {
  pushEvent("whatsapp_click", { ...pageData() });
}

export function trackEmailClick(email: string): void {
  pushEvent("email_click", { email_address: email, ...pageData() });
}

export function trackMapClick(url = ""): void {
  pushEvent("map_click", { link_url: url || undefined, ...pageData() });
}

export function trackFileDownload(fileName: string, fileExtension: string): void {
  pushEvent("file_download", { file_name: fileName, file_extension: fileExtension, ...pageData() });
}

const SOCIAL_HOSTS = /(facebook|instagram|linkedin|twitter|x\.com|youtube|t\.me|tiktok)\./i;

export function trackOutboundClick(url: string, label = ""): void {
  let domain = "";
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    /* malformed href: leave domain empty */
  }
  pushEvent("outbound_click", {
    link_url: url,
    link_domain: domain || undefined,
    link_text: label || undefined,
    is_social: SOCIAL_HOSTS.test(url) || undefined,
    ...pageData(),
  });
}
