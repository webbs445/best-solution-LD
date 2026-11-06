"use client";

import { createContext, useCallback, useContext, useMemo, useReducer, useRef, type ReactNode } from "react";
import { ZONE_BY_ID, type ActKey, type Priority } from "@/content/freezone";
import { topMatches, type Match } from "@/lib/zoneSearch";
import { FZ_FORM_ID } from "@/lib/lead";
import { trackCalculatorStart, trackCalculatorStep } from "@/lib/analytics";
import { prefersReducedMotion } from "@/lib/useReducedMotion";

/*
  The free zone planner's state, shared by the planner and the zone explorer ("Ask an advisor about this zone"
  hands that zone to the planner). Advice only: activities, priority and team pick a shortlist; no prices.
*/

/** Fired when a zone elsewhere on the page hands itself to the planner (the planner then opens its advisor screen). */
export const FZ_GO_PLANNER = "fz:go-planner";

export const MAX_TEAM = 50;
export const MAX_SHAREHOLDERS = 12;

interface State {
  acts: ActKey[];
  pri: Priority;
  team: number;
  sh: number;
  zone: string;
}

type Action =
  | { type: "toggleAct"; v: ActKey }
  | { type: "priority"; v: Priority }
  | { type: "count"; key: "team" | "sh"; delta: 1 | -1 }
  | { type: "zone"; id: string };

const BOUNDS = { team: [1, MAX_TEAM], sh: [1, MAX_SHAREHOLDERS] } as const;

/* Choosing what the business does or what matters most re-ranks the zones and selects the best match. */
const reRank = (s: State): State => ({ ...s, zone: topMatches(s.acts, s.pri)[0].zone.id });

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
      return { ...s, [a.key]: Math.max(lo, Math.min(hi, s[a.key] + a.delta)) };
    }
    case "zone":
      return ZONE_BY_ID[a.id] ? { ...s, zone: a.id } : s;
  }
}

const init = (): State => reRank({ acts: [], pri: "range", team: 1, sh: 1, zone: "" });

interface PlannerContextValue {
  state: State;
  matches: Match[];
  toggleAct: (v: ActKey) => void;
  setPriority: (v: Priority) => void;
  step: (key: "team" | "sh", delta: 1 | -1) => void;
  chooseZone: (id: string, source: "match" | "list" | "explorer") => void;
  /** Select a zone and scroll the planner (advisor screen) into view. */
  goPlanner: (id: string) => void;
}

const PlannerContext = createContext<PlannerContextValue | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const matches = useMemo(() => topMatches(state.acts, state.pri), [state.acts, state.pri]);

  // calculator_start once per page view, on the first change from any entry point (same events as before).
  const started = useRef(false);
  const track = useCallback((step: string, value: string) => {
    if (!started.current) {
      started.current = true;
      trackCalculatorStart(FZ_FORM_ID);
    }
    trackCalculatorStep(FZ_FORM_ID, step, value);
  }, []);

  const toggleAct = useCallback((v: ActKey) => (track("activity", v), dispatch({ type: "toggleAct", v })), [track]);
  const setPriority = useCallback((v: Priority) => (track("priority", v), dispatch({ type: "priority", v })), [track]);
  const step = useCallback(
    (key: "team" | "sh", delta: 1 | -1) => (track(key === "team" ? "team" : "shareholders", delta > 0 ? "plus" : "minus"), dispatch({ type: "count", key, delta })),
    [track],
  );
  const chooseZone = useCallback(
    (id: string, source: "match" | "list" | "explorer") => (track("zone", `${ZONE_BY_ID[id]?.name ?? id} (${source})`), dispatch({ type: "zone", id })),
    [track],
  );
  const goPlanner = useCallback(
    (id: string) => {
      chooseZone(id, "explorer");
      window.dispatchEvent(new Event(FZ_GO_PLANNER));
      document.getElementById("planner")?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    },
    [chooseZone],
  );

  const value = useMemo(
    () => ({ state, matches, toggleAct, setPriority, step, chooseZone, goPlanner }),
    [state, matches, toggleAct, setPriority, step, chooseZone, goPlanner],
  );
  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner(): PlannerContextValue {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used inside <PlannerProvider>");
  return ctx;
}
