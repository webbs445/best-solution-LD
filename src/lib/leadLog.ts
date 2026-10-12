/*
  One JSON line per lead request in the Vercel logs, so a missing lead can be traced: which form, what
  happened (created / duplicate / invalid / rate_limited / honeypot / erp_failed ...), the ERP lead id,
  the campaign and whether a Google click id came with it. Never a name, phone, email or message.
*/

/** Filled in by the route as it goes; anything left out is worked out from the response. */
export interface LeadLog {
  erp_id?: string;
  erp_status?: number;
}

type Body = Record<string, unknown> | null;
const s = (v: unknown, max = 120) => (typeof v === "string" ? v.slice(0, max) : undefined);

export function leadResult(status: number, req: Body, res: Body): string {
  if (status === 200) return s(req?.website) ? "honeypot" : res?.created === false ? "duplicate" : "created";
  if (status === 422) return "invalid";
  if (status === 429) return "rate_limited";
  if (status === 400) return "invalid_json";
  if (status === 503) return "erp_not_configured";
  if (status === 502) return "erp_failed";
  return `error_${status}`;
}

export function leadLogLine(route: string, status: number, req: Body, res: Body, log: LeadLog, ms: number) {
  return {
    msg: "lead",
    route,
    result: leadResult(status, req, res),
    status,
    ...(res?.fields ? { invalid_fields: res.fields } : null),
    ...(typeof res?.error === "string" && status >= 500 ? { error: res.error } : null),
    erp_id: log.erp_id,
    erp_status: log.erp_status,
    form_id: s(req?.form_id),
    event_id: s(req?.event_id, 60),
    utm_source: s(req?.utm_source),
    utm_medium: s(req?.utm_medium),
    utm_campaign: s(req?.utm_campaign),
    gclid: !!(s(req?.gclid) || s(req?.gbraid) || s(req?.wbraid) || s(req?.click_id)),
    ms,
  };
}

/** Wraps a lead route's POST handler and logs one line per request, including when the handler throws. */
export function withLeadLog(route: string, handler: (request: Request, log: LeadLog) => Promise<Response>) {
  return async (request: Request) => {
    const t0 = Date.now();
    const req = (await request
      .clone()
      .json()
      .catch(() => null)) as Body;
    const log: LeadLog = {};
    let status = 500;
    let res: Body = null;
    try {
      const response = await handler(request, log);
      status = response.status;
      res = (await response
        .clone()
        .json()
        .catch(() => null)) as Body;
      return response;
    } finally {
      console.info(JSON.stringify(leadLogLine(route, status, req, res, log, Date.now() - t0)));
    }
  };
}
