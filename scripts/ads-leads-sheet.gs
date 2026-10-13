/*
  Google Apps Script for the "Google Ads leads – Lead Radar" Google Sheet (Extensions → Apps Script).
  The website adds one row per Google Ads lead (tracking only: no name, phone or email), and /ads-report reads them
  back, so a lead stays counted even after the ERP hides it from the website's API user.

  Uploaded with Google's clasp CLI as a sheet-bound script, with ADS_SHEET_SECRET filled in below, and deployed as a
  web app (Execute as: me, Access: anyone); its /exec URL is ADS_SHEET_URL. Requests without the secret are refused,
  so the public URL alone reads or writes nothing.
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
];

const reply = (obj) => ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
const allowed = (secret) => !SECRET.startsWith("__") && secret === SECRET;

/** Run once from the editor (or by the setup script's first visit) so Google asks the owner for access to the sheet. */
function authorize() {
  sheet();
}

function sheet() {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (s.getLastRow() === 0) {
    s.appendRow(COLUMNS.map((c) => c[1]));
    s.setFrozenRows(1);
    s.getRange(1, 1, 1, COLUMNS.length).setFontWeight("bold");
  }
  return s;
}

/** Adds a lead. Body: {"secret": "...", "lead": {name, creation, ...}}. A lead number already in the sheet is skipped. */
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return reply({ ok: false, error: "bad json" }); }
  if (!allowed(body.secret)) return reply({ ok: false, error: "forbidden" });
  const lead = body.lead || {};
  if (!/^[A-Z]+-\d+$/.test(String(lead.name || ""))) return reply({ ok: false, error: "no lead number" });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const s = sheet();
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

/** Every lead in the sheet: GET ?secret=... */
function doGet(e) {
  if (!allowed(e.parameter.secret)) return reply({ ok: false, error: "forbidden" });
  const s = sheet();
  const rows = s.getLastRow() > 1 ? s.getRange(2, 1, s.getLastRow() - 1, COLUMNS.length).getDisplayValues() : [];
  const leads = rows.filter((r) => r[0]).map((r) => Object.fromEntries(COLUMNS.map((c, i) => [c[0], r[i].trim()])));
  return reply({ ok: true, leads });
}
