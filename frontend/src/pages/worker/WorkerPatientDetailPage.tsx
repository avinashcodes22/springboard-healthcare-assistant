import { useEffect, useState } from "react";
import { ArrowLeft, Download, FileText, UsersRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { errorMessage } from "../../api/client";
import { downloadWorkerPatientDocument, getWorkerPatient } from "../../api/worker";
import { ErrorBlock, LoadingBlock } from "../../components/ui/AsyncState";
import {
  CategoryBadge,
  FileTypeBadge,
} from "../../components/ui/Badges";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageIntro } from "../../components/ui/PageIntro";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  formatBytes,
  formatDate,
  languageName,
} from "../../lib/languages";
import type { MedicalDocument, WorkerPatientDetail } from "../../types";

export function WorkerPatientDetailPage() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState<WorkerPatientDetail | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  usePageTitle(patient?.full_name ?? "Patient record");

  const load = () => {
    const id = Number(patientId);
    if (!Number.isInteger(id) || id <= 0) {
      setError("That patient record link is not valid.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    getWorkerPatient(id)
      .then(setPatient)
      .catch((requestError: unknown) => {
        setError(
          errorMessage(
            requestError,
            "This patient record is not available to you.",
          ),
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [patientId]);

  const handleDownload = (document: MedicalDocument) => {
    if (!patient) return;
    setActionError("");
    setDownloadingId(document.id);
    downloadWorkerPatientDocument(patient.id, document)
      .catch((requestError: unknown) => {
        setActionError(
          errorMessage(requestError, "The document could not be downloaded."),
        );
      })
      .finally(() => setDownloadingId(null));
  };

  if (loading) return <LoadingBlock label="Loading patient record" />;

  if (error || !patient) {
    return (
      <ErrorBlock
        title="Patient record unavailable."
        body={error || "This record could not be found."}
        onRetry={load}
      />
    );
  }

  return (
    <>
      <Link className="back-link" to="/worker/patients">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to my patients
      </Link>

      <PageIntro
        eyebrow="Assigned patient"
        title={patient.full_name}
        lead={`${languageName(patient.preferred_language)} · Registered ${formatDate(
          patient.created_at,
        )}`}
        actions={
          <span className="status-chip status-chip--assigned">
            Assignment verified
          </span>
        }
      />

      <section className="stat-grid stat-grid--three" aria-label="Patient summary">
        <article className="stat-card">
          <p>Medical documents</p>
          <strong>{patient.document_count}</strong>
          <span>Available to download</span>
        </article>
        <article className="stat-card">
          <p>Scheduled follow-ups</p>
          <strong>{patient.scheduled_follow_ups}</strong>
          <span>Managed by you</span>
        </article>
        <article className="stat-card">
          <p>Contact</p>
          <strong className="stat-card__text">
            {patient.phone || "Not provided"}
          </strong>
          <span>Patient profile</span>
        </article>
      </section>

      <section className="workspace-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Medical record shelf</p>
            <h2>Patient documents</h2>
          </div>
          <span className="panel-heading__meta">
            Only assigned patient records are shown
          </span>
        </div>

        {actionError ? (
          <p className="inline-error" role="alert">
            {actionError}
          </p>
        ) : null}

        {patient.documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No medical documents are stored."
            body="This patient has not uploaded any documents yet."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Category</th>
                  <th>File type</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th className="cell-actions">Action</th>
                </tr>
              </thead>
              <tbody>
                {patient.documents.map((document) => (
                  <tr key={document.id}>
                    <td>
                      <span className="table-primary">
                        {document.original_filename}
                      </span>
                    </td>
                    <td>
                      <CategoryBadge category={document.category} />
                    </td>
                    <td>
                      <FileTypeBadge contentType={document.content_type} />
                    </td>
                    <td>{formatBytes(document.size_bytes)}</td>
                    <td>{formatDate(document.created_at)}</td>
                    <td className="cell-actions">
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={downloadingId === document.id}
                        onClick={() => handleDownload(document)}
                        icon={<Download size={15} />}
                      >
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="workspace-panel workspace-panel--note">
        <UsersRound size={20} aria-hidden="true" />
        <div>
          <h2>Use this record for coordination only.</h2>
          <p>
            Sahaaya stores documents but does not diagnose conditions or
            prescribe treatment. Follow-up notes should describe coordination
            tasks, not clinical decisions.
          </p>
        </div>
      </div>
    </>
  );
}
