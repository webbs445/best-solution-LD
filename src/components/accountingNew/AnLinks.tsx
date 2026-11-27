"use client";

import type { ReactNode } from "react";
import { AC_WHATSAPP } from "@/content/accounting";
import type { QuoteAnswers } from "./quoteLogic";
import { openQuote, type QuoteTopic } from "./quoteStore";
import { accTrack, type AnSection } from "./track";

/*
  A call-to-action link that reports acc_cta_click with its section. A link to #quote (the default) opens the quote
  pop-up instead, filled with prefill (only what that section's answers prove); before the page is interactive it
  still scrolls to the quote section.
*/
export function AnCta({ section, href = "#quote", className = "an-btn1", prefill, topic, note, children }: { section: AnSection; href?: string; className?: string; prefill?: Partial<QuoteAnswers>; topic?: QuoteTopic; note?: string; children: ReactNode }) {
  return (
    <a
      className={className}
      href={href}
      data-cta-location={`AN S${section}`}
      onClick={(e) => {
        accTrack("acc_cta_click", { section });
        if (href !== "#quote") return;
        e.preventDefault();
        openQuote(section, prefill, e.currentTarget, topic, note);
      }}
    >
      {children}
    </a>
  );
}

/* The site's WhatsApp number with the accounting message prefilled; reports acc_whatsapp_click with its section number. */
export function AnWhatsApp({ section, className = "an-btn2", children, href = AC_WHATSAPP.question }: { section: number; className?: string; children: ReactNode; href?: string }) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer" onClick={() => accTrack("acc_whatsapp_click", { section })}>
      {children}
    </a>
  );
}
