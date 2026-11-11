import Image from "next/image";
import { DISCLAIMER, FOOTER_TAIL, MAPS_URL, SITE, SOCIAL, ZONE_NAMES_NOTE } from "@/content/site";
import { FZ_NAV } from "@/content/freezone";
import { ALL_SERVICES } from "@/content/services";
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
  { href: `mailto:${SITE.email}`, icon: <MailIcon />, title: SITE.email, note: "We reply by email" },
  { href: MAPS_URL, icon: <PinIcon />, title: "Business Bay, Dubai", note: "View on Google Maps", external: true },
];

/* The /freezone page footer. Its "Book a Callback" button owns the page's one callback popup;
   every other "callback" button opens it through CallbackTrigger. */
export function FzFooter({
  blurb = `Free zone advice from a private consultancy in Business Bay, Dubai.${FOOTER_TAIL}`,
  nav = FZ_NAV,
  navLabel = "This page",
  defaultInterest = "freezone",
  ctaLocation = "FZ Footer - Book a Callback",
  formId,
}: {
  blurb?: string;
  nav?: { href: string; label: string }[];
  navLabel?: string;
  defaultInterest?: Parameters<typeof CallbackButton>[0]["defaultInterest"];
  ctaLocation?: string;
  formId?: Parameters<typeof CallbackButton>[0]["formId"];
} = {}) {
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
            <p>{blurb}</p>
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
                <a key={c.title} className="bs-fci" href={c.href} {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : null)}>
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
            <h4>Book a consultation</h4>
            <p>Tell us your plans. We reply by phone, WhatsApp or email.</p>
            <CallbackButton className="btn btn-primary" defaultInterest={defaultInterest} ctaLocation={ctaLocation} formId={formId}>
              Book a Callback <ArrowIcon />
            </CallbackButton>
            <small>No obligation</small>
          </div>
        </div>
        <nav className="f5-nav" aria-label={navLabel}>
          {[...nav, ALL_SERVICES].map((n) => (
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
            <p data-legal>{DISCLAIMER}</p>
            <p>
              {ZONE_NAMES_NOTE && `${ZONE_NAMES_NOTE} `}0% corporate tax applies only to qualifying income under Qualifying
              Free Zone Person (QFZP) conditions.
            </p>
          </div>
        </div>
      </div>
      <div className="bs-fbottom">
        <div className="bs-fbin">
          <p>
            &copy; {year} <strong>Best Solution</strong>. All rights reserved.
          </p>
          <nav aria-label="Legal">
            <a href={SITE.privacy}>Privacy Policy</a>
            <a href={SITE.terms}>Terms of Service</a>
            <CookieSettingsButton />
          </nav>
        </div>
      </div>
    </footer>
  );
}
