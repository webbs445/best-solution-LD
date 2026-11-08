import Image from "next/image";
import { CLAIMS, REVIEW_ROWS, SITE, type Review, firstName } from "@/content/site";
import { Marquee } from "@/components/ui/Marquee";
import { ArrowIcon, StarIcon } from "@/components/ui/Icons";
import styles from "./Reviews.module.css";

/*
  Reviews kept off the home page because their wording uses terms our Google Ads rules exclude here.
  Review text is never edited; /freezone still shows the full REVIEW_ROWS.
*/
const HOME_EXCLUDED = ["Chandra Mohan", "Javed Khan", "Tanwir Chowdhury", "Carlos Freyre"];
const HOME_REVIEWS = REVIEW_ROWS.flat().filter((r) => !HOME_EXCLUDED.includes(r.name));

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
      <blockquote lang={r.lang} data-review-quote>“{r.quote}”</blockquote>
      <figcaption>
        <Image className={styles.photo} src={r.photo} alt="" width={44} height={44} />
        <span>
          <b>{firstName(r.name)}</b>
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
          <h2 id="reviews-title">What our clients say</h2>
          <p className="lede">Google reviews from our clients.</p>
        </div>
        <div className={styles.score}>
          {/* The rating shows only once confirmed against the live Google profile (content/site CLAIMS). */}
          {CLAIMS.rating && (
            <>
              <b>{CLAIMS.rating}</b>
              <div>
                <Stars />
              </div>
            </>
          )}
          <a className={styles.all} href={SITE.googleReviews} target="_blank" rel="noopener">
            Read all Google reviews <ArrowIcon />
          </a>
        </div>
      </div>
      <Marquee speed={60} className={styles.rowWrap}>
        {(copy) => (
          <ul className={styles.row} aria-hidden={copy || undefined}>
            {HOME_REVIEWS.map((r) => (
              <li key={r.name}>
                <Card r={r} copy={copy} />
              </li>
            ))}
          </ul>
        )}
      </Marquee>
    </section>
  );
}
