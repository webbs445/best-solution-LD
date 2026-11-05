import { describe, expect, it } from "vitest";
import { officeOpen } from "./officeHours";

// Dubai is UTC+4 all year.
describe("officeOpen", () => {
  it("is open Monday to Friday, 9am to 6pm Dubai time", () => {
    expect(officeOpen(new Date("2026-11-09T05:00:00Z"))).toBe(true); // Mon 09:00
    expect(officeOpen(new Date("2026-11-13T13:59:00Z"))).toBe(true); // Fri 17:59
  });

  it("is closed before 9, from 6pm, and on Saturday and Sunday", () => {
    expect(officeOpen(new Date("2026-11-09T04:59:00Z"))).toBe(false); // Mon 08:59
    expect(officeOpen(new Date("2026-11-09T14:00:00Z"))).toBe(false); // Mon 18:00
    expect(officeOpen(new Date("2026-11-14T08:00:00Z"))).toBe(false); // Sat 12:00
    expect(officeOpen(new Date("2026-11-15T08:00:00Z"))).toBe(false); // Sun 12:00
  });
});
