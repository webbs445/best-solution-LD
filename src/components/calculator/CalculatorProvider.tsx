"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { estimate, stepOrder, type Answers, type Estimate, type JurisdictionChoice, type StepId } from "@/lib/pricing";
import { track } from "@/lib/analytics";

interface State {
  answers: Answers;
  stepId: StepId;
  view: "quiz" | "result";
  /** Emirate filter on the setup-option list. */
  emirate: string;
  /** Bumps on every step change so the step re-mounts, animates in and takes focus. */
  navKey: number;
  /** Bumps every time a result is shown, to replay its animation and fire analytics. */
  resultKey: number;
}

type Action =
  | { type: "answer"; id: StepId; value: Answers[StepId] }
  | { type: "goto"; id: StepId }
  | { type: "emirate"; emirate: string }
  | { type: "useJurisdiction"; jurisdiction: JurisdictionChoice };

const initialState: State = {
  answers: {},
  stepId: "profile",
  view: "quiz",
  emirate: "All",
  navKey: 0,
  resultKey: 0,
};

function nextUnanswered(a: Answers): StepId | null {
  return stepOrder(a).find((id) => a[id] === undefined) ?? null;
}

/* Move to the first unanswered question, or to the result once every question applies and is answered. */
function advance(state: State, answers: Answers, emirate: string): State {
  const next = nextUnanswered(answers);
  if (next) return { ...state, answers, emirate, stepId: next, view: "quiz", navKey: state.navKey + 1 };
  return { ...state, answers, emirate, view: "result", navKey: state.navKey + 1, resultKey: state.resultKey + 1 };
}

function withJurisdiction(state: State, j: Answers["jurisdiction"]): { answers: Answers; emirate: string } {
  if (state.answers.jurisdiction === j) return { answers: { ...state.answers }, emirate: state.emirate };
  const answers = { ...state.answers, jurisdiction: j };
  delete answers.option;
  return { answers, emirate: "All" };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "answer": {
      if (action.id === "jurisdiction") {
        const { answers, emirate } = withJurisdiction(state, action.value as Answers["jurisdiction"]);
        return advance(state, answers, emirate);
      }
      return advance(state, { ...state.answers, [action.id]: action.value }, state.emirate);
    }
    case "useJurisdiction": {
      const { answers, emirate } = withJurisdiction(state, action.jurisdiction);
      return advance(state, answers, emirate);
    }
    case "goto": {
      const order = stepOrder(state.answers);
      const stepId = order.includes(action.id) ? action.id : order[order.length - 1];
      return { ...state, stepId, view: "quiz", navKey: state.navKey + 1 };
    }
    case "emirate":
      return { ...state, emirate: action.emirate };
  }
}

interface CalculatorContextValue {
  state: State;
  order: StepId[];
  result: Estimate | null;
  answer: (id: StepId, value: Answers[StepId]) => void;
  goTo: (id: StepId) => void;
  setEmirate: (emirate: string) => void;
  /** Answers the jurisdiction question from elsewhere on the page and moves the calculator on. */
  startWithJurisdiction: (j: JurisdictionChoice, source?: string) => void;
}

const CalculatorContext = createContext<CalculatorContextValue | null>(null);

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const order = useMemo(() => stepOrder(state.answers), [state.answers]);
  const result = useMemo(() => (state.view === "result" ? estimate(state.answers) : null), [state.view, state.answers]);

  const answer = useCallback((id: StepId, value: Answers[StepId]) => {
    track("calculator_step", { step_id: id, answer: String(value) });
    dispatch({ type: "answer", id, value });
  }, []);

  const goTo = useCallback((id: StepId) => dispatch({ type: "goto", id }), []);
  const setEmirate = useCallback((emirate: string) => dispatch({ type: "emirate", emirate }), []);

  const startWithJurisdiction = useCallback((jurisdiction: JurisdictionChoice, source = "jurisdiction_panel") => {
    track("calculator_step", { step_id: "jurisdiction", answer: jurisdiction, source });
    dispatch({ type: "useJurisdiction", jurisdiction });
  }, []);

  useEffect(() => {
    if (!result || state.resultKey === 0) return;
    track("calculator_complete", {
      jurisdiction: state.answers.jurisdiction,
      setup: result.name,
      total: result.total,
      renewal: result.renewal,
    });
    // Fire once per shown result, not on unrelated re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.resultKey]);

  const value = useMemo(
    () => ({ state, order, result, answer, goTo, setEmirate, startWithJurisdiction }),
    [state, order, result, answer, goTo, setEmirate, startWithJurisdiction],
  );

  return <CalculatorContext.Provider value={value}>{children}</CalculatorContext.Provider>;
}

export function useCalculator(): CalculatorContextValue {
  const ctx = useContext(CalculatorContext);
  if (!ctx) throw new Error("useCalculator must be used inside <CalculatorProvider>");
  return ctx;
}
