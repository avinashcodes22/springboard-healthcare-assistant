import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { roleHome } from "../../lib/roles";
import type { Role } from "../../types";

export function RoleRoute({ allow }: { allow: Role[] }) {
  const { user } = useAuth();

  if (!user) return null;

  if (!allow.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return <Outlet />;
}
