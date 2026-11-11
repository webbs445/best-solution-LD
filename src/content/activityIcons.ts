/* Lucide icon bodies for the /freezone activity search, keyed by activity name (32 KB of SVG paths).
   Kept out of content/freezone.ts so the browser bundles of home, /freezone and /cost-calculator don't carry it:
   the server passes the popular chips' icons, and FzZones loads this file when the activity search is first used. */
import ACTIVITY_ICONS from "./activity-icons.json";

const ICONS = ACTIVITY_ICONS as { map: Record<string, string>; icons: Record<string, string> };

/** The inner SVG markup of an activity's icon (static Lucide paths from our own content file). */
export function activityIcon(name: string): string {
  return ICONS.icons[ICONS.map[name]] || ICONS.icons["briefcase-business"];
}
