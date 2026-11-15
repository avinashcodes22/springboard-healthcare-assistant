import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { FileLock2, Languages, ListChecks } from "lucide-react";

import { Logo } from "../brand/Logo";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  asideTitle?: string;
  asideBody?: string;
}

export function AuthLayout({
  eyebrow,
  title,
  intro,
  children,
  asideTitle = "A quieter way to keep health records.",
  asideBody = "Clear records, your language, and health information that is easy to return to.",
}: AuthLayoutProps) {
  return (
    <div className="auth-shell">
      <a className="skip-link" href="#auth-form">
        Skip to form
      </a>

      <aside className="auth-aside">
        <div className="auth-aside__top">
          <Link to="/" aria-label="Sahaaya home">
            <Logo tone="light" showTagline />
          </Link>
        </div>

        <div className="auth-aside__content">
          <p className="auth-aside__eyebrow">SAHAAYA / CARE RECORDS</p>
          <h2>{asideTitle}</h2>
          <p>{asideBody}</p>

          <ul className="auth-aside__list">
            <li>
              <FileLock2 aria-hidden="true" size={20} />
              <span>Documents tied to your account</span>
            </li>
            <li>
              <Languages aria-hidden="true" size={20} />
              <span>Nine supported language preferences</span>
            </li>
            <li>
              <ListChecks aria-hidden="true" size={20} />
              <span>A clear document history</span>
            </li>
          </ul>
        </div>

        <div className="auth-aside__art" aria-hidden="true">
          <div className="auth-sheet auth-sheet--back" />
          <div className="auth-sheet auth-sheet--front">
            <span />
            <span />
            <span className="is-short" />
            <div className="auth-sheet__stamp">PDF</div>
          </div>
          <div className="auth-seal">తెలుగు</div>
        </div>

        <p className="auth-aside__foot">
          This prototype does not diagnose, prescribe or replace professional
          medical care.
        </p>
      </aside>

      <main className="auth-main" id="auth-form">
        <div className="auth-main__inner">
          <div className="auth-mobile-brand">
            <Link to="/" aria-label="Sahaaya home">
              <Logo />
            </Link>
          </div>
          <div className="auth-heading">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{intro}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
