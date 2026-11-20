/*
  Google Apps Script for the "Google Ads leads – Lead Radar" Google Sheet (Extensions → Apps Script).
  The website adds one row per Google Ads lead (tracking only: no name, phone or email), and /ads-report reads them
  back, so a lead stays counted even after the ERP hides it from the website's API user.

  Pasted into the sheet's Apps Script editor (or uploaded with clasp) with the real ADS_SHEET_SECRET filled in below,
  and deployed as a web app (Execute as: me, Access: anyone); its /exec URL is ADS_SHEET_URL. Requests without a secret are refused,
  so the public URL alone reads or writes nothing.

  Two secrets:
  - SECRET (below; the app's ADS_SHEET_SECRET): reads and writes. Production only.
  - READ_SECRET (Project Settings → Script Properties, 32+ characters; the app's ADS_SHEET_READ_SECRET): reads only.
    doPost never accepts it, and reads change nothing in the sheet. For deployments that must only read (Vercel Preview).

  Two tabs, both found by their exact name, never by position:
  - "Lead log" (LOG_TAB): the Google Ads lead log. The only tab doGet reads and the only one the lead write uses.
    Without a tab of that name, reads and lead writes answer an error and nothing is created.
  - "Fallback" (FALLBACK_TAB): when the ERP refuses a website lead or doesn't answer, the website sends the whole lead
    here (with its name, phone and email, so sales can call back). doGet never reads it, so the read-only secret,
    Vercel Preview and /ads-report can't see contact details. Created by the script the first time. Each fallback
  lead emails ALERT_EMAIL (Script Properties; one address, or several separated by commas) with only
  "1 lead saved to the fallback". Without ALERT_EMAIL the lead is still saved. The first deploy after this change
  asks the owner to allow sending email (run authorize() once from the editor).
*/

const SECRET = "__ADS_SHEET_SECRET__"; // replaced at upload; never commit the real value

// [field the website sends, column title]. Add new columns at the end only: the order is the sheet's layout.
const COLUMNS = [
  ["name", "Lead"],
  ["creation", "Received (UAE)"],
  ["custom_campaign", "Campaign (utm_campaign)"],
  ["custom_ad_set_name", "Keyword (utm_term)"],
  ["custom_ad_name", "Ad group_ad (utm_content)"],
  ["custom_form_name", "Page / form"],
  ["custom_platform", "Platform (utm_source)"],
  ["source", "Source"],
  ["custom_clid", "Google click ID"],
  // The visitor's cookie choice when sending the form: Accepted all, Rejected all, Analytics only, Marketing only,
  // No choice yet, or Unknown. Blank on rows from before this column. Only Accepted all and Marketing only go to Google Ads.
  ["consent", "Cookie consent"],
];

const LOG_TAB = "Lead log";
const FALLBACK_TAB = "Fallback";
const ALERT_SUBJECT = "Website lead saved to the fallback";
const ALERT_BODY = "1 lead saved to the fallback.";
// [field the website sends, column title] for the Fallback tab. Add new columns at the end only.
const FALLBACK_COLUMNS = [
  ["received", "Received (UAE)"],
  ["lead_name", "Name"],
  ["mobile_no", "Phone"],
  ["email_id", "Email"],
  ["form_name", "Form"],
  ["source_page", "Source page"],
  ["landing_page", "Landing page"],
  ["utm_source", "utm_source"],
  ["utm_medium", "utm_medium"],
  ["utm_campaign", "utm_campaign"],
  ["utm_term", "utm_term"],
  ["utm_content", "utm_content"],
  ["click_id", "Click ID"],
  ["consent", "Cookie consent"],
  ["event_id", "Event ID"],
  ["erp_error", "ERP error"],
  ["erp_check", "ERP check needed"],
  ["details", "Details"],
];

const reply = (obj) => ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);

/** The read-only secret from Script Properties; "" when unset. Shorter than 32 characters counts as unset. */
function readSecret() {
  const v = PropertiesService.getScriptProperties().getProperty("READ_SECRET") || "";
  return v.length >= 32 ? v : "";
}
/** Writing (and reading): the write secret only. */
const canWrite = (secret) => !SECRET.startsWith("__") && secret === SECRET;
/** Reading: the write secret or the read-only one. */
const canRead = (secret) => canWrite(secret) || (readSecret() !== "" && secret === readSecret());

/** Run once from the editor (or by the setup script's first visit) so Google asks the owner for access to the sheet. */
function authorize() {
  if (!sheetForWriting()) throw new Error(`No tab named "${LOG_TAB}": rename the lead log tab to exactly that first.`);
  fallbackSheet();
  MailApp.getRemainingDailyQuota(); // asks for the "send email" permission the fallback alert needs
}

/** The lead log tab, by its exact name only (never by position, so moving tabs can't expose the Fallback tab). Null if missing. */
function logSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_TAB);
}

/** The lead log tab, its header row added or fixed first. Only for writing: reads never change the sheet. Null if missing. */
function sheetForWriting() {
  const s = logSheet();
  if (!s) return null;
  if (s.getLastRow() === 0) {
    s.appendRow(COLUMNS.map((c) => c[1]));
    s.setFrozenRows(1);
    s.getRange(1, 1, 1, COLUMNS.length).setFontWeight("bold");
  }
  // A column added later (Cookie consent): give the existing sheet its header once.
  const head = s.getRange(1, 1, 1, COLUMNS.length);
  const titles = head.getDisplayValues()[0];
  if (titles.some((t, i) => t !== COLUMNS[i][1])) {
    head.setValues([COLUMNS.map((c) => c[1])]);
    head.setFontWeight("bold");
  }
  return s;
}

/** Adds a lead. Body: {"secret": "...", "lead": {name, creation, ...}}. Only the write secret. A lead number already in the sheet is skipped. */
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return reply({ ok: false, error: "bad json" }); }
  if (!canWrite(body.secret)) return reply({ ok: false, error: "forbidden" });
  if (body.fallback) return addFallback(body.fallback);
  const lead = body.lead || {};
  if (!/^[A-Z]+-\d+$/.test(String(lead.name || ""))) return reply({ ok: false, error: "no lead number" });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const s = sheetForWriting();
    if (!s) return reply({ ok: false, error: "no lead log tab" });
    const last = s.getLastRow();
    const names = last > 1 ? s.getRange(2, 1, last - 1, 1).getDisplayValues().map((r) => r[0]) : [];
    if (names.includes(lead.name)) return reply({ ok: true, duplicate: true });
    // Plain text, so Sheets never turns times or ids into dates or numbers.
    const range = s.getRange(last + 1, 1, 1, COLUMNS.length);
    range.setNumberFormat("@");
    range.setValues([COLUMNS.map((c) => String(lead[c[0]] || "").slice(0, 500))]);
    return reply({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

/** Every lead in the sheet: GET ?secret=... (the write or the read-only secret). Strictly read-only. */
function doGet(e) {
  if (!canRead(e.parameter.secret)) return reply({ ok: false, error: "forbidden" });
  const s = logSheet(); // the "Lead log" tab by name: never the Fallback tab, wherever the tabs are
  if (!s) return reply({ ok: false, error: "no lead log tab" });
  const rows = s.getLastRow() > 1 ? s.getRange(2, 1, s.getLastRow() - 1, COLUMNS.length).getDisplayValues() : [];
  const leads = rows.filter((r) => r[0]).map((r) => Object.fromEntries(COLUMNS.map((c, i) => [c[0], (r[i] || "").trim()])));
  return reply({ ok: true, leads });
}

/** The Fallback tab, created with its header row the first time. */
function fallbackSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let s = book.getSheetByName(FALLBACK_TAB);
  if (!s) {
    s = book.insertSheet(FALLBACK_TAB, book.getSheets().length); // last, never the first tab
    s.appendRow(FALLBACK_COLUMNS.map((c) => c[1]));
    s.setFrozenRows(1);
    s.getRange(1, 1, 1, FALLBACK_COLUMNS.length).setFontWeight("bold");
  }
  return s;
}

/**
 * Saves a lead the ERP did not take and emails the alert. ok: true only once the row is written; the alert is best
 * effort (a mail failure is reported as alerted: false but the lead stays saved). The email holds no lead data.
 */
function addFallback(lead) {
  if (!String(lead.mobile_no || "").trim() && !String(lead.email_id || "").trim()) return reply({ ok: false, error: "no contact" });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const s = fallbackSheet();
    const range = s.getRange(s.getLastRow() + 1, 1, 1, FALLBACK_COLUMNS.length);
    range.setNumberFormat("@");
    range.setValues([FALLBACK_COLUMNS.map((c) => String(lead[c[0]] || "").slice(0, 2000))]);
  } finally {
    lock.releaseLock();
  }
  let alerted = false;
  const to = alertTo();
  if (to) {
    try {
      MailApp.sendEmail(to, ALERT_SUBJECT, ALERT_BODY);
      alerted = true;
    } catch (err) {
      console.error("Fallback alert email failed", err);
    }
  }
  return reply({ ok: true, alerted });
}

const alertTo = () => PropertiesService.getScriptProperties().getProperty("ALERT_EMAIL") || "";

/** Run once from the editor: sends the same alert email a fallback lead sends, to ALERT_EMAIL. Writes no row. */
function testAlertEmail() {
  const to = alertTo();
  if (!to) throw new Error("ALERT_EMAIL is not set in Script Properties.");
  MailApp.sendEmail(to, ALERT_SUBJECT, ALERT_BODY);
  Logger.log(`Alert email sent to ${to.split(",").length} address(es). No row was written.`);
}

/**
 * Run from the editor (select it, then Run) after setting READ_SECRET: proves the read-only secret can read and
 * can't write, without ever writing (the write attempt uses an invalid lead number, so even a wrong check could not
 * add a row). Results in the Execution log; nothing is changed in the sheet.
 */
function testReadSecretCannotWrite() {
  const rs = readSecret();
  if (!rs) throw new Error("READ_SECRET is not set (or shorter than 32 characters) in Script Properties.");
  const s = logSheet();
  if (!s) throw new Error(`No tab named "${LOG_TAB}".`);
  const rowsBefore = s.getLastRow();
  const json = (out) => JSON.parse(out.getContent());
  const read = json(doGet({ parameter: { secret: rs } }));
  const write = json(doPost({ postData: { contents: JSON.stringify({ secret: rs, lead: { name: "not-a-lead" } }) } }));
  const anon = json(doGet({ parameter: {} }));
  const rowsAfter = s.getLastRow();
  const pass = read.ok === true && Array.isArray(read.leads) && write.error === "forbidden" && anon.error === "forbidden" && rowsAfter === rowsBefore;
  Logger.log(`READ_SECRET reads: ${read.ok ? `yes, ${read.leads.length} leads` : `NO (${read.error})`}`);
  Logger.log(`READ_SECRET writes: ${write.error === "forbidden" ? "no (forbidden)" : `UNEXPECTED: ${JSON.stringify(write)}`}`);
  Logger.log(`No secret reads: ${anon.error === "forbidden" ? "no (forbidden)" : "UNEXPECTED"}`);
  Logger.log(`Rows before ${rowsBefore}, after ${rowsAfter}: ${rowsAfter === rowsBefore ? "unchanged" : "CHANGED"}`);
  Logger.log(pass ? "PASS" : "FAIL");
}

/**
 * Run from the editor after a redeploy (READ_SECRET set): proves the Fallback tab can't be written with the read-only
 * secret, a wrong secret or none, and that with the Fallback tab moved to the front, a read still returns exactly the
 * "Lead log" rows. The tab order is put back afterwards; no row is written and no email is sent.
 */
function testFallbackIsPrivate() {
  const rs = readSecret();
  if (!rs) throw new Error("READ_SECRET is not set (or shorter than 32 characters) in Script Properties.");
  const log = logSheet();
  if (!log) throw new Error(`No tab named "${LOG_TAB}".`);
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const fb = fallbackSheet();
  const fbRows = fb.getLastRow(), logRows = log.getLastRow();
  const json = (out) => JSON.parse(out.getContent());
  const fake = { lead_name: "TEST AUDIT - DELETE", mobile_no: "+971500000000", email_id: "test-audit@xerebo.com" };
  const writes = [rs, "wrong", undefined].map((secret) =>
    json(doPost({ postData: { contents: JSON.stringify({ secret, fallback: fake }) } })).error);

  const position = fb.getIndex();
  let read;
  book.setActiveSheet(fb);
  book.moveActiveSheet(1); // Fallback first
  try {
    read = json(doGet({ parameter: { secret: rs } }));
  } finally {
    book.setActiveSheet(fb);
    book.moveActiveSheet(position);
  }
  const expected = logRows > 1 ? log.getRange(2, 1, logRows - 1, 1).getDisplayValues().filter((r) => r[0]).length : 0;
  const keys = COLUMNS.map((c) => c[0]).join();
  const onlyLog = read.ok === true && read.leads.length === expected && read.leads.every((l) => Object.keys(l).join() === keys);
  const unchanged = fb.getLastRow() === fbRows && log.getLastRow() === logRows && fb.getIndex() === position;
  const pass = writes.every((e) => e === "forbidden") && onlyLog && unchanged;
  Logger.log(`Fallback writes without SECRET: ${writes.join(", ")}`);
  Logger.log(`Fallback moved to the front, read returned ${read.leads ? read.leads.length : read.error} rows; "${LOG_TAB}" has ${expected}: ${onlyLog ? "lead log only" : "WRONG"}`);
  Logger.log(`Rows and tab order unchanged: ${unchanged ? "yes" : "NO"}`);
  Logger.log(pass ? "PASS" : "FAIL");
}
