"use client";

import type { ReactNode } from "react";
import { goToPlan, setXs, useXs, xsTrack, type XsState } from "./store";
import { waLink, type TopicId } from "@/content/xservicesx";
import { BtnArrow, Icon } from "./ui";

/*
  Every plan button on the page: saves what it stands for (topic, advisor) in the shared state and opens the plan
  pop-up. Tracking uses the site-wide names (docs/services-events.md): data-cta-location sends
  consultation_cta_click {cta_location: id}; xs_topic_select / xs_advisor_select stay page-specific.
  variant: primary / dark (with the arrow square) or chip.
*/
export function XsCta({
  id,
  location,
  children,
  variant = "primary",
  set,
  source,
  className = "",
  arrow = variant !== "chip",
  watch = true,
}: {
  id: string;
  location: string;
  children: ReactNode;
  variant?: "primary" | "dark" | "chip";
  set?: Partial<XsState>;
  /** xs_topic_select source when this button sets a topic. */
  source?: "hero" | "s3" | "s5" | "s7" | "s9";
  className?: string;
  arrow?: boolean;
  /** false: the phone sticky bar ignores this button (data-cta), e.g. the header one, always on screen. */
  watch?: boolean;
}) {
  return (
    <button
      type="button"
      className={`xs-btn xs-${variant} ${className}`}
      data-xs-cta={id}
      data-cta-location={id}
      data-xs-location={location}
      data-cta={variant === "chip" || !watch ? undefined : ""}
      onClick={() => {
        if (set) setXs(set);
        if (set?.topic) xsTrack("topic_select", { topic: set.topic, source: source ?? "s3" });
        if (set?.advisor) xsTrack("advisor_select", { advisor: set.advisor });
        goToPlan();
      }}
    >
      {children}
      {arrow && <BtnArrow />}
    </button>
  );
}

/** WhatsApp link with the topic (only) in the message: the given one, else the one picked on the page. whatsapp_click {cta_location}. */
export function XsWhatsApp({ location, topic, className = "xs-btn xs-ghost", children, label }: { location: string; topic?: TopicId | null; className?: string; children?: ReactNode; label?: string }) {
  const picked = useXs().topic;
  return (
    <a className={className} href={waLink(topic === undefined ? picked : topic)} target="_blank" rel="noopener" aria-label={label} data-area={location}>
      {children ?? (
        <>
          <Icon name="whatsapp" className="xs-wa-ico" />
          Ask on WhatsApp
        </>
      )}
    </a>
  );
}

/** tel: link. phone_click {cta_location}. */
export function XsPhone({ location, href, className, children, label }: { location: string; href: string; className?: string; children: ReactNode; label?: string }) {
  return (
    <a className={className} href={href} aria-label={label} data-area={location}>
      {children}
    </a>
  );
}
