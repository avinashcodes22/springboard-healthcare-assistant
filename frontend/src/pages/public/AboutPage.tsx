import {
  ArrowRight,
  BellRing,
  FileLock2,
  HeartHandshake,
  Languages,
  Mic,
  ShieldCheck,
  Siren,
  UserCog,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useLocale } from "../../context/LocaleContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import { LANGUAGES } from "../../lib/languages";

export function AboutPage() {
  const { t } = useLocale();
  usePageTitle("About Sahaaya");

  return (
    <>
      <section className="about-hero">
        <div className="container about-hero__grid">
          <div>
            <p className="eyebrow">{t("about.eyebrow")}</p>
            <h1>{t("about.title")}</h1>
          </div>
          <p className="about-hero__intro">{t("about.intro")}</p>
        </div>
      </section>

      <section className="section section--bordered">
        <div className="container about-grid">
          <article className="about-block about-block--wide">
            <span className="about-block__number">01</span>
            <HeartHandshake aria-hidden="true" size={28} strokeWidth={1.6} />
            <h2>{t("about.missionTitle")}</h2>
            <p>{t("about.missionBody")}</p>
          </article>

          <article className="about-block">
            <span className="about-block__number">02</span>
            <FileLock2 aria-hidden="true" size={28} strokeWidth={1.6} />
            <h2>{t("about.patientsTitle")}</h2>
            <p>{t("about.patientsBody")}</p>
          </article>

          <article className="about-block">
            <span className="about-block__number">03</span>
            <ShieldCheck aria-hidden="true" size={28} strokeWidth={1.6} />
            <h2>{t("about.workersTitle")}</h2>
            <p>{t("about.workersBody")}</p>
          </article>

          <article className="about-block about-block--wide">
            <span className="about-block__number">04</span>
            <UserCog aria-hidden="true" size={28} strokeWidth={1.6} />
            <h2>{t("about.adminTitle")}</h2>
            <p>{t("about.adminBody")}</p>
          </article>
        </div>
      </section>

      <section className="section section--soft">
        <div className="container about-boundaries">
          <div>
            <p className="eyebrow">{t("about.safetyTitle")}</p>
            <h2>{t("about.safetyBody")}</h2>
          </div>
          <div className="about-language-list">
            <p className="eyebrow">{t("common.language")}</p>
            <ul>
              {LANGUAGES.map((language) => (
                <li key={language.code} lang={language.code}>
                  {language.native}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section section--bordered">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Product roadmap</p>
            <h2>{t("about.roadmapTitle")}</h2>
            <p>{t("about.roadmapIntro")}</p>
          </div>
          <div className="public-roadmap">
            <article>
              <Languages size={23} aria-hidden="true" />
              <span className="status-chip status-chip--warning">
                {t("about.roadmapStatus")}
              </span>
              <h3>{t("about.roadmap1Title")}</h3>
              <p>{t("about.roadmap1Body")}</p>
            </article>
            <article>
              <Mic size={23} aria-hidden="true" />
              <span className="status-chip status-chip--warning">
                {t("about.roadmapStatus")}
              </span>
              <h3>{t("about.roadmap2Title")}</h3>
              <p>{t("about.roadmap2Body")}</p>
            </article>
            <article>
              <BellRing size={23} aria-hidden="true" />
              <span className="status-chip status-chip--warning">
                {t("about.roadmapStatus")}
              </span>
              <h3>{t("about.roadmap3Title")}</h3>
              <p>{t("about.roadmap3Body")}</p>
            </article>
            <article>
              <Siren size={23} aria-hidden="true" />
              <span className="status-chip status-chip--warning">
                {t("about.roadmapStatus")}
              </span>
              <h3>{t("about.roadmap4Title")}</h3>
              <p>{t("about.roadmap4Body")}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container about-cta">
          <div>
            <h2>{t("home.closingTitle")}</h2>
            <p>{t("home.closingBody")}</p>
          </div>
          <div className="hero__actions">
            <Link className="btn btn--primary btn--lg" to="/register">
              {t("about.cta")}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="btn btn--secondary btn--lg" to="/health-resources">
              {t("about.ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
