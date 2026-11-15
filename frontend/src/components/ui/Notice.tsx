import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  ShieldAlert,
} from "lucide-react";

type NoticeTone = "info" | "success" | "error" | "warning";

interface NoticeProps {
  tone?: NoticeTone;
  title?: string;
  children: ReactNode;
  role?: "status" | "alert";
}

const icons = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
  warning: ShieldAlert,
};

export function Notice({
  tone = "info",
  title,
  children,
  role = tone === "error" ? "alert" : "status",
}: NoticeProps) {
  const Icon = icons[tone];

  return (
    <div className={`notice notice--${tone}`} role={role}>
      <Icon aria-hidden="true" size={20} className="notice__icon" />
      <div>
        {title ? <strong className="notice__title">{title}</strong> : null}
        <div className="notice__body">{children}</div>
      </div>
    </div>
  );
}
