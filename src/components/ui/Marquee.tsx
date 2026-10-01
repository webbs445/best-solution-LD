import type { ReactNode } from "react";
import { MarqueeLoop } from "./MarqueeLoop";

/**
 * An endlessly scrolling row. `children(copy)` renders one set of items; when `copy` is true it
 * must put aria-hidden="true" on its root element. The set is repeated as often as needed to fill
 * the row on any screen width (see MarqueeLoop). The copies are dropped for reduced motion, where
 * the row becomes a plain horizontal scroller instead.
 *
 * `speed` is the time, in seconds, to scroll past one set.
 */
export function Marquee({
  children,
  speed = 50,
  reverse = false,
  className = "",
  label,
}: {
  children: (copy: boolean) => ReactNode;
  speed?: number;
  reverse?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <MarqueeLoop original={children(false)} copy={children(true)} speed={speed} reverse={reverse} className={className} label={label} />
  );
}
