import Image from "next/image";
import { SITE } from "@/content/site";
import { SPV_WA_HREF } from "@/content/spv";

/* Scroll progress, header and mobile menu. Converted from the structuring landing page HTML. */
export function SpvChrome() {
  return (
    <>
<div className="sprog" aria-hidden="true"><i id="sprog"></i></div>
<header className="top" id="top">
  <div className="wrap">
    <a className="brand" href="#main" aria-label="Best Solution home"><Image src={SITE.logo} alt="Best Solution" width={95} height={42} priority /></a>
    <nav className="nav" aria-label="Sections"><a href="#why">Why a structure</a><a href="#compare">Structures</a><a href="#fit">Find your fit</a><a href="#layers">How it works</a><a href="#faq">FAQ</a></nav>
    <div className="tact">
      <a className="ico-btn" href={SPV_WA_HREF} target="_blank" rel="noopener" aria-label="Chat on WhatsApp" data-area="SPV Header"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.3z" /></svg></a>
      <a className="btn btn-cu hb" href="#consult" data-cta-location="SPV Header Book">Book a consultation</a>
      <button className="burger" id="burger" aria-label="Open menu" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
    </div>
  </div>
</header>
<nav className="drawer" id="drawer" aria-label="Menu">
  <a href="#why">Why a structure</a><a href="#compare">Structures</a><a href="#fit">Find your fit</a><a href="#layers">How it works</a><a href="#faq">FAQ</a><a className="dcta" href="#consult" data-cta-location="SPV Drawer Book">Book a free consultation</a>
</nav>
    </>
  );
}
