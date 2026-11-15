import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { LoadingBlock } from "../ui/AsyncState";

export function ProtectedRoute() {
  const { user, ready, sessionExpired } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="route-loading">
        <LoadingBlock />
      </div>
    );
  }

  if (!user) {
    const target = sessionExpired ? "/login?expired=1" : "/login";
    return (
      <Navigate
        to={target}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}
