import { describe, expect, it } from "vitest";
import { LEGAL_V2_DRAFT } from "./legalV2";

// The site's wording rules (Google Ads brief): no service words this site does not offer, no promises, no em dashes or ®.
const BANNED =
  /\b(set[- ]?up|startups?|start(s|ed|ing)?|open(s|ed|ing)?|register(s|ed|ing)?|registrations?|licen[cs]e[sd]?|licensing|visas?|permits?|approvals?|approved|documents?|formation|fast(er|est)?|instant(ly)?|quick(ly|er)?|guarantee[sd]?|cheapest|lowest|launch(es|ed|ing)?|transparent|renew(s|ed|al|als)?|PRO)\b|100 ?%|no hidden fees|\bbest\b(?![ -]solution)|\bfree\b(?! zone)|[—®]/gi;

describe("LEGAL_V2_DRAFT", () => {
  for (const [doc, { blocks, contactTitle, contactLine }] of Object.entries(LEGAL_V2_DRAFT)) {
    it(`${doc} has no banned words, em dashes or ®`, () => {
      const text = [...blocks.map(([, t]) => t), contactTitle, contactLine].join("\n");
      expect(text.match(BANNED) ?? []).toEqual([]);
    });
  }

  it("privacy names the contact email and the data rights", () => {
    const text = LEGAL_V2_DRAFT.privacy.blocks.map(([, t]) => t).join(" ");
    expect(text).toContain("connect@best-solution.ae");
    for (const right of ["copy", "correct", "delete", "withdraw"]) expect(text).toContain(right);
  });
});
