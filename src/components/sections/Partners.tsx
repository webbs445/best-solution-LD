import Image from "next/image";
import { AUTHORITIES } from "@/content/site";
import { Marquee } from "@/components/ui/Marquee";
import styles from "./Partners.module.css";

export function Partners() {
  return (
    <section className={styles.partners} aria-labelledby="partners-title">
      <div className={`wrap ${styles.head}`} data-reveal="">
        <h2 id="partners-title">Free zones and jurisdictions we advise on</h2>
        <p>Mainland, free zone and offshore structures across all seven emirates.</p>
      </div>
      <Marquee speed={55}>
        {(copy) => (
          <ul className={styles.row} aria-hidden={copy || undefined}>
            {AUTHORITIES.map((a) => (
              <li key={a.file}>
                <Image src={a.src} alt={copy ? "" : a.name} width={150} height={150} />
              </li>
            ))}
          </ul>
        )}
      </Marquee>
    </section>
  );
}
