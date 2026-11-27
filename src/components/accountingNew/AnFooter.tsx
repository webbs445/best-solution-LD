import { CookieSettingsButton } from "@/components/analytics/CookieConsentBanner";
import { DISCLAIMER } from "@/content/site";
import { XS_CONFIG as C } from "@/content/xservicesx.config";

/* The site's standard legal strip (same links and wording as the other landing pages). Server component. */
export function AnFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="an-foot">
      <div className="an-wrap">
        <span data-legal>&copy; {year} Best Solution.</span>
        <a href={C.privacyUrl}>Privacy</a>
        <a href={C.termsUrl}>Terms</a>
        <CookieSettingsButton />
        {/* Same wording as the live /accounting footer. */}
        <p>{DISCLAIMER} We are not affiliated with the Federal Tax Authority.</p>
      </div>
    </footer>
  );
}
