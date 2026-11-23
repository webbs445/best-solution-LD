import { afterEach, describe, expect, it, vi } from "vitest";
import { pushXsLead } from "./xsAnalytics";

afterEach(() => vi.unstubAllGlobals());

describe("/xservicesx conversion events", () => {
  it("pushes one form_submit and one generate_lead, with the page parameters and no name, number or email", () => {
    const dataLayer: Record<string, unknown>[] = [];
    vi.stubGlobal("window", { dataLayer, location: { pathname: "/xservicesx", href: "https://x/xservicesx" }, dispatchEvent: () => true });
    vi.stubGlobal("CustomEvent", class {});
    vi.stubGlobal("document", { title: "", referrer: "", cookie: "" });
    pushXsLead({ eventId: "evt_1_abc", topic: "holding", contactPref: "call" });
    const events = dataLayer.filter((d) => d.event);
    expect(events.map((e) => e.event)).toEqual(["form_submit", "generate_lead"]);
    expect(events[1]).toMatchObject({ event: "generate_lead", topic: "holding", contact_pref: "call", form_location: "s9", page: "/xservicesx", form_id: "LP Services Plan" });
    expect(events[0]).toMatchObject({ event_id: "evt_1_abc", form_data: { form_id: "LP Services Plan", lead_conversion_eligible: true } });
    const text = JSON.stringify(dataLayer);
    expect(text).not.toMatch(/@|\+971|\bTest\b/);
    expect(Object.values((events[0].user_data ?? {}) as object).filter(Boolean)).toEqual([]);
    expect(events[1].user_data).toBeUndefined();
  });
});
