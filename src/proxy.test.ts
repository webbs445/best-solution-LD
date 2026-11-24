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
