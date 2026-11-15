import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

import { useLocale } from "../../context/LocaleContext";
import { Logo } from "../brand/Logo";

export function PublicFooter() {
  const { t } = useLocale();

  return (
    <footer className="public-footer">
      <div className="container public-footer__grid">
        <div className="public-footer__brand">
          <Link to="/" aria-label="Sahaaya home">
            <Logo tone="light" showTagline />
          </Link>
          <p>{t("footer.notice")}</p>
        </div>

        <div className="public-footer__column">
          <h3>{t("footer.productTitle")}</h3>
          <Link to="/">{t("nav.home")}</Link>
          <Link to="/about">{t("nav.about")}</Link>
          <Link to="/health-resources">{t("nav.resources")}</Link>
        </div>

        <div className="public-footer__column">
          <h3>{t("footer.accountTitle")}</h3>
          <Link to="/login">{t("nav.login")}</Link>
          <Link to="/register">{t("nav.register")}</Link>
          <Link to="/register/worker">{t("auth.workerRegister")}</Link>
        </div>

        <div className="public-footer__safety">
          <ShieldCheck aria-hidden="true" size={22} />
          <div>
            <h3>{t("footer.safetyTitle")}</h3>
            <p>{t("footer.safetyBody")}</p>
          </div>
        </div>
      </div>

      <div className="container public-footer__bottom">
        <span>{t("footer.rights")}</span>
        <span>Sahaaya · {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
