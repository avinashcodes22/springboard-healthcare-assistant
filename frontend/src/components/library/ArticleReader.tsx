import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

import { errorMessage } from "../../api/client";
import { getPublishedContent } from "../../api/health-content";
import { useLocale } from "../../context/LocaleContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  contentCategoryLabel,
  formatDate,
  languageName,
} from "../../lib/languages";
import type { HealthContent } from "../../types";
import { ErrorBlock, LoadingBlock } from "../ui/AsyncState";
import { ContentCategoryBadge } from "../ui/Badges";
import { Notice } from "../ui/Notice";

interface ArticleReaderProps {
  contentId: number;
  backTo: string;
}

export function ArticleReader({ contentId, backTo }: ArticleReaderProps) {
  const { t } = useLocale();

  const [article, setArticle] = useState<HealthContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  usePageTitle(article?.title ?? "Health library");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setArticle(await getPublishedContent(contentId));
    } catch (requestError) {
      setError(
        errorMessage(
          requestError,
          "This health information could not be loaded.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <LoadingBlock label={t("library.loading")} />;
  }

  if (error || !article) {
    return (
      <>
        <Link className="back-link" to={backTo}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t("library.back")}
        </Link>
        <ErrorBlock
          title={t("library.errorTitle")}
          body={error}
          onRetry={() => void load()}
        />
      </>
    );
  }

  const paragraphs = article.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <article className="article-reader">
      <Link className="back-link" to={backTo}>
        <ArrowLeft size={16} aria-hidden="true" />
        {t("library.back")}
      </Link>

      <header className="article-reader__head">
        <div className="article-reader__meta">
          <ContentCategoryBadge category={article.category} />
          <span lang={article.language}>
            {languageName(article.language)}
          </span>
          <span>{formatDate(article.updated_at)}</span>
        </div>
        <h1>{article.title}</h1>
        <p className="article-reader__byline">
          {t("library.by")} {article.author_name}
        </p>
      </header>

      <div className="article-reader__body">
        <aside className="article-reader__rail" aria-hidden="true">
          <span>{contentCategoryLabel(article.category)}</span>
          <span>{formatDate(article.created_at)}</span>
        </aside>
        <div className="prose">
          {paragraphs.map((paragraph, index) => (
            <p key={`${paragraph.slice(0, 24)}-${index}`}>{paragraph}</p>
          ))}
        </div>
      </div>

      <Notice tone="warning">
        <span className="disclaimer-line">
          <ShieldAlert size={18} aria-hidden="true" />
          {t("library.disclaimer")}
        </span>
      </Notice>
      <p className="article-reader__translation">
        {t("library.notTranslated")}
      </p>
    </article>
  );
}
