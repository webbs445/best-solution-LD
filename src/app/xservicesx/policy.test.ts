import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/*
  Landing page copy policy for /xservicesx: renders the whole page on the server (every section, both the phone and
  the desktop wording) and fails on a banned word, a [placeholder] bracket or an em dash in the text, attributes people
  can read, the WhatsApp message, the JSON-LD or the meta tags. Allowed: "Best Solution" and "free zone". Google review
  quotes are scanned too; the only exemptions are two phrases inside them, "stress-free" and "THE BEST SOLUTIONS"
  (word for word, may not be edited). A review that fails is dropped from XS_CONFIG, never edited.
*/
vi.mock("next/font/google", () => ({ Inter_Tight: () => ({ variable: "font-inter-tight" }) }));

const { default: Page, metadata } = await import("./page");

const BANNED =
  /\b(set[\s-]?up|startups?|start|starting|open|register|registration|licen[cs]e|visas?|permits?|approval|approved|documents?|formation|fast|faster|instant|quick|guarantee[sd]?|best|cheapest|lowest|launch|transparent|free|renew|renewal|official|trade name|incorporation)\b|100\s?%|no hidden fees|®|#1\b/gi;
const CASED = /\b(DED|PRO)\b/g;

/** Every string value in a JSON value (the JSON-LD text, without its syntax). */
const strings = (v: unknown): string[] =>
  typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === "object" ? Object.values(v).flatMap(strings) : [];

function pageText(): string {
  const html = renderToStaticMarkup(createElement(Page));
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => strings(JSON.parse(m[1])));
  const wa = [...html.matchAll(/wa\.me\/\d+\?text=([^"&]+)/g)].map((m) => decodeURIComponent(m[1]));
  const attrs = [...html.matchAll(/\s(?:alt|aria-label|placeholder|title)="([^"]*)"/g)].map((m) => m[1]);
  const body = html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ");
  const meta = [String((metadata.title as { absolute: string }).absolute), String(metadata.description)];
  return [body, ...attrs, ...wa, ...ld, ...meta]
    .join(" | ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

describe("/xservicesx copy policy", () => {
  const text = pageText();
  const allowed = text.replace(/stress-free/g, " ").replace(/best solution|best-solution.ae/gi, " ").replace(/free zones?/gi, " ");
  const around = (m: RegExpMatchArray) => `"${m[0]}" in ...${allowed.slice(Math.max(0, (m.index ?? 0) - 40), (m.index ?? 0) + 40)}...`;

  it("renders every section's copy", () => {
    for (const t of ["Make the right call on your UAE company", "Which of these is on your mind?", "Pick your situation.", "In one consultation, you'll know", "Don't take our word for it.", "Prefer to talk first?", "Ask us anything.", "Your plan is almost ready."])
      expect(text).toContain(t);
  });

  it("has no banned word", () => {
    expect([...allowed.matchAll(BANNED)].map(around)).toEqual([]);
    expect([...allowed.matchAll(CASED)].map(around)).toEqual([]);
  });

  it("has no [placeholder] bracket and no em dash", () => {
    expect([...text.matchAll(/[[\]]/g)].map(around)).toEqual([]);
    expect(text).not.toContain("—");
  });

  it("keeps the meta title within 60 characters and the description within 155", () => {
    expect(String((metadata.title as { absolute: string }).absolute).length).toBeLessThanOrEqual(60);
    expect(String(metadata.description).length).toBeLessThanOrEqual(155);
  });

  it("puts every question and answer in the server HTML and the FAQPage JSON-LD", async () => {
    const { FAQS } = await import("@/content/xservicesx");
    const html = renderToStaticMarkup(createElement(Page)).replace(/&#x27;|&#39;/g, "'");
    for (const f of FAQS) {
      expect(html).toContain(`<dt>${f.q}</dt>`);
      expect(html).toContain(`<dd>${f.a}</dd>`);
    }
    expect(html).toContain('"@type":"FAQPage"');
  });
});

describe("/xservicesx with the live config", () => {
  it("shows Trust with its office card and leaves S6 out while no advisors are set; QA fixtures are off", async () => {
    const { XS_CONFIG } = await import("@/content/xservicesx.config");
    expect(process.env.NEXT_PUBLIC_XS_FIXTURE).toBeUndefined();
    expect(XS_CONFIG.reviews).toHaveLength(14);
    expect(XS_CONFIG.reviews[0].firstNameInitial).toBe("Michael D.");
    const html = renderToStaticMarkup(createElement(Page));
    expect(html).toContain('id="reviews"');
    expect(html).toContain("Request a call back");
    expect(html).not.toContain("Real people. Not a call centre.");
    expect(html).toContain('id="xs-wall"'); // 14 reviews: the moving wall, 7 per row
  });
});
