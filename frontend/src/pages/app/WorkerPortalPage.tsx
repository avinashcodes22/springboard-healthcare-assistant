import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  FilePenLine,
  LoaderCircle,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";

import { errorMessage } from "../../api/client";
import {
  createContent,
  deleteContent,
  listMyContent,
  updateContent,
} from "../../api/health-content";
import { ErrorBlock, LoadingBlock } from "../../components/ui/AsyncState";
import { StatusBadge } from "../../components/ui/Badges";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Field, TextArea, TextInput } from "../../components/ui/FormField";
import { LanguageSelect } from "../../components/ui/LanguageSelect";
import { Modal } from "../../components/ui/Modal";
import { Notice } from "../../components/ui/Notice";
import { PageIntro } from "../../components/ui/PageIntro";
import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../context/LocaleContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  contentCategoryLabel,
  formatDateTime,
  languageName,
} from "../../lib/languages";
import type {
  ContentStatus,
  HealthContent,
  HealthContentPayload,
} from "../../types";

interface EditorState {
  id: number | null;
  title: string;
  content: string;
  category: string;
  language: string;
  status: ContentStatus;
}

export function WorkerPortalPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  usePageTitle("Healthcare worker portal");

  const [items, setItems] = useState<HealthContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorErrors, setEditorErrors] = useState<{
    title?: string;
    content?: string;
  }>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HealthContent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setItems(await listMyContent());
    } catch (requestError) {
      setLoadError(
        errorMessage(
          requestError,
          "We could not load your authored content. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "healthcare_worker") void load();
  }, [load, user?.role]);

  if (!user) return null;

  if (user.role !== "healthcare_worker") {
    return <Navigate to="/app" replace />;
  }

  if (!user.is_active || !user.is_approved) {
    return <Navigate to="/pending-approval" replace />;
  }

  const startNew = () => {
    setEditorErrors({});
    setNotice("");
    setEditor({
      id: null,
      title: "",
      content: "",
      category: "general",
      language: user.preferred_language || "en",
      status: "draft",
    });
  };

  const startEdit = (content: HealthContent) => {
    setEditorErrors({});
    setNotice("");
    setEditor({
      id: content.id,
      title: content.title,
      content: content.content,
      category: content.category,
      language: content.language,
      status: content.status,
    });
  };

  const updateEditor = <K extends keyof EditorState>(
    key: K,
    value: EditorState[K],
  ) => {
    setEditor((current) => (current ? { ...current, [key]: value } : current));
    if (key === "title" || key === "content") {
      setEditorErrors((current) => ({ ...current, [key]: undefined }));
    }
    setActionError("");
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;

    const nextErrors: { title?: string; content?: string } = {};
    if (editor.title.trim().length < 3) {
      nextErrors.title = t("worker.validationTitle");
    }
    if (editor.content.trim().length < 20) {
      nextErrors.content = t("worker.validationBody");
    }

    setEditorErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload: HealthContentPayload = {
      title: editor.title.trim(),
      content: editor.content.trim(),
      category: editor.category.trim(),
      language: editor.language,
      status: editor.status,
    };

    setSaving(true);
    setActionError("");

    try {
      if (editor.id) {
        await updateContent(editor.id, payload);
      } else {
        await createContent(payload);
      }
      setNotice(t("worker.saved"));
      setEditor(null);
      await load();
    } catch (requestError) {
      setActionError(errorMessage(requestError, t("worker.failed")));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteContent(deleteTarget.id);
      setItems((current) =>
        current.filter((content) => content.id !== deleteTarget.id),
      );
      if (editor?.id === deleteTarget.id) setEditor(null);
      setDeleteTarget(null);
      setNotice(t("worker.deleted"));
    } catch (requestError) {
      setActionError(
        errorMessage(requestError, "The article could not be deleted."),
      );
    } finally {
      setDeleting(false);
    }
  };

  const submitLabel = saving
    ? t("worker.saving")
    : editor?.status === "published"
      ? editor.id
        ? t("worker.save")
        : t("worker.publish")
      : t("worker.saveDraft");

  return (
    <div className="worker-page">
      <PageIntro
        eyebrow={t("worker.eyebrow")}
        title={t("worker.title")}
        lead={t("worker.intro")}
        actions={
          <Button onClick={startNew} icon={<Plus size={18} />}>
            {t("worker.new")}
          </Button>
        }
      />

      {notice ? <Notice tone="success">{notice}</Notice> : null}
      {actionError ? (
        <Notice tone="error" title={t("worker.failed")}>
          {actionError}
        </Notice>
      ) : null}

      <div className="worker-layout">
        <section className="worker-list" aria-labelledby="authored-content">
          <div className="documents-toolbar">
            <div>
              <p className="eyebrow">CONTENT DESK</p>
              <h2 id="authored-content">{t("worker.authored")}</h2>
            </div>
            <span className="documents-count">
              {items.length} {items.length === 1 ? "article" : "articles"}
            </span>
          </div>

          {loading ? (
            <LoadingBlock />
          ) : loadError ? (
            <ErrorBlock
              title="Content unavailable"
              body={loadError}
              onRetry={() => void load()}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={t("worker.emptyTitle")}
              body={t("worker.emptyBody")}
              action={
                <Button onClick={startNew} icon={<Plus size={18} />}>
                  {t("worker.new")}
                </Button>
              }
            />
          ) : (
            <ul className="content-list">
              {items.map((content) => (
                <li className="content-item" key={content.id}>
                  <div className="content-item__top">
                    <StatusBadge status={content.status} />
                    <span>{contentCategoryLabel(content.category)}</span>
                    <span>{languageName(content.language)}</span>
                  </div>
                  <h3>{content.title}</h3>
                  <p>{content.content}</p>
                  <div className="content-item__foot">
                    <span>{formatDateTime(content.updated_at)}</span>
                    <div className="content-item__actions">
                      {content.status === "published" ? (
                        <Link
                          className="icon-button"
                          to={`/health-resources/${content.id}`}
                          aria-label={`View published article ${content.title}`}
                        >
                          <ExternalLink size={17} aria-hidden="true" />
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => startEdit(content)}
                        aria-label={`Edit ${content.title}`}
                      >
                        <FilePenLine size={17} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button--danger"
                        onClick={() => setDeleteTarget(content)}
                        aria-label={`Delete ${content.title}`}
                      >
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="worker-editor" aria-labelledby="editor-heading">
          {editor ? (
            <form className="content-form" onSubmit={handleSave} noValidate>
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">ARTICLE EDITOR</p>
                  <h2 id="editor-heading">
                    {editor.id ? t("worker.editTitle") : t("worker.createTitle")}
                  </h2>
                </div>
                {saving ? (
                  <LoaderCircle
                    className="spin-icon"
                    size={20}
                    aria-hidden="true"
                  />
                ) : null}
              </div>

              <Field
                label={t("worker.contentTitle")}
                htmlFor="content-title"
                error={editorErrors.title}
              >
                <TextInput
                  id="content-title"
                  value={editor.title}
                  onChange={(event) =>
                    updateEditor("title", event.target.value)
                  }
                  invalid={Boolean(editorErrors.title)}
                  maxLength={200}
                  placeholder="A clear, plain-language title"
                  aria-describedby={
                    editorErrors.title ? "content-title-error" : undefined
                  }
                  required
                />
              </Field>

              <div className="form-grid">
                <Field
                  label={t("worker.category")}
                  htmlFor="content-category"
                  hint={t("worker.categoryHint")}
                >
                  <TextInput
                    id="content-category"
                    value={editor.category}
                    onChange={(event) =>
                      updateEditor("category", event.target.value)
                    }
                    maxLength={50}
                    placeholder="nutrition"
                    aria-describedby="content-category-hint"
                    required
                  />
                </Field>

                <Field
                  label={t("worker.language")}
                  htmlFor="content-language"
                >
                  <LanguageSelect
                    id="content-language"
                    value={editor.language}
                    onChange={(value) => updateEditor("language", value)}
                  />
                </Field>
              </div>

              <Field
                label={t("worker.contentBody")}
                htmlFor="content-body"
                error={editorErrors.content}
                hint="Plain text. Separate paragraphs with a blank line."
              >
                <TextArea
                  id="content-body"
                  value={editor.content}
                  onChange={(event) =>
                    updateEditor("content", event.target.value)
                  }
                  invalid={Boolean(editorErrors.content)}
                  rows={10}
                  maxLength={50000}
                  placeholder="Write general health education for the community."
                  aria-describedby={
                    editorErrors.content
                      ? "content-body-error"
                      : "content-body-hint"
                  }
                  required
                />
              </Field>

              <fieldset className="status-options">
                <legend>{t("worker.status")}</legend>
                <label
                  className={
                    editor.status === "draft" ? "is-selected" : ""
                  }
                >
                  <input
                    type="radio"
                    name="content-status"
                    value="draft"
                    checked={editor.status === "draft"}
                    onChange={() => updateEditor("status", "draft")}
                  />
                  <span>{t("worker.draftOption")}</span>
                </label>
                <label
                  className={
                    editor.status === "published" ? "is-selected" : ""
                  }
                >
                  <input
                    type="radio"
                    name="content-status"
                    value="published"
                    checked={editor.status === "published"}
                    onChange={() => updateEditor("status", "published")}
                  />
                  <span>{t("worker.publishedOption")}</span>
                </label>
              </fieldset>

              <Notice tone="warning">{t("worker.safety")}</Notice>

              <div className="form-actions">
                <Button type="submit" loading={saving}>
                  {submitLabel}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setEditor(null)}
                  disabled={saving}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </form>
          ) : (
            <div className="editor-placeholder">
              <span className="editor-placeholder__icon" aria-hidden="true">
                <FilePenLine size={28} strokeWidth={1.6} />
              </span>
              <h2 id="editor-heading">{t("worker.createTitle")}</h2>
              <p>{t("worker.intro")}</p>
              <Button onClick={startNew} icon={<Plus size={18} />}>
                {t("worker.new")}
              </Button>
              <div className="editor-placeholder__note">
                <ShieldCheck size={18} aria-hidden="true" />
                <span>
                  Only active, approved healthcare workers can publish content.
                </span>
              </div>
              <Link className="text-link" to="/health-resources">
                {t("worker.viewPublic")}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          )}
        </aside>
      </div>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        title={t("worker.deleteTitle")}
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
              {t("worker.deleteConfirm")}
            </Button>
          </div>
        }
      >
        <p className="modal-copy">{t("worker.deleteBody")}</p>
        {deleteTarget ? (
          <p className="modal-file">{deleteTarget.title}</p>
        ) : null}
      </Modal>
    </div>
  );
}
