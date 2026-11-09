import Image from "next/image";
import { CLAIMS, REVIEWS, REVIEWS_SCROLL, SITE, type SiteReview } from "@/content/site";
import { ReviewAvatar } from "@/components/ui/ReviewAvatar";
import { Marquee } from "@/components/ui/Marquee";
import { ArrowIcon, StarIcon } from "@/components/ui/Icons";
import styles from "./Reviews.module.css";

function Stars({ label }: { label?: string }) {
  return (
    <div
      className={styles.stars}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} />
      ))}
    </div>
  );
}

function Card({ r, copy }: { r: SiteReview; copy: boolean }) {
  return (
    <figure className={styles.card}>
      <div className={styles.top}>
        <Stars label={copy ? undefined : "5 out of 5 stars"} />
        {r.logo && (
          <Image className={styles.logo} src={r.logo} alt={copy ? "" : (r.company ?? "")} width={92} height={30} />
        )}
      </div>
      {r.title && <h3>{r.title}</h3>}
      <blockquote lang={r.lang} data-review-quote>
        “{r.quote}”
      </blockquote>
      <figcaption>
        <ReviewAvatar r={r} className={styles.photo} />
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
      {/* Each review once per loop; a still row while there are too few to fill it (content/site REVIEWS_SCROLL). */}
      {REVIEWS_SCROLL ? (
        <Marquee speed={60} className={styles.rowWrap}>
          {(copy) => (
            <ul className={styles.row} aria-hidden={copy || undefined}>
              {REVIEWS.map((r) => (
                <li key={r.name}>
                  <Card r={r} copy={copy} />
                </li>
              ))}
            </ul>
          )}
        </Marquee>
      ) : (
        <ul className={`${styles.row} ${styles.static} ${styles.rowWrap}`}>
          {REVIEWS.map((r) => (
            <li key={r.name}>
              <Card r={r} copy={false} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
