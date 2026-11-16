/*
  Notes on known test visits in the ad landing counts (/internal/ad-landings). Edit this list in code: each note marks
  its day on the dashboard and, while "Exclude test visits" is on (the default), its counts are taken off that day's
  totals for that page and click type. No choice is worked out from the rest (banner shown minus the three choices),
  so it is recorded here for reference only.
*/
import type { ClickParam } from "@/lib/adLandings";

export interface TestNote {
  date: string;
  note: string;
  path: string;
  param: ClickParam;
  counts: { land: number; shown: number; accept_all: number; reject_all: number; manage: number; none: number };
}

export const TEST_NOTES: TestNote[] = [
  {
    date: "2026-11-16",
    note: "QA test visits",
    path: "/services",
    param: "gbraid",
    counts: { land: 3, shown: 3, accept_all: 1, reject_all: 1, manage: 0, none: 1 },
  },
  {
    date: "2026-11-16",
    note: "QA test visit after device counting (390 px iPhone profile, accept)",
    path: "/services",
    param: "gbraid",
    counts: { land: 1, shown: 1, accept_all: 1, reject_all: 0, manage: 0, none: 0 },
  },
];
