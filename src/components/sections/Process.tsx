import Image from "next/image";
import { CallbackLink } from "@/components/freezone/CallbackTrigger";
import { ArrowIcon } from "@/components/ui/Icons";
import { CLAIMS } from "@/content/site";
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
            From your first conversation to your decision, with the same advisor at every step.
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
              <b>{CLAIMS.oneAdvisor ? "One consultant" : "Your consultation"}</b>
              <span>{CLAIMS.oneAdvisor ? "from first call to decision" : "in person or by video call"}</span>
            </figcaption>
          </figure>
        </div>
        <div data-reveal="">
          <Timeline />
          <div className={styles.cta}>
            <CallbackLink className="btn btn-primary" location="LP Process - Book a Consultation">
              Book a Consultation <ArrowIcon />
            </CallbackLink>
            <span>No obligation.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
