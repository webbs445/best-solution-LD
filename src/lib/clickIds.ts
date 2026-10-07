/*
  Google Ads click IDs (gclid, gbraid, wbraid) for lead attribution, without cookies.
  On the first page load of a visit they are read from the landing URL and kept in sessionStorage
  (this tab only, cleared when the tab closes), so a lead sent later in the visit still carries them.
  The first values found win; nothing is stored when the URL has none.
*/

const KEY = "bs_click_ids";

export interface ClickIds {
  gclid: string;
  gbraid: string;
  wbraid: string;
}

const EMPTY: ClickIds = { gclid: "", gbraid: "", wbraid: "" };

/** Read the click IDs from the current URL into sessionStorage, unless this visit already has them. */
export function captureClickIds(): void {
  try {
    if (sessionStorage.getItem(KEY)) return;
    const q = new URLSearchParams(window.location.search);
    const ids: ClickIds = { gclid: q.get("gclid") || "", gbraid: q.get("gbraid") || "", wbraid: q.get("wbraid") || "" };
    if (ids.gclid || ids.gbraid || ids.wbraid) sessionStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Storage blocked (private mode, disabled site data): the lead is sent without click IDs.
  }
}

/** The click IDs kept for this visit (empty strings when there are none). */
export function getClickIdsForVisit(): ClickIds {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) || "null") as Partial<ClickIds> | null;
    return v ? { gclid: v.gclid || "", gbraid: v.gbraid || "", wbraid: v.wbraid || "" } : EMPTY;
  } catch {
    return EMPTY;
  }
}
