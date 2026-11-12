"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FZ_FORM_ID } from "@/lib/lead";
import { ConsultForm } from "@/components/consult/ConsultForm";
import { UnlockDialog } from "@/components/ui/UnlockDialog";

/*
  "Get a budget breakdown for your activity" on /freezone: the consultation form in the page's existing popup, with the
  topic preset to "Budget planning". Sent to /api/consult as the free zone form (FZ_FORM_ID), so form_start and
  form_submit work as for every other form. Advice on what to plan for only: no figures.
*/

/** Dispatch on window to open the budget popup. */
export const FZ_OPEN_BUDGET = "fz-open-budget";

export const BUDGET_CTA = "Get a budget breakdown for your activity";

/** The opener, a link to the consultation section if scripts fail. `location` becomes data-cta-location, reported by AnalyticsInit as consultation_cta_click. */
export function BudgetTrigger({ className, location, children = BUDGET_CTA }: { className: string; location: string; children?: ReactNode }) {
  return (
    <a
      className={className}
      href="#consultation"
      data-cta-location={location}
      onClick={(e) => {
        e.preventDefault();
        window.dispatchEvent(new Event(FZ_OPEN_BUDGET));
      }}
    >
      {children}
    </a>
  );
}

export function BudgetConsult() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(FZ_OPEN_BUDGET, show);
    return () => window.removeEventListener(FZ_OPEN_BUDGET, show);
  }, []);

  return (
    <UnlockDialog
      open={open}
      onClose={() => setOpen(false)}
      sent={false}
      intro="Tell us your activity and team size. An advisor sends you what to plan for in each zone you are considering."
      tags={["Budget"]}
    >
      <ConsultForm formId={FZ_FORM_ID} idPrefix="fzb" topic="Budget planning" />
    </UnlockDialog>
  );
}
