"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { planOrder, type JurisdictionChoice, type PlanAnswers, type PlanStep } from "@/lib/setupPlan";
import {
  jurisdictionLabel,
  trackCalculatorComplete,
  trackCalculatorResultView,
  trackCalculatorStart,
  trackCalculatorStep,
  trackJurisdictionInterest,
} from "@/lib/analytics";
import { FORM_ID } from "@/lib/lead";

/*
  The home setup planner's state: one question at a time, then the shortlist. Advice only (Google Ads policy): no
  prices or residency. The same calculator events as before, without a cost.
*/

interface State {
  answers: PlanAnswers;
  stepId: PlanStep;
  view: "quiz" | "result";
  /** Emirate filter on the option list. */
  emirate: string;
  /** Bumps on every step change so the step re-mounts, animates in and takes focus. */
  navKey: number;
  /** Bumps every time the shortlist is shown, to replay its animation and fire analytics. */
  resultKey: number;
}

type Action =
  | { type: "answer"; id: PlanStep; value: PlanAnswers[PlanStep] }
  | { type: "goto"; id: PlanStep }
  | { type: "emirate"; emirate: string }
  | { type: "useJurisdiction"; jurisdiction: JurisdictionChoice };

const initialState: State = { answers: {}, stepId: "jurisdiction", view: "quiz", emirate: "All", navKey: 0, resultKey: 0 };

const nextUnanswered = (a: PlanAnswers): PlanStep | null => planOrder(a).find((id) => a[id] === undefined) ?? null;

/* Move to the first unanswered question, or to the shortlist once every question that applies is answered. */
function advance(state: State, answers: PlanAnswers, emirate: string): State {
  const next = nextUnanswered(answers);
  if (next) return { ...state, answers, emirate, stepId: next, view: "quiz", navKey: state.navKey + 1 };
  return { ...state, answers, emirate, view: "result", navKey: state.navKey + 1, resultKey: state.resultKey + 1 };
}

function withJurisdiction(state: State, j: JurisdictionChoice | undefined): { answers: PlanAnswers; emirate: string } {
  if (state.answers.jurisdiction === j) return { answers: { ...state.answers }, emirate: state.emirate };
  const answers = { ...state.answers, jurisdiction: j };
  delete answers.option;
  return { answers, emirate: "All" };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "answer": {
      if (action.id === "jurisdiction") {
        const { answers, emirate } = withJurisdiction(state, action.value as JurisdictionChoice);
        return advance(state, answers, emirate);
      }
      return advance(state, { ...state.answers, [action.id]: action.value }, state.emirate);
    }
    case "useJurisdiction": {
      const { answers, emirate } = withJurisdiction(state, action.jurisdiction);
      return advance(state, answers, emirate);
    }
    case "goto": {
      const order = planOrder(state.answers);
      const stepId = order.includes(action.id) ? action.id : order[order.length - 1];
      return { ...state, stepId, view: "quiz", navKey: state.navKey + 1 };
    }
    case "emirate":
      return { ...state, emirate: action.emirate };
  }
}

interface CalculatorContextValue {
  state: State;
  order: PlanStep[];
  done: boolean;
  answer: (id: PlanStep, value: PlanAnswers[PlanStep]) => void;
  goTo: (id: PlanStep) => void;
  setEmirate: (emirate: string) => void;
  /** Answers the jurisdiction question from elsewhere on the page and moves the planner on. */
  startWithJurisdiction: (j: JurisdictionChoice, source?: string) => void;
}

const CalculatorContext = createContext<CalculatorContextValue | null>(null);

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const order = useMemo(() => planOrder(state.answers), [state.answers]);
  const done = state.view === "result";

  // calculator_start once per page view, on the first answer from any entry point.
  const started = useRef(false);
  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    trackCalculatorStart(FORM_ID);
  }, []);

  const answer = useCallback(
    (id: PlanStep, value: PlanAnswers[PlanStep]) => {
      start();
      trackCalculatorStep(FORM_ID, id, String(id === "jurisdiction" ? jurisdictionLabel(String(value)) : value));
      dispatch({ type: "answer", id, value });
    },
    [start],
  );

  const goTo = useCallback((id: PlanStep) => dispatch({ type: "goto", id }), []);
  const setEmirate = useCallback((emirate: string) => dispatch({ type: "emirate", emirate }), []);

  // Entry from the hero structure check or the jurisdictions panel: an "establish" intent signal, then the
  // jurisdiction step answered on the visitor's behalf.
  const startWithJurisdiction = useCallback(
    (jurisdiction: JurisdictionChoice, source = "jurisdiction_panel") => {
      const j = jurisdictionLabel(jurisdiction) as string;
      trackJurisdictionInterest(j, "establish", { source });
      start();
      trackCalculatorStep(FORM_ID, "jurisdiction", j);
      dispatch({ type: "useJurisdiction", jurisdiction });
    },
    [start],
  );

  useEffect(() => {
    if (!done || state.resultKey === 0) return;
    // The shortlist is on screen: once per page view (deduplicated in lib/analytics).
    const jurisdiction = jurisdictionLabel(state.answers.jurisdiction);
    trackCalculatorResultView(FORM_ID, { jurisdiction });
    trackCalculatorComplete({ calculatorId: FORM_ID, jurisdiction });
    // Fire once per shown shortlist, not on unrelated re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.resultKey]);

  const value = useMemo(
    () => ({ state, order, done, answer, goTo, setEmirate, startWithJurisdiction }),
    [state, order, done, answer, goTo, setEmirate, startWithJurisdiction],
  );

  return <CalculatorContext.Provider value={value}>{children}</CalculatorContext.Provider>;
}

export function useCalculator(): CalculatorContextValue {
  const ctx = useContext(CalculatorContext);
  if (!ctx) throw new Error("useCalculator must be used inside <CalculatorProvider>");
  return ctx;
}
