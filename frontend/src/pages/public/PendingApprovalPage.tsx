import { Clock3 } from "lucide-react";
import { Link } from "react-router-dom";

import { useLocale } from "../../context/LocaleContext";
import { usePageTitle } from "../../hooks/usePageTitle";

export function PendingApprovalPage() {
  const { t } = useLocale();
  usePageTitle("Awaiting approval");

  const steps = [
    { title: t("pending.step1Title"), body: t("pending.step1Body") },
    { title: t("pending.step2Title"), body: t("pending.step2Body") },
    { title: t("pending.step3Title"), body: t("pending.step3Body") },
  ];

  return (
    <section className="status-page">
      <div className="container status-page__inner">
        <div className="status-card">
          <span className="status-card__icon" aria-hidden="true">
            <Clock3 size={30} strokeWidth={1.6} />
          </span>
          <p className="eyebrow">{t("pending.eyebrow")}</p>
          <h1>{t("pending.title")}</h1>
          <p className="status-card__lead">{t("pending.intro")}</p>

          <ol className="status-steps">
            {steps.map((step, index) => (
              <li key={step.title}>
                <span aria-hidden="true">0{index + 1}</span>
                <div>
                  <h2>{step.title}</h2>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="status-card__actions">
            <Link className="btn btn--primary" to="/login">
              {t("pending.login")}
            </Link>
            <Link className="btn btn--secondary" to="/">
              {t("pending.home")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
