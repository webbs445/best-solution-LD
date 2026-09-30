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
            UAE Business Setup Advisory
          </p>
          <h1 className={styles.title}>
            Your UAE business setup,
            <br /> <span>costed and planned</span>
            <br /> before you begin
          </h1>
          <p className={styles.sub}>
            Receive a clear cost estimate in minutes, followed by a consultation with a dedicated advisor who
            recommends the right structure for your business.
          </p>
          <div className={`cta-row ${styles.ctaRow}`}>
            <CtaLink className="btn btn-primary" href="#calculator">
              Calculate Your Setup Cost <ArrowIcon />
            </CtaLink>
            <CtaLink className="btn btn-outline" href={SITE.whatsapp}>
              Speak to a Consultant
            </CtaLink>
          </div>
          <TrustRail />
        </div>

        <HeroCard />
      </div>
    </div>
  );
}
