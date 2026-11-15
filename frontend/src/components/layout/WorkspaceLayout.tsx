import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { LogOut, Menu, X } from "lucide-react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../context/LocaleContext";
import { Logo } from "../brand/Logo";
import { LocaleToggle } from "../ui/LocaleToggle";

export interface WorkspaceNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface WorkspaceLayoutProps {
  variant: "patient" | "worker" | "admin";
  home: string;
  homeLabel: string;
  roleEyebrow: string;
  identityDetail: string;
  navLabel: string;
  items: WorkspaceNavItem[];
  showLocale?: boolean;
  publicLink?: boolean;
  safetyNote: string;
}

export function WorkspaceLayout({
  variant,
  home,
  homeLabel,
  roleEyebrow,
  identityDetail,
  navLabel,
  items,
  showLocale = true,
  publicLink = false,
  safetyNote,
}: WorkspaceLayoutProps) {
  const { user, logout } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar-link${isActive ? " is-active" : ""}`;

  return (
    <div className={`app-shell workspace workspace--${variant}`}>
      <a className="skip-link" href="#app-content">
        Skip to main content
      </a>

      {menuOpen ? (
        <button
          type="button"
          className="app-overlay"
          aria-label={t("nav.closeMenu")}
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside className={`app-sidebar${menuOpen ? " is-open" : ""}`}>
        <div className="app-sidebar__top">
          <Link to={home} aria-label={homeLabel}>
            <Logo tone="light" showTagline />
          </Link>
          <button
            type="button"
            className="sidebar-close icon-button"
            onClick={() => setMenuOpen(false)}
            aria-label={t("nav.closeMenu")}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="app-sidebar__identity">
          <p className="eyebrow">{roleEyebrow}</p>
          <p className="app-sidebar__name">{user?.full_name}</p>
          <p className="app-sidebar__language">{identityDetail}</p>
        </div>

        <nav className="sidebar-nav" aria-label={navLabel}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={navClass}
              >
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="app-sidebar__bottom">
          {showLocale ? <LocaleToggle /> : null}
          {publicLink ? (
            <Link className="sidebar-public-link" to="/health-resources">
              {t("nav.publicSite")}
            </Link>
          ) : null}
          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <LogOut size={18} aria-hidden="true" />
            {t("nav.logout")}
          </button>
          <p className="sidebar-safety">{safetyNote}</p>
        </div>
      </aside>

      <div className="app-frame">
        <header className="app-mobile-bar">
          <button
            type="button"
            className="icon-button"
            onClick={() => setMenuOpen(true)}
            aria-label={t("nav.openMenu")}
            aria-expanded={menuOpen}
          >
            <Menu size={22} aria-hidden="true" />
          </button>
          <Link to={home} aria-label={homeLabel}>
            <Logo compact />
          </Link>
          {showLocale ? <LocaleToggle /> : <span aria-hidden="true" />}
        </header>

        <main
          className={`app-content app-content--${variant}`}
          id="app-content"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
