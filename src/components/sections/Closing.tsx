import Image from "next/image";
import { CLAIMS, DISCLAIMER, FOOTER_COLUMNS, MAPS_URL, SITE, SOCIAL } from "@/content/site";
import { CallbackLink } from "@/components/freezone/CallbackTrigger";
import { CtaLink } from "@/components/ui/CtaLink";
import { CookieSettingsButton } from "@/components/analytics/CookieConsentBanner";
import {
  ArrowIcon,
  CheckIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  WhatsAppIcon,
} from "@/components/ui/Icons";
import { CallbackButton } from "./Callback";
import { AdvisorsBadge } from "@/components/ui/AdvisorsBadge";
import styles from "./Closing.module.css";

/* The middle point shows only once confirmed (content/site CLAIMS.writtenFees). */
const POINTS = ["No obligation", CLAIMS.writtenFees, "Reply by phone, WhatsApp or email"].filter((p): p is string => !!p);

/* Closing CTA: a card on the page ground, just above the footer. */
export function Closing() {
  return (
    <section className={styles.close} aria-labelledby="close-title">
      <div className={`wrap ${styles.wrap}`} data-reveal="">
        <div className={styles.card}>
          <div className={styles.rings} aria-hidden="true" />
          <div className={styles.copy}>
            <p className={styles.eyebrow}>Talk to an advisor</p>
            <h2 id="close-title">
              Talk your plans through <span>with an advisor</span>
            </h2>
            <p className={styles.lede}>Share your plans and speak with an advisor at a time that suits you.</p>
            <div className={styles.actions}>
              <CallbackLink className="btn btn-primary" location="LP Closing - Book a Consultation">
                Book a Consultation <ArrowIcon />
              </CallbackLink>
              <CtaLink className={styles.ghost} href={SITE.whatsapp} location="LP Closing - Speak to a Consultant">
                <WhatsAppIcon />
                <span>Speak to a Consultant</span>
              </CtaLink>
            </div>
            <ul className={styles.points}>
              {POINTS.map((point) => (
                <li key={point}>
                  <CheckIcon />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.side}>
            <figure className={styles.wall}>
              <Image
                src="/images/brand-wall-clean.webp"
                alt="Best Solution logo wall at the Business Bay office"
                width={1100}
                height={677}
                sizes="(max-width: 1020px) 100vw, 500px"
                // Small (about 25 KB) and the largest image when the page reloads scrolled to this card, so load it straight away.
                loading="eager"
              />
              <figcaption>
                <i aria-hidden="true" />
                Business Bay, Dubai
              </figcaption>
            </figure>
            <div className={styles.tiles}>
              <p className={styles.tilesHead}>Or reach us directly</p>
              <a className={styles.tile} href={SITE.phone.href}>
                <span className={styles.tileIco}>
                  <PhoneIcon />
                </span>
                <span>
                  <small>Call</small>
                  <b>{SITE.phone.display}</b>
                </span>
              </a>
              <a className={styles.tile} href={MAPS_URL} target="_blank" rel="noopener">
                <span className={styles.tileIco}>
                  <PinIcon />
                </span>
                <span>
                  <small>Visit</small>
                  <b>Business Bay, Dubai</b>
                </span>
              </a>
              <p className={styles.hours}>
                <i aria-hidden="true" />
                {SITE.hours.long}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.glow} aria-hidden="true">
        <i />
        <i />
      </div>
      <div className={styles.fin}>
        <div className={styles.main}>
          <div className={styles.brand}>
            <a className={styles.flogo} href="#top" aria-label="Best Solution, back to top">
              <Image src={SITE.mark} alt="Best Solution" width={240} height={112} />
            </a>
            <p>
              Private business advice in Business Bay, Dubai. One advisor, with any fees confirmed in writing.
            </p>
            <div className={styles.social}>
              {SOCIAL_LINKS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener" aria-label={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div className={styles.links}>
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title} className={styles.col}>
                <h2>{col.title}</h2>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {l.href ? (
                        <a href={l.href} {...(l.external ? { target: "_blank", rel: "noopener" } : null)}>
                          {l.label}
                        </a>
                      ) : (
                        l.label
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className={styles.ctaCard}>
              <AdvisorsBadge className={styles.live} />
              <h2>Book a Consultation</h2>
              <p>Tell us your plans. We reply by phone, WhatsApp or email.</p>
              <CallbackButton className="btn btn-primary">
                Book a Callback <ArrowIcon />
              </CallbackButton>
              <small>No obligation</small>
            </div>
          </div>
        </div>

        <div className={styles.contact}>
          <p className={styles.contactHead}>Get in touch</p>
          <div className={styles.contactRow}>
            {CONTACTS.map((c) => (
              <a
                key={c.title}
                className={styles.ci}
                href={c.href}
                {...(c.external ? { target: "_blank", rel: "noopener" } : null)}
              >
                <span className={styles.ico}>{c.icon}</span>
                <span>
                  <b>{c.title}</b>
                  <small>{c.note}</small>
                </span>
              </a>
            ))}
          </div>
        </div>

        <p className={styles.disclaimer} data-legal>
          {DISCLAIMER}
        </p>
        <p className={styles.disclaimer}>
          Free zone names identify the zones we advise on and do not imply any affiliation. Any fees are confirmed in writing
          before work begins.
        </p>
      </div>

      <div className={styles.bottom}>
        <div className={styles.bin}>
          <p>
            © {year} <strong>Best Solution</strong>. All rights reserved.
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
