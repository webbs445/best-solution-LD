"use client";

import { useSyncExternalStore } from "react";
import { officeOpen } from "@/lib/officeHours";

const noSubscribe = () => () => {};

/*
  "Advisors available": shown only Monday to Friday, 9:00 to 18:00 Dubai time (lib/officeHours), the same rule for
  every visitor (clock only: no user agent, location or cookie). Outside those hours it keeps its space, hidden.
  The server HTML renders it hidden; the browser shows it when the office is open.
*/
export function AdvisorsBadge({ className, label = "Advisors available" }: { className?: string; label?: string }) {
  const open = useSyncExternalStore(noSubscribe, () => officeOpen(new Date()), () => false);
  return (
    <span className={className} style={open ? undefined : { visibility: "hidden" }} aria-hidden={open ? undefined : true}>
      <i aria-hidden="true" />
      {label}
    </span>
  );
}
