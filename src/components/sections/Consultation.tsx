import type { CSSProperties, ReactNode } from "react";
import { ChecklistIcon, ReceiptIcon, StructureIcon, TimerIcon } from "@/components/ui/Icons";
import styles from "./Consultation.module.css";

const CARDS: { icon: ReactNode; title: string; body: string }[] = [
  { icon: <StructureIcon />, title: "A recommended structure", body: "Mainland, free zone or offshore, selected according to how and where you trade." },
  { icon: <ReceiptIcon />, title: "A complete cost breakdown", body: "First-year and renewal costs, set out in full." },
  { icon: <ChecklistIcon />, title: "A document checklist", body: "The exact requirements for your case." },
  { icon: <TimerIcon />, title: "A realistic timeline", body: "Each stage explained, with clear responsibilities." },
];

export function Consultation() {
  return (
    <section className="block sec-light" id="consultation">
      <div className="wrap">
        <div data-reveal="">
          <p className="section-kicker">The consultation</p>
          <h2>What your complimentary consultation covers</h2>
          <p className="lede">
            One conversation with a dedicated advisor gives you everything required to make an informed decision.
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
