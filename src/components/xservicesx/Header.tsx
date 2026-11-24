"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { SITE } from "@/content/site";
import { PLAN_CTA } from "@/content/xservicesx";
import { XS_CONFIG as C } from "@/content/xservicesx.config";
import { ServicesMenu } from "@/components/ui/ServicesMenu";
import { Icon } from "./ui";
import { XsCta, XsPhone, XsWhatsApp } from "./XsCta";

/*
  The page header, matched to the other landing pages' floating header (components/header): logo, the Services
  dropdown, Reviews and FAQ, the phone number and a copper plan button (desktop). At the top it sits on the hero;
  once the page scrolls it becomes a floating rounded bar. Phones: logo plus call and WhatsApp buttons (the sticky bar
  carries the plan button).
*/
export function XsHeader({ showReviews }: { showReviews: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`xs-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="xs-header-bar">
        <a className="xs-logo" href="#top" aria-label="Best Solution, back to top">
          <Image src={SITE.logo} alt="Best Solution" width={135} height={60} priority />
        </a>
        <nav className="xs-nav" aria-label="Page">
          <ServicesMenu />
          {showReviews && <a href="#reviews">Reviews</a>}
          <a href="#faq">FAQ</a>
        </nav>
        <div className="xs-header-act">
          <XsPhone location="header" href={C.phoneNumber.href} className="xs-header-phone">
            <Icon name="phone" size={16} />
            {C.phoneNumber.display}
          </XsPhone>
          {/* Not watched by the phone sticky bar (desktop only, and always on screen). */}
          <XsCta id="header_plan" location="header" className="xs-header-cta" arrow={false} watch={false}>
            {PLAN_CTA}
          </XsCta>
          <div className="xs-header-icons">
            <XsPhone location="header" href={C.phoneNumber.href} className="xs-icon-btn" label={`Call ${C.phoneNumber.display}`}>
              <Icon name="phone" size={20} />
            </XsPhone>
            <XsWhatsApp location="header" className="xs-icon-btn" label="Chat on WhatsApp">
              <Icon name="whatsapp" size={20} className="xs-wa-ico" />
            </XsWhatsApp>
          </div>
        </div>
      </div>
    </header>
  );
}
