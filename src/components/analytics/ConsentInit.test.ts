import { describe, expect, it } from "vitest";
import { CONSENT_INIT_SCRIPT } from "./ConsentInit";

/*
  The consent bootstrap ships as a string. If it ever stops parsing (a stray backslash in the template literal is
  enough), the browser skips it entirely and no defaults are set. These checks run the script against a recording
  gtag and resolve consent the way Google does: a region default for the visitor's country wins over the general
  default; updates apply on top.
*/
function stateFor(country: string, cookie = "") {
  const calls: unknown[][] = [];
  const dataLayer = { push: (a: IArguments) => calls.push([...a]) };
  const w: Record<string, unknown> = { dataLayer };
  // window/document/Node stand-ins: the script only needs dataLayer, cookie and the Node prototype for its Clarity hold.
  function Node() {}
  new Function("window", "dataLayer", "document", "Node", "URL", CONSENT_INIT_SCRIPT)(w, dataLayer, { cookie }, Node, URL);
  const defaults = calls.filter((c) => c[0] === "consent" && c[1] === "default").map((c) => c[2] as Record<string, unknown>);
  const regional = defaults.find((d) => Array.isArray(d.region) && (d.region as string[]).includes(country));
  const general = defaults.find((d) => !d.region);
  const state: Record<string, unknown> = { ...general, ...regional };
  for (const c of calls.filter((c) => c[0] === "consent" && c[1] === "update")) Object.assign(state, c[2]);
  return { state, calls, defaults };
}
const KEYS = ["ad_storage", "analytics_storage", "ad_user_data", "ad_personalization"];
const all = (s: Record<string, unknown>, v: string) => KEYS.every((k) => s[k] === v);
const saved = (analytics: boolean, marketing: boolean) => `bs_consent=${encodeURIComponent(JSON.stringify({ v: 2, ts: 1, analytics, marketing }))}`;

describe("consent bootstrap script", () => {
  it("is valid JavaScript", () => {
    expect(() => new Function(CONSENT_INIT_SCRIPT)).not.toThrow();
  });

  it("UAE with no choice: the four signals granted; functionality and personalization denied, security granted", () => {
    const { state } = stateFor("AE");
    expect(all(state, "granted")).toBe(true);
    expect(state).toMatchObject({ functionality_storage: "denied", personalization_storage: "denied", security_storage: "granted", wait_for_update: 500 });
  });

  it("EEA, UK and Switzerland with no choice: all denied, by a region default (wait_for_update 500)", () => {
    for (const c of ["DE", "FR", "IE", "NO", "IS", "LI", "GB", "CH"]) expect(all(stateFor(c).state, "denied"), c).toBe(true);
    expect(stateFor("DE").state.wait_for_update).toBe(500);
  });

  it("a saved Accept all grants everywhere; a saved Reject all denies everywhere, also outside Europe", () => {
    expect(all(stateFor("DE", saved(true, true)).state, "granted")).toBe(true);
    expect(all(stateFor("AE", saved(false, false)).state, "denied")).toBe(true);
  });

  it("sets both defaults first, and keeps ads_data_redaction and url_passthrough", () => {
    const { calls, defaults } = stateFor("AE");
    expect(defaults).toHaveLength(2);
    expect(calls[0].slice(0, 2)).toEqual(["consent", "default"]);
    expect(calls[1].slice(0, 2)).toEqual(["consent", "default"]);
    expect(calls).toContainEqual(["set", "ads_data_redaction", true]);
    expect(calls).toContainEqual(["set", "url_passthrough", true]);
  });

  it("denies Clarity consent and holds its script until consent is known", () => {
    expect(CONSENT_INIT_SCRIPT).toContain("window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' })");
    expect(CONSENT_INIT_SCRIPT).toContain("window.__bsReleaseClarity");
  });
});
