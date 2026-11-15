import { useEffect, useState } from "react";
import { BarChart3, Languages, UsersRound } from "lucide-react";

import { getAdminAnalytics } from "../../api/admin";
import { errorMessage } from "../../api/client";
import { ErrorBlock, LoadingBlock } from "../../components/ui/AsyncState";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageIntro } from "../../components/ui/PageIntro";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  documentCategoryLabel,
  languageShortName,
} from "../../lib/languages";
import type { AdminAnalytics } from "../../types";

function BarList({
  items,
  empty,
}: {
  items: { label: string; value: number }[];
  empty: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  if (items.length === 0) {
    return <p className="bar-empty">{empty}</p>;
  }

  return (
    <ul className="bar-list">
      {items.map((item) => (
        <li key={item.label}>
          <div className="bar-list__label">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <div className="bar-list__track">
            <span
              className="bar-list__fill"
              style={{
                width: `${
                  item.value === 0 ? 0 : Math.max(4, (item.value / max) * 100)
                }%`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  usePageTitle("Healthcare analytics");

  const load = () => {
    setLoading(true);
    setError("");
    getAdminAnalytics()
      .then(setAnalytics)
      .catch((requestError: unknown) => {
        setError(
          errorMessage(requestError, "We could not load platform analytics."),
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <LoadingBlock label="Loading platform analytics" />;

  if (error || !analytics) {
    return (
      <ErrorBlock
        title="Analytics unavailable."
        body={error}
        onRetry={load}
      />
    );
  }

  const documentItems = Object.entries(analytics.documents_by_category).map(
    ([category, count]) => ({
      label: documentCategoryLabel(category),
      value: count,
    }),
  );
  const contentLanguageItems = analytics.content_languages.map((item) => ({
    label: languageShortName(item.language),
    value: item.count,
  }));
  const patientLanguageItems = analytics.language_preferences.map((item) => ({
    label: languageShortName(item.language),
    value: item.count,
  }));

  return (
    <>
      <PageIntro
        eyebrow="Service insight"
        title="Healthcare analytics"
        lead="Live counts from the current Sahaaya database. These figures describe platform activity, not clinical outcomes."
      />

      <section className="stat-grid stat-grid--six" aria-label="Analytics summary">
        <article className="stat-card">
          <p>Patient registrations</p>
          <strong>{analytics.patient_registrations}</strong>
          <span>All patient accounts</span>
        </article>
        <article className="stat-card">
          <p>Worker registrations</p>
          <strong>{analytics.worker_registrations}</strong>
          <span>{analytics.approved_workers} approved</span>
        </article>
        <article className="stat-card">
          <p>Documents stored</p>
          <strong>{analytics.total_documents}</strong>
          <span>Across patient accounts</span>
        </article>
        <article className="stat-card">
          <p>Care assignments</p>
          <strong>{analytics.active_assignments}</strong>
          <span>Worker-patient links</span>
        </article>
        <article className="stat-card">
          <p>Follow-ups scheduled</p>
          <strong>{analytics.scheduled_follow_ups}</strong>
          <span>{analytics.completed_follow_ups} completed</span>
        </article>
        <article className="stat-card">
          <p>Health content</p>
          <strong>{analytics.total_content}</strong>
          <span>{analytics.published_content} published</span>
        </article>
      </section>

      <div className="analytics-grid">
        <section className="workspace-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Document mix</p>
              <h2>Documents by category</h2>
            </div>
            <BarChart3 size={21} aria-hidden="true" />
          </div>
          <BarList
            items={documentItems}
            empty="No patient documents have been uploaded yet."
          />
        </section>

        <section className="workspace-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Publication coverage</p>
              <h2>Health content by language</h2>
            </div>
            <Languages size={21} aria-hidden="true" />
          </div>
          <BarList
            items={contentLanguageItems}
            empty="No health content has been created yet."
          />
        </section>

        <section className="workspace-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Patient preferences</p>
              <h2>Account language preferences</h2>
            </div>
            <UsersRound size={21} aria-hidden="true" />
          </div>
          <BarList
            items={patientLanguageItems}
            empty="No patient language preferences are available."
          />
        </section>

        <section className="workspace-panel workspace-panel--summary">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Workforce snapshot</p>
              <h2>Approval coverage</h2>
            </div>
          </div>
          <dl className="analytics-facts">
            <div>
              <dt>Approved workers</dt>
              <dd>{analytics.approved_workers}</dd>
            </div>
            <div>
              <dt>Pending workers</dt>
              <dd>{analytics.pending_workers}</dd>
            </div>
            <div>
              <dt>Published content</dt>
              <dd>{analytics.published_content}</dd>
            </div>
            <div>
              <dt>Draft content</dt>
              <dd>{analytics.draft_content}</dd>
            </div>
          </dl>
          {analytics.total_documents === 0 ? (
            <div className="analytics-empty-note">
              <EmptyState
                icon={BarChart3}
                title="Document analytics will build over time."
                body="Category and volume figures become more useful as patients upload records."
              />
            </div>
          ) : null}
        </section>
      </div>

      <p className="content-footnote">
        Figures are calculated directly from current platform records. No
        estimated or simulated values are included.
      </p>
    </>
  );
}
