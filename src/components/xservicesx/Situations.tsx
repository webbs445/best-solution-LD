import { S3_BIG, S3_CARDS } from "@/content/xservicesx";
import { XS_CONFIG as C } from "@/content/xservicesx.config";
import { Icon } from "./ui";
import { XsCta } from "./XsCta";
import { FzExplainButton, FzExplainInCard, FzExplainRow } from "./FzExplainer";

/*
  Section 3: the "planning a new company" card, four smaller situations (link to the service page, chip action that
  sets the topic) and the "Not sure" bar. Server rendered; lift and icon fill on hover or focus are CSS only.
*/
export function Situations() {
  return (
    <section className="xs-sec xs-s3" id="services" aria-labelledby="xsS3">
      <div className="xs-wrap">
        <div className="xs-head">
          <span className="xs-eyebrow">WHERE ARE YOU RIGHT NOW?</span>
          <h2 id="xsS3">
            Pick your situation.<span className="d-only"> We&apos;ll take it from there.</span>
          </h2>
        </div>
        <div className="xs-bento">
          <article className="xs-card xs-big">
            <div className="xs-big-top">
              <span className="xs-tag">MOST COMMON</span>
              <h3>{S3_BIG.title}</h3>
              <p className="d-only">{S3_BIG.text}</p>
              <p className="p-only xs-big-one">{S3_BIG.textShort}</p>
            </div>
            <div className="xs-big-get t-up">
              <span className="xs-eyebrow d-only">YOU&apos;LL GET</span>
              <ul>
                {S3_BIG.points.map((p, i) => (
                  <li key={p}>
                    <Icon name="check" size={16} strokeWidth={2.6} />
                    <span className="d-only">{p}</span>
                    <span className="m-only">{S3_BIG.pointsShort[i]}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Decorative written-plan preview filling the card's spare height on desktop (scaled or hidden if short). */}
            <div className="xs-big-preview" aria-hidden="true">
              <div className="xs-big-inset">
              <div className="xs-big-sheet">
                <b>Best Solution · Written plan</b>
                <span className="xs-bs-row">
                  <span>Right structure</span>
                  <i style={{ width: 92 }} />
                </span>
                <span className="xs-bs-row">
                  <span>Year one</span>
                  <span>
                    AED <i style={{ width: 70 }} />
                  </span>
                </span>
                <span className="xs-bs-row">
                  <span>Every year after</span>
                  <span>
                    AED <i style={{ width: 56 }} />
                  </span>
                </span>
                <span className="xs-bs-row">
                  <span>Timeline</span>
                  <span>
                    <i style={{ width: 34 }} /> weeks
                  </span>
                </span>
              </div>
                <span className="xs-big-caption">Example layout. Yours depends on your activity.</span>
              </div>
            </div>
            <div className="xs-big-actions">
              <XsCta id="s3_plan_new_company" location="s3" set={{ topic: "new_company" }} source="s3">
                Plan my new company
              </XsCta>
              <a className="xs-link" href={C.servicePages.new_company}>
                Plan your budget <span aria-hidden="true">→</span>
              </a>
            </div>
          </article>
          {S3_CARDS.map((c, i) => [
            <article key={c.topic} className="xs-card xs-small">
              <div className="xs-small-top">
                <span className="xs-ico">
                  <Icon name={c.icon} size={20} />
                </span>
                <span className="xs-num d-only" aria-hidden="true">
                  0{i + 2}
                </span>
              </div>
              <h3>
                <span className="d-only">{c.title}</span>
                <span className="m-only">{c.titleShort}</span>
              </h3>
              {c.topic === "fz_or_mainland" && <FzExplainButton />}
              {c.topic === "fz_or_mainland" ? <FzExplainInCard what={c.what} /> : <p className="d-only">{c.what}</p>}
              <div className="xs-small-foot">
                <a className="xs-link d-only" href={C.servicePages[c.topic as keyof typeof C.servicePages]}>
                  {c.page} <span aria-hidden="true">→</span>
                </a>
                <XsCta id={c.ctaId} location="s3" variant="chip" set={{ topic: c.topic }} source="s3" className="d-only">
                  {c.cta}
                </XsCta>
                <XsCta id={c.ctaId} location="s3" variant="chip" set={{ topic: c.topic }} source="s3" className="m-only xs-tile-act">
                  {c.ctaShort} <span aria-hidden="true">→</span>
                </XsCta>
              </div>
            </article>,
            c.topic === "holding" && <FzExplainRow key="explain-row" />,
          ])}
        </div>
        <div className="xs-notsure">
          <span className="xs-ico" aria-hidden="true">
            <Icon name="help" size={22} />
          </span>
          <div>
            <h3>Not sure which one fits?</h3>
            <p>
              Tell us your plan<span className="d-only"> in a few lines</span>. An advisor tells you where to begin.
            </p>
          </div>
          <XsCta id="s3_not_sure" location="s3" variant="dark" set={{ topic: "not_sure" }} source="s3">
            Tell us your plan
          </XsCta>
        </div>
      </div>
    </section>
  );
}
