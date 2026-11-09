import Image from "next/image";
import type { Zone } from "@/content/freezone";
import { partnerLogo } from "@/content/site";

/*
  A free zone's short name on a white tile. The zone's logo shows instead only while its partner flag is set
  (content/site PARTNER_LOGOS: a signed agreement allowing logo use). `size` picks the tile style from freezone.css
  (zl-row, zl-xl, zl-tile, zl-sug, zl-cmp).
*/
export function ZoneLogo({ zone, size, alt = true }: { zone: Zone; size: string; alt?: boolean }) {
  const logo = partnerLogo(zone.id);
  if (logo) {
    return (
      <span className={`zl ${size}`}>
        <Image src={logo} alt={alt ? `${zone.name} logo` : ""} width={132} height={84} unoptimized loading="lazy" />
      </span>
    );
  }
  return (
    <span className={`zl zl-txt ${size}`} aria-hidden="true">
      <b>{zone.short[1]}</b>
    </span>
  );
}
