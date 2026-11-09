import { ZONES } from "@/content/freezone";

/*
  "Free zones we compare for you": the same moving strip as before, with zone names as text in the tiles. No authority
  logos (Google Ads policy on implied affiliation).
*/
const ZONE_ITEMS = ZONES.map((z) => ({ key: z.id, b: z.short[1], small: z.emirate as string }));

export function FzPartners({
  title = "Free zones we compare for you",
  sub = "Across the UAE, matched to your activity.",
  items = ZONE_ITEMS,
}: { title?: string; sub?: string; items?: { key: string; b: string; small: string }[] } = {}) {
  const row = (copy: boolean) => (
    <ul className="logo-row" aria-hidden={copy || undefined}>
      {items.map((z) => (
        <li key={z.key}>
          <span className="logo-name">
            <b>{z.b}</b>
            <small>{z.small}</small>
          </span>
        </li>
      ))}
    </ul>
  );
  return (
    <section className="partners" aria-labelledby="partnersTitle">
      <div className="wrap partners-head">
        <h2 id="partnersTitle">{title}</h2>
        <p>{sub}</p>
      </div>
      <div className="marquee logo-marquee">
        <div className="marquee-track">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </section>
  );
}
