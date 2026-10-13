/* UAE Corporate Tax rules behind the /corporate-tax page (headline rates; an illustration, not tax advice). */

const lastDay = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

/** UAE Corporate Tax for one period, as the return works it out (an illustration of the standard steps). */
export function computeTax(v: { rev: number; np: number; ent: number; fin: number; ex: number; loss: number; nqi: number; nqr: number }, qfzp: boolean, sbrOn: boolean) {
  const sbrOk = !qfzp && v.rev <= 3_000_000;
  const sbr = sbrOk && sbrOn;
  const addEnt = Math.round(v.ent * 0.5);
  const adj = v.np + addEnt + v.fin - v.ex;
  const pos = Math.max(0, adj);
  const used = sbr ? 0 : Math.min(v.loss, Math.round(pos * 0.75));
  const ti = Math.max(0, pos - used);
  const limit = Math.min(v.rev * 0.05, 5_000_000);
  const qPass = qfzp && v.nqr <= limit;
  let b0 = 0, b9 = 0;
  if (sbr) b0 = b9 = 0;
  else if (qPass) { b9 = Math.min(v.nqi, ti); b0 = ti - b9; }
  else { b0 = Math.min(ti, 375_000); b9 = Math.max(0, ti - 375_000); }
  return { sbrOk, sbr, addEnt, adj, used, ti, limit, qPass, qFail: qfzp && !qPass, b0, b9, tax: Math.round(b9 * 0.09) };
}

/** The tax period ending in month m (0-11) of year y, its due date (9 months later) and the days left from `today`. */
export function yearEnd(m: number, y: number, today: Date) {
  const start = new Date(y - 1, m + 1, 1), end = new Date(y, m, lastDay(y, m));
  let dm = m + 9;
  const dy = y + Math.floor(dm / 12);
  dm %= 12;
  const due = new Date(dy, dm, lastDay(dy, dm));
  return { start, end, due, days: Math.round((due.getTime() - today.getTime()) / 86_400_000) };
}

/** Late-return penalty for n months (AED 500 a month for the first 12, then AED 1,000). */
export const latePenalty = (n: number) => Math.min(n, 12) * 500 + Math.max(0, n - 12) * 1000;
