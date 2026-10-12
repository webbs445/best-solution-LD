"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useCalculator } from "./CalculatorProvider";
import { Scramble } from "@/components/ui/Scramble";
import { OPTION_Q, STEPS } from "@/content/calculator";
import { DATA, maxResidents, type Answers, type Jurisdiction } from "@/lib/pricing";
import { useReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Calculator.module.css";

/* Line icons per answer; package options share one. */
const ICONS: Record<string, ReactNode> = {
  mainland: <path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3" />,
  freezone: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  offshore: <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" />,
  undecided: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
    </>
  ),
  recommend: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />,
  flexi: <path d="M3 10h18M5 10v9M19 10v9M9 10V6h6v4" />,
  private: <path d="M6 21V4h12v17M3 21h18M14 12h.01" />,
  virtual: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  none: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </>
  ),
  package: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 10h8M8 14h5" />
    </>
  ),
};

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

const LOCK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

interface OptionProps {
  title: string;
  desc?: string;
  icon: string;
  index: number;
  pressed: boolean;
  onChoose: () => void;
}

function Option({ title, desc, icon, index, pressed, onChoose }: OptionProps) {
  return (
    <button type="button" className={styles.opt} aria-pressed={pressed} onClick={onChoose} style={{ "--i": index } as CSSProperties}>
      <span className={styles.ico}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {ICONS[icon] ?? ICONS.package}
        </svg>
      </span>
      <span className={styles.txt}>
        <b>{title}</b>
        {desc ? <small>{desc}</small> : null}
      </span>
      <span className={styles.mark}>{pressed ? CHECK : null}</span>
    </button>
  );
}

function ResidencyStepper({ count, setCount, max }: { count: number; setCount: (n: number) => void; max: number }) {
  const caption =
    count === 0
      ? "No residency required"
      : count === max
        ? `For more than ${max}, your consultant will quote directly`
        : count === 1
          ? "1 person"
          : `${count} people`;
  return (
    <div className={styles.stepper}>
      <div className={styles.stepperRow}>
        <button type="button" aria-label="Fewer people" disabled={count <= 0} onClick={() => setCount(Math.max(0, count - 1))}>
          −
        </button>
        <output aria-live="polite" key={count}>
          {count}
        </output>
        <button type="button" aria-label="More people" disabled={count >= max} onClick={() => setCount(Math.min(max, count + 1))}>
          +
        </button>
      </div>
      <div className={styles.stepperSide}>
        <p className={styles.stepperCap}>{caption}</p>
        <div className={styles.people} aria-hidden="true">
          {Array.from({ length: Math.min(count, 6) }, (_, i) => (
            <i key={i}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
              </svg>
            </i>
          ))}
        </div>
      </div>
    </div>
  );
}

export function QuizStep() {
  const { state, order, answer, goTo, setEmirate } = useCalculator();
  const { stepId, answers, emirate, navKey } = state;
  const step = STEPS[stepId];
  const idx = Math.max(0, order.indexOf(stepId));
  const reduce = useReducedMotion();
  const [pending, setPending] = useState<string | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const maxRes = maxResidents(answers);
  const [resCount, setResCount] = useState(() => Math.min(answers.residency ?? 0, maxRes));

  /* After a user-driven step change, move focus to the new question for keyboard and screen-reader users. */
  useEffect(() => {
    if (navKey > 0) titleRef.current?.focus({ preventScroll: true });
  }, [navKey]);

  const current = answers[stepId] === undefined ? undefined : String(answers[stepId]);

  const choose = (value: string) => {
    if (pending !== null) return;
    setPending(value);
    // A brief pause lets the tick appear before the next question slides in.
    window.setTimeout(() => answer(stepId, value as Answers[typeof stepId]), reduce ? 0 : 260);
  };

  const isPressed = (value: string) => (pending ?? current) === value;
  const jurisdiction = answers.jurisdiction as Jurisdiction | undefined;
  const title = step.list && jurisdiction ? OPTION_Q[jurisdiction] : step.q;

  let body: ReactNode = null;

  if (step.stepper) {
    body = <ResidencyStepper count={resCount} setCount={setResCount} max={maxRes} />;
  } else if (step.list && jurisdiction) {
    const all = DATA[jurisdiction];
    const emirates = all.reduce<string[]>((acc, o) => (o.emirate && !acc.includes(o.emirate) ? [...acc, o.emirate] : acc), []);
    const visible = all.filter((o) => emirate === "All" || o.emirate === emirate);
    body = (
      <>
        {emirates.length > 1 ? (
          <div className={styles.filters} role="group" aria-label="Filter by emirate">
            {["All", ...emirates].map((e) => (
              <button key={e} type="button" aria-pressed={e === emirate} onClick={() => setEmirate(e)}>
                {e}
              </button>
            ))}
          </div>
        ) : null}
        <div className={styles.opts}>
          <Option
            title="Not sure, recommend one for me"
            desc="Your consultant will advise"
            icon="recommend"
            index={0}
            pressed={isPressed("recommend")}
            onChoose={() => choose("recommend")}
          />
          {visible.map((o, i) => (
            <Option key={o.id} title={o.name} desc={o.desc} icon="package" index={i + 1} pressed={isPressed(o.id)} onChoose={() => choose(o.id)} />
          ))}
        </div>
      </>
    );
  } else if (step.options) {
    body = (
      <div className={styles.opts}>
        {step.options.map(([value, optTitle, desc], i) => (
          <Option key={value} title={optTitle} desc={desc} icon={value} index={i} pressed={isPressed(value)} onChoose={() => choose(value)} />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.step}>
      <div className={styles.q}>
        <h3 ref={titleRef} tabIndex={-1} className={styles.stepTitle}>
          {title}
        </h3>
        {step.hint ? <p className={styles.hint}>{step.hint}</p> : null}
      </div>
      {body}
      <div className={styles.stepNav}>
        <div className={styles.navBtns}>
          {idx > 0 ? (
            <button type="button" className={styles.ghost} onClick={() => goTo(order[idx - 1])}>
              Back
            </button>
          ) : null}
          {step.stepper ? (
            <button type="button" className={styles.cta} onClick={() => answer("residency", resCount)}>
              Continue
            </button>
          ) : null}
          {step.compare ? (
            <a className={styles.compare} href="#jurisdiction">
              Compare jurisdictions
            </a>
          ) : null}
        </div>
        <p className={styles.teaser}>
          <span className={styles.teaserLock}>{LOCK}</span>
          Your exact cost unlocks at the end
          <Scramble className={styles.teaserFig} />
        </p>
      </div>
    </div>
  );
}
