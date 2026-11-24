import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

describe("proxy: old /cost-calculator language URLs", () => {
  it.each(["ar", "fr", "ru", "zh", "en"])("301s ?lang=%s to the English page and keeps the click id", (lang) => {
    const res = proxy(new NextRequest(`https://business.best-solution.ae/cost-calculator?lang=${lang}&gclid=TEST123`));
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("https://business.best-solution.ae/cost-calculator?gclid=TEST123");
  });

  it("leaves the page alone without ?lang", () => {
    const res = proxy(new NextRequest("https://business.best-solution.ae/cost-calculator?gclid=TEST123"));
    expect(res.headers.get("location")).toBeNull();
  });
});

describe("proxy: /xservicesx moved to /services", () => {
  it.each(["/xservicesx", "/xservicesx/"])("301s %s to /services in one hop and keeps the query string", (path) => {
    const res = proxy(new NextRequest(`https://business.best-solution.ae${path}?utm_source=google&gclid=TEST123`));
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("https://business.best-solution.ae/services?utm_source=google&gclid=TEST123");
  });
});

describe("proxy: trailing slashes (Next's own redirect is off)", () => {
  it("308s a trailing slash to the URL without it, keeping the query string", () => {
    const res = proxy(new NextRequest("https://business.best-solution.ae/freezone/?gclid=TEST123"));
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://business.best-solution.ae/freezone?gclid=TEST123");
  });

  it("leaves the home page and normal paths alone", () => {
    for (const u of ["https://business.best-solution.ae/", "https://business.best-solution.ae/services?gclid=TEST123"])
      expect(proxy(new NextRequest(u)).headers.get("location")).toBeNull();
  });
});
