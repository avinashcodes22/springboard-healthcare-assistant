import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  CalendarCheck,
  FileText,
  Link2,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  getAdminOverview,
  listAdminWorkers,
} from "../../api/admin";
import { errorMessage } from "../../api/client";
import { ErrorBlock, LoadingBlock } from "../../components/ui/AsyncState";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageIntro } from "../../components/ui/PageIntro";
import { usePageTitle } from "../../hooks/usePageTitle";
import { formatDate, languageShortName } from "../../lib/languages";
import type { AdminOverview, AdminWorker } from "../../types";

export function AdminOverviewPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [pendingWorkers, setPendingWorkers] = useState<AdminWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  usePageTitle("Administration overview");

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([getAdminOverview(), listAdminWorkers("pending")])
      .then(([nextOverview, workers]) => {
        setOverview(nextOverview);
        setPendingWorkers(workers);
      })
      .catch((requestError: unknown) => {
        setError(
          errorMessage(requestError, "We could not load the administration overview."),
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <LoadingBlock label="Loading administration overview" />;

  if (error || !overview) {
    return (
      <ErrorBlock
        title="Administration overview unavailable."
        body={error}
        onRetry={load}
      />
    );
  }

  const attentionCount = overview.pending_workers + overview.overdue_follow_ups;

  return (
    <>
      <PageIntro
        eyebrow="Administration"
        title="Platform overview"
        lead="A structured view of accounts, care coordination loads and published health information."
        actions={
          <span className="status-chip status-chip--assigned">
            API {overview.api_status}
          </span>
        }
      />

      <section className="stat-grid stat-grid--six" aria-label="Platform totals">
        <article className="stat-card">
          <p>Patients</p>
          <strong>{overview.total_patients}</strong>
          <span>Registered patient accounts</span>
        </article>
        <article className="stat-card">
          <p>Healthcare workers</p>
          <strong>{overview.total_workers}</strong>
          <span>{overview.approved_workers} approved</span>
        </article>
        <article className="stat-card">
          <p>Pending approval</p>
          <strong className={overview.pending_workers ? "is-alert" : ""}>
            {overview.pending_workers}
          </strong>
          <span>Worker accounts awaiting review</span>
        </article>
        <article className="stat-card">
          <p>Medical documents</p>
          <strong>{overview.total_documents}</strong>
          <span>Private patient uploads</span>
        </article>
        <article className="stat-card">
          <p>Published content</p>
          <strong>{overview.published_content}</strong>
          <span>{overview.draft_content} drafts in review</span>
        </article>
        <article className="stat-card">
          <p>Care assignments</p>
          <strong>{overview.active_assignments}</strong>
          <span>{overview.scheduled_follow_ups} scheduled follow-ups</span>
        </article>
      </section>

      {attentionCount > 0 ? (
        <div className="attention-banner">
          <Activity size={20} aria-hidden="true" />
          <div>
            <strong>Items requiring attention</strong>
            <p>
              {overview.pending_workers} worker approval
              {overview.pending_workers === 1 ? "" : "s"} and{" "}
              {overview.overdue_follow_ups} overdue follow-up
              {overview.overdue_follow_ups === 1 ? "" : "s"} are open.
            </p>
          </div>
          <Link className="text-link" to="/admin/workers">
            Review workers <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      ) : null}

      <div className="workspace-grid">
        <section className="workspace-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Worker access</p>
              <h2>Pending approvals</h2>
            </div>
            <Link className="text-link" to="/admin/workers">
              Manage <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          {pendingWorkers.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No worker approvals are waiting."
              body="New healthcare-worker registrations will appear here for review."
            />
          ) : (
            <ul className="compact-list">
              {pendingWorkers.map((worker) => (
                <li key={worker.id}>
                  <div className="compact-list__icon">
                    <UsersRound size={18} aria-hidden="true" />
                  </div>
                  <div className="compact-list__copy">
                    <Link to="/admin/workers">{worker.full_name}</Link>
                    <span>
                      {worker.email} ·{" "}
                      {languageShortName(worker.preferred_language)}
                    </span>
                  </div>
                  <span className="status-chip status-chip--warning">
                    Pending
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="workspace-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">System health</p>
              <h2>Service status</h2>
            </div>
            <Link className="text-link" to="/admin/monitoring">
              Details <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <dl className="status-list">
            <div>
              <dt>
                <Activity size={16} aria-hidden="true" />
                API
              </dt>
              <dd className="status-chip status-chip--success">
                {overview.api_status}
              </dd>
            </div>
            <div>
              <dt>
                <ShieldCheck size={16} aria-hidden="true" />
                Database
              </dt>
              <dd className="status-chip status-chip--success">
                {overview.database_status}
              </dd>
            </div>
            <div>
              <dt>
                <CalendarCheck size={16} aria-hidden="true" />
                Overdue follow-ups
              </dt>
              <dd>{overview.overdue_follow_ups}</dd>
            </div>
            <div>
              <dt>
                <FileText size={16} aria-hidden="true" />
                Draft content
              </dt>
              <dd>{overview.draft_content}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="workspace-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Administration controls</p>
            <h2>Available in this workspace</h2>
          </div>
        </div>
        <div className="control-grid">
          <Link to="/admin/users">
            <UsersRound size={19} aria-hidden="true" />
            <strong>User management</strong>
            <span>Activate or deactivate non-administrator accounts.</span>
          </Link>
          <Link to="/admin/workers">
            <Link2 size={19} aria-hidden="true" />
            <strong>Care assignments</strong>
            <span>Approve workers and connect them to patients.</span>
          </Link>
          <Link to="/admin/content">
            <FileText size={19} aria-hidden="true" />
            <strong>Content moderation</strong>
            <span>Review, publish and organize health education.</span>
          </Link>
          <Link to="/admin/analytics">
            <Activity size={19} aria-hidden="true" />
            <strong>Analytics</strong>
            <span>Inspect real platform counts and language coverage.</span>
          </Link>
        </div>
      </section>

      <p className="content-footnote">
        Snapshot generated {formatDate(new Date().toISOString())}. Administrator
        actions are recorded in the audit log.
      </p>
    </>
  );
}
