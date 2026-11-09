import Image from "next/image";
import { ZONES } from "@/content/freezone";
import { PARTNERS, PARTNER_HEADING } from "@/content/site";
import { Marquee } from "@/components/ui/Marquee";
import styles from "./Partners.module.css";

/*
  Zones we advise on, as text tiles in the moving strip. Once a partner flag is set (content/site PARTNER_LOGOS), the
  strip lists only the confirmed partner zones, with their logos, under the partner heading.
*/
export function Partners() {
  const partner = PARTNERS.length > 0;
  // A short partner list is shown once, still and centred, instead of a scrolling strip that repeats it.
  const still = partner && PARTNERS.length < 6;
  const partnerItems = (copy: boolean) =>
    PARTNERS.map((p) => (
      <li key={p.zone}>
        {p.logo ? (
          <Image src={p.logo} alt={copy ? "" : `${p.name} logo`} width={150} height={150} unoptimized />
        ) : (
          <span className={styles.name}>
            <b>{p.name}</b>
          </span>
        )}
      </li>
    ));
  return (
    <section className={styles.partners} aria-labelledby="partners-title">
      <div className={`wrap ${styles.head}`} data-reveal="">
        <div>
          <h2 id="partners-title">{PARTNER_HEADING ?? "Free zones and jurisdictions we advise on"}</h2>
          <p className={styles.note}>We are a private consultancy, not a government entity.</p>
        </div>
        <p>Mainland, free zone and offshore structures across the UAE.</p>
      </div>
      {still ? (
        <div className="wrap">
          <ul className={`${styles.row} ${styles.static}`}>{partnerItems(false)}</ul>
        </div>
      ) : (
        <Marquee speed={55}>
          {(copy) => (
            <ul className={styles.row} aria-hidden={copy || undefined}>
              {partner
                ? partnerItems(copy)
                : ZONES.map((z) => (
                    <li key={z.id}>
                      <span className={styles.name}>
                        <b>{z.short[0]}</b>
                        <small>{z.emirate}</small>
                      </span>
                    </li>
                  ))}
            </ul>
          )}
        </Marquee>
      )}
    </section>
  );
}
