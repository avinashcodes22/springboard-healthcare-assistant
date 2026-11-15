import { Outlet } from "react-router-dom";

import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";

export function PublicLayout() {
  return (
    <div className="public-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <PublicHeader />
      <main id="main-content">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
