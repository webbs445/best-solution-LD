import { describe, expect, it } from "vitest";
import { CONSENT_INIT_SCRIPT } from "./ConsentInit";

/*
  The consent bootstrap ships as a string. If it ever stops parsing (a stray backslash in the
  template literal is enough), the browser skips it entirely: no "denied" defaults, so every tag
  sets cookies before the visitor chooses. These checks keep that from reaching production.
*/
describe("consent bootstrap script", () => {
  it("is valid JavaScript", () => {
    expect(() => new Function(CONSENT_INIT_SCRIPT)).not.toThrow();
  });

  it("denies analytics and ads storage by default", () => {
    expect(CONSENT_INIT_SCRIPT).toMatch(/gtag\('consent', 'default'/);
    expect(CONSENT_INIT_SCRIPT).toMatch(/analytics_storage: 'denied'/);
    expect(CONSENT_INIT_SCRIPT).toMatch(/ad_storage: 'denied'/);
  });

  it("denies Clarity consent and holds its script until consent", () => {
    expect(CONSENT_INIT_SCRIPT).toContain("window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' })");
    expect(CONSENT_INIT_SCRIPT).toContain("window.__bsReleaseClarity");
  });
});
