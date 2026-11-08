import { ZONES } from "@/content/freezone";

/*
  "Free zones we compare for you": the same moving strip as before, with zone names as text in the tiles. No authority
  logos (Google Ads policy on implied affiliation).
*/
export function FzPartners({
  title = "Free zones we compare for you",
  sub = "Across the UAE, matched to your activity.",
}: { title?: string; sub?: string } = {}) {
  const row = (copy: boolean) => (
    <ul className="logo-row" aria-hidden={copy || undefined}>
      {ZONES.map((z) => (
        <li key={z.id}>
          <span className="logo-name">
            <b>{z.short[1]}</b>
            <small>{z.emirate}</small>
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
