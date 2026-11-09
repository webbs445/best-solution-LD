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
  it("every flag is off by default, so no logo renders and no partner sentence shows", () => {
    expect(Object.values(PARTNER_LOGOS).every((v) => v === false)).toBe(true);
    for (const p of Object.values(PARTNER_ZONES)) expect(partnerLogo(p.zone)).toBeNull();
    expect(CLAIMS.partners).toBeNull();
    expect(DISCLAIMER).toBe(
      "Best Solution is a private business consultancy. We are not a government entity and do not act on behalf of any government authority. Official decisions are made only by the relevant UAE authorities.",
    );
  });
  it("has a flag for every partner zone and no government emblem", () => {
    expect(Object.keys(PARTNER_LOGOS).sort()).toEqual(Object.keys(PARTNER_ZONES).sort());
    for (const p of Object.values(PARTNER_ZONES)) expect(p.logo ?? "").not.toMatch(/det\.|added\.|sedd\.|government/);
  });
});
