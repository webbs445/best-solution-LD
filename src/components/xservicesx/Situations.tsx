import { PLAN_CTA, S3_BIG, S3_CARDS } from "@/content/xservicesx";
import { XS_CONFIG as C } from "@/content/xservicesx.config";
import { Icon } from "./ui";
import { XsCta } from "./XsCta";

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
            </div>
            <div className="xs-big-get">
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
            <div className="xs-big-actions">
              <XsCta id="s3_new_company" location="s3" set={{ topic: "new_company" }} source="s3">
                {PLAN_CTA}
              </XsCta>
              <a className="xs-link" href={C.servicePages.new_company}>
                Plan your budget <span aria-hidden="true">→</span>
              </a>
            </div>
          </article>
          {S3_CARDS.map((c, i) => (
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
              <p className="d-only">{c.what}</p>
              <div className="xs-small-foot">
                <a className="xs-link d-only" href={C.servicePages[c.topic as keyof typeof C.servicePages]}>
                  {c.page} <span aria-hidden="true">→</span>
                </a>
                <XsCta id={`s3_${c.topic}`} location="s3" variant="chip" set={{ topic: c.topic }} source="s3" className="d-only">
                  {c.cta}
                </XsCta>
                <XsCta id={`s3_${c.topic}`} location="s3" variant="chip" set={{ topic: c.topic }} source="s3" className="m-only xs-tile-act">
                  {c.ctaShort} <span aria-hidden="true">→</span>
                </XsCta>
              </div>
            </article>
          ))}
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
