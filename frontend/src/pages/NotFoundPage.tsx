import { Link } from "react-router-dom";

import { useLocale } from "../context/LocaleContext";
import { usePageTitle } from "../hooks/usePageTitle";

export function NotFoundPage() {
  const { t } = useLocale();
  usePageTitle("Page not found");

  return (
    <section className="status-page">
      <div className="container status-page__inner">
        <div className="status-card status-card--left">
          <p className="eyebrow">{t("notFound.eyebrow")}</p>
          <h1>{t("notFound.title")}</h1>
          <p className="status-card__lead">{t("notFound.body")}</p>
          <Link className="btn btn--primary" to="/">
            {t("notFound.home")}
          </Link>
        </div>
      </div>
    </section>
  );
}
