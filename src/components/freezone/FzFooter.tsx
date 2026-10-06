import Image from "next/image";
import { MAPS_URL, SITE, SOCIAL } from "@/content/site";
import { FZ_NAV } from "@/content/freezone";
import { CallbackButton } from "@/components/sections/Callback";
import { CookieSettingsButton } from "@/components/analytics/CookieConsentBanner";
import {
  ArrowIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  WhatsAppIcon,
} from "@/components/ui/Icons";

const SOCIAL_LINKS = [
  { href: SOCIAL.facebook, label: "Facebook", icon: <FacebookIcon /> },
  { href: SOCIAL.instagram, label: "Instagram", icon: <InstagramIcon /> },
  { href: SOCIAL.linkedin, label: "LinkedIn", icon: <LinkedInIcon /> },
  { href: SITE.whatsapp, label: "WhatsApp", icon: <WhatsAppIcon /> },
];

const CONTACTS = [
  { href: SITE.phone.href, icon: <PhoneIcon />, title: SITE.phone.display, note: SITE.hours.short },
  { href: `mailto:${SITE.email}`, icon: <MailIcon />, title: SITE.email, note: "Reply within 24 hrs" },
  { href: MAPS_URL, icon: <PinIcon />, title: "Business Bay, Dubai", note: "View on Google Maps", external: true },
];

/* The /freezone page footer. Its "Book a Callback" button owns the page's one callback popup;
   every other "callback" button opens it through CallbackTrigger. */
export function FzFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bs-footer f4">
      <div className="bs-fglow" aria-hidden="true">
        <i />
        <i />
      </div>
      <div className="bs-fin">
        <div className="f5-top">
          <div className="f4-brand">
            <a className="bs-flogo" href="#top" aria-label="Best Solution, back to top">
              <Image src={SITE.mark} alt="Best Solution" width={160} height={75} />
            </a>
            <p>Independent free zone advice from Business Bay, Dubai. One consultant, every step, with costs confirmed in writing.</p>
            <div className="bs-social">
              {SOCIAL_LINKS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener" aria-label={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
          <div className="f5-col">
            <h4>Contact</h4>
            <div className="f5-contact">
              {CONTACTS.map((c) => (
                <a key={c.title} className="bs-fci" href={c.href} {...(c.external ? { target: "_blank", rel: "noopener" } : null)}>
                  <span className="bs-ico">{c.icon}</span>
                  <span>
                    <b>{c.title}</b>
                    <small>{c.note}</small>
                  </span>
                </a>
              ))}
            </div>
          </div>
          <div className="f5-cta">
            <span className="qc-live">
              <i />
              Consultants available
            </span>
            <h4>Free consultation</h4>
            <p>Tell us your plans. An advisor calls you back within one business day.</p>
            <CallbackButton className="btn btn-primary" defaultInterest="freezone" ctaLocation="FZ Footer — Book a Callback">
              Book a Callback <ArrowIcon />
            </CallbackButton>
            <small>No obligation</small>
          </div>
        </div>
        <nav className="f5-nav" aria-label="This page">
          {FZ_NAV.map((n) => (
            <a key={n.href} href={n.href}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="f5-legal" id="disclaimer">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16.5v.5" />
          </svg>
          <div>
            <b>Important information</b>
            <p>
              Best Solution&reg; is a private business consultancy based in Business Bay, Dubai, and is not affiliated with
              any government entity or free zone authority. All licences, permits and residency approvals are issued solely
              by the relevant UAE authorities. Free zone names and logos identify the zones we advise on and do not imply
              affiliation. Prices are indicative starting costs from our current rate card, may change, and are
              confirmed in writing by your advisor. 0% corporate tax applies only to qualifying income under Qualifying Free
              Zone Person (QFZP) conditions.
            </p>
          </div>
        </div>
      </div>
      <div className="bs-fbottom">
        <div className="bs-fbin">
          <p>
            &copy; {year} <strong>Best Solution&reg;</strong>. All rights reserved.
          </p>
          <nav aria-label="Legal">
            <a href={SITE.privacy} target="_blank" rel="noopener">
              Privacy Policy
            </a>
            <a href={SITE.terms} target="_blank" rel="noopener">
              Terms of Service
            </a>
            <CookieSettingsButton />
          </nav>
        </div>
      </div>
    </footer>
  );
}
