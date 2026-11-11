import { CookieSettingsButton } from "@/components/analytics/CookieConsentBanner";
import Image from "next/image";
import { CLAIMS, DISCLAIMER, SITE } from "@/content/site";
import { SPV_WA_HREF } from "@/content/spv";

/* Footer and the mobile dock. Converted from the structuring landing page HTML. */
export function SpvFooter() {
  return (
    <>
<footer className="ft">
  <div className="wrap">
    <div className="ft-big rv"><p className="ft-st"><span>Structure it right.</span><span className="o">Protect what matters.</span></p><a className="btn btn-cu" href="#consult" data-cta-location="SPV Footer Book">Book a Consultation <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></a></div>
    <div className="ft-top">
      <div><Image src={SITE.mark} alt="Best Solution" width={111} height={52} /><p>Private advisory on foundations, SPVs, holding and offshore companies, from our office in Business Bay, Dubai.</p></div>
      <div><h4>Explore</h4><a href="#why">Why a structure</a><a href="#compare">Structures</a><a href="#fit">Find your fit</a><a href="#faq">FAQ</a><a href="/services">All services</a></div>
      <div><h4>Contact</h4><a href={SITE.phone.href} data-area="SPV Footer">{SITE.phone.display}</a><a href={SITE.whatsapp} target="_blank" rel="noopener" data-area="SPV Footer">WhatsApp</a><a href={`mailto:${SITE.email}`} data-area="SPV Footer">{SITE.email}</a></div>
    </div>
    <p className="ft-legal" data-legal>{DISCLAIMER}</p>
    <p className="ft-legal" data-legal>Best Solution is based in Business Bay, Dubai. Information on this page is general, is not legal, tax or investment advice, and does not replace advice on your own circumstances. Diagrams are illustrations only. {CLAIMS.writtenQuote ? "Fees are confirmed in writing after your consultation." : "Fees are explained in your consultation."}</p>
    <div className="ft-bot"><span>© {new Date().getFullYear()} Best Solution. All rights reserved.</span><span className="ft-links"><a href={SITE.privacy} style={{ textDecoration: "underline" }}>Privacy policy</a><a href={SITE.terms} style={{ textDecoration: "underline" }}>Terms</a><CookieSettingsButton className="ft-cookie" /></span></div>
  </div>
</footer>

<div className="dock" id="dock">
  <a className="wa" href={SPV_WA_HREF} target="_blank" rel="noopener" data-area="SPV Mobile Dock"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" /></svg>WhatsApp</a>
  <a className="pl" href="#consult" data-cta-location="SPV Mobile Dock Book">Book a Consultation</a>
</div>
    </>
  );
}
