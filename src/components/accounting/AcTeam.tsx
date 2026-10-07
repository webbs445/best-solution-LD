import Image from "next/image";
import { AC_TEAM, AC_TEAM_READY } from "@/content/accounting";

/*
  "Your accounting team": a compact strip of the people behind the books. The entries in AC_TEAM are
  placeholders until AC_TEAM_READY is true; until then the strip renders only in development and is
  marked as a placeholder, so it can never reach the live page half-filled.
*/
export function AcTeam() {
  const placeholder = !AC_TEAM_READY;
  if (placeholder && process.env.NODE_ENV === "production") return null;

  return (
    <div className={`team rv${placeholder ? " is-placeholder" : ""}`}>
      <div className="team-head">
        <h3>Your accounting team</h3>
        <p>The people who keep your books, in our Business Bay office.</p>
        {placeholder && <span className="team-flag">Placeholder: shown in development only</span>}
      </div>
      <ul>
        {AC_TEAM.map((m, i) => (
          <li key={i}>
            {m.photo ? (
              <Image className="tm-ph" src={`/team/${m.photo}.webp`} alt="" width={64} height={64} />
            ) : (
              <span className="tm-ph" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                </svg>
              </span>
            )}
            <div>
              <b>{m.name}</b>
              <span>{m.role}</span>
              <em>{m.qualification}</em>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
