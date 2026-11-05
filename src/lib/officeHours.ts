/** Whether the Business Bay office is open at `at`: Monday to Friday, 9am to 6pm Dubai time (SITE.hours). */
export function officeOpen(at: Date): boolean {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dubai", weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(at);
  const day = parts.find((p) => p.type === "weekday")!.value;
  const hour = Number(parts.find((p) => p.type === "hour")!.value);
  return !["Sat", "Sun"].includes(day) && hour >= 9 && hour < 18;
}
