import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Download,
  FolderOpen,
  History,
  UploadCloud,
  UserRound,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";

import { errorMessage } from "../../api/client";
import { downloadDocument, listDocuments } from "../../api/documents";
import { DocumentTypeIcon } from "../../components/ui/DocumentTypeIcon";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorBlock, LoadingBlock } from "../../components/ui/AsyncState";
import { FileTypeBadge } from "../../components/ui/Badges";
import { Notice } from "../../components/ui/Notice";
import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../context/LocaleContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  documentCategoryLabel,
  formatDate,
  formatDateTime,
  languageShortName,
} from "../../lib/languages";
import type { MedicalDocument } from "../../types";

export function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  usePageTitle("Dashboard");

  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listDocuments();
      setDocuments(data);
    } catch (requestError) {
      setError(
        errorMessage(
          requestError,
          "We could not load your documents. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "patient") void load();
  }, [load, user?.role]);

  if (user?.role === "healthcare_worker") {
    return <Navigate to="/app/worker" replace />;
  }

  const firstName = user?.full_name.split(" ")[0] ?? "";
  const recent = documents.slice(0, 3);

  const handleDownload = async (document: MedicalDocument) => {
    setDownloadingId(document.id);
    setNotice("");
    try {
      await downloadDocument(document);
      setNotice(t("records.downloadStarted"));
    } catch (requestError) {
      setNotice(
        errorMessage(requestError, t("records.downloadFailed")),
      );
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="dashboard">
      <header className="dash-head">
        <div>
          <p className="eyebrow">{t("dashboard.eyebrow")}</p>
          <h1>
            {t("dashboard.welcome")}, {firstName}.
          </h1>
          <p className="dash-head__intro">{t("dashboard.intro")}</p>
        </div>
        <div className="dash-language">
          <span>{t("profile.preferred")}</span>
          <strong lang={user?.preferred_language}>
            {languageShortName(user?.preferred_language)}
          </strong>
          <Link to="/app/profile">
            {t("nav.profile")}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </header>

      {notice ? <Notice tone="success">{notice}</Notice> : null}

      <section className="metric-strip" aria-label="Account summary">
        <div className="metric">
          <span className="metric__label">{t("dashboard.recordsMetric")}</span>
          <strong>{loading ? "—" : documents.length}</strong>
          <span className="metric__note">
            {documents.length === 1 ? "document stored" : "documents stored"}
          </span>
        </div>
        <div className="metric">
          <span className="metric__label">{t("dashboard.languageMetric")}</span>
          <strong className="metric__language">
            {languageShortName(user?.preferred_language)}
          </strong>
          <span className="metric__note">
            {user?.preferred_language?.toUpperCase()}
          </span>
        </div>
        <div className="metric">
          <span className="metric__label">{t("dashboard.statusMetric")}</span>
          <strong className="metric__status">
            <span aria-hidden="true" />
            {user?.is_active ? t("profile.active") : t("profile.pending")}
          </strong>
          <span className="metric__note">Patient account</span>
        </div>
      </section>

      <div className="dash-grid">
        <section className="dash-main" aria-labelledby="recent-records">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="eyebrow">YOUR RECORD SHELF</p>
              <h2 id="recent-records">{t("dashboard.recentTitle")}</h2>
            </div>
            {documents.length > 0 ? (
              <Link className="text-link" to="/app/records">
                {t("common.viewAll")}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            ) : null}
          </div>
          <p className="section-sub">{t("dashboard.recentIntro")}</p>

          {loading ? (
            <LoadingBlock />
          ) : error ? (
            <ErrorBlock
              title="Documents unavailable"
              body={error}
              onRetry={() => void load()}
            />
          ) : recent.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title={t("dashboard.emptyTitle")}
              body={t("dashboard.emptyBody")}
              action={
                <Link className="btn btn--primary" to="/app/records">
                  <UploadCloud size={18} aria-hidden="true" />
                  {t("dashboard.uploadTitle")}
                </Link>
              }
            />
          ) : (
            <ul className="record-list">
              {recent.map((document) => (
                <li className="record-row" key={document.id}>
                  <DocumentTypeIcon contentType={document.content_type} />
                  <div className="record-row__body">
                    <Link
                      className="record-row__name"
                      to="/app/records"
                    >
                      {document.original_filename}
                    </Link>
                    <div className="record-row__meta">
                      <span>{documentCategoryLabel(document.category)}</span>
                      <span>{formatDate(document.created_at)}</span>
                      <FileTypeBadge contentType={document.content_type} />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => void handleDownload(document)}
                    disabled={downloadingId === document.id}
                    aria-label={`Download ${document.original_filename}`}
                  >
                    <Download size={18} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="record-footnote">
            Last checked {formatDateTime(new Date().toISOString())}
          </p>
        </section>

        <aside className="dash-side" aria-labelledby="quick-actions">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="eyebrow">SHORTCUTS</p>
              <h2 id="quick-actions">{t("dashboard.quickTitle")}</h2>
            </div>
          </div>

          <Link className="action-tile action-tile--forest" to="/app/records">
            <span className="action-tile__icon" aria-hidden="true">
              <UploadCloud size={24} strokeWidth={1.7} />
            </span>
            <span>
              <strong>{t("dashboard.uploadTitle")}</strong>
              <small>{t("dashboard.uploadBody")}</small>
            </span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>

          <Link className="action-tile action-tile--sage" to="/app/history">
            <span className="action-tile__icon" aria-hidden="true">
              <History size={24} strokeWidth={1.7} />
            </span>
            <span>
              <strong>{t("dashboard.historyTitle")}</strong>
              <small>{t("dashboard.historyBody")}</small>
            </span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>

          <div className="side-note">
            <BookOpen size={22} strokeWidth={1.7} aria-hidden="true" />
            <div>
              <h3>{t("dashboard.libraryTitle")}</h3>
              <p>{t("dashboard.libraryBody")}</p>
              <Link className="text-link" to="/app/library">
                {t("nav.library")}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="side-note side-note--account">
            <UserRound size={22} strokeWidth={1.7} aria-hidden="true" />
            <div>
              <h3>{t("nav.profile")}</h3>
              <p>Update your phone number or preferred language.</p>
              <Link className="text-link" to="/app/profile">
                {t("profile.edit")}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
