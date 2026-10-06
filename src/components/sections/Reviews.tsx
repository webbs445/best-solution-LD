import Image from "next/image";
import { REVIEW_ROWS, SITE, type Review } from "@/content/site";
import { Marquee } from "@/components/ui/Marquee";
import { ArrowIcon, StarIcon } from "@/components/ui/Icons";
import styles from "./Reviews.module.css";

function Stars({ label }: { label?: string }) {
  return (
    <div className={styles.stars} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} />
      ))}
    </div>
  );
}

function Card({ r, copy }: { r: Review; copy: boolean }) {
  return (
    <figure className={styles.card}>
      <div className={styles.top}>
        <Stars label={copy ? undefined : "5 out of 5 stars"} />
        <Image className={styles.logo} src={r.logo} alt={copy ? "" : r.company} width={92} height={30} />
      </div>
      <h3>{r.title}</h3>
      <blockquote lang={r.lang}>“{r.quote}”</blockquote>
      <figcaption>
        <Image className={styles.photo} src={r.photo} alt="" width={44} height={44} />
        <span>
          <b>{r.name}</b>
          {r.role}
        </span>
        <em>Google review</em>
      </figcaption>
    </figure>
  );
}

export function Reviews() {
  return (
    <section id="reviews" className={`block sec-light ${styles.testimonials}`} aria-labelledby="reviews-title">
      <div className={`wrap ${styles.head}`} data-reveal="">
        <div>
          <p className="section-kicker">Client reviews</p>
          <h2 id="reviews-title">Trusted by business owners from more than 80 countries</h2>
          <p className="lede">Google reviews from our clients.</p>
        </div>
        <div className={styles.score}>
          <b>4.8</b>
          <div>
            <Stars />
            <span>from more than 200 Google reviews</span>
          </div>
          <a className={styles.all} href={SITE.googleReviews} target="_blank" rel="noopener">
            Read all Google reviews <ArrowIcon />
          </a>
        </div>
      </div>
      {REVIEW_ROWS.map((row, i) => (
        <Marquee key={i} speed={i ? 60 : 70} reverse={i % 2 === 1} className={styles.rowWrap}>
          {(copy) => (
            <ul className={styles.row} aria-hidden={copy || undefined}>
              {row.map((r) => (
                <li key={r.name}>
                  <Card r={r} copy={copy} />
                </li>
              ))}
            </ul>
          )}
        </Marquee>
      ))}
    </section>
  );
}
