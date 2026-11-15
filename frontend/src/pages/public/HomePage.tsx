import {
  ArrowRight,
  BookOpen,
  FileText,
  FolderOpen,
  Languages,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

import { RecordArt } from "../../components/visual/RecordArt";
import { useLocale } from "../../context/LocaleContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import { LANGUAGES } from "../../lib/languages";

export function HomePage() {
  const { t } = useLocale();
  usePageTitle("Healthcare, made understandable");

  const capabilities = [
    {
      icon: FileText,
      title: t("home.cap1Title"),
      body: t("home.cap1Body"),
    },
    {
      icon: FolderOpen,
      title: t("home.cap2Title"),
      body: t("home.cap2Body"),
    },
    {
      icon: Languages,
      title: t("home.cap3Title"),
      body: t("home.cap3Body"),
    },
    {
      icon: BookOpen,
      title: t("home.cap4Title"),
      body: t("home.cap4Body"),
    },
  ];

  const steps = [
    {
      number: "01",
      title: t("home.step1Title"),
      body: t("home.step1Body"),
    },
    {
      number: "02",
      title: t("home.step2Title"),
      body: t("home.step2Body"),
    },
    {
      number: "03",
      title: t("home.step3Title"),
      body: t("home.step3Body"),
    },
  ];

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <p className="eyebrow hero__eyebrow">{t("home.eyebrow")}</p>
            <h1>
              {t("home.headlineLead")}{" "}
              <em>{t("home.headlineAccent")}</em>
            </h1>
            <p className="hero__support">{t("home.supporting")}</p>

            <div className="hero__actions">
              <Link className="btn btn--primary btn--lg" to="/register">
                {t("home.ctaPrimary")}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className="btn btn--secondary btn--lg" to="/login">
                {t("home.ctaSecondary")}
              </Link>
            </div>

            <p className="hero__note">
              <LockKeyhole aria-hidden="true" size={16} />
              {t("home.note")}
            </p>
          </div>

          <RecordArt />
        </div>
      </section>

      <section className="section section--bordered">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t("home.capabilitiesEyebrow")}</p>
              <h2>{t("home.capabilitiesTitle")}</h2>
            </div>
            <p>{t("home.capabilitiesBody")}</p>
          </div>

          <div className="capability-grid">
            {capabilities.map((capability, index) => {
              const Icon = capability.icon;
              return (
                <article className="capability" key={capability.title}>
                  <div className="capability__top">
                    <span className="capability__number" aria-hidden="true">
                      0{index + 1}
                    </span>
                    <Icon
                      className="capability__icon"
                      size={24}
                      strokeWidth={1.7}
                      aria-hidden="true"
                    />
                  </div>
                  <h3>{capability.title}</h3>
                  <p>{capability.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section section--soft">
        <div className="container">
          <div className="section-heading section-heading--steps">
            <div>
              <p className="eyebrow">{t("home.stepsEyebrow")}</p>
              <h2>{t("home.stepsTitle")}</h2>
            </div>
          </div>

          <div className="step-grid">
            {steps.map((step) => (
              <article className="step" key={step.number}>
                <span className="step__number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="language-band">
        <div className="container language-band__grid">
          <div className="language-band__copy">
            <p className="eyebrow eyebrow--light">
              {t("home.languagesEyebrow")}
            </p>
            <h2>{t("home.languagesTitle")}</h2>
            <p>{t("home.languagesBody")}</p>
            <p className="language-band__note">{t("home.languagesNote")}</p>
          </div>

          <ul className="language-grid" aria-label="Supported languages">
            {LANGUAGES.map((language) => (
              <li key={language.code}>
                <span lang={language.code}>{language.native}</span>
                <small>{language.english}</small>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container closing-grid">
          <div className="closing-panel">
            <p className="eyebrow">{t("home.safetyTitle")}</p>
            <div className="closing-panel__body">
              <ShieldCheck
                className="closing-panel__icon"
                size={30}
                strokeWidth={1.6}
                aria-hidden="true"
              />
              <p>{t("home.safetyBody")}</p>
            </div>
          </div>

          <div className="closing-cta">
            <h2>{t("home.closingTitle")}</h2>
            <p>{t("home.closingBody")}</p>
            <Link className="btn btn--primary btn--lg" to="/register">
              {t("home.ctaPrimary")}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="text-link" to="/health-resources">
              {t("nav.resources")}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
