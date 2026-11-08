"use client";

import { useSyncExternalStore } from "react";
import { SITE } from "@/content/site";
import { officeOpen } from "@/lib/officeHours";

const noSubscribe = () => () => {};

/* "Advisors available" only during office hours; outside them, the hours themselves. Read in the browser (the server HTML shows "available"), so a static page stays correct. */
export function SvLive() {
  const open = useSyncExternalStore(noSubscribe, () => officeOpen(new Date()), () => true);
  return (
    <span className={`sv-live qc-live${open ? "" : " is-closed"}`}>
      <i />
      {open ? "Advisors available" : SITE.hours.short}
    </span>
  );
}
