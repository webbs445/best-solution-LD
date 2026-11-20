// Preload for the LOCAL QA server only: its clock starts at the fixture's day (TODAY, 14:00 Dubai) and runs on from
// there, so the Google Ads QA's dates and numbers (written for that day) hold whatever day the checks run.
// Start the server with: NODE_OPTIONS=--import=./scripts/qa/fixed-clock.mjs (README "Google Ads view").
// QA_NOW overrides the start time (an ISO date with offset). Never used by the site itself.
import { TODAY } from "./fixtures/googleAdsFixture.mjs";

const start = Date.parse(process.env.QA_NOW || `${TODAY}T14:00:00+04:00`);
const offset = start - Date.now();
const RealDate = Date;
class QaDate extends RealDate {
  constructor(...args) {
    if (args.length) super(...args);
    else super(RealDate.now() + offset);
  }
  static now() {
    return RealDate.now() + offset;
  }
}
// Own copies of the static methods: Next's middleware sandbox copies Date's own properties only.
QaDate.parse = RealDate.parse;
QaDate.UTC = RealDate.UTC;
globalThis.Date = QaDate;
