"use client";

import type { ReactNode } from "react";
import { OPEN_CALLBACK } from "@/components/sections/Callback";

/*
  Opens the page's single callback popup (the CallbackButton in the footer) from anywhere on the page.
  `location` becomes data-cta-location, reported by AnalyticsInit as consultation_cta_click.
*/
export function CallbackTrigger({ className, location, children }: { className: string; location: string; children: ReactNode }) {
  return (
    <button
      type="button"
      className={className}
      aria-controls="cbModal"
      data-cta-location={location}
      onClick={() => window.dispatchEvent(new Event(OPEN_CALLBACK))}
    >
      {children}
    </button>
  );
}
