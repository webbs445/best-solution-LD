import Image from "next/image";
import { SITE } from "@/content/site";
import { SPV_WA_HREF } from "@/content/spv";

/* Footer and the mobile dock. Converted from the structuring landing page HTML. */
export function SpvFooter() {
  return (
    <>
<footer className="ft">
  <div className="wrap">
    <div className="ft-big rv"><p className="ft-st"><span>Structure it right.</span><span className="o">Protect what matters.</span></p><a className="btn btn-cu" href="#consult" data-cta-location="SPV Footer Book">Book a free consultation <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></a></div>
    <div className="ft-top">
      <div><Image src={SITE.mark} alt="Best Solution" width={111} height={52} /><p>Private advisory on foundations, SPVs, holding and offshore companies, from our office in Business Bay, Dubai.</p></div>
      <div><h4>Explore</h4><a href="#why">Why a structure</a><a href="#compare">Structures</a><a href="#fit">Find your fit</a><a href="#faq">FAQ</a></div>
      <div><h4>Contact</h4><a href={SITE.phone.href} data-area="SPV Footer">{SITE.phone.display}</a><a href={SITE.whatsapp} target="_blank" rel="noopener" data-area="SPV Footer">WhatsApp</a><a href={`mailto:${SITE.email}`} data-area="SPV Footer">{SITE.email}</a></div>
    </div>
    <p className="ft-legal">Best Solution® is a private business consultancy based in Business Bay, Dubai. We are not affiliated with any government entity, free zone authority or registry, and we do not issue government documents. Decisions on entities, residency and property ownership are made solely by the relevant UAE authorities. Information on this page is general, is not legal, tax or investment advice, and does not replace advice on your own circumstances. Diagrams are illustrations only. Fees are confirmed in writing after your consultation.</p>
    <div className="ft-bot"><span>© {new Date().getFullYear()} Best Solution®. All rights reserved.</span><a href={SITE.privacy} style={{ textDecoration: "underline" }}>Privacy policy</a></div>
  </div>
</footer>

<div className="dock" id="dock">
  <a className="wa" href={SPV_WA_HREF} target="_blank" rel="noopener" data-area="SPV Mobile Dock"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" /></svg>WhatsApp</a>
  <a className="pl" href="#consult" data-cta-location="SPV Mobile Dock Book">Book free consultation</a>
</div>
    </>
  );
}
