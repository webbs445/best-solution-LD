import { pushEvent } from "@/lib/analytics";

/*
  /accounting-new dataLayer events. Each event's parameters are typed to fixed values (numbers and option
  labels the page itself offers), so no name, number, email or typed text can reach the dataLayer.
*/
export type AccEvents = {
  acc_check_answer: { line: number; answer: "Yes" | "No" };
  acc_check_result: { result: string };
  acc_quote_step: { step: 1 | 2 | 3 };
  acc_quote_submit: { need: string };
  acc_whatsapp_click: { section: number };
  acc_cta_click: { section: number };
};

export function accTrack<K extends keyof AccEvents>(event: K, params: AccEvents[K]): void {
  pushEvent(event, params);
}
