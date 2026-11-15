import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true">
        <Icon size={26} strokeWidth={1.7} />
      </span>
      <h3>{title}</h3>
      <p>{body}</p>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}
