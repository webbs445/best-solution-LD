"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

/** Keeps the visit's first-touch click IDs and UTMs (sessionStorage only; see lib/attribution). On every page. */
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
