import { useEffect, useState } from "react";
import { Activity, Database, RefreshCw, Server, ShieldCheck } from "lucide-react";

import { getAdminMonitoring } from "../../api/admin";
import { errorMessage } from "../../api/client";
import { ErrorBlock, LoadingBlock } from "../../components/ui/AsyncState";
import { Button } from "../../components/ui/Button";
import { PageIntro } from "../../components/ui/PageIntro";
import { usePageTitle } from "../../hooks/usePageTitle";
import { formatDateTime } from "../../lib/languages";
import type { AdminMonitoring } from "../../types";

export function AdminMonitoringPage() {
  const [monitoring, setMonitoring] = useState<AdminMonitoring | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  usePageTitle("System monitoring");

  const load = (initial = false) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    setError("");
    getAdminMonitoring()
      .then(setMonitoring)
      .catch((requestError: unknown) => {
        setError(
          errorMessage(requestError, "We could not load system monitoring."),
        );
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    load(true);
  }, []);

  if (loading) return <LoadingBlock label="Checking system status" />;

  if (error || !monitoring) {
    return (
      <ErrorBlock
        title="System monitoring unavailable."
        body={error}
        onRetry={() => load(true)}
      />
    );
  }

  const apiHealthy = monitoring.api_status === "healthy";
  const databaseHealthy = monitoring.database_status === "healthy";

  return (
    <>
      <PageIntro
        eyebrow="Operational health"
        title="System monitoring"
        lead="A real-time health check of the API and database connection. No credentials or patient data are displayed."
        actions={
          <Button
            variant="secondary"
            size="sm"
            loading={refreshing}
            onClick={() => load(false)}
            icon={<RefreshCw size={15} />}
          >
            Refresh
          </Button>
        }
      />

      <section className="monitor-grid">
        <article className="monitor-card">
          <div className="monitor-card__head">
            <span className="monitor-card__icon">
              <Server size={21} aria-hidden="true" />
            </span>
            <span
              className={`status-chip ${
                apiHealthy ? "status-chip--success" : "status-chip--danger"
              }`}
            >
              {monitoring.api_status}
            </span>
          </div>
          <h2>Application API</h2>
          <p>The FastAPI service is responding to authenticated administrator requests.</p>
          <dl>
            <div>
              <dt>Version</dt>
              <dd>{monitoring.application_version}</dd>
            </div>
            <div>
              <dt>Checked</dt>
              <dd>{formatDateTime(monitoring.checked_at)}</dd>
            </div>
          </dl>
        </article>

        <article className="monitor-card">
          <div className="monitor-card__head">
            <span className="monitor-card__icon">
              <Database size={21} aria-hidden="true" />
            </span>
            <span
              className={`status-chip ${
                databaseHealthy ? "status-chip--success" : "status-chip--danger"
              }`}
            >
              {monitoring.database_status}
            </span>
          </div>
          <h2>PostgreSQL database</h2>
          <p>The platform can query its primary database for current counts and records.</p>
          <dl>
            <div>
              <dt>Connection</dt>
              <dd>{monitoring.database_detail}</dd>
            </div>
            <div>
              <dt>Access</dt>
              <dd>Authenticated administrator</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="workspace-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Operational notes</p>
            <h2>What this check covers</h2>
          </div>
          <Activity size={21} aria-hidden="true" />
        </div>
        <ul className="check-list">
          <li>
            <ShieldCheck size={17} aria-hidden="true" />
            <span>
              Administrator role and active account status are verified before
              this data is returned.
            </span>
          </li>
          <li>
            <Database size={17} aria-hidden="true" />
            <span>
              Database health is confirmed with a live query, not a cached
              status label.
            </span>
          </li>
          <li>
            <Server size={17} aria-hidden="true" />
            <span>
              Application version reflects the running backend configuration.
            </span>
          </li>
        </ul>
      </section>

      <p className="content-footnote">
        This page is an operational health check only. It does not expose
        infrastructure credentials, environment variables or patient records.
      </p>
    </>
  );
}
