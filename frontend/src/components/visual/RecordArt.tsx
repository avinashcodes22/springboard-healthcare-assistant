import { ShieldCheck } from "lucide-react";

export function RecordArt() {
  return (
    <div
      className="record-art"
      role="img"
      aria-label="An illustrated folder of organised medical documents with a Telugu language seal."
    >
      <div className="record-art__frame">
        <span className="record-art__index">PERSONAL RECORD / 01</span>

        <svg
          className="record-art__branch"
          viewBox="0 0 220 260"
          aria-hidden="true"
        >
          <path
            d="M188 236c-36-35-61-80-64-132-1-25 4-51 14-78"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M135 107c-23 1-42-7-55-23 20-4 40 1 55 23Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M142 139c21-9 42-8 60 4-17 13-39 12-60-4Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M127 76c-12-17-13-35-3-53 16 13 19 32 3 53Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="139" cy="27" r="3.5" fill="var(--terracotta)" />
        </svg>

        <article className="paper-sheet paper-sheet--back">
          <p className="paper-sheet__kicker">DISCHARGE SUMMARY</p>
          <div className="paper-sheet__line paper-sheet__line--title" />
          <div className="paper-sheet__line" />
          <div className="paper-sheet__line" />
          <div className="paper-sheet__line is-short" />
          <span className="paper-sheet__tag">PDF</span>
        </article>

        <article className="paper-sheet paper-sheet--front">
          <header className="paper-sheet__head">
            <span className="paper-sheet__mark" aria-hidden="true">
              S
            </span>
            <div>
              <p>SAHAAYA CARE FILE</p>
              <span>Your records, in one place</span>
            </div>
          </header>

          <div className="paper-sheet__body">
            <p className="paper-sheet__label">WHAT IS INSIDE</p>
            <ul>
              <li>Prescriptions</li>
              <li>Medical reports</li>
              <li>Discharge summaries</li>
            </ul>
          </div>

          <div className="paper-sheet__meta">
            <span>
              <ShieldCheck aria-hidden="true" size={14} />
              Private to you
            </span>
            <span>9 languages</span>
          </div>
        </article>

        <div className="language-seal">
          <span lang="te">తెలుగు</span>
          <small>Language, your way</small>
        </div>

        <p className="record-art__caption">
          Organised documents. A familiar language.
        </p>
      </div>
    </div>
  );
}
