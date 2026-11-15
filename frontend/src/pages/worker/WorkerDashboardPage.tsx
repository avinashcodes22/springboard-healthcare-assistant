import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Languages,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import { errorMessage } from "../../api/client";
import {
  getWorkerOverview,
  listFollowUps,
  listWorkerPatients,
} from "../../api/worker";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorBlock, LoadingBlock } from "../../components/ui/AsyncState";
import { PageIntro } from "../../components/ui/PageIntro";
import { useAuth } from "../../context/AuthContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import { formatDate, languageShortName } from "../../lib/languages";
import type {
  FollowUp,
  WorkerOverview,
  WorkerPatientSummary,
} from "../../types";

const emptyOverview: WorkerOverview = {
  assigned_patients: 0,
  scheduled_follow_ups: 0,
  overdue_follow_ups: 0,
  completed_follow_ups: 0,
  authored_content: 0,
  published_content: 0,
  draft_content: 0,
};

export function WorkerDashboardPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<WorkerOverview>(emptyOverview);
  const [patients, setPatients] = useState<WorkerPatientSummary[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  usePageTitle("Worker dashboard");
  const firstName = user?.full_name.split(" ")[0] ?? "there";

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([
      getWorkerOverview(),
      listWorkerPatients(),
      listFollowUps("scheduled"),
    ])
      .then(([nextOverview, nextPatients, nextFollowUps]) => {
        setOverview(nextOverview);
        setPatients(nextPatients);
        setFollowUps(nextFollowUps);
      })
      .catch((requestError: unknown) => {
        setError(
          errorMessage(
            requestError,
            "We could not load your worker dashboard.",
          ),
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <LoadingBlock label="Loading your workspace" />;

  if (error) {
    return (
      <ErrorBlock
        title="Your workspace could not be loaded."
        body={error}
        onRetry={load}
      />
    );
  }

  const upcoming = followUps.slice(0, 5);

  return (
    <>
      <PageIntro
        eyebrow="Healthcare worker"
        title={`Welcome back, ${firstName}.`}
        lead="Review assigned patients, upcoming follow-ups and the health information you have published."
      />

      <section className="stat-grid" aria-label="Worker summary">
        <article className="stat-card">
          <p>Assigned patients</p>
          <strong>{overview.assigned_patients}</strong>
          <span>Care coordination list</span>
        </article>
        <article className="stat-card">
          <p>Scheduled follow-ups</p>
          <strong>{overview.scheduled_follow_ups}</strong>
          <span>Open monitoring items</span>
        </article>
        <article className="stat-card">
          <p>Overdue follow-ups</p>
          <strong className={overview.overdue_follow_ups ? "is-alert" : ""}>
            {overview.overdue_follow_ups}
          </strong>
          <span>Past their planned date</span>
        </article>
        <article className="stat-card">
          <p>Published articles</p>
          <strong>{overview.published_content}</strong>
          <span>{overview.draft_content} saved as draft</span>
        </article>
      </section>

      <div className="workspace-grid">
        <section className="workspace-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Your patient list</p>
              <h2>Assigned patients</h2>
            </div>
            <Link className="text-link" to="/worker/patients">
              View all <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          {patients.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title="No patients are assigned yet."
              body="A Sahaaya administrator controls patient assignments. Once a patient is assigned to you, their record summary will appear here."
            />
          ) : (
            <ul className="compact-list">
              {patients.slice(0, 5).map((patient) => (
                <li key={patient.id}>
                  <div className="compact-list__icon">
                    <UserRound size={18} aria-hidden="true" />
                  </div>
                  <div className="compact-list__copy">
                    <Link to={`/worker/patients/${patient.id}`}>
                      {patient.full_name}
                    </Link>
                    <span>
                      {languageShortName(patient.preferred_language)} ·{" "}
                      {patient.document_count} document
                      {patient.document_count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <span className="compact-list__meta">
                    {patient.scheduled_follow_ups} follow-up
                    {patient.scheduled_follow_ups === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="workspace-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Next actions</p>
              <h2>Upcoming follow-ups</h2>
            </div>
            <Link className="text-link" to="/worker/follow-ups">
              Manage <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No scheduled follow-ups."
              body="Add a follow-up date from the follow-up monitoring page when care coordination requires it."
            />
          ) : (
            <ul className="compact-list">
              {upcoming.map((followUp) => (
                <li key={followUp.id}>
                  <div className="compact-list__icon">
                    <CalendarCheck size={18} aria-hidden="true" />
                  </div>
                  <div className="compact-list__copy">
                    <Link to="/worker/follow-ups">{followUp.patient_name}</Link>
                    <span>
                      Due{" "}
                      <time dateTime={followUp.due_date}>
                        {formatDate(followUp.due_date)}
                      </time>
                    </span>
                  </div>
                  {followUp.is_overdue ? (
                    <span className="status-chip status-chip--danger">
                      Overdue
                    </span>
                  ) : (
                    <span className="status-chip">Scheduled</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="quick-grid quick-grid--four">
        <Link className="quick-card" to="/worker/patients">
          <UsersRound size={21} aria-hidden="true" />
          <span>Patient records</span>
          <p>Review assigned patient summaries and download their documents.</p>
        </Link>
        <Link className="quick-card" to="/worker/follow-ups">
          <CalendarCheck size={21} aria-hidden="true" />
          <span>Follow-up monitoring</span>
          <p>Schedule check-ins and mark coordination tasks as complete.</p>
        </Link>
        <Link className="quick-card" to="/worker/content">
          <BookOpen size={21} aria-hidden="true" />
          <span>Health content</span>
          <p>Write and publish general health education for your community.</p>
        </Link>
        <Link className="quick-card" to="/worker/translation">
          <Languages size={21} aria-hidden="true" />
          <span>Translation support</span>
          <p>See what language support is available and what is planned next.</p>
        </Link>
      </section>
    </>
  );
}
