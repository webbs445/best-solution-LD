import type { Zone } from "@/content/freezone";

/*
  A free zone's short name on a white tile. Text only: no authority logos on this page (Google Ads policy on
  implied affiliation). `size` picks the tile style from freezone.css (zl-row, zl-xl, zl-tile, zl-sug, zl-cmp).
*/
export function ZoneLogo({ zone, size }: { zone: Zone; size: string; alt?: boolean }) {
  return (
    <span className={`zl zl-txt ${size}`} aria-hidden="true">
      <b>{zone.short[1]}</b>
    </span>
  );
}
