"use client";

import type { ReactNode } from "react";
import { AC_WHATSAPP } from "@/content/accounting";
import { accTrack, type AnSection } from "./track";

/* A call-to-action link (to #quote unless told otherwise) that reports acc_cta_click with its section number. */
export function AnCta({ section, href = "#quote", className = "an-btn1", children }: { section: AnSection; href?: string; className?: string; children: ReactNode }) {
  return (
    <a className={className} href={href} data-cta-location={`AN S${section}`} onClick={() => accTrack("acc_cta_click", { section })}>
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
