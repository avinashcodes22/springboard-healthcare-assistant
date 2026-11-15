import {
  BookOpen,
  CalendarCheck,
  Languages,
  LayoutDashboard,
  UserRound,
  UsersRound,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../context/LocaleContext";
import { languageName } from "../../lib/languages";
import { WorkspaceLayout, type WorkspaceNavItem } from "./WorkspaceLayout";

export function WorkerLayout() {
  const { user } = useAuth();
  const { t } = useLocale();

  const items: WorkspaceNavItem[] = [
    {
      to: "/worker",
      label: t("nav.dashboard"),
      icon: LayoutDashboard,
      end: true,
    },
    { to: "/worker/patients", label: t("nav.patients"), icon: UsersRound },
    {
      to: "/worker/translation",
      label: t("nav.translation"),
      icon: Languages,
    },
    { to: "/worker/content", label: t("nav.healthContent"), icon: BookOpen },
    {
      to: "/worker/follow-ups",
      label: t("nav.followUps"),
      icon: CalendarCheck,
    },
    { to: "/worker/profile", label: t("nav.profile"), icon: UserRound },
  ];

  return (
    <WorkspaceLayout
      variant="worker"
      home="/worker"
      homeLabel="Sahaaya worker dashboard"
      roleEyebrow="Healthcare worker"
      identityDetail={languageName(user?.preferred_language)}
      navLabel="Healthcare worker navigation"
      items={items}
      publicLink
      safetyNote="Only access patients assigned to you. Never record diagnoses or prescribe treatment here."
    />
  );
}
