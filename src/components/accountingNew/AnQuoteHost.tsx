"use client";

import { lazy, Suspense, useState } from "react";
import { useQuote } from "./quoteStore";

// The pop-up's code (and its CSS) is fetched on the first open only, never on page load.
const AnQuoteDialog = lazy(() => import("./AnQuoteDialog"));

/** Renders nothing until the quote pop-up is first opened (always by a click), then keeps it mounted. */
export function AnQuoteHost() {
  const { open } = useQuote();
  const [ever, setEver] = useState(false);
  if (open && !ever) setEver(true);
  return ever ? (
    <Suspense fallback={null}>
      <AnQuoteDialog />
    </Suspense>
  ) : null;
}
