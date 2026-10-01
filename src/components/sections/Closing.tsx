import Image from "next/image";
import { FOOTER_COLUMNS, MAPS_URL, SITE, SOCIAL } from "@/content/site";
import { CtaLink } from "@/components/ui/CtaLink";
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
import styles from "./Closing.module.css";

const POINTS = ["No obligation", "Estimate confirmed in writing", "Reply within 24 hours"];

/* Closing CTA: a card on the page ground, just above the footer. */
export function Closing() {
  return (
    <section className={styles.close} aria-labelledby="close-title">
      <div className={`wrap ${styles.wrap}`} data-reveal="">
        <div className={styles.card}>
          <div className={styles.rings} aria-hidden="true" />
          <div className={styles.copy}>
            <p className={styles.eyebrow}>Complimentary consultation</p>
            <h2 id="close-title">
              Begin with <span>clarity on cost</span>
            </h2>
            <p className={styles.lede}>Obtain your estimate today and speak with a consultant at a time that suits you.</p>
            <div className={styles.actions}>
              <CtaLink className="btn btn-primary" href="#calculator">
                Calculate Your Setup Cost <ArrowIcon />
              </CtaLink>
              <CtaLink className={styles.ghost} href={SITE.whatsapp}>
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
                src="/images/brand-wall.webp"
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
                Monday to Friday, 9am to 6pm
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
  { href: SITE.phone.href, icon: <PhoneIcon />, title: SITE.phone.display, note: "Mon to Fri, 9AM to 6PM" },
  { href: `mailto:${SITE.email}`, icon: <MailIcon />, title: SITE.email, note: "Reply within 24 hrs" },
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
              Your trusted partner for business setup advice in Dubai. One consultant, every step, with costs confirmed
              in writing.
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
              <span className={styles.live}>
                <i aria-hidden="true" />
                Consultants available
              </span>
              <h2>Free consultation</h2>
              <p>Tell us your plans. A consultant calls you back within one business day.</p>
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

        <p className={styles.disclaimer}>
          Best Solution® is a private business consultancy based in Business Bay, Dubai, and is not affiliated with any
          government entity. All licences, permits and visas are issued solely by the relevant UAE authorities. All costs
          shown are estimates and are confirmed in writing before any engagement.
        </p>
      </div>

      <div className={styles.bottom}>
        <div className={styles.bin}>
          <p>
            © {year} <strong>Best Solution®</strong>. All rights reserved.
          </p>
          <nav aria-label="Legal">
            <a href={SITE.privacy} target="_blank" rel="noopener">
              Privacy Policy
            </a>
            <a href={SITE.terms} target="_blank" rel="noopener">
              Terms of Service
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
