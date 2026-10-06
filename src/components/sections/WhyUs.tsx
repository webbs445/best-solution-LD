import Image from "next/image";
import { SITE, WHY } from "@/content/site";
import { ArrowIcon } from "@/components/ui/Icons";
import styles from "./WhyUs.module.css";

/* Photos from best-solution.ae. `shape` sets each tile's aspect ratio so the two columns interlock. */
const PHOTOS = [
  { src: "/images/why-event.webp", alt: "Best Solution consultants with clients at a Dubai business event", w: 760, h: 507, shape: "a" },
  { src: "/images/why-team.webp", alt: "Best Solution team at a client event", w: 760, h: 503, shape: "b" },
  { src: "/images/why-founder.webp", alt: "Founder Essa Al Harthi in a client meeting", w: 760, h: 507, shape: "c" },
  { src: "/images/why-consultation.webp", alt: "Client consultation at the Best Solution office", w: 760, h: 563, shape: "d" },
] as const;

const photo = (p: (typeof PHOTOS)[number]) => (
  <figure key={p.src} className={`${styles.img} ${styles[p.shape]}`}>
    <Image src={p.src} alt={p.alt} width={p.w} height={p.h} sizes="(max-width: 640px) 50vw, (max-width: 1020px) 310px, 270px" />
  </figure>
);

export function WhyUs() {
  return (
    <section className="block sec-warm" aria-labelledby="why-title">
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.collage} data-reveal="">
          <div className={styles.col}>
            {PHOTOS.slice(0, 2).map(photo)}
          </div>
          <div className={`${styles.col} ${styles.offset}`}>
            {PHOTOS.slice(2).map(photo)}
          </div>
          <div className={styles.quote}>
            <span>Best Solution</span>
            <strong>
              One consultant.
              <br />
              One clear path.
            </strong>
          </div>
        </div>
        <div className={styles.content} data-reveal="">
          <p className="section-kicker">Why Best Solution</p>
          <h2 id="why-title">One team for every stage of your business</h2>
          <p className="lede">
            Since {SITE.founded}, Best Solution has advised entrepreneurs and investors on establishing and operating businesses in
            the UAE.
          </p>
          <div className={styles.list}>
            {WHY.map((w, i) => (
              <article key={w.title}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{w.title}</h3>
                  <p>{w.body}</p>
                </div>
              </article>
            ))}
          </div>
          <a className={styles.link} href="#consultation">
            See what your consultation covers <ArrowIcon />
          </a>
        </div>
      </div>
    </section>
  );
}
