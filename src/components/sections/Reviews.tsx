import Image from "next/image";
import { CLAIMS, REVIEW_ROWS, SITE, type Review } from "@/content/site";
import { ArrowIcon } from "@/components/ui/Icons";
import styles from "./Reviews.module.css";

/*
  Reviews kept off the home page because their wording uses terms our Google Ads rules exclude here.
  Review text is never edited. Each review is shown once, word for word, with no star rating or title of our own.
*/
const HOME_EXCLUDED = ["Chandra Mohan", "Javed Khan", "Tanwir Chowdhury", "Carlos Freyre"];
const HOME_REVIEWS = REVIEW_ROWS.flat().filter((r) => !HOME_EXCLUDED.includes(r.name));

function Card({ r }: { r: Review }) {
  return (
    <figure className={styles.card}>
      <div className={styles.top}>
        <Image className={styles.logo} src={r.logo} alt={r.company} width={92} height={30} />
      </div>
      <blockquote lang={r.lang} data-review-quote>
        “{r.quote}”
      </blockquote>
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
          <h2 id="reviews-title">What our clients say</h2>
          <p className="lede">Google reviews from our clients, word for word.</p>
        </div>
        <div className={styles.score}>
          {/* The rating shows only once confirmed against the live Google profile (content/site CLAIMS). */}
          {CLAIMS.rating && <b>{CLAIMS.rating}</b>}
          <a className={styles.all} href={SITE.googleReviews} target="_blank" rel="noopener">
            Read all Google reviews <ArrowIcon />
          </a>
        </div>
      </div>
      <ul className={`wrap ${styles.grid}`}>
        {HOME_REVIEWS.map((r) => (
          <li key={r.name}>
            <Card r={r} />
          </li>
        ))}
      </ul>
    </section>
  );
}
