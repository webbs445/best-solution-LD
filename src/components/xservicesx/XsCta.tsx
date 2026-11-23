"use client";

import type { ReactNode } from "react";
import { goToPlan, setXs, useXs, xsTrack, type XsState } from "./store";
import { waLink, type TopicId } from "@/content/xservicesx";
import { BtnArrow, Icon } from "./ui";

/*
  Every plan button on the page: saves what it stands for (topic, advisor) in the shared state, reports
  xs_cta_click (and xs_topic_select when it sets a topic), then scrolls to the one form and focuses its first empty
  field. variant: primary / dark (with the arrow square) or chip.
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
}) {
  return (
    <button
      type="button"
      className={`xs-btn xs-${variant} ${className}`}
      data-xs-cta={id}
      data-cta={variant === "chip" ? undefined : ""}
      onClick={() => {
        if (set) setXs(set);
        if (set?.topic) xsTrack("xs_topic_select", { topic: set.topic, source: source ?? "s3" });
        if (set?.advisor) xsTrack("xs_advisor_select", { advisor: set.advisor });
        xsTrack("xs_cta_click", { cta_id: id, location });
        goToPlan();
      }}
    >
      {children}
      {arrow && <BtnArrow />}
    </button>
  );
}

/** WhatsApp link with the topic (only) in the message: the given one, else the one picked on the page. xs_whatsapp_click {location}. */
export function XsWhatsApp({ location, topic, className = "xs-btn xs-ghost", children, label }: { location: string; topic?: TopicId | null; className?: string; children?: ReactNode; label?: string }) {
  const picked = useXs().topic;
  return (
    <a className={className} href={waLink(topic === undefined ? picked : topic)} target="_blank" rel="noopener" aria-label={label} onClick={() => xsTrack("xs_whatsapp_click", { location })}>
      {children ?? (
        <>
          <Icon name="whatsapp" className="xs-wa-ico" />
          Ask on WhatsApp
        </>
      )}
    </a>
  );
}

/** tel: link. xs_phone_click {location}. */
export function XsPhone({ location, href, className, children, label }: { location: string; href: string; className?: string; children: ReactNode; label?: string }) {
  return (
    <a className={className} href={href} aria-label={label} onClick={() => xsTrack("xs_phone_click", { location })}>
      {children}
    </a>
  );
}
