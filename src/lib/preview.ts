/*
  Vercel preview deployments (VERCEL_ENV "preview") must never reach real systems: lead routes answer with a mock
  lead and make no outbound calls (ERP, lead log sheet, email DNS check). Production and local development, where
  VERCEL_ENV is "production" or unset, are unchanged.
*/
export const isPreviewDeployment = (): boolean => process.env.VERCEL_ENV === "preview";

/** The mock lead id a preview returns instead of an ERP lead, e.g. "PREVIEW-1793883905999". */
export const previewLeadId = (): string => `PREVIEW-${Date.now()}`;
