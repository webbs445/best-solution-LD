import Image from "next/image";
import { AUTHORITIES } from "@/content/site";

/* "Free zones we compare for you": the authority logo strip by default; pages can pass text tiles (`items`) instead. */
const LOGO_ITEMS = AUTHORITIES.map((a) => ({ key: a.file, b: a.name, small: "", src: a.src }));

export function FzPartners({
  title = "Free zones we compare for you",
  sub = "Across the UAE, matched to your activity.",
  items = LOGO_ITEMS,
}: { title?: string; sub?: string; items?: { key: string; b: string; small: string; src?: string }[] } = {}) {
  const row = (copy: boolean) => (
    <ul className="logo-row" aria-hidden={copy || undefined}>
      {items.map((z) => (
        <li key={z.key}>
          {z.src ? (
            <Image src={z.src} alt={copy ? "" : z.b} width={120} height={120} />
          ) : (
            <span className="logo-name">
              <b>{z.b}</b>
              <small>{z.small}</small>
            </span>
          )}
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
