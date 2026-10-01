import type { AnchorHTMLAttributes } from "react";

/**
 * A call-to-action link. `location` becomes `data-cta-location`, which the delegated tracker in
 * AnalyticsInit reports as `consultation_cta_click`, the same convention best-solution.ae uses.
 * Use a fixed English literal ("LP Hero — Calculate Cost"), never the visible label.
 */
export function CtaLink({ location, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { location: string }) {
  const external = typeof props.href === "string" && /^https?:/.test(props.href);
  return <a {...(external ? { target: "_blank", rel: "noopener" } : null)} data-cta-location={location} {...props} />;
}
