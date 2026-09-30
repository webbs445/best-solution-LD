/* GTM dataLayer events. Event names match the original page so existing GTM triggers keep working:
   calculator_step, calculator_complete, jurisdiction_view, cta_click, form_start, generate_lead. */

type DataLayerEvent = Record<string, unknown> & { event: string };

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
  }
}

export function track(event: string, data: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ...data, event });
}
