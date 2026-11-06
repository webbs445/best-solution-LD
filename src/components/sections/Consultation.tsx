import type { CSSProperties, ReactNode } from "react";
import { ChecklistIcon, PinIcon, ReceiptIcon, StructureIcon } from "@/components/ui/Icons";
import styles from "./Consultation.module.css";

const CARDS: { icon: ReactNode; title: string; body: string }[] = [
  { icon: <StructureIcon />, title: "Where to base your business", body: "Mainland, free zone or offshore, compared against how and where you plan to trade." },
  { icon: <ReceiptIcon />, title: "Planning your budget", body: "What to plan for, so there are fewer surprises later." },
  { icon: <PinIcon />, title: "Office options", body: "Flexi desk, shared office or private office, and which suits how you work." },
  { icon: <ChecklistIcon />, title: "Your next steps", body: "A clear view of your options, so you can decide in your own time." },
];

export function Consultation() {
  return (
    <section className="block sec-light" id="consultation">
      <div className="wrap">
        <div data-reveal="">
          <p className="section-kicker">The consultation</p>
          <h2>What your consultation covers</h2>
          <p className="lede">
            One conversation with a dedicated advisor, so you can make an informed decision.
          </p>
        </div>
        <div className={styles.cards}>
          {CARDS.map((c, i) => (
            <div
              key={c.title}
              className={styles.cardWrap}
              data-reveal=""
              style={{ "--reveal-delay": `${i * 80}ms` } as CSSProperties}
            >
              <div className={styles.card}>
                <div className={styles.ico}>{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
