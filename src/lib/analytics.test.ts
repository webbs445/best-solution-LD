import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* Minimal browser stand-ins: the helpers only touch window.dataLayer, location and document.cookie. */
let cookies: Record<string, string> = {};
let dataLayer: Record<string, unknown>[] = [];

function stubBrowser(search = "") {
  cookies = {};
  dataLayer = [];
  const location = { pathname: "/", search, protocol: "https:", hostname: "business.best-solution.ae" };
  vi.stubGlobal("location", location);
  vi.stubGlobal("window", {
    location,
    dataLayer,
    dispatchEvent: () => true,
  });
  vi.stubGlobal("document", {
    documentElement: { lang: "en", dir: "" },
    get cookie() {
      return Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
    },
    set cookie(raw: string) {
      const [pair] = raw.split(";");
      const i = pair.indexOf("=");
      cookies[pair.slice(0, i)] = pair.slice(i + 1);
    },
  });
}

// Fresh module state (the pending-conversion flag, visitor geo) for every test. The visitor's region is known (UAE,
// not an opt-in region) unless a test passes null, so conversion pushes run at once.
async function load(optInRegion: boolean | null = false) {
  vi.resetModules();
  const mods = { analytics: await import("./analytics"), consent: await import("./consent") };
  if (optInRegion !== null) mods.consent.applyRegionDefault(optInRegion);
  return mods;
}

beforeEach(() => stubBrowser());
afterEach(() => vi.unstubAllGlobals());

describe("toE164", () => {
  it("matches the main site's normaliser", async () => {
    const { toE164 } = (await load()).analytics;
    expect(toE164("0501234567")).toBe("+971501234567");
    expect(toE164("+971 50 123 4567")).toBe("+971501234567");
    expect(toE164("00447911123456")).toBe("+447911123456");
    expect(toE164("971501234567")).toBe("+971501234567");
    expect(toE164("501234567")).toBe("+971501234567");
    expect(toE164("")).toBe("");
  });
});

describe("genEventId", () => {
  it("uses the main site's evt_<time>_<random> format", async () => {
    const { genEventId } = (await load()).analytics;
    expect(genEventId()).toMatch(/^evt_\d+_[a-z0-9]{1,6}$/);
  });
});

describe("confirmed lead response", () => {
  it("only allows conversion events for an explicit created true response", async () => {
    const { isConfirmedLeadResponse, pushFormSubmit, pushGenerateLead } = (await load()).analytics;
    for (const response of [{ created: false }, {}, { created: "true" }, null]) {
      if (isConfirmedLeadResponse(response)) {
        pushFormSubmit({ formId: "LP Test" });
        pushGenerateLead({ formId: "LP Test" });
      }
    }
    expect(dataLayer).toHaveLength(0);

    if (isConfirmedLeadResponse({ created: true })) {
      pushFormSubmit({ formId: "LP Test" });
      pushGenerateLead({ formId: "LP Test" });
    }
    expect(dataLayer.filter((event) => event.event === "form_submit")).toHaveLength(1);
    expect(dataLayer.filter((event) => event.event === "generate_lead")).toHaveLength(1);
  });
});

describe("pushFormSubmit", () => {
  it("pushes the main site's nested form_submit shape", async () => {
    const { analytics, consent } = await load();
    const { pushFormSubmit } = analytics;
    // A UAE visitor with no choice: the regional default grants ad_user_data.
    consent.applyRegionDefault(false);
    pushFormSubmit({
      formId: "LP Cost Calculator",
      formType: "calculator",
      serviceInterest: "mainland",
      email: "  Sara@Example.COM ",
      phone: "050 123 4567",
      firstName: "Sara",
      lastName: "Al Mansoori",
      eventId: "evt_1_abc",
    });
    expect(dataLayer).toHaveLength(1);
    expect(dataLayer[0]).toMatchObject({
      event: "form_submit",
      event_id: "evt_1_abc",
      form_data: {
        form_id: "LP Cost Calculator",
        form_name: "LP Cost Calculator",
        form_type: "calculator",
        service_interest: "mainland",
        lead_type: "sales",
        value: 1,
        currency: "AED",
      },
      user_data: { email: "sara@example.com", phone: "+971501234567", first_name: "Sara", last_name: "Al Mansoori" },
      marketing_data: { gclid: "", fbclid: "", li_fat_id: "" },
      page_data: { page_location: "/", canonical_path: "/", content_group: "business_setup", language: "en" },
    });
  });

  it("marks every confirmed lead eligible for the Ads lead tag, whatever its form (the /freezone callback pop-up too)", async () => {
    const { pushFormSubmit } = (await load()).analytics;
    pushFormSubmit({ formId: "LP Callback Request", formType: "callback" });
    pushFormSubmit({ formId: "LP Future Landing Page Lead" });
    expect(dataLayer.filter((e) => e.event === "form_submit").map((e) => (e.form_data as Record<string, unknown>).lead_conversion_eligible)).toEqual([true, true]);
  });

  it("clears user_data and form_data before the next event", async () => {
    const { pushFormSubmit, trackScrollDepth } = (await load()).analytics;
    pushFormSubmit({ formId: "LP Callback Request", email: "a@b.co" });
    trackScrollDepth(50);
    expect(dataLayer[1]).toEqual({ user_data: null, form_data: null, event_id: null });
    expect(dataLayer[2]).toMatchObject({ event: "scroll_depth", percent: 50 });
    trackScrollDepth(75);
    expect(dataLayer).toHaveLength(4);
  });
});

describe("page paths", () => {
  it("reports /freezone as the canonical path of its sitelink routes", async () => {
    const { canonicalPath } = (await load()).analytics;
    expect(canonicalPath("/freezone/planner")).toBe("/freezone");
    expect(canonicalPath("/freezone/")).toBe("/freezone/");
    expect(canonicalPath("/freezone")).toBe("/freezone");
    expect(canonicalPath("/mainland")).toBe("/mainland");
  });

  it("trackEvent attaches page_data", async () => {
    const { trackEvent } = (await load()).analytics;
    trackEvent("zone_select", { zone: "RAKEZ" });
    expect(dataLayer[0]).toMatchObject({ event: "zone_select", zone: "RAKEZ", page_data: { canonical_path: "/" } });
  });
});

describe("calculator events", () => {
  it("nest under calculator_data, and calculator_complete carries an event_id", async () => {
    const { trackCalculatorStart, trackCalculatorStep, trackCalculatorComplete } = (await load()).analytics;
    trackCalculatorStart("LP Cost Calculator");
    trackCalculatorStep("LP Cost Calculator", "jurisdiction", "free_zone");
    trackCalculatorComplete({ calculatorId: "LP Cost Calculator", jurisdiction: "free_zone", visaCount: 2, estimatedCost: 24210 });
    expect(dataLayer.map((d) => d.event)).toEqual(["calculator_start", "calculator_step", "calculator_complete"]);
    expect(dataLayer[1].calculator_data).toEqual({ calculator_id: "LP Cost Calculator", step_name: "jurisdiction", step_value: "free_zone" });
    expect(dataLayer[2]).toMatchObject({
      event_id: expect.stringMatching(/^evt_/),
      calculator_data: { calculator_id: "LP Cost Calculator", jurisdiction: "free_zone", visa_count: 2, estimated_cost: 24210, currency: "AED" },
    });
  });
});

describe("consent and click ids", () => {
  it("maps the two choosable categories onto the seven Consent Mode signals", async () => {
    const { toConsentSignals } = (await load()).consent;
    expect(toConsentSignals({ analytics: true, marketing: false })).toEqual({
      security_storage: "granted",
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      functionality_storage: "denied",
      personalization_storage: "denied",
    });
  });

  it("round-trips the bs_consent cookie and pushes consent_update", async () => {
    const { setConsent, readConsent } = (await load()).consent;
    expect(readConsent()).toBeNull();
    setConsent({ analytics: true, marketing: true });
    expect(readConsent()).toEqual({ analytics: true, marketing: true });
    expect(dataLayer).toContainEqual({ event: "consent_update", consent: { analytics: true, marketing: true } });
  });

  it("Europe: stores click ids only after marketing consent", async () => {
    stubBrowser("?gclid=abc123&fbclid=fb9");
    const { analytics, consent } = await load(true);
    analytics.captureClickIds();
    expect(analytics.getClid()).toBe("");
    consent.setConsent({ analytics: true, marketing: true });
    analytics.captureClickIds();
    expect(analytics.getClid()).toBe("abc123");
    expect(analytics.getClickIds()).toEqual({ gclid: "abc123", fbclid: "fb9", li_fat_id: "" });
  });

  it("UAE with no choice: stores click ids at once; after Reject all, not", async () => {
    stubBrowser("?gclid=abc123");
    const a = await load(false);
    a.analytics.captureClickIds();
    expect(a.analytics.getClid()).toBe("abc123");
    stubBrowser("?gclid=abc123");
    const b = await load(false);
    b.consent.saveConsent(b.consent.ALL_DENIED);
    b.analytics.captureClickIds();
    expect(b.analytics.getClid()).toBe("");
  });
});

describe("user_data follows ad_user_data", () => {
  const lead = { formId: "LP Callback", email: "test-audit@xerebo.com", phone: "050 000 0000" };
  const sent = () => ({ fs: dataLayer.find((e) => e.event === "form_submit"), gl: dataLayer.find((e) => e.event === "generate_lead") });
  const pushBoth = (a: Awaited<ReturnType<typeof load>>["analytics"]) => {
    a.pushFormSubmit(lead);
    a.pushGenerateLead(lead);
  };

  it("UAE, no choice: email and E.164 phone on form_submit and generate_lead", async () => {
    const { analytics, consent } = await load();
    consent.applyRegionDefault(false);
    pushBoth(analytics);
    expect(sent().fs?.user_data).toMatchObject({ email: "test-audit@xerebo.com", phone: "+971500000000" });
    expect(sent().gl?.user_data).toMatchObject({ email: "test-audit@xerebo.com", phone_number: "+971500000000" });
  });

  it("after Accept all (any region): sent", async () => {
    const { analytics, consent } = await load();
    consent.applyRegionDefault(true);
    consent.saveConsent(consent.ALL_GRANTED);
    pushBoth(analytics);
    expect(sent().fs?.user_data).toMatchObject({ email: "test-audit@xerebo.com" });
  });

  it("after Reject all, even outside Europe: no user_data at all", async () => {
    const { analytics, consent } = await load();
    consent.applyRegionDefault(false);
    consent.saveConsent(consent.ALL_DENIED);
    pushBoth(analytics);
    expect(sent().fs).not.toHaveProperty("user_data");
    expect(sent().gl).not.toHaveProperty("user_data");
    expect(JSON.stringify(dataLayer)).not.toContain("test-audit@xerebo.com");
  });

  it("Europe with no choice: no user_data", async () => {
    const { analytics } = await load(true);
    pushBoth(analytics);
    expect(sent().fs).toBeDefined();
    expect(JSON.stringify(dataLayer)).not.toContain("test-audit@xerebo.com");
  });

  it("region not known yet: waits for /api/geo, then follows it (UAE: user_data sent)", async () => {
    vi.useFakeTimers();
    try {
      const { analytics, consent } = await load(null);
      pushBoth(analytics);
      expect(sent().fs).toBeUndefined();
      vi.advanceTimersByTime(400);
      consent.applyRegionDefault(false);
      expect(dataLayer.filter((e) => e.event).map((e) => e.event)).toEqual(["form_submit", "generate_lead"]);
      expect(sent().fs?.user_data).toMatchObject({ email: "test-audit@xerebo.com" });
      vi.advanceTimersByTime(2000);
      expect(dataLayer.filter((e) => e.event === "form_submit")).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("region still unknown after 1 second: pushes without user_data", async () => {
    vi.useFakeTimers();
    try {
      const { analytics } = await load(null);
      pushBoth(analytics);
      vi.advanceTimersByTime(999);
      expect(sent().fs).toBeUndefined();
      vi.advanceTimersByTime(1);
      expect(sent().fs).toBeDefined();
      expect(sent().gl).toBeDefined();
      expect(JSON.stringify(dataLayer)).not.toContain("test-audit@xerebo.com");
    } finally {
      vi.useRealTimers();
    }
  });

  it("a saved choice needs no wait", async () => {
    const { analytics, consent } = await load(null);
    consent.saveConsent(consent.ALL_GRANTED);
    pushBoth(analytics);
    expect(sent().fs?.user_data).toMatchObject({ email: "test-audit@xerebo.com" });
  });
});

describe("effectiveConsent", () => {
  it("is the saved choice, else granted outside the opt-in regions, else denied", async () => {
    const { consent } = await load(null);
    expect(consent.effectiveConsent()).toEqual(consent.ALL_DENIED);
    consent.applyRegionDefault(true);
    expect(consent.effectiveConsent()).toEqual(consent.ALL_DENIED);
    consent.applyRegionDefault(false);
    expect(consent.effectiveConsent()).toEqual(consent.ALL_GRANTED);
    consent.saveConsent(consent.ALL_DENIED);
    expect(consent.effectiveConsent()).toEqual(consent.ALL_DENIED);
  });
});

describe("lead standard events", () => {
  it("pushes generate_lead with value, AED, E.164 phone and lowercase email, then clears the PII", async () => {
    const { analytics, consent } = await load();
    consent.applyRegionDefault(false);
    analytics.pushGenerateLead({ formId: "LP Callback", service: "free_zone", email: "  Layla@Example.COM ", phone: "050 123 4567" });
    analytics.trackContentView("/");
    const lead = dataLayer.find((e) => e.event === "generate_lead") as Record<string, unknown>;
    expect(lead).toMatchObject({
      form_id: "LP Callback",
      lead_type: "form",
      page: "/",
      service: "free_zone",
      value: 100,
      currency: "AED",
      user_data: { email: "layla@example.com", phone_number: "+971501234567" },
    });
    const i = dataLayer.indexOf(lead);
    expect(dataLayer[i + 1]).toEqual({ user_data: null, form_data: null, event_id: null });
  });

  it("sends calculator_step once per step and calculator_result_view once per page view", async () => {
    const { analytics } = await load();
    analytics.trackCalculatorStep("LP Cost Calculator", "jurisdiction", "mainland");
    analytics.trackCalculatorStep("LP Cost Calculator", "jurisdiction", "free_zone");
    analytics.trackCalculatorStep("LP Cost Calculator", "residency", "1");
    analytics.trackCalculatorResultView("LP Cost Calculator", { estimatedCost: 24000 });
    analytics.trackCalculatorResultView("LP Cost Calculator", { estimatedCost: 27000 });
    expect(dataLayer.filter((e) => e.event === "calculator_step")).toHaveLength(2);
    expect(dataLayer.filter((e) => e.event === "calculator_result_view")).toHaveLength(1);
  });

  it("adds cta_location and the agreed values to contact clicks", async () => {
    const { analytics } = await load();
    analytics.trackWhatsappClick("Calculator Result");
    analytics.trackPhoneClick("+97145531546", "Header");
    analytics.trackEmailClick("connect@best-solution.ae", "Footer");
    expect(dataLayer.find((e) => e.event === "whatsapp_click")).toMatchObject({ cta_location: "Calculator Result", value: 70, currency: "AED" });
    expect(dataLayer.find((e) => e.event === "phone_click")).toMatchObject({ cta_location: "Header", value: 70 });
    expect(dataLayer.find((e) => e.event === "email_click")).toMatchObject({ cta_location: "Footer", value: 40 });
  });
});

describe("form drop-off events", () => {
  it("form_abandon carries where the visitor stopped, and form_error the fields that blocked a send", async () => {
    const { analytics } = await load();
    analytics.trackFormAbandon("LP Cost Calculator", { last_field: "email_id", fields_filled: "lead_name,mobile_no", error_fields: "mobile_no", submit_attempts: 1, seconds_in_form: 42, exit: "page_leave" });
    analytics.trackFormError("LP Cost Calculator", ["mobile_no", "email_id"], 2);
    expect(dataLayer.find((e) => e.event === "form_abandon")).toMatchObject({
      form_data: { form_id: "LP Cost Calculator", last_field: "email_id", fields_filled: "lead_name,mobile_no", error_fields: "mobile_no", submit_attempts: 1, seconds_in_form: 42, exit: "page_leave" },
    });
    expect(dataLayer.find((e) => e.event === "form_error")).toMatchObject({ form_data: { form_id: "LP Cost Calculator", error_fields: "mobile_no,email_id", attempt: 2 } });
  });

  it("pushFormSubmit tells the page the form succeeded", async () => {
    const seen: string[] = [];
    (window as unknown as { dispatchEvent: (e: Event) => boolean }).dispatchEvent = (e) => {
      seen.push(`${e.type}:${(e as CustomEvent).detail}`);
      return true;
    };
    const { analytics } = await load();
    analytics.pushFormSubmit({ formId: "LP Structuring Consultation", email: "test@example.com", phone: "+971500000000" });
    expect(seen).toContain("bs:form-success:LP Structuring Consultation");
  });
});

describe("planner events", () => {
  it("sends planner_start and planner_complete once per page view, with choices only", async () => {
    const { trackPlannerStart, trackPlannerComplete } = (await load()).analytics;
    trackPlannerStart("LP Free Zone Planner");
    trackPlannerStart("LP Free Zone Planner");
    trackPlannerComplete("LP Free Zone Planner", { zone: "IFZA (Dubai)", activities: "trading,services", priority: "range", team: 2 });
    trackPlannerComplete("LP Free Zone Planner", { zone: "Meydan" });
    expect(dataLayer.map((e) => e.event)).toEqual(["planner_start", "planner_complete"]);
    expect(dataLayer[0]).toMatchObject({ planner_data: { planner_id: "LP Free Zone Planner" }, page_data: { page_location: "/" } });
    expect(dataLayer[1]).toMatchObject({
      planner_data: { planner_id: "LP Free Zone Planner", zone: "IFZA (Dubai)", activities: "trading,services", priority: "range", team: 2 },
    });
  });
});
