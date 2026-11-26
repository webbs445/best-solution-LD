import { BOOK_STATES, SOFTWARE, VOLUMES } from "@/content/accounting";

/*
  /accounting-new quote form choices (design S9). /api/accounting accepts exactly these values from the new page;
  the old /accounting page keeps sending its own lists (content/accounting), which are a subset.
*/
export const AN_NEEDS = [
  "Keep my books every month",
  "Catch up on past months",
  "File my VAT or Corporate Tax",
  "Statements for my bank or auditor",
  "My company is new",
  "Not sure yet",
] as const;
export const AN_VOLUMES = VOLUMES;
export const AN_SOFTWARE = [...SOFTWARE, "Not sure"];
export const AN_BOOK_STATES = [...BOOK_STATES, "Not sure"];
/** The new form's submit button, filed as the lead's button name. */
export const AN_BUTTON = "Get my quote today";
