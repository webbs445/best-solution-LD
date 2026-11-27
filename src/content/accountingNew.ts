import { BOOK_STATES, SOFTWARE, VOLUMES, type ServiceKey } from "@/content/accounting";

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
/**
 * Each step 1 answer filed as the service the old /accounting form sends (content/accounting SERVICE_NAMES),
 * so new leads sort the same way in the CRM. The answer itself is filed on its own "Need" line.
 */
export const AN_NEED_SERVICE: Record<(typeof AN_NEEDS)[number], ServiceKey> = {
  "Keep my books every month": "complete",
  "Catch up on past months": "bookkeeping",
  "File my VAT or Corporate Tax": "complete",
  "Statements for my bank or auditor": "statements",
  "My company is new": "bookkeeping",
  "Not sure yet": "not_sure",
};
export const AN_VOLUMES = VOLUMES;
export const AN_SOFTWARE = [...SOFTWARE, "Not sure"];
export const AN_BOOK_STATES = [...BOOK_STATES, "Not sure"];
/** The seven services in "What we do". Ticked ones are sent as "services" and filed on the lead's notes. */
export const AN_SERVICES = [
  "Bookkeeping",
  "Bank reconciliation",
  "Financial statements",
  "VAT returns",
  "Corporate Tax return",
  "Catch-up bookkeeping",
  "Audit-ready records",
];
/** The new form's submit button, filed as the lead's button name. */
export const AN_BUTTON = "Get my quote today";
