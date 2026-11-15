import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Download,
  History,
  LoaderCircle,
  UploadCloud,
} from "lucide-react";
import { Link } from "react-router-dom";

import { errorMessage } from "../../api/client";
import { downloadDocument } from "../../api/documents";
import { getHistory } from "../../api/users";
import { ErrorBlock, LoadingBlock } from "../../components/ui/AsyncState";
import { CategoryBadge, FileTypeBadge } from "../../components/ui/Badges";
import { DocumentTypeIcon } from "../../components/ui/DocumentTypeIcon";
import { EmptyState } from "../../components/ui/EmptyState";
import { Notice } from "../../components/ui/Notice";
import { PageIntro } from "../../components/ui/PageIntro";
import { useLocale } from "../../context/LocaleContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import { formatDateTime } from "../../lib/languages";
import type { HistoryItem } from "../../types";

export function HistoryPage() {
  const { t } = useLocale();
  usePageTitle("My medical history");

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await getHistory());
    } catch (requestError) {
      setError(
        errorMessage(
          requestError,
          "We could not load your medical history. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDownload = async (item: HistoryItem) => {
    setDownloadingId(item.document_id);
    setDownloadError("");
    try {
      await downloadDocument({
        id: item.document_id,
        original_filename: item.original_filename,
      });
    } catch (requestError) {
      setDownloadError(
        errorMessage(requestError, t("records.downloadFailed")),
      );
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="history-page">
      <PageIntro
        eyebrow={t("history.eyebrow")}
        title={t("history.title")}
        lead={t("history.intro")}
        actions={
          <Link className="btn btn--secondary" to="/app/records">
            <UploadCloud size={18} aria-hidden="true" />
            {t("records.upload")}
          </Link>
        }
      />

      {downloadError ? (
        <Notice tone="error" title={t("records.downloadFailed")}>
          {downloadError}
        </Notice>
      ) : null}

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock
          title="History unavailable"
          body={error}
          onRetry={() => void load()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={History}
          title={t("history.emptyTitle")}
          body={t("history.emptyBody")}
          action={
            <Link className="btn btn--primary" to="/app/records">
              <UploadCloud size={18} aria-hidden="true" />
              {t("records.upload")}
            </Link>
          }
        />
      ) : (
        <>
          <div className="history-head">
            <span className="eyebrow">{t("history.timelineLabel")}</span>
            <span>{items.length} records</span>
          </div>

          <ol className="timeline" aria-label={t("history.timelineLabel")}>
            {items.map((item) => (
              <li className="timeline__item" key={item.document_id}>
                <span className="timeline__marker" aria-hidden="true">
                  <span />
                </span>
                <div className="timeline__date">
                  <CalendarDays size={15} aria-hidden="true" />
                  {formatDateTime(item.upload_date)}
                </div>
                <div className="timeline__card">
                  <div className="timeline__card-main">
                    <DocumentTypeIcon
                      contentType={item.file_type}
                      size={22}
                    />
                    <div>
                      <h3>{item.original_filename}</h3>
                      <div className="timeline__meta">
                        <CategoryBadge category={item.category} />
                        <FileTypeBadge contentType={item.file_type} />
                        <span>{t("history.uploaded")}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => void handleDownload(item)}
                    disabled={downloadingId === item.document_id}
                    aria-label={`Download ${item.original_filename}`}
                  >
                    {downloadingId === item.document_id ? (
                      <LoaderCircle
                        className="spin-icon"
                        size={18}
                        aria-hidden="true"
                      />
                    ) : (
                      <Download size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ol>

          <p className="history-note">{t("history.note")}</p>
        </>
      )}
    </div>
  );
}
