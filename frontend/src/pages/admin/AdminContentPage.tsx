import { useEffect, useState, type FormEvent } from "react";
import { FileText, PencilLine } from "lucide-react";

import {
  listAdminContent,
  updateAdminContent,
} from "../../api/admin";
import { errorMessage } from "../../api/client";
import { ErrorBlock, LoadingBlock } from "../../components/ui/AsyncState";
import { ContentCategoryBadge, StatusBadge } from "../../components/ui/Badges";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Field, SelectInput, TextInput } from "../../components/ui/FormField";
import { Modal } from "../../components/ui/Modal";
import { Notice } from "../../components/ui/Notice";
import { PageIntro } from "../../components/ui/PageIntro";
import { usePageTitle } from "../../hooks/usePageTitle";
import { LANGUAGES, formatDate, languageShortName } from "../../lib/languages";
import type {
  ContentStatus,
  HealthContent,
} from "../../types";

type Filter = "all" | ContentStatus;

export function AdminContentPage() {
  const [content, setContent] = useState<HealthContent[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [editTarget, setEditTarget] = useState<HealthContent | null>(null);
  const [status, setStatus] = useState<ContentStatus>("draft");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("en");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  usePageTitle("Content management");

  const load = () => {
    setLoading(true);
    setError("");
    listAdminContent()
      .then(setContent)
      .catch((requestError: unknown) => {
        setError(
          errorMessage(requestError, "We could not load health content."),
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openEditor = (article: HealthContent) => {
    setEditTarget(article);
    setStatus(article.status);
    setCategory(article.category);
    setLanguage(article.language);
    setFormError("");
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;
    if (!category.trim()) {
      setFormError("Enter a category.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const updated = await updateAdminContent(editTarget.id, {
        status,
        category: category.trim(),
        language,
      });
      setContent((current) =>
        current.map((article) =>
          article.id === updated.id ? updated : article,
        ),
      );
      setEditTarget(null);
      setSuccess(`"${updated.title}" was updated.`);
    } catch (requestError: unknown) {
      setFormError(
        errorMessage(requestError, "The article could not be updated."),
      );
    } finally {
      setSaving(false);
    }
  };

  const filtered =
    filter === "all"
      ? content
      : content.filter((article) => article.status === filter);

  if (loading) return <LoadingBlock label="Loading health content" />;

  if (error) {
    return (
      <ErrorBlock
        title="Health content could not be loaded."
        body={error}
        onRetry={load}
      />
    );
  }

  return (
    <>
      <PageIntro
        eyebrow="Health information"
        title="Content management"
        lead="Review worker-authored health education, control publication status and organize categories and languages."
      />

      {success ? <Notice tone="success">{success}</Notice> : null}

      <div className="toolbar-row">
        <div className="filter-tabs" role="tablist" aria-label="Content status">
          {(
            [
              { value: "all", label: "All", count: content.length },
              {
                value: "published",
                label: "Published",
                count: content.filter((item) => item.status === "published")
                  .length,
              },
              {
                value: "draft",
                label: "Drafts",
                count: content.filter((item) => item.status === "draft").length,
              },
            ] as { value: Filter; label: string; count: number }[]
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={filter === tab.value}
              className={filter === tab.value ? "is-active" : ""}
              onClick={() => setFilter(tab.value)}
            >
              {tab.label}
              <span>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {content.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No health content has been created."
          body="Published and draft articles from approved healthcare workers will appear here."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No articles in this view."
          body="Choose another status filter to see the rest of the content."
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Category</th>
                <th>Language</th>
                <th>Author</th>
                <th>Status</th>
                <th>Updated</th>
                <th className="cell-actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((article) => (
                <tr key={article.id}>
                  <td>
                    <span className="table-primary">{article.title}</span>
                    <span className="table-secondary">
                      {article.content.slice(0, 96)}
                      {article.content.length > 96 ? "…" : ""}
                    </span>
                  </td>
                  <td>
                    <ContentCategoryBadge category={article.category} />
                  </td>
                  <td>{languageShortName(article.language)}</td>
                  <td>{article.author_name}</td>
                  <td>
                    <StatusBadge status={article.status} />
                  </td>
                  <td>{formatDate(article.updated_at)}</td>
                  <td className="cell-actions">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditor(article)}
                      icon={<PencilLine size={15} />}
                    >
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="content-footnote">
        Article text stays authored by healthcare workers. Administrators control
        publication status and classification metadata.
      </p>

      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="Review article metadata"
      >
        {editTarget ? (
          <form className="stacked-form" onSubmit={handleSave} noValidate>
            <div className="review-snippet">
              <p className="eyebrow">Article</p>
              <h3>{editTarget.title}</h3>
              <p>{editTarget.content.slice(0, 220)}…</p>
              <span>By {editTarget.author_name}</span>
            </div>

            {formError ? (
              <p className="inline-error" role="alert">
                {formError}
              </p>
            ) : null}

            <Field label="Publication status" htmlFor="admin-content-status">
              <SelectInput
                id="admin-content-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ContentStatus)
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </SelectInput>
            </Field>
            <Field label="Category" htmlFor="admin-content-category">
              <TextInput
                id="admin-content-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                required
              />
            </Field>
            <Field label="Language" htmlFor="admin-content-language">
              <SelectInput
                id="admin-content-language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
              >
                {LANGUAGES.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.native} · {option.english}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setEditTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {saving ? "Saving…" : "Save review"}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </>
  );
}
