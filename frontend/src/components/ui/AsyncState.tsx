import { RotateCcw } from "lucide-react";

import { useLocale } from "../../context/LocaleContext";
import { Button } from "./Button";
import { Spinner } from "./Spinner";

export function LoadingBlock({ label }: { label?: string }) {
  const { t } = useLocale();
  return (
    <div className="loading-block" role="status" aria-live="polite">
      <Spinner label={label ?? t("common.loading")} />
      <p>{label ?? t("common.loading")}…</p>
    </div>
  );
}

interface ErrorBlockProps {
  title: string;
  body?: string;
  onRetry?: () => void;
}

export function ErrorBlock({ title, body, onRetry }: ErrorBlockProps) {
  const { t } = useLocale();

  return (
    <div className="error-block" role="alert">
      <h3>{title}</h3>
      {body ? <p>{body}</p> : null}
      {onRetry ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          icon={<RotateCcw size={16} />}
        >
          {t("common.retry")}
        </Button>
      ) : null}
    </div>
  );
}
