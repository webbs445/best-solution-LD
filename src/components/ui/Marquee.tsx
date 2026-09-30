import type { CSSProperties, ReactNode } from "react";
import styles from "./Marquee.module.css";

/**
 * An endlessly scrolling row. `children` is called twice so the loop is seamless; on the
 * second call (`copy` is true) it must put aria-hidden="true" on its root element. That copy
 * is dropped for reduced motion, where the row becomes a plain horizontal scroller instead.
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
    <div
      className={`${styles.marquee} ${reverse ? styles.reverse : ""} ${className}`}
      style={{ "--speed": `${speed}s` } as CSSProperties}
      role={label ? "region" : undefined}
      aria-label={label}
    >
      <div className={styles.track}>
        {children(false)}
        {children(true)}
      </div>
    </div>
  );
}
