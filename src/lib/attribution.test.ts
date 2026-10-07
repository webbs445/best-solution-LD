import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { attributionFields, captureAttribution, getAttribution } from "./attribution";

function visit(search: string, cookie = "") {
  vi.stubGlobal("window", { location: { search } });
  vi.stubGlobal("document", { cookie });
}

describe("attribution", () => {
  let store: Record<string, string>;
  beforeEach(() => {
    store = {};
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => void (store[k] = v),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("keeps the first touch for the visit and never overwrites it", () => {
    visit("?gbraid=GB1&utm_source=google&utm_campaign=spring");
    captureAttribution();
    visit("?gclid=LATER&utm_source=facebook");
    captureAttribution();
    expect(getAttribution()).toMatchObject({ gclid: "", gbraid: "GB1", utm_source: "google", utm_campaign: "spring" });
  });

  it("stores nothing when the landing URL has no click IDs or UTMs", () => {
    visit("?ref=abc");
    captureAttribution();
    expect(store).toEqual({});
  });

  it("uses gclid, then gbraid, then wbraid for click_id", () => {
    visit("?wbraid=WB&gbraid=GB&gclid=GC");
    expect(attributionFields().click_id).toBe("GC");
    store = {};
    visit("?wbraid=WB&gbraid=GB");
    expect(attributionFields().click_id).toBe("GB");
  });

  it("falls back to the consented ad cookies when there is no Google click ID", () => {
    visit("?utm_source=meta", "fbclid=FB123");
    expect(attributionFields()).toMatchObject({ utm_source: "meta", click_id: "FB123" });
  });
});
