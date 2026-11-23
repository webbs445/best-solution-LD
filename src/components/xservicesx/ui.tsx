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
  play: <path d="M7 4l13 8-13 8z" />,
  pause: <><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></>,
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

/** The illustrated Business Bay map with its pin: full card art, or the compact strip for phones. */
export function MapArt({ compact }: { compact?: boolean }) {
  return compact ? (
    <svg width="110" height="140" viewBox="0 0 110 140" aria-hidden="true">
      <path d="M-5 100 C 30 86, 60 112, 115 90" stroke="#CFE0EC" strokeWidth="14" fill="none" />
      <path d="M0 40 H110 M0 70 H110 M36 0 V140 M80 0 V140" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M55 64s10-11 10-19a10 10 0 0 0-20 0c0 8 10 19 10 19z" fill="#B9714B" />
      <circle cx="55" cy="45" r="4" fill="#FFFFFF" />
    </svg>
  ) : (
    <svg viewBox="0 0 280 270" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path d="M-10 196 C 60 170, 110 214, 170 184 S 260 150, 300 170" stroke="#CFE0EC" strokeWidth="22" fill="none" />
      <path d="M0 70 H280 M0 128 H280 M0 240 H280 M58 0 V270 M150 0 V270 M226 0 V270" stroke="#FFFFFF" strokeWidth="9" />
      <path d="M0 30 L280 110" stroke="#FFFFFF" strokeWidth="14" />
      <rect x="72" y="84" width="62" height="30" rx="5" fill="#E6DCD1" />
      <rect x="164" y="138" width="48" height="36" rx="5" fill="#E6DCD1" />
      <rect x="72" y="138" width="62" height="34" rx="5" fill="#E6DCD1" />
      <rect x="164" y="80" width="48" height="34" rx="5" fill="#E6DCD1" />
      <path d="M140 116s10-11 10-19a10 10 0 0 0-20 0c0 8 10 19 10 19z" fill="#B9714B" />
      <circle cx="140" cy="97" r="4" fill="#FFFFFF" />
    </svg>
  );
}
