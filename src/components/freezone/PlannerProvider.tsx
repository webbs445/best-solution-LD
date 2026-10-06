"use client";

import { createContext, useCallback, useContext, useMemo, useReducer, useRef, type ReactNode } from "react";
import { ACT_LABEL, ZONE_BY_ID, type ActKey, type Priority } from "@/content/freezone";
import {
  MAX_ACTIVITIES,
  MAX_SHAREHOLDERS,
  maxResidents,
  plannerEstimate,
  topMatches,
  type Match,
  type PlannerInput,
} from "@/lib/freezone";
import type { Estimate } from "@/lib/pricing";
import { FZ_FORM_ID } from "@/lib/lead";
import { trackCalculatorComplete, trackCalculatorStart, trackCalculatorStep, trackJurisdictionInterest } from "@/lib/analytics";
import { prefersReducedMotion } from "@/lib/useReducedMotion";

/*
  The free zone planner's state, shared by the planner itself and the zone explorer
  ("Estimate My Cost" on a zone hands that zone to the planner).
*/

interface State extends PlannerInput {
  /** The visitor picked the zone themselves, so re-ranking must not replace it. */
  manual: boolean;
}

type Action =
  | { type: "toggleAct"; v: ActKey }
  | { type: "priority"; v: Priority }
  | { type: "count"; key: "res" | "sh" | "na"; delta: 1 | -1 }
  | { type: "zone"; id: string }
  | { type: "bank"; on: boolean }
  | { type: "res"; n: number };

const BOUNDS = { res: [0, 12], sh: [1, MAX_SHAREHOLDERS], na: [1, MAX_ACTIVITIES] } as const;

/* Residency can never exceed what the selected zone's packages cover. */
function clampRes(s: State): State {
  const mx = maxResidents(ZONE_BY_ID[s.zone]);
  return s.res > mx ? { ...s, res: mx } : s;
}

/* Choosing what the business does or what matters most re-ranks the zones and selects the best match. */
function reRank(s: State): State {
  return clampRes({ ...s, manual: false, zone: topMatches(s)[0].zone.id });
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "toggleAct": {
      const has = s.acts.includes(a.v);
      if (!has && s.acts.length >= 3) return s;
      return reRank({ ...s, acts: has ? s.acts.filter((x) => x !== a.v) : [...s.acts, a.v] });
    }
    case "priority":
      return reRank({ ...s, pri: a.v });
    case "count": {
      const [lo, hi] = BOUNDS[a.key];
      const next = Math.max(lo, Math.min(hi, s[a.key] + a.delta));
      return clampRes({ ...s, [a.key]: next });
    }
    case "zone":
      return ZONE_BY_ID[a.id] ? clampRes({ ...s, zone: a.id, manual: true }) : s;
    case "bank":
      return { ...s, bank: a.on };
    case "res":
      return clampRes({ ...s, res: Math.max(0, Math.round(a.n)) });
  }
}

function init(): State {
  const base: State = { acts: [], pri: "cost", res: 0, sh: 1, na: 1, bank: false, zone: "", manual: false };
  return { ...base, zone: topMatches(base)[0].zone.id };
}

interface PlannerContextValue {
  state: State;
  matches: Match[];
  estimate: Estimate;
  toggleAct: (v: ActKey) => void;
  setPriority: (v: Priority) => void;
  step: (key: "res" | "sh" | "na", delta: 1 | -1) => void;
  chooseZone: (id: string, source: "match" | "list" | "explorer") => void;
  setBank: (on: boolean) => void;
  /** Select a zone (and optionally the residency count) and scroll the planner into view. */
  goPlanner: (id: string, res?: number) => void;
  /** The visitor asked for the estimate in writing. Defaults to the planner's own figure; the zone popup passes its own. */
  complete: (input?: PlannerInput, est?: Estimate, source?: string) => void;
  /** Report a calculator_step (and calculator_start the first time) from outside the planner. */
  trackStep: (step: string, value: string) => void;
}

const PlannerContext = createContext<PlannerContextValue | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const matches = useMemo(() => topMatches(state), [state]);
  const estimate = useMemo(() => plannerEstimate(state), [state]);

  // calculator_start once per page view, on the first change from any entry point.
  const started = useRef(false);
  const track = useCallback((step: string, value: string) => {
    if (!started.current) {
      started.current = true;
      trackCalculatorStart(FZ_FORM_ID);
    }
    trackCalculatorStep(FZ_FORM_ID, step, value);
  }, []);

  const toggleAct = useCallback(
    (v: ActKey) => {
      track("activity", v);
      dispatch({ type: "toggleAct", v });
    },
    [track],
  );

  const setPriority = useCallback(
    (v: Priority) => {
      track("priority", v);
      dispatch({ type: "priority", v });
    },
    [track],
  );

  const step = useCallback(
    (key: "res" | "sh" | "na", delta: 1 | -1) => {
      track({ res: "residency", sh: "shareholders", na: "activities" }[key], delta > 0 ? "plus" : "minus");
      dispatch({ type: "count", key, delta });
    },
    [track],
  );

  const chooseZone = useCallback(
    (id: string, source: "match" | "list" | "explorer") => {
      track("zone", `${ZONE_BY_ID[id]?.name ?? id} (${source})`);
      dispatch({ type: "zone", id });
    },
    [track],
  );

  const setBank = useCallback(
    (on: boolean) => {
      track("bank", on ? "yes" : "no");
      dispatch({ type: "bank", on });
    },
    [track],
  );

  const goPlanner = useCallback(
    (id: string, res?: number) => {
      chooseZone(id, "explorer");
      if (res != null) dispatch({ type: "res", n: res });
      document.getElementById("planner")?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    },
    [chooseZone],
  );

  // calculator_complete once per distinct estimate, so repeat clicks on the same figure don't recount.
  const completed = useRef("");
  const complete = useCallback(
    (input?: PlannerInput, est?: Estimate, source = "fz_planner") => {
    const i = input ?? state;
    const e = est ?? estimate;
    const key = `${i.zone}|${e.total}`;
    if (completed.current === key) return;
    if (!completed.current) trackJurisdictionInterest("free_zone", "establish", { source });
    completed.current = key;
    trackCalculatorComplete({
      calculatorId: FZ_FORM_ID,
      jurisdiction: "free_zone",
      activity: i.acts.map((a) => ACT_LABEL[a]).join(", ") || undefined,
      visaCount: e.residents,
      estimatedCost: e.total,
    });
    },
    [state, estimate],
  );

  const value = useMemo(
    () => ({ state, matches, estimate, toggleAct, setPriority, step, chooseZone, setBank, goPlanner, complete, trackStep: track }),
    [state, matches, estimate, toggleAct, setPriority, step, chooseZone, setBank, goPlanner, complete, track],
  );

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner(): PlannerContextValue {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used inside <PlannerProvider>");
  return ctx;
}
