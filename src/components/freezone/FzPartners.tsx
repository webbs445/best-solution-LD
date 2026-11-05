import Image from "next/image";
import { AUTHORITIES } from "@/content/site";

/* "Free zones we compare for you": the authority logo strip shared with the home page's assets. */
export function FzPartners({
  title = "Free zones we compare for you",
  sub = "Across all seven emirates, matched to your activity and budget.",
}: { title?: string; sub?: string } = {}) {
  const row = (copy: boolean) => (
    <ul className="logo-row" aria-hidden={copy || undefined}>
      {AUTHORITIES.map((a) => (
        <li key={a.file}>
          <Image src={a.src} alt={copy ? "" : a.name} width={120} height={120} />
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
