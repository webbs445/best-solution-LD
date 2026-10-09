import { SITE } from "@/content/site";
import { CtaLink } from "@/components/ui/CtaLink";
import { ArrowIcon } from "@/components/ui/Icons";
import { HeroCard } from "./HeroCard";
import { TrustRail } from "./TrustRail";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <div className={styles.hero}>
      <div className={`wrap ${styles.inner}`}>
        <div className={styles.copy}>
          <p className={styles.kicker}>
            <i aria-hidden="true" />
            UAE Company Structure Advisory
          </p>
          <h1 className={styles.title}>
            Know what your
            <br /> <span>UAE company costs</span>
            <br /> before you begin.
          </h1>
          <p className={styles.sub}>
            Receive a clear cost estimate, followed by a consultation with a dedicated advisor who
            recommends the right structure for your business.
          </p>
          <div className={`cta-row ${styles.ctaRow}`}>
            <CtaLink className="btn btn-primary" href="#calculator" location="LP Hero — Calculate Cost">
              Calculate Your Company Cost <ArrowIcon />
            </CtaLink>
            <CtaLink className="btn btn-outline" href={SITE.whatsapp} location="LP Hero — Speak to a Consultant">
              Speak to a Consultant
            </CtaLink>
          </div>
          {/* Phones: one trust line instead of the stats rail, and the structure check moves below the calculator. */}
          <p className={styles.trustLine}>
            Advising since {SITE.founded} · Business Bay
          </p>
          <TrustRail />
        </div>

        <div className={styles.cardSlot}>
          <HeroCard />
        </div>
      </div>
    </div>
  );
}

/** The structure check on phones, placed after the calculator (hidden on larger screens). */
export function HeroCardAfterCalculator() {
  return (
    <div className={`wrap ${styles.cardAfter}`}>
      <HeroCard />
    </div>
  );
}
