import {
  Activity,
  BarChart3,
  FileText,
  LayoutDashboard,
  UserCog,
  UsersRound,
} from "lucide-react";

import { WorkspaceLayout, type WorkspaceNavItem } from "./WorkspaceLayout";

export function AdminLayout() {
  const items: WorkspaceNavItem[] = [
    {
      to: "/admin",
      label: "Overview",
      icon: LayoutDashboard,
      end: true,
    },
    { to: "/admin/users", label: "User Management", icon: UserCog },
    { to: "/admin/workers", label: "Healthcare Workers", icon: UsersRound },
    { to: "/admin/content", label: "Content Management", icon: FileText },
    { to: "/admin/analytics", label: "Healthcare Analytics", icon: BarChart3 },
    { to: "/admin/monitoring", label: "System Monitoring", icon: Activity },
  ];

  return (
    <WorkspaceLayout
      variant="admin"
      home="/admin"
      homeLabel="Sahaaya administration overview"
      roleEyebrow="Administrator"
      identityDetail="Administration workspace"
      navLabel="Administration navigation"
      items={items}
      showLocale={false}
      safetyNote="Administrator actions are audited. Use patient information only for authorized care coordination."
    />
  );
}
