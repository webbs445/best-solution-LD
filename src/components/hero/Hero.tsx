import { DISCLAIMER, SITE } from "@/content/site";
import { CtaLink } from "@/components/ui/CtaLink";
import { ArrowIcon } from "@/components/ui/Icons";
import { HeroCard } from "./HeroCard";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <div className={styles.hero}>
      <div className={`wrap ${styles.inner}`}>
        <div className={styles.copy}>
          <p className={styles.kicker}>
            <i aria-hidden="true" />
            Private business advisors in Dubai
          </p>
          <h1 className={styles.title}>
            Get clear advice
            <br /> <span>on your UAE company</span>
            <br /> before you decide.
          </h1>
          <p className={styles.sub}>
            Talk to a dedicated advisor about mainland, free zone and offshore options. We explain what fits your plans
            in plain terms, so you can choose your next step.
          </p>
          <div className={`cta-row ${styles.ctaRow}`}>
            <CtaLink className="btn btn-primary" href="#calculator" location="LP Hero - Book a Consultation">
              Book a Consultation <ArrowIcon />
            </CtaLink>
            <CtaLink className="btn btn-outline" href={SITE.whatsapp} location="LP Hero - Speak to a Consultant">
              Speak to an Advisor
            </CtaLink>
          </div>
          <p className={styles.trustLine}>
            Business Bay, Dubai · {SITE.hours.short}
          </p>
          <p className={styles.legal} data-legal="">
            {DISCLAIMER}
          </p>
        </div>

        <div className={styles.cardSlot}>
          <HeroCard />
        </div>
      </div>
    </div>
  );
}
