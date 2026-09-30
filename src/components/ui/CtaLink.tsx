"use client";

import type { AnchorHTMLAttributes } from "react";
import { track } from "@/lib/analytics";

/** An anchor that reports `cta_click` to the dataLayer, as the original `.js-cta` links did. */
export function CtaLink({ onClick, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const external = typeof props.href === "string" && /^https?:/.test(props.href);
  return (
    <a
      {...(external ? { target: "_blank", rel: "noopener" } : null)}
      {...props}
      onClick={(e) => {
        track("cta_click", { cta_text: e.currentTarget.textContent?.trim(), cta_target: props.href });
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
