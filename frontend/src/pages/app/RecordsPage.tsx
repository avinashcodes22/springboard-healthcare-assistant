import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import {
  Download,
  FileSearch,
  FolderOpen,
  LoaderCircle,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import { errorMessage } from "../../api/client";
import {
  deleteDocument,
  downloadDocument,
  getDocument,
  listDocuments,
  uploadDocument,
} from "../../api/documents";
import { ErrorBlock, LoadingBlock } from "../../components/ui/AsyncState";
import { Button } from "../../components/ui/Button";
import {
  CategoryBadge,
  FileTypeBadge,
} from "../../components/ui/Badges";
import { DocumentTypeIcon } from "../../components/ui/DocumentTypeIcon";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { Notice } from "../../components/ui/Notice";
import { PageIntro } from "../../components/ui/PageIntro";
import { useLocale } from "../../context/LocaleContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  DOCUMENT_CATEGORIES,
  documentCategoryLabel,
  formatBytes,
  formatDate,
  formatDateTime,
} from "../../lib/languages";
import type { DocumentCategory, MedicalDocument } from "../../types";

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];

function fileExtension(name: string): string {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index).toLowerCase() : "";
}

export function RecordsPage() {
  const { t } = useLocale();
  usePageTitle("My health records");

  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState<DocumentCategory | "all">("all");

  const [category, setCategory] =
    useState<DocumentCategory>("medical_report");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const [detail, setDetail] = useState<MedicalDocument | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MedicalDocument | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await listDocuments();
      setDocuments(data);
    } catch (requestError) {
      setLoadError(
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
    void load();
  }, [load]);

  const chooseFile = (candidate: File | undefined) => {
    setUploadError("");
    setNotice("");

    if (!candidate) {
      setFile(null);
      return;
    }

    if (!ALLOWED_EXTENSIONS.includes(fileExtension(candidate.name))) {
      setFile(null);
      setFileError(t("records.validationType"));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (candidate.size > MAX_UPLOAD_SIZE) {
      setFile(null);
      setFileError(t("records.validationSize"));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (candidate.size === 0) {
      setFile(null);
      setFileError(t("records.validationEmpty"));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFileError("");
    setFile(candidate);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    chooseFile(event.dataTransfer.files[0]);
  };

  const clearFile = () => {
    setFile(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    setUploadError("");
    setNotice("");

    if (!file) {
      setFileError(t("records.validationEmpty"));
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      await uploadDocument(file, category, setProgress);
      setNotice(t("records.uploadSuccess"));
      clearFile();
      await load();
    } catch (requestError) {
      setUploadError(
        errorMessage(requestError, t("records.uploadFailed")),
      );
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDownload = async (document: MedicalDocument) => {
    setDownloadingId(document.id);
    setNotice("");
    try {
      await downloadDocument(document);
      setNotice(t("records.downloadStarted"));
    } catch (requestError) {
      setUploadError(
        errorMessage(requestError, t("records.downloadFailed")),
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const openDetails = async (document: MedicalDocument) => {
    setDetailLoading(true);
    setUploadError("");
    try {
      const loaded = await getDocument(document.id);
      setDetail(loaded);
    } catch (requestError) {
      setUploadError(
        errorMessage(requestError, "The document details are unavailable."),
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument(deleteTarget.id);
      setDocuments((current) =>
        current.filter((document) => document.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
      setNotice(t("records.deleted"));
    } catch (requestError) {
      setUploadError(errorMessage(requestError, "The document could not be deleted."));
    } finally {
      setDeleting(false);
    }
  };

  const filtered =
    filter === "all"
      ? documents
      : documents.filter((document) => document.category === filter);

  return (
    <div className="records-page">
      <PageIntro
        eyebrow={t("records.eyebrow")}
        title={t("records.title")}
        lead={t("records.intro")}
      />

      {notice ? <Notice tone="success">{notice}</Notice> : null}
      {uploadError ? (
        <Notice tone="error" title={t("records.uploadFailed")}>
          {uploadError}
        </Notice>
      ) : null}

      <div className="records-layout">
        <section className="upload-panel" aria-labelledby="upload-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">NEW RECORD</p>
              <h2 id="upload-heading">{t("records.uploadTitle")}</h2>
            </div>
            <span className="panel-heading__meta">{t("records.supported")}</span>
          </div>
          <p className="upload-panel__intro">{t("records.uploadIntro")}</p>

          <div className="upload-step">
            <p className="step-label">
              <span aria-hidden="true">01</span>
              {t("records.category")}
            </p>
            <fieldset className="category-options">
              <legend className="sr-only">{t("records.category")}</legend>
              {DOCUMENT_CATEGORIES.map((value) => (
                <label
                  key={value}
                  className={`category-option${
                    category === value ? " is-selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="document-category"
                    value={value}
                    checked={category === value}
                    onChange={() => setCategory(value)}
                  />
                  <span>{documentCategoryLabel(value)}</span>
                </label>
              ))}
            </fieldset>
          </div>

          <div className="upload-step">
            <p className="step-label">
              <span aria-hidden="true">02</span>
              {t("records.file")}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              id="document-file"
              className="sr-only"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={(event) => chooseFile(event.target.files?.[0])}
            />

            <div
              className={`upload-zone${dragActive ? " is-dragging" : ""}${
                file ? " has-file" : ""
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              {file ? (
                <>
                  <span className="upload-zone__icon" aria-hidden="true">
                    <FileSearch size={26} strokeWidth={1.7} />
                  </span>
                  <div className="selected-file">
                    <span className="selected-file__label">
                      {t("records.selected")}
                    </span>
                    <strong>{file.name}</strong>
                    <small>{formatBytes(file.size)}</small>
                  </div>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={clearFile}
                    aria-label={t("records.remove")}
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </>
              ) : (
                <label
                  htmlFor="document-file"
                  className="upload-zone__label"
                >
                  <span className="upload-zone__icon" aria-hidden="true">
                    <UploadCloud size={28} strokeWidth={1.6} />
                  </span>
                  <strong>{t("records.chooseFile")}</strong>
                  <span>{t("records.dropFile")}</span>
                  <small>{t("records.supported")} · max 10 MB</small>
                </label>
              )}
            </div>

            {fileError ? (
              <p className="field__error" role="alert">
                {fileError}
              </p>
            ) : null}
          </div>

          {uploading ? (
            <div className="upload-progress" aria-live="polite">
              <div className="upload-progress__row">
                <span>
                  {t("records.uploading")} {progress}%
                </span>
                <LoaderCircle
                  className="spin-icon"
                  size={16}
                  aria-hidden="true"
                />
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : null}

          <Button
            onClick={() => void handleUpload()}
            loading={uploading}
            disabled={!file}
            size="lg"
            className="upload-panel__submit"
            icon={<UploadCloud size={18} />}
          >
            {t("records.upload")}
          </Button>

          <div className="upload-privacy">
            <ShieldCheck size={18} strokeWidth={1.7} aria-hidden="true" />
            <p>
              Files are validated and stored privately. Only you can download
              the documents in your account.
            </p>
          </div>
        </section>

        <section className="documents-panel" aria-labelledby="documents-heading">
          <div className="documents-toolbar">
            <div>
              <p className="eyebrow">RECORD SHELF</p>
              <h2 id="documents-heading">{t("records.listTitle")}</h2>
            </div>
            <span className="documents-count">
              {documents.length} {documents.length === 1 ? "document" : "documents"}
            </span>
          </div>
          <p className="section-sub">{t("records.listIntro")}</p>

          <div className="filter-row" role="group" aria-label={t("records.categories")}>
            <button
              type="button"
              className={filter === "all" ? "is-active" : ""}
              onClick={() => setFilter("all")}
              aria-pressed={filter === "all"}
            >
              {t("common.allCategories")}
            </button>
            {DOCUMENT_CATEGORIES.map((value) => (
              <button
                key={value}
                type="button"
                className={filter === value ? "is-active" : ""}
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
              >
                {documentCategoryLabel(value)}
              </button>
            ))}
          </div>

          {loading ? (
            <LoadingBlock />
          ) : loadError ? (
            <ErrorBlock
              title="Documents unavailable"
              body={loadError}
              onRetry={() => void load()}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title={t("records.emptyTitle")}
              body={t("records.emptyBody")}
            />
          ) : (
            <ul className="document-list">
              {filtered.map((document) => (
                <li className="document-item" key={document.id}>
                  <DocumentTypeIcon
                    contentType={document.content_type}
                    size={24}
                  />
                  <div className="document-item__body">
                    <button
                      type="button"
                      className="document-item__name"
                      onClick={() => void openDetails(document)}
                      aria-label={`View details for ${document.original_filename}`}
                    >
                      {document.original_filename}
                    </button>
                    <div className="document-item__meta">
                      <CategoryBadge category={document.category} />
                      <span>{formatDate(document.created_at)}</span>
                      <span>{formatBytes(document.size_bytes)}</span>
                      <FileTypeBadge contentType={document.content_type} />
                    </div>
                  </div>
                  <div className="document-item__actions">
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => void handleDownload(document)}
                      disabled={downloadingId === document.id}
                      aria-label={`Download ${document.original_filename}`}
                    >
                      {downloadingId === document.id ? (
                        <LoaderCircle
                          className="spin-icon"
                          size={18}
                          aria-hidden="true"
                        />
                      ) : (
                        <Download size={18} aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      className="icon-button icon-button--danger"
                      onClick={() => setDeleteTarget(document)}
                      aria-label={`Delete ${document.original_filename}`}
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {detailLoading ? (
        <div className="detail-loading">
          <LoadingBlock label="Loading document details" />
        </div>
      ) : null}

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="Document details"
        closeLabel={t("common.close")}
        footer={
          detail ? (
            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setDetail(null)}>
                {t("common.close")}
              </Button>
              <Button
                icon={<Download size={17} />}
                onClick={() => void handleDownload(detail)}
              >
                {t("common.download")}
              </Button>
            </div>
          ) : null
        }
      >
        {detail ? (
          <dl className="detail-list">
            <div>
              <dt>Document</dt>
              <dd>{detail.original_filename}</dd>
            </div>
            <div>
              <dt>{t("records.category")}</dt>
              <dd>{documentCategoryLabel(detail.category)}</dd>
            </div>
            <div>
              <dt>{t("history.uploaded")}</dt>
              <dd>{formatDateTime(detail.created_at)}</dd>
            </div>
            <div>
              <dt>File type</dt>
              <dd>{detail.content_type}</dd>
            </div>
            <div>
              <dt>File size</dt>
              <dd>{formatBytes(detail.size_bytes)}</dd>
            </div>
            <div>
              <dt>Access</dt>
              <dd>Private to your account</dd>
            </div>
          </dl>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        title={t("records.deleteTitle")}
        closeLabel={t("common.close")}
        footer={
          <div className="modal-actions">
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              onClick={() => void confirmDelete()}
            >
              {t("records.deleteConfirm")}
            </Button>
          </div>
        }
      >
        <p className="modal-copy">{t("records.deleteBody")}</p>
        {deleteTarget ? (
          <p className="modal-file">
            <DocumentTypeIcon contentType={deleteTarget.content_type} />
            {deleteTarget.original_filename}
          </p>
        ) : null}
      </Modal>
    </div>
  );
}
