import { useCallback, useEffect, useState } from "react";
import { ArrowRight, BookOpen, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";

import { listPublishedContent } from "../../api/health-content";
import { errorMessage } from "../../api/client";
import { useLocale } from "../../context/LocaleContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  contentCategoryLabel,
  formatDate,
  LANGUAGES,
  languageShortName,
} from "../../lib/languages";
import type { HealthContent } from "../../types";
import { ErrorBlock, LoadingBlock } from "../ui/AsyncState";
import { ContentCategoryBadge } from "../ui/Badges";
import { EmptyState } from "../ui/EmptyState";
import { LanguageSelect } from "../ui/LanguageSelect";
import { PageIntro } from "../ui/PageIntro";

interface LibraryBrowserProps {
  linkBase: string;
}

export function LibraryBrowser({ linkBase }: LibraryBrowserProps) {
  const { t } = useLocale();
  usePageTitle("Health library");

  const [articles, setArticles] = useState<HealthContent[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [language, setLanguage] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    listPublishedContent()
      .then((allArticles) => {
        if (!active) return;
        const unique = Array.from(
          new Set(allArticles.map((article) => article.category)),
        ).sort();
        setCategories(unique);
      })
      .catch(() => {
        if (active) setCategories([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listPublishedContent({
        language: language || undefined,
        category: category || undefined,
      });
      setArticles(data);
    } catch (requestError) {
      setError(errorMessage(requestError, t("library.errorBody")));
    } finally {
      setLoading(false);
    }
  }, [language, category, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="library-page">
      <PageIntro
        eyebrow={t("library.eyebrow")}
        title={t("library.title")}
        lead={t("library.intro")}
      />

      <div className="library-toolbar">
        <div className="library-toolbar__label">
          <SlidersHorizontal size={17} aria-hidden="true" />
          Filters
        </div>
        <div className="library-filter">
          <label htmlFor="library-language">{t("library.filterLanguage")}</label>
          <LanguageSelect
            id="library-language"
            value={language}
            onChange={setLanguage}
            includeAll
            allLabel={t("common.allLanguages")}
          />
        </div>
        <div className="library-filter">
          <label htmlFor="library-category">
            {t("library.filterCategory")}
          </label>
          <select
            id="library-category"
            className="select"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">{t("common.allCategories")}</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {contentCategoryLabel(value)}
              </option>
            ))}
          </select>
        </div>
        <span className="library-count">
          {articles.length} {articles.length === 1 ? "article" : "articles"}
        </span>
      </div>

      {loading ? (
        <LoadingBlock label={t("library.loading")} />
      ) : error ? (
        <ErrorBlock
          title={t("library.errorTitle")}
          body={error}
          onRetry={() => void load()}
        />
      ) : articles.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={t("library.emptyTitle")}
          body={t("library.emptyBody")}
        />
      ) : (
        <div className="article-list">
          {articles.map((article, index) => (
            <Link
              className="article-row"
              to={`${linkBase}/${article.id}`}
              key={article.id}
            >
              <span className="article-row__index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="article-row__body">
                <div className="article-row__meta">
                  <ContentCategoryBadge category={article.category} />
                  <span>{languageShortName(article.language)}</span>
                  <span>{formatDate(article.updated_at)}</span>
                </div>
                <h2>{article.title}</h2>
                <p>
                  {article.content.length > 210
                    ? `${article.content.slice(0, 210).trimEnd()}…`
                    : article.content}
                </p>
                <span className="article-row__author">
                  {t("library.by")} {article.author_name}
                </span>
              </div>
              <span className="article-row__arrow" aria-hidden="true">
                <ArrowRight size={20} />
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="library-footnote">
        <p>{t("library.disclaimer")}</p>
        <p>{t("library.notTranslated")}</p>
        <div className="library-languages" aria-label="Available languages">
          {LANGUAGES.map((item) => (
            <span key={item.code} lang={item.code}>
              {item.native}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
