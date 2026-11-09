import { describe, expect, it } from "vitest";
import { CLAIMS, DISCLAIMER, PARTNER_LOGOS, PARTNER_ZONES, REVIEWS, REVIEW_BANNED, partnerLogo } from "./site";

describe("REVIEWS", () => {
  it.each(REVIEWS.map((r) => [r.name, r]))("%s: no licence, visa, residency, price or timing wording", (_, r) => {
    expect(r.quote).not.toMatch(REVIEW_BANNED);
    if (r.title) expect(r.title).not.toMatch(REVIEW_BANNED);
  });
  it("first names only", () => {
    for (const r of REVIEWS) expect(r.name).not.toMatch(/\s/);
  });
  it("the banned-wording rule catches the excluded reviews", () => {
    expect("No hidden charges, no surprises. Exactly what was promised, delivered on time.").toMatch(REVIEW_BANNED);
    expect("Everything became structured, professional, and stress-free").not.toMatch(REVIEW_BANNED);
  });
});

describe("PARTNER_LOGOS", () => {
  const BASE =
    "Best Solution is a private business consultancy. We are not a government entity and do not act on behalf of any government authority. Official decisions are made only by the relevant UAE authorities.";
  it("a zone's logo renders only while its flag is true (and it has a logo file)", () => {
    for (const [k, p] of Object.entries(PARTNER_ZONES)) {
      expect(partnerLogo(p.zone)).toBe(PARTNER_LOGOS[k as keyof typeof PARTNER_LOGOS] && p.logo ? p.logo : null);
    }
  });
  it("the partner sentence shows only while at least one flag is true, and names exactly those zones", () => {
    const on = Object.entries(PARTNER_ZONES).filter(([k]) => PARTNER_LOGOS[k as keyof typeof PARTNER_LOGOS]);
    if (!on.length) {
      expect(CLAIMS.partners).toBeNull();
      expect(DISCLAIMER).toBe(BASE);
    } else {
      expect(DISCLAIMER.startsWith(BASE)).toBe(true);
      expect(CLAIMS.partners).toMatch(/^We are a registered channel partner of /);
      if (on.length <= 4) for (const [, p] of on) expect(CLAIMS.partners).toContain(p.name);
      else expect(CLAIMS.partners).toContain("the free zones whose logos appear on this page");
    }
  });
  it("has a flag for every partner zone and no government emblem", () => {
    expect(Object.keys(PARTNER_LOGOS).sort()).toEqual(Object.keys(PARTNER_ZONES).sort());
    for (const p of Object.values(PARTNER_ZONES)) expect(p.logo ?? "").not.toMatch(/det.|added.|sedd.|government/);
  });
});
