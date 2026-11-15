import {
  BookOpen,
  FolderOpen,
  History,
  House,
  LayoutDashboard,
  UserRound,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../context/LocaleContext";
import { languageName } from "../../lib/languages";
import { WorkspaceLayout, type WorkspaceNavItem } from "./WorkspaceLayout";

export function AppLayout() {
  const { user } = useAuth();
  const { t } = useLocale();

  const items: WorkspaceNavItem[] = [
    { to: "/", label: t("nav.home"), icon: House, end: true },
    {
      to: "/app",
      label: t("nav.dashboard"),
      icon: LayoutDashboard,
      end: true,
    },
    { to: "/app/profile", label: t("nav.profile"), icon: UserRound },
    { to: "/app/records", label: t("nav.records"), icon: FolderOpen },
    { to: "/app/history", label: t("nav.history"), icon: History },
    { to: "/app/library", label: t("nav.library"), icon: BookOpen },
  ];

  return (
    <WorkspaceLayout
      variant="patient"
      home="/app"
      homeLabel="Sahaaya dashboard"
      roleEyebrow="Patient"
      identityDetail={languageName(user?.preferred_language)}
      navLabel="Patient navigation"
      items={items}
      publicLink
      safetyNote="Sahaaya does not provide emergency care or medical diagnoses."
    />
  );
}
