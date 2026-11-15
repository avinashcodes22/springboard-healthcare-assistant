import type { ReactNode } from "react";

interface PageIntroProps {
  eyebrow: string;
  title: string;
  lead?: string;
  actions?: ReactNode;
}

export function PageIntro({
  eyebrow,
  title,
  lead,
  actions,
}: PageIntroProps) {
  return (
    <header className="page-intro">
      <div className="page-intro__copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {lead ? <p className="page-intro__lead">{lead}</p> : null}
      </div>
      {actions ? <div className="page-intro__actions">{actions}</div> : null}
    </header>
  );
}
