import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";

import { errorMessage } from "../../api/client";
import { listWorkerPatients } from "../../api/worker";
import { ErrorBlock, LoadingBlock } from "../../components/ui/AsyncState";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageIntro } from "../../components/ui/PageIntro";
import { usePageTitle } from "../../hooks/usePageTitle";
import { formatDate, languageName } from "../../lib/languages";
import type { WorkerPatientSummary } from "../../types";

export function WorkerPatientsPage() {
  const [patients, setPatients] = useState<WorkerPatientSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  usePageTitle("My patients");

  const load = () => {
    setLoading(true);
    setError("");
    listWorkerPatients()
      .then(setPatients)
      .catch((requestError: unknown) => {
        setError(
          errorMessage(requestError, "We could not load assigned patients."),
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return patients;
    return patients.filter(
      (patient) =>
        patient.full_name.toLowerCase().includes(search) ||
        (patient.phone ?? "").toLowerCase().includes(search),
    );
  }, [patients, query]);

  if (loading) return <LoadingBlock label="Loading assigned patients" />;

  if (error) {
    return (
      <ErrorBlock
        title="Assigned patients could not be loaded."
        body={error}
        onRetry={load}
      />
    );
  }

  return (
    <>
      <PageIntro
        eyebrow="Care coordination"
        title="My patients"
        lead="These are the patient records an administrator has assigned to you. Access is limited to this list."
      />

      <div className="toolbar-row">
        <label className="search-field">
          <Search size={17} aria-hidden="true" />
          <span className="visually-hidden">Search assigned patients</span>
          <input
            className="input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or phone"
          />
        </label>
        <p className="toolbar-count">
          {filtered.length} of {patients.length} patient
          {patients.length === 1 ? "" : "s"}
        </p>
      </div>

      {patients.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No patients are assigned to you."
          body="Patient assignments are created by a Sahaaya administrator. You cannot browse unassigned patient records."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No patients match that search."
          body="Try a different name or clear the search field."
        />
      ) : (
        <div className="patient-card-grid">
          {filtered.map((patient) => (
            <article className="patient-card" key={patient.id}>
              <div className="patient-card__head">
                <span className="patient-card__avatar" aria-hidden="true">
                  {patient.full_name.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <h2>{patient.full_name}</h2>
                  <p>{languageName(patient.preferred_language)}</p>
                </div>
              </div>
              <dl className="patient-card__meta">
                <div>
                  <dt>Documents</dt>
                  <dd>{patient.document_count}</dd>
                </div>
                <div>
                  <dt>Follow-ups</dt>
                  <dd>{patient.scheduled_follow_ups}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{patient.phone || "Not provided"}</dd>
                </div>
                <div>
                  <dt>Registered</dt>
                  <dd>{formatDate(patient.created_at)}</dd>
                </div>
              </dl>
              <Link
                className="text-link patient-card__link"
                to={`/worker/patients/${patient.id}`}
              >
                Review record <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
