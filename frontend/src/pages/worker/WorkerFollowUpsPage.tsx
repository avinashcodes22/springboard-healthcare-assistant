import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CalendarCheck,
  Check,
  Plus,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";

import { errorMessage } from "../../api/client";
import {
  createFollowUp,
  deleteFollowUp,
  listFollowUps,
  listWorkerPatients,
  updateFollowUp,
} from "../../api/worker";
import { ErrorBlock, LoadingBlock } from "../../components/ui/AsyncState";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import {
  Field,
  SelectInput,
  TextArea,
  TextInput,
} from "../../components/ui/FormField";
import { Modal } from "../../components/ui/Modal";
import { Notice } from "../../components/ui/Notice";
import { PageIntro } from "../../components/ui/PageIntro";
import { usePageTitle } from "../../hooks/usePageTitle";
import { formatDate } from "../../lib/languages";
import type {
  FollowUp,
  FollowUpStatus,
  WorkerPatientSummary,
} from "../../types";

type Filter = "all" | FollowUpStatus;

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function statusClass(followUp: FollowUp): string {
  if (followUp.status === "completed") return "status-chip status-chip--success";
  if (followUp.status === "cancelled") return "status-chip status-chip--muted";
  if (followUp.is_overdue) return "status-chip status-chip--danger";
  return "status-chip status-chip--assigned";
}

export function WorkerFollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [patients, setPatients] = useState<WorkerPatientSummary[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [patientId, setPatientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FollowUp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  usePageTitle("Follow-up monitoring");

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([listFollowUps(), listWorkerPatients()])
      .then(([nextFollowUps, nextPatients]) => {
        setFollowUps(nextFollowUps);
        setPatients(nextPatients);
      })
      .catch((requestError: unknown) => {
        setError(
          errorMessage(requestError, "We could not load follow-up monitoring."),
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? followUps
        : followUps.filter((followUp) => followUp.status === filter),
    [filter, followUps],
  );

  const counts = useMemo(
    () => ({
      all: followUps.length,
      scheduled: followUps.filter((item) => item.status === "scheduled").length,
      completed: followUps.filter((item) => item.status === "completed").length,
      cancelled: followUps.filter((item) => item.status === "cancelled").length,
    }),
    [followUps],
  );

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setActionError("");
    setSuccess("");

    if (!patientId) {
      setFormError("Select an assigned patient.");
      return;
    }
    if (!dueDate) {
      setFormError("Choose a follow-up date.");
      return;
    }

    setCreating(true);
    try {
      const created = await createFollowUp({
        patient_id: Number(patientId),
        due_date: dueDate,
        notes: notes.trim() || null,
      });
      setFollowUps((current) => [created, ...current]);
      setPatientId("");
      setDueDate("");
      setNotes("");
      setSuccess("Follow-up scheduled.");
    } catch (requestError: unknown) {
      setFormError(
        errorMessage(requestError, "The follow-up could not be scheduled."),
      );
    } finally {
      setCreating(false);
    }
  };

  const handleStatus = async (followUp: FollowUp, status: FollowUpStatus) => {
    setBusyId(followUp.id);
    setActionError("");
    setSuccess("");
    try {
      const updated = await updateFollowUp(followUp.id, { status });
      setFollowUps((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSuccess(
        status === "completed"
          ? "Follow-up marked as completed."
          : "Follow-up cancelled.",
      );
    } catch (requestError: unknown) {
      setActionError(
        errorMessage(requestError, "The follow-up could not be updated."),
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    setActionError("");
    try {
      await deleteFollowUp(deleteTarget.id);
      setFollowUps((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
      setSuccess("Follow-up removed.");
    } catch (requestError: unknown) {
      setActionError(
        errorMessage(requestError, "The follow-up could not be removed."),
      );
      setDeleteTarget(null);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <LoadingBlock label="Loading follow-up monitoring" />;

  if (error) {
    return (
      <ErrorBlock
        title="Follow-up monitoring could not be loaded."
        body={error}
        onRetry={load}
      />
    );
  }

  return (
    <>
      <PageIntro
        eyebrow="Care coordination"
        title="Follow-up monitoring"
        lead="Keep a simple record of planned check-ins for patients assigned to you. This does not record clinical outcomes or advice."
      />

      {success ? <Notice tone="success">{success}</Notice> : null}
      {actionError ? <Notice tone="error">{actionError}</Notice> : null}

      <div className="workspace-grid workspace-grid--sidebar">
        <section className="workspace-panel">
          <div className="filter-tabs" role="tablist" aria-label="Follow-up status">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={filter === item.value}
                className={filter === item.value ? "is-active" : ""}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
                <span>{counts[item.value]}</span>
              </button>
            ))}
          </div>

          {followUps.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No follow-ups have been scheduled."
              body={
                patients.length === 0
                  ? "A Sahaaya administrator must assign patients to you before you can schedule follow-ups."
                  : "Use the form to add a planned check-in for an assigned patient."
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No follow-ups in this view."
              body="Choose another status filter to see the rest of your follow-ups."
            />
          ) : (
            <ul className="follow-up-list">
              {filtered.map((followUp) => (
                <li key={followUp.id} className="follow-up-card">
                  <div className="follow-up-card__date">
                    <span>
                      {new Date(followUp.due_date).toLocaleDateString("en-IN", {
                        month: "short",
                      })}
                    </span>
                    <strong>
                      {new Date(followUp.due_date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                      })}
                    </strong>
                  </div>
                  <div className="follow-up-card__body">
                    <div className="follow-up-card__head">
                      <h2>{followUp.patient_name}</h2>
                      <span className={statusClass(followUp)}>
                        {followUp.status === "scheduled" && followUp.is_overdue
                          ? "Overdue"
                          : followUp.status}
                      </span>
                    </div>
                    <p>
                      Due{" "}
                      <time dateTime={followUp.due_date}>
                        {formatDate(followUp.due_date)}
                      </time>
                    </p>
                    {followUp.notes ? <p>{followUp.notes}</p> : null}
                    {followUp.status === "scheduled" ? (
                      <div className="follow-up-card__actions">
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={busyId === followUp.id}
                          onClick={() =>
                            handleStatus(followUp, "completed")
                          }
                          icon={<Check size={15} />}
                        >
                          Mark completed
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === followUp.id}
                          onClick={() => handleStatus(followUp, "cancelled")}
                          icon={<X size={15} />}
                        >
                          Cancel
                        </Button>
                        <button
                          type="button"
                          className="icon-button icon-button--danger"
                          aria-label={`Remove follow-up for ${followUp.patient_name}`}
                          onClick={() => setDeleteTarget(followUp)}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <div className="follow-up-card__actions">
                        <button
                          type="button"
                          className="text-link text-link--danger"
                          onClick={() => setDeleteTarget(followUp)}
                        >
                          Remove record
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="workspace-panel workspace-panel--sticky">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Add a planned check-in</p>
              <h2>Schedule follow-up</h2>
            </div>
            <Plus size={20} aria-hidden="true" />
          </div>

          {patients.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title="No assigned patients."
              body="Patient follow-ups can only be created for patients assigned to you by an administrator."
            />
          ) : (
            <form className="stacked-form" onSubmit={handleCreate} noValidate>
              {formError ? (
                <p className="inline-error" role="alert">
                  {formError}
                </p>
              ) : null}
              <Field label="Assigned patient" htmlFor="follow-up-patient">
                <SelectInput
                  id="follow-up-patient"
                  value={patientId}
                  onChange={(event) => setPatientId(event.target.value)}
                  required
                >
                  <option value="">Select a patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Follow-up date" htmlFor="follow-up-date">
                <TextInput
                  id="follow-up-date"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  required
                />
              </Field>
              <Field
                label="Coordination note"
                htmlFor="follow-up-notes"
                optional
                hint="Use a short, non-clinical note."
              >
                <TextArea
                  id="follow-up-notes"
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={1000}
                  placeholder="For example: confirm the patient received the appointment reminder."
                />
              </Field>
              <Button type="submit" loading={creating}>
                {creating ? "Scheduling…" : "Schedule follow-up"}
              </Button>
            </form>
          )}
        </aside>
      </div>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Remove this follow-up?"
        footer={
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Keep record
            </Button>
            <Button
              variant="danger"
              loading={busyId === deleteTarget?.id}
              onClick={handleDelete}
            >
              Remove record
            </Button>
          </div>
        }
      >
        <p className="modal-copy">
          This permanently removes the follow-up for{" "}
          <strong>{deleteTarget?.patient_name}</strong>. Completed follow-up
          counts will change.
        </p>
      </Modal>
    </>
  );
}
