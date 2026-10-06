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

// Fresh module state (the pending-conversion flag, visitor geo) for every test.
async function load() {
  vi.resetModules();
  return { analytics: await import("./analytics"), consent: await import("./consent") };
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

describe("pushFormSubmit", () => {
  it("pushes the main site's nested form_submit shape", async () => {
    const { pushFormSubmit } = (await load()).analytics;
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

  it("clears user_data and form_data before the next event", async () => {
    const { pushFormSubmit, trackScrollDepth } = (await load()).analytics;
    pushFormSubmit({ formId: "LP Callback Request", email: "a@b.co" });
    trackScrollDepth(50);
    expect(dataLayer[1]).toEqual({ user_data: null, form_data: null });
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
  it("maps categories onto the seven Consent Mode signals", async () => {
    const { toConsentSignals } = (await load()).consent;
    expect(toConsentSignals({ analytics: true, marketing: false, functional: true })).toEqual({
      security_storage: "granted",
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      functionality_storage: "granted",
      personalization_storage: "granted",
    });
  });

  it("round-trips the bs_consent cookie and pushes consent_update", async () => {
    const { setConsent, readConsent } = (await load()).consent;
    expect(readConsent()).toBeNull();
    setConsent({ analytics: true, marketing: true, functional: false });
    expect(readConsent()).toEqual({ analytics: true, marketing: true, functional: false });
    expect(dataLayer).toContainEqual({ event: "consent_update", consent: { analytics: true, marketing: true, functional: false } });
  });

  it("stores click ids only after marketing consent", async () => {
    stubBrowser("?gclid=abc123&fbclid=fb9");
    const { analytics, consent } = await load();
    analytics.captureClickIds();
    expect(analytics.getClid()).toBe("");
    consent.setConsent({ analytics: true, marketing: true, functional: true });
    analytics.captureClickIds();
    expect(analytics.getClid()).toBe("abc123");
    expect(analytics.getClickIds()).toEqual({ gclid: "abc123", fbclid: "fb9", li_fat_id: "" });
  });
});
