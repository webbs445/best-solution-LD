"use client";

import { useEffect, useRef, useState } from "react";
import { useCalculator } from "./CalculatorProvider";
import { OPTION_Q, STEPS } from "@/content/calculator";
import { DATA, formatAED, maxResidents, type Answers, type Jurisdiction } from "@/lib/pricing";
import { useReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Calculator.module.css";

interface OptionProps {
  title: string;
  desc?: string;
  price?: number;
  priceLabel: "from" | "add";
  pressed: boolean;
  onChoose: () => void;
}

function Option({ title, desc, price, priceLabel, pressed, onChoose }: OptionProps) {
  return (
    <button type="button" className={styles.opt} aria-pressed={pressed} onClick={onChoose}>
      <span className={styles.txt}>
        <b>{title}</b>
        {desc ? <small>{desc}</small> : null}
      </span>
      {price ? (
        <span className={styles.price}>
          <em>{priceLabel}</em>AED {formatAED(price)}
        </span>
      ) : null}
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
    <>
      <div className={styles.stepper}>
        <button type="button" aria-label="Fewer people" disabled={count <= 0} onClick={() => setCount(Math.max(0, count - 1))}>
          −
        </button>
        <output aria-live="polite">{count}</output>
        <button type="button" aria-label="More people" disabled={count >= max} onClick={() => setCount(Math.min(max, count + 1))}>
          +
        </button>
      </div>
      <p className={styles.stepperCap}>{caption}</p>
    </>
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
    // A brief pause lets the selected state register before the next question slides in.
    window.setTimeout(() => answer(stepId, value as Answers[typeof stepId]), reduce ? 0 : 180);
  };

  const isPressed = (value: string) => (pending ?? current) === value;
  const jurisdiction = answers.jurisdiction as Jurisdiction | undefined;
  const title = step.list && jurisdiction ? OPTION_Q[jurisdiction] : step.q;

  let body: React.ReactNode = null;

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
        <div className={`${styles.opts} ${styles.list}`}>
          <Option
            title="Not sure, recommend one for me"
            desc="Your consultant will advise"
            priceLabel="from"
            pressed={isPressed("recommend")}
            onChoose={() => choose("recommend")}
          />
          {visible.map((o) => (
            <Option
              key={o.id}
              title={o.name}
              desc={o.desc}
              price={o.price}
              priceLabel="from"
              pressed={isPressed(o.id)}
              onChoose={() => choose(o.id)}
            />
          ))}
        </div>
      </>
    );
  } else if (step.options) {
    body = (
      <div className={`${styles.opts} ${step.two ? styles.two : ""}`}>
        {step.options.map(([value, optTitle, desc, price]) => (
          <Option
            key={value}
            title={optTitle}
            desc={desc}
            price={price}
            priceLabel={stepId === "workspace" ? "from" : "add"}
            pressed={isPressed(value)}
            onChoose={() => choose(value)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.step}>
      <h3 ref={titleRef} tabIndex={-1} className={styles.stepTitle}>
        {title}
      </h3>
      {step.hint ? <p className={styles.hint}>{step.hint}</p> : null}
      {body}
      <div className={styles.stepNav}>
        {idx > 0 ? (
          <button type="button" className="text-btn" onClick={() => goTo(order[idx - 1])}>
            Back
          </button>
        ) : (
          <span />
        )}
        {step.compare ? (
          <a className="link" href="#jurisdiction">
            Compare jurisdictions
          </a>
        ) : null}
        {step.stepper ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => answer("residency", resCount)}>
            Continue
          </button>
        ) : null}
      </div>
    </div>
  );
}
