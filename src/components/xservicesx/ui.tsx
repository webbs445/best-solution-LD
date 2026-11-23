import type { ReactNode } from "react";
import type { IconName } from "@/content/xservicesx";

/* Line icons in the lucide style (24 grid, stroke 2), drawn inline so the page loads no icon library. */
const PATHS: Record<IconName, ReactNode> = {
  arrowRight: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  arrowLeftRight: <><path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" /></>,
  layers: <><path d="M12.8 2.2a2 2 0 0 0-1.6 0L2.6 6.1a1 1 0 0 0 0 1.8l8.6 3.9a2 2 0 0 0 1.6 0l8.6-3.9a1 1 0 0 0 0-1.8z" /><path d="m22 12.6-9.2 4.2a2 2 0 0 1-1.6 0L2 12.6" /><path d="m22 17.6-9.2 4.2a2 2 0 0 1-1.6 0L2 17.6" /></>,
  book: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>,
  percent: <><path d="M19 5 5 19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></>,
  help: <><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></>,
  check: <path d="m5 12 5 5 9-10" />,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />,
  whatsapp: <path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.6L3 21z" />,
  pin: <><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  send: <><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4z" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>,
  file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  hand: <><path d="M9 11V5a2 2 0 0 1 4 0v6" /><path d="M13 10V8a2 2 0 0 1 4 0v4a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 4 13.5V12a2 2 0 0 1 4 0" /></>,
  star: <path d="m12 2.5 2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.1l-5.9 3.2 1.3-6.5-4.9-4.5 6.6-.8z" />,
};

export function Icon({ name, size = 18, className, strokeWidth = 2 }: { name: IconName; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={name === "star" ? "currentColor" : "none"}
      stroke={name === "star" ? "none" : "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}

/** The arrow in its 32 px square, inside primary and dark buttons. */
export const BtnArrow = () => (
  <span className="xs-arrow">
    <Icon name="arrowRight" size={16} strokeWidth={2.4} />
  </span>
);

/** Five stars, read out as the rating (decorative when no label is given). */
export function Stars({ label, size = 16 }: { label?: string; size?: number }) {
  return (
    <span className="xs-stars" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {Array.from({ length: 5 }, (_, i) => (
        <Icon key={i} name="star" size={size} />
      ))}
    </span>
  );
}

/** The silhouette shown in place of an advisor photo until one exists. */
export const Silhouette = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 200 240" aria-hidden="true" focusable="false">
    <circle cx="100" cy="86" r="44" fill="rgba(255,255,255,0.09)" />
    <path d="M14 240c0-68 40-96 86-96s86 28 86 96z" fill="rgba(255,255,255,0.07)" />
  </svg>
);
