import { CookieSettingsButton } from "@/components/analytics/CookieConsentBanner";
import { OFFICE_LINE, TOPICS } from "@/content/xservicesx";
import { XS_CONFIG as C } from "@/content/xservicesx.config";
import { Icon } from "./ui";
import { XsPhone, XsWhatsApp } from "./XsCta";

/* The page footer (navy-deep). Phones: an office card with Call and Directions, and Services / Company lists that open on tap. */
export function XsFooter({ showReviews }: { showReviews: boolean }) {
  const services = (Object.keys(C.servicePages) as (keyof typeof C.servicePages)[]).map((t) => ({ href: C.servicePages[t], label: TOPICS[t].label }));
  const company = [
    ...(C.aboutUrl ? [{ href: C.aboutUrl, label: "About us" }] : []),
    ...(C.advisors.length ? [{ href: "#advisors", label: "Our advisors" }] : []),
    ...(showReviews ? [{ href: "#reviews", label: "Client reviews" }] : []),
    { href: "#faq", label: "Questions" },
  ];
  const year = new Date().getFullYear();
  const links = (l: { href: string; label: string }[]) =>
    l.map((x) => (
      <a key={x.href} className="xs-fl" href={x.href}>
        {x.label}
      </a>
    ));
  return (
    <footer className="xs-footer">
      <div className="xs-wrap">
        <div className="xs-fgrid">
          <div className="xs-fbrand">
            <b>Best Solution</b>
            <p>
              Private business advisors in Business Bay, Dubai.<span className="d-only"> Clear answers, in writing, before you spend a dirham.</span>
            </p>
            <XsWhatsApp location="footer" className="xs-fwa d-only">
              <Icon name="whatsapp" size={18} />
              Chat on WhatsApp
            </XsWhatsApp>
          </div>
          <div className="xs-office m-only">
            <span>{OFFICE_LINE.replace(", Dubai", "")}</span>
            {C.officeHours && <span>{C.officeHours}</span>}
            <span className="xs-office-btns">
              <XsPhone location="footer" href={C.phoneNumber.href}>
                Call
              </XsPhone>
              <a href={C.mapsUrl} target="_blank" rel="noopener noreferrer">
                Directions
              </a>
            </span>
          </div>
          <nav className="xs-fcol d-only" aria-label="Services">
            <span className="xs-fh">SERVICES</span>
            {links(services)}
          </nav>
          <nav className="xs-fcol d-only" aria-label="Company">
            <span className="xs-fh">COMPANY</span>
            {links(company)}
          </nav>
          <div className="xs-fcol d-only">
            <span className="xs-fh">VISIT OR CALL</span>
            <span className="xs-fline">
              <Icon name="pin" size={16} />
              {OFFICE_LINE}
            </span>
            {C.officeHours && (
              <span className="xs-fline">
                <Icon name="clock" size={16} />
                {C.officeHours}
              </span>
            )}
            <XsPhone location="footer" href={C.phoneNumber.href} className="xs-fl xs-fline">
              <Icon name="phone" size={16} />
              {C.phoneNumber.display}
            </XsPhone>
            <a className="xs-fl xs-fline" href={`mailto:${C.email}`}>
              <Icon name="mail" size={16} />
              {C.email}
            </a>
          </div>
          <div className="xs-facc m-only">
            <details>
              <summary>
                SERVICES <span aria-hidden="true" />
              </summary>
              <div>{links(services)}</div>
            </details>
            <details>
              <summary>
                COMPANY <span aria-hidden="true" />
              </summary>
              <div>{links(company)}</div>
            </details>
          </div>
        </div>
        <div className="xs-fbottom">
          <span data-legal>&copy; {year} Best Solution. A private business consultancy. Not a government office or free zone authority.</span>
          <span className="xs-flegal">
            <a className="xs-fl" href={C.privacyUrl}>
              Privacy
            </a>
            <a className="xs-fl" href={C.termsUrl}>
              Terms
            </a>
            <CookieSettingsButton className="xs-fl xs-cookie" />
          </span>
        </div>
      </div>
    </footer>
  );
}
