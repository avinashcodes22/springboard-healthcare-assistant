import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../context/LocaleContext";
import { Logo } from "../brand/Logo";
import { LocaleToggle } from "../ui/LocaleToggle";

export function PublicHeader() {
  const { t } = useLocale();
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `public-nav__link${isActive ? " is-active" : ""}`;

  return (
    <header className="public-header">
      <div className="public-header__inner container">
        <Link to="/" className="public-header__brand" aria-label="Sahaaya home">
          <Logo />
        </Link>

        <nav className="public-nav" aria-label="Primary navigation">
          <NavLink to="/" end className={navLinkClass}>
            {t("nav.home")}
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            {t("nav.about")}
          </NavLink>
          <NavLink to="/health-resources" className={navLinkClass}>
            {t("nav.resources")}
          </NavLink>
        </nav>

        <div className="public-header__actions">
          <LocaleToggle />
          {user ? (
            <Link to="/app" className="btn btn--secondary btn--sm">
              {t("nav.dashboard")}
            </Link>
          ) : (
            <>
              <Link className="header-text-link" to="/login">
                {t("nav.login")}
              </Link>
              <Link className="header-register" to="/register">
                {t("nav.register")}
              </Link>
            </>
          )}
          <button
            type="button"
            className="nav-toggle"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
          >
            {open ? (
              <X size={24} aria-hidden="true" />
            ) : (
              <Menu size={24} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div className="mobile-nav" id="mobile-navigation">
          <nav className="container" aria-label="Mobile navigation">
            <NavLink to="/" end className={navLinkClass}>
              {t("nav.home")}
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              {t("nav.about")}
            </NavLink>
            <NavLink to="/health-resources" className={navLinkClass}>
              {t("nav.resources")}
            </NavLink>
            {user ? (
              <NavLink to="/app" className={navLinkClass}>
                {t("nav.dashboard")}
              </NavLink>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>
                  {t("nav.login")}
                </NavLink>
                <NavLink to="/register" className={navLinkClass}>
                  {t("nav.register")}
                </NavLink>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
