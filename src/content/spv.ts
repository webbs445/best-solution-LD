/* ============================================================
   /spv page content (foundations, SPVs, holding and offshore companies), from
   BestSolution_Structuring_LandingPage.html. Google Ads (UAE): no "start/setup/register/documents/
   fast/guarantee" style words in visitor-facing text; the footer disclaimer is the only place that
   mentions registries or government documents.
   ============================================================ */

import { SITE } from "./site";

export const SPV_WA_TEXT = "Hello, I would like advice on a foundation or holding structure.";
export const SPV_WA_HREF = `${SITE.whatsapp}?text=${encodeURIComponent(SPV_WA_TEXT)}`;

/* TODO(advisor): add "Will my ownership be private?" and "Can a foundation help plan inheritance?" once the advisor supplies the wording. */
export const SPV_FAQS: { q: string; a: string }[] = [
  {
    q: "What is the difference between a foundation and a holding company?",
    a: "A foundation holds assets for beneficiaries under rules you write, so it suits family wealth and succession. A holding company owns shares in other companies, so it suits business groups and investments. Many families use both: a foundation that owns a holding company.",
  },
  {
    q: "Do I need to live in the UAE?",
    a: "Not always. Several options are available to non-residents. What applies depends on the jurisdiction and your situation, and we confirm it with you at the consultation.",
  },
  {
    q: "Will a structure reduce my tax?",
    a: "A structure is a planning tool, not a tax shortcut. Tax depends on where you live, where your assets are and how each entity operates. UAE Corporate Tax and economic substance rules apply depending on that activity, and we work alongside your tax adviser where needed.",
  },
  {
    q: "Can a structure hold UAE property?",
    a: "Some entities can hold property in designated areas, subject to each area's rules. We check this for your specific property before recommending a structure.",
  },
  {
    q: "How much does a structure cost?",
    a: "It depends on the jurisdiction, the number of entities and the yearly upkeep. After the consultation you receive a written breakdown, before any work begins.",
  },
  {
    q: "Is my information confidential?",
    a: "Yes. Your details are seen only by the advisor handling your case and are never shared with third parties without your permission.",
  },
];

/* Consultation form choices. The API accepts only these values. */
export const SPV_GOALS = ["Family wealth and succession", "Property", "Business group", "A single deal or asset", "Not sure yet"] as const;
export const SPV_ASSETS = ["In the UAE", "Outside the UAE", "Both"] as const;
export const SPV_CONTACT = ["WhatsApp", "Phone call", "Email"] as const;
export type SpvGoal = (typeof SPV_GOALS)[number];
export type SpvAssets = (typeof SPV_ASSETS)[number];

/* Links and the fit finder pre-fill the form through this window event (detail: SpvPrefill). */
export const SPV_PREFILL_EVENT = "spv:prefill";
export interface SpvPrefill {
  goal?: SpvGoal;
  assets?: SpvAssets;
  /** The fit finder's suggestion, e.g. "Private foundation + Holding company". */
  fit?: string;
}
