import Image from "next/image";
import { CtaLink } from "@/components/ui/CtaLink";
import { ArrowIcon } from "@/components/ui/Icons";
import { Timeline } from "./Timeline";
import styles from "./Process.module.css";

export function Process() {
  return (
    <section className={`block ${styles.process}`} id="process" aria-labelledby="process-title">
      <div className={`wrap ${styles.grid}`}>
        <div data-reveal="">
          <p className="section-kicker">Three simple steps</p>
          <h2 id="process-title">How it works</h2>
          <p className={styles.intro}>
            From your first estimate to a confirmed plan, with the same consultant at every step.
          </p>
          <figure className={styles.photo}>
            <Image
              src="/images/process-meeting.webp"
              alt="A Best Solution consultant in a client meeting"
              width={720}
              height={632}
              sizes="(max-width: 1020px) 100vw, 480px"
            />
            <figcaption>
              <b>One consultant</b>
              <span>from estimate to decision</span>
            </figcaption>
          </figure>
        </div>
        <div data-reveal="">
          <Timeline />
          <div className={styles.cta}>
            <CtaLink className="btn btn-primary" href="#calculator">
              Start with Step 1 <ArrowIcon />
            </CtaLink>
            <span>No obligation.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
