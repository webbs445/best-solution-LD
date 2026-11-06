import Image from "next/image";
import { DISCLAIMER, SITE } from "@/content/site";
import { LEGAL, type LegalBlock } from "@/content/legal";
import { CookieSettingsButton } from "@/components/analytics/CookieConsentBanner";
import { PhoneIcon, WhatsAppIcon } from "@/components/ui/Icons";
import "@/app/consult/consult.css";
import "./legal.css";

const block = ([tag, text]: LegalBlock, i: number) => {
  const Tag = tag === "li" ? "p" : tag;
  return (
    <Tag key={i} className={tag === "li" ? "lg-item" : undefined}>
      {text}
    </Tag>
  );
};

/* /privacy and /terms: the www legal text on this host, inside the same plain header and footer as /consult. */
export function LegalPage({ doc }: { doc: keyof typeof LEGAL }) {
  const { blocks, contactTitle, contactLine } = LEGAL[doc];
  return (
    <div className="ad-page">
      <header className="ad-header">
        <div className="ad-wrap ad-header-in">
          <a className="ad-brand" href="#top" aria-label="Best Solution, back to top">
            <Image src="/brand/icon-mark.webp" alt="" width={28} height={40} priority />
            <span>Best Solution</span>
          </a>
          <div className="ad-head-cta">
            <a className="ad-hbtn" href={SITE.phone.href} aria-label="Call Best Solution">
              <PhoneIcon />
              <span>Call</span>
            </a>
            <a className="ad-hbtn ad-hbtn-wa" href={SITE.whatsapp} target="_blank" rel="noopener" aria-label="WhatsApp Best Solution">
              <WhatsAppIcon />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </header>
      <main id="top" className="ad-wrap lg-doc">
        {blocks.map(block)}
        <h2>{contactTitle}</h2>
        <p>{contactLine}</p>
        <p>
          Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          <br />
          Phone <a href={SITE.phone.href}>{SITE.phone.display}</a>
          <br />
          Office: Business Bay, Dubai, UAE
        </p>
      </main>
      <footer className="ad-footer">
        <div className="ad-wrap">
          <nav className="ad-foot-links" aria-label="Legal">
            <a href={SITE.privacy}>Privacy Policy</a>
            <a href={SITE.terms}>Terms</a>
            <CookieSettingsButton />
          </nav>
          <p className="ad-foot-disclaimer">{DISCLAIMER}</p>
          <p className="ad-copy">&copy; {new Date().getFullYear()} Best Solution</p>
        </div>
      </footer>
    </div>
  );
}
