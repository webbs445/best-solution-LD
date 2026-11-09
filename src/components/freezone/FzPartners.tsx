import Image from "next/image";
import { ZONES } from "@/content/freezone";
import { PARTNERS, PARTNER_HEADING } from "@/content/site";

/*
  "Free zones we compare for you": the moving strip with zone names as text in the tiles. Once a partner flag is set
  (content/site PARTNER_LOGOS), the default strip lists only the confirmed partner zones, with their logos, under the
  partner heading. Pages that pass their own `items` (mainland, offshore) keep them.
*/
const ZONE_ITEMS = ZONES.map((z) => ({
  key: z.id,
  b: z.short[0],
  small: z.emirate as string,
  src: null as string | null,
}));
const PARTNER_ITEMS = PARTNERS.map((p) => ({
  key: p.zone,
  b: p.name,
  small: "",
  src: p.logo as string | null,
}));

export function FzPartners({
  title = "Free zones we compare for you",
  sub = "Across the UAE, matched to your activity.",
  items,
}: {
  title?: string;
  sub?: string;
  items?: { key: string; b: string; small: string; src?: string | null }[];
} = {}) {
  const partner = !items && PARTNER_HEADING !== null;
  const list = items ?? (partner ? PARTNER_ITEMS : ZONE_ITEMS);
  // A short partner list is shown once, still and centred, instead of a scrolling strip with gaps or repeats.
  const still = partner && list.length < 6;
  const row = (copy: boolean) => (
    <ul className={`logo-row${still ? " logo-static" : ""}`} aria-hidden={copy || undefined}>
      {list.map((z) => (
        <li key={z.key}>
          {z.src ? (
            <Image src={z.src} alt={copy ? "" : `${z.b} logo`} width={120} height={120} unoptimized />
          ) : (
            <span className="logo-name">
              <b>{z.b}</b>
              {z.small && <small>{z.small}</small>}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
  return (
    <section className="partners" aria-labelledby="partnersTitle">
      <div className="wrap partners-head">
        <h2 id="partnersTitle">{partner ? PARTNER_HEADING : title}</h2>
        <p>{sub}</p>
      </div>
      {still ? (
        <div className="wrap">{row(false)}</div>
      ) : (
        <div className="marquee logo-marquee">
          <div className="marquee-track">
            {row(false)}
            {row(true)}
          </div>
        </div>
      )}
    </section>
  );
}
