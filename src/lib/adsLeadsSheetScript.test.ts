import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

/*
  Runs the real scripts/ads-leads-sheet.gs against a small in-memory stand-in for the Apps Script services, with the
  Fallback tab first, so the tab rules, the secrets, the write path and the alert are checked before it is pasted live.
*/
const WRITE = "write-secret-for-tests-0000000000";
const READ = "read-secret-for-tests-00000000000"; // 33 characters
const source = readFileSync(new URL("../../scripts/ads-leads-sheet.gs", import.meta.url), "utf8").replace('"__ADS_SHEET_SECRET__"', JSON.stringify(WRITE));

class Tab {
  constructor(public name: string, public rows: string[][] = []) {}
  getName = () => this.name;
  getLastRow = () => this.rows.length;
  appendRow = (r: string[]) => void this.rows.push(r.map(String));
  setFrozenRows = () => {};
  getIndex = () => book.tabs.indexOf(this) + 1;
  getRange = (row: number, col: number, nr: number, nc: number) => ({
    getDisplayValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => this.rows[row - 1 + i]?.[col - 1 + j] ?? "")),
    setValues: (v: string[][]) => v.forEach((r, i) => (this.rows[row - 1 + i] = r.map(String))),
    setNumberFormat: () => {},
    setFontWeight: () => {},
  });
}

let book: { tabs: Tab[]; active?: Tab };
let props: Record<string, string>;
const mail = { sendEmail: vi.fn(), getRemainingDailyQuota: () => 100 };

function script() {
  const services = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheets: () => book.tabs,
        getSheetByName: (n: string) => book.tabs.find((t) => t.name === n) ?? null,
        insertSheet: (n: string, at: number) => (book.tabs.splice(at, 0, new Tab(n)), book.tabs[at]),
        setActiveSheet: (t: Tab) => (book.active = t),
        moveActiveSheet: (pos: number) => {
          book.tabs.splice(book.tabs.indexOf(book.active!), 1);
          book.tabs.splice(pos - 1, 0, book.active!);
        },
      }),
    },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: (s: string) => ({ setMimeType() { return this; }, getContent: () => s }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => props[k] ?? null }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    MailApp: mail,
    Logger: { log: vi.fn() },
  };
  const fns = new Function(...Object.keys(services), `${source}\nreturn { doGet, doPost, testAlertEmail, testFallbackIsPrivate, authorize };`)(...Object.values(services));
  const out = (o: { getContent(): string }) => JSON.parse(o.getContent());
  return {
    get: (secret?: string) => out(fns.doGet({ parameter: secret === undefined ? {} : { secret } })),
    post: (body: unknown) => out(fns.doPost({ postData: { contents: JSON.stringify(body) } })),
    fns,
    logged: () => services.Logger.log.mock.calls.map((c) => c[0]).join("\n"),
  };
}

const HEADER = ["Lead", "Received (UAE)", "Campaign (utm_campaign)", "Keyword (utm_term)", "Ad group_ad (utm_content)", "Page / form", "Platform (utm_source)", "Source", "Google click ID", "Cookie consent"];
const contact = { lead_name: "TEST AUDIT - DELETE", mobile_no: "+971500000000", email_id: "test-audit@xerebo.com" };

beforeEach(() => {
  mail.sendEmail.mockReset();
  props = { READ_SECRET: READ, ALERT_EMAIL: "alerts@example.com" };
  // Fallback deliberately first, holding contact details; the lead log second.
  book = {
    tabs: [
      new Tab("Fallback", [["Received (UAE)", "Name", "Phone"], ["2026-11-20", contact.lead_name, contact.mobile_no]]),
      new Tab("Lead log", [HEADER, ["BSL-1", "2026-11-20 10:00", "fz"], ["BSL-2", "2026-11-20 11:00", "fz"]]),
      new Tab("Notes", [["anything"]]),
    ],
  };
});

describe("lead log Apps Script", () => {
  it("reads the tab named Lead log only, even with Fallback first, and returns its columns only", () => {
    const read = script().get(READ);
    expect(read.ok).toBe(true);
    expect(read.leads.map((l: { name: string }) => l.name)).toEqual(["BSL-1", "BSL-2"]);
    expect(Object.keys(read.leads[0])).toEqual(["name", "creation", "custom_campaign", "custom_ad_set_name", "custom_ad_name", "custom_form_name", "custom_platform", "source", "custom_clid", "consent"]);
    expect(JSON.stringify(read)).not.toContain(contact.mobile_no);
  });

  it("answers an error and creates nothing when no tab is named Lead log", () => {
    book.tabs[1].name = "Sheet1";
    const s = script();
    expect(s.get(READ)).toEqual({ ok: false, error: "no lead log tab" });
    expect(s.post({ secret: WRITE, lead: { name: "BSL-3" } })).toEqual({ ok: false, error: "no lead log tab" });
    expect(book.tabs.map((t) => [t.name, t.rows.length])).toEqual([["Fallback", 2], ["Sheet1", 3], ["Notes", 1]]);
    expect(() => s.fns.authorize()).toThrow(/Lead log/);
  });

  it("refuses reads without a valid secret, and a READ_SECRET under 32 characters", () => {
    expect(script().get()).toEqual({ ok: false, error: "forbidden" });
    expect(script().get("wrong")).toEqual({ ok: false, error: "forbidden" });
    props.READ_SECRET = "short-secret-1234567890"; // 23 characters
    expect(script().get("short-secret-1234567890")).toEqual({ ok: false, error: "forbidden" });
    expect(script().get(WRITE).ok).toBe(true);
  });

  it("writes a lead to Lead log with the write secret only, skipping a lead number already there", () => {
    const s = script();
    expect(s.post({ secret: READ, lead: { name: "BSL-3" } })).toEqual({ ok: false, error: "forbidden" });
    expect(s.post({ secret: WRITE, lead: { name: "not-a-lead" } })).toEqual({ ok: false, error: "no lead number" });
    expect(s.post({ secret: WRITE, lead: { name: "BSL-3", custom_campaign: "fz" } })).toEqual({ ok: true });
    expect(s.post({ secret: WRITE, lead: { name: "BSL-3" } })).toEqual({ ok: true, duplicate: true });
    expect(book.tabs[1].rows.at(-1)!.slice(0, 3)).toEqual(["BSL-3", "", "fz"]);
    expect(book.tabs[0].rows).toHaveLength(2); // Fallback untouched
  });

  it("saves a fallback lead with the write secret only, and the alert email holds no lead data", () => {
    const s = script();
    for (const secret of [READ, "wrong", undefined]) expect(s.post({ secret, fallback: contact })).toEqual({ ok: false, error: "forbidden" });
    expect(mail.sendEmail).not.toHaveBeenCalled();
    expect(s.post({ secret: WRITE, fallback: contact })).toEqual({ ok: true, alerted: true });
    expect(book.tabs[0].rows).toHaveLength(3);
    expect(book.tabs[1].rows).toHaveLength(3); // Lead log untouched
    expect(mail.sendEmail).toHaveBeenCalledWith("alerts@example.com", "Website lead saved to the fallback", "1 lead saved to the fallback.");
  });

  it("testAlertEmail sends the alert to ALERT_EMAIL and writes no row; it stops when ALERT_EMAIL is unset", () => {
    const before = JSON.stringify(book.tabs.map((t) => t.rows));
    script().fns.testAlertEmail();
    expect(mail.sendEmail).toHaveBeenCalledOnce();
    expect(mail.sendEmail).toHaveBeenCalledWith("alerts@example.com", "Website lead saved to the fallback", "1 lead saved to the fallback.");
    expect(JSON.stringify(book.tabs.map((t) => t.rows))).toBe(before);
    delete props.ALERT_EMAIL;
    expect(() => script().fns.testAlertEmail()).toThrow(/ALERT_EMAIL/);
  });

  it("testFallbackIsPrivate passes, and puts the tab order back", () => {
    book.tabs.push(book.tabs.shift()!); // Fallback last, as the script creates it
    const s = script();
    s.fns.testFallbackIsPrivate();
    expect(s.logged()).toMatch(/PASS$/);
    expect(book.tabs.map((t) => t.name)).toEqual(["Lead log", "Notes", "Fallback"]);
    expect(mail.sendEmail).not.toHaveBeenCalled();
  });
});
