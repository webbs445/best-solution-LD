import { AnCta } from "./AnLinks";
import "./an-s2.css";

/* Section 2: what a healthy balance can hide (designs S2E desktop, S2EPhone). Static apart from hover; server component. */
export function AnBalance() {
  return (
    <section className="s2" aria-labelledby="s2-title">
      <div className="an-wrap s2-in">
        <div className="s2-head">
          <div className="s2-hl">
            <span className="s2-eyebrow">{"What your balance won't tell you"}</span>
            <h2 id="s2-title" className="an-h s2-h">
              A healthy bank balance<br /> can hide <b>a bad month.</b>
            </h2>
          </div>
          <p className="s2-lede">Three things sit inside almost every balance, and owners rarely see them until the bank, the auditor or the tax return does.</p>
        </div>

        <div className="s2-cols">
          <div className="s2-col">
            <span className="s2-big an-num">01</span>
            <div className="s2-stage" aria-hidden="true">
              <div className="s2-slip s2-i1 an-num">
                <div className="s2-hd">INVOICE #1043</div>
                <div className="s2-sbody"><span>Sent 28 Jul · Due 27 Aug</span><span className="s2-tot"><span>Total</span><b>18,400</b></span></div>
              </div>
              <div className="s2-slip s2-i2 an-num">
                <div className="s2-hd">INVOICE #1039</div>
                <div className="s2-sbody"><span>Sent 14 Jul · Due 13 Aug</span><span className="s2-tot"><span>Total</span><b>22,600</b></span></div>
              </div>
              <span className="s2-stamp s2-st1">UNPAID · 60+ DAYS</span>
            </div>
            <h3 className="s2-ct">{"Money you're owed"}</h3>
            <p className="s2-cd">{"Invoices sent, not paid. They feel like income. They aren't."}</p>
          </div>

          <div className="s2-col">
            <span className="s2-big an-num">02</span>
            <div className="s2-stage s2-bal an-num" aria-hidden="true">
              <span className="s2-balrow"><span className="s2-ball">YOUR BALANCE</span><span className="s2-balv">212,640</span></span>
              <span className="s2-barx"><span className="s2-own" /><span className="s2-vseg" /></span>
              <span className="s2-legend"><span>Yours to spend</span><span className="s2-vat"><span className="s2-sw" />VAT 7,410 · not yours</span></span>
            </div>
            <h3 className="s2-ct">{"Money that isn't yours"}</h3>
            <p className="s2-cd">If your company charges VAT, part of your balance belongs to the tax return. Spend it, and the return becomes a problem.</p>
          </div>

          <div className="s2-col">
            <span className="s2-big an-num">03</span>
            <div className="s2-stage" aria-hidden="true">
              <div className="s2-slip s2-b s2-b1 an-num"><span className="s2-kind">SUPPLIER BILL</span><span className="s2-brow"><span>Al Noor · 5 Sep</span><b>2,150</b></span></div>
              <div className="s2-slip s2-b s2-b2 an-num"><span className="s2-kind">SUPPLIER BILL</span><span className="s2-brow"><span>Al Noor · 6 Sep</span><b>2,150</b></span></div>
              <span className="s2-stamp s2-st3">×2</span>
            </div>
            <h3 className="s2-ct">Money that left by mistake</h3>
            <p className="s2-cd">A supplier paid twice. A card charge nobody recognises.</p>
          </div>
        </div>

        <div className="s2-end">
          <span className="s2-close">Clean monthly books show all three, <b>before they cost you.</b></span>
          <AnCta section={2} href="#check" className="s2-go">
            <span>
              Is yours hiding something? Check in 60 seconds{" "}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B9714B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14" /><path d="m6 13 6 6 6-6" /></svg>
            </span>
          </AnCta>
        </div>
      </div>
    </section>
  );
}
