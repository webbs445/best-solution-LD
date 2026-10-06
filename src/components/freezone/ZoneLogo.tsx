import Image from "next/image";
import type { Zone } from "@/content/freezone";

/*
  A free zone's logo on a white tile, or its monogram when we have no logo.
  `size` picks the tile style from freezone.css (zl-row, zl-xl, zl-tile, zl-sug, zl-cmp).
  Logos are small and some are SVG, so they're served as-is rather than through the image optimiser.
*/
export function ZoneLogo({ zone, size, alt = true }: { zone: Zone; size: string; alt?: boolean }) {
  if (!zone.logo) {
    return (
      <span className={`zl zl-txt ${size}`}>
        <b>{zone.short[1]}</b>
      </span>
    );
  }
  return (
    <span className={`zl ${size}`}>
      <Image src={zone.logo} alt={alt ? `${zone.name} logo` : ""} width={132} height={84} unoptimized loading="lazy" />
    </span>
  );
}
