import { RATES, type Jurisdiction, type StepId } from "@/lib/pricing";

/** [value, title, description?, price?] */
export type StepOption = [value: string, title: string, desc?: string, price?: number];

export interface StepDef {
  q?: string;
  hint?: string;
  options?: StepOption[];
  two?: boolean;
  compare?: boolean;
  list?: boolean;
  stepper?: boolean;
}

export const STEPS: Record<StepId, StepDef> = {
  profile: {
    q: "What describes you most closely?",
    two: true,
    options: [
      ["first_time", "First-time entrepreneur"],
      ["investor", "Foreign investor"],
      ["expanding", "Established business expanding to the UAE"],
      ["freelancer", "Freelancer"],
      ["ecommerce_biz", "E-commerce business"],
      ["relocating", "Relocating to the UAE"],
    ],
  },
  jurisdiction: {
    q: "Which jurisdiction are you considering?",
    compare: true,
    options: [
      ["mainland", "Mainland", "Trade directly across the UAE"],
      ["freezone", "Free zone", "International and business-to-business operations"],
      ["offshore", "Offshore", "Holding structures and asset protection"],
      ["undecided", "Not sure yet", "Your consultant will recommend one"],
    ],
  },
  option: { list: true },
  residency: {
    q: "How many people require UAE residency?",
    hint: "Include yourself, partners and employees.",
    stepper: true,
  },
  workspace: {
    q: "What type of workspace do you need?",
    options: [
      ["flexi", "Flexi-desk or shared desk", "", RATES.workspace.flexi],
      ["private", "Private office", "", RATES.workspace.private],
      ["virtual", "Virtual office", "", RATES.workspace.virtual],
      ["none", "No workspace needed"],
    ],
  },
  bank: {
    q: "Would you like help with a corporate bank account?",
    hint: "The final decision rests with the bank.",
    options: [
      ["yes", "Yes, include bank account assistance", "", RATES.bank],
      ["no", "No, I will arrange it myself"],
    ],
  },
};

export const OPTION_Q: Record<Jurisdiction, string> = {
  mainland: "Which mainland structure fits your business?",
  freezone: "Which free zone are you considering?",
  offshore: "Which offshore jurisdiction are you considering?",
};
