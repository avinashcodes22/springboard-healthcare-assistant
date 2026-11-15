import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Check,
  Link2,
  Plus,
  ShieldOff,
  Trash2,
  UserCheck,
  UsersRound,
} from "lucide-react";

import {
  approveAdminWorker,
  createAdminAssignment,
  deleteAdminAssignment,
  listAdminAssignments,
  listAdminUsers,
  listAdminWorkers,
  revokeAdminWorker,
} from "../../api/admin";
import { errorMessage } from "../../api/client";
import { ErrorBlock, LoadingBlock } from "../../components/ui/AsyncState";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { SelectInput } from "../../components/ui/FormField";
import { Notice } from "../../components/ui/Notice";
import { PageIntro } from "../../components/ui/PageIntro";
import { usePageTitle } from "../../hooks/usePageTitle";
import { formatDate, languageShortName } from "../../lib/languages";
import type {
  AdminAssignment,
  AdminUser,
  AdminWorker,
} from "../../types";

type WorkerFilter = "pending" | "approved" | "all";

export function AdminWorkersPage() {
  const [workers, setWorkers] = useState<AdminWorker[]>([]);
  const [patients, setPatients] = useState<AdminUser[]>([]);
  const [assignments, setAssignments] = useState<AdminAssignment[]>([]);
  const [workerFilter, setWorkerFilter] = useState<WorkerFilter>("all");
  const [workerId, setWorkerId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  usePageTitle("Healthcare workers");

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([
      listAdminWorkers("all"),
      listAdminUsers({ role: "patient", status: "active" }),
      listAdminAssignments(),
    ])
      .then(([nextWorkers, nextPatients, nextAssignments]) => {
        setWorkers(nextWorkers);
        setPatients(nextPatients);
        setAssignments(nextAssignments);
      })
      .catch((requestError: unknown) => {
        setError(
          errorMessage(
            requestError,
            "We could not load healthcare-worker management.",
          ),
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filteredWorkers = useMemo(() => {
    if (workerFilter === "pending") {
      return workers.filter((worker) => !worker.is_approved);
    }
    if (workerFilter === "approved") {
      return workers.filter((worker) => worker.is_approved);
    }
    return workers;
  }, [workerFilter, workers]);

  const approvedWorkers = workers.filter((worker) => worker.is_approved);

  const handleApproval = async (worker: AdminWorker) => {
    setBusyId(worker.id);
    setActionError("");
    setSuccess("");
    try {
      const updated = worker.is_approved
        ? await revokeAdminWorker(worker.id)
        : await approveAdminWorker(worker.id);
      setWorkers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSuccess(
        updated.is_approved
          ? `${updated.full_name} can now access worker features.`
          : `${updated.full_name} no longer has worker access.`,
      );
    } catch (requestError: unknown) {
      setActionError(
        errorMessage(requestError, "Worker access could not be updated."),
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleAssign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setActionError("");
    setSuccess("");

    if (!workerId || !patientId) {
      setFormError("Select both a worker and a patient.");
      return;
    }

    setCreating(true);
    try {
      const created = await createAdminAssignment(
        Number(workerId),
        Number(patientId),
      );
      setAssignments((current) => [created, ...current]);
      setWorkers((current) =>
        current.map((worker) =>
          worker.id === created.worker_id
            ? {
                ...worker,
                assigned_patient_count: worker.assigned_patient_count + 1,
              }
            : worker,
        ),
      );
      setPatientId("");
      setSuccess(`${created.patient_name} was assigned to ${created.worker_name}.`);
    } catch (requestError: unknown) {
      setFormError(
        errorMessage(requestError, "The care assignment could not be created."),
      );
    } finally {
      setCreating(false);
    }
  };

  const handleRemoveAssignment = async (assignment: AdminAssignment) => {
    setBusyId(assignment.id);
    setActionError("");
    setSuccess("");
    try {
      await deleteAdminAssignment(assignment.id);
      setAssignments((current) =>
        current.filter((item) => item.id !== assignment.id),
      );
      setWorkers((current) =>
        current.map((worker) =>
          worker.id === assignment.worker_id
            ? {
                ...worker,
                assigned_patient_count: Math.max(
                  0,
                  worker.assigned_patient_count - 1,
                ),
              }
            : worker,
        ),
      );
      setSuccess("The care assignment was removed.");
    } catch (requestError: unknown) {
      setActionError(
        errorMessage(requestError, "The assignment could not be removed."),
      );
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <LoadingBlock label="Loading healthcare workers" />;

  if (error) {
    return (
      <ErrorBlock
        title="Healthcare-worker management could not be loaded."
        body={error}
        onRetry={load}
      />
    );
  }

  const tabs: { value: WorkerFilter; label: string; count: number }[] = [
    {
      value: "pending",
      label: "Pending",
      count: workers.filter((worker) => !worker.is_approved).length,
    },
    {
      value: "approved",
      label: "Approved",
      count: approvedWorkers.length,
    },
    { value: "all", label: "All workers", count: workers.length },
  ];

  return (
    <>
      <PageIntro
        eyebrow="Workforce access"
        title="Healthcare workers"
        lead="Approve worker accounts and control which patients each approved worker may access."
      />

      {success ? <Notice tone="success">{success}</Notice> : null}
      {actionError ? <Notice tone="error">{actionError}</Notice> : null}

      <section className="workspace-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Registration review</p>
            <h2>Worker accounts</h2>
          </div>
          <span className="panel-heading__meta">
            {approvedWorkers.length} approved
          </span>
        </div>

        <div className="filter-tabs" role="tablist" aria-label="Worker approval status">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={workerFilter === tab.value}
              className={workerFilter === tab.value ? "is-active" : ""}
              onClick={() => setWorkerFilter(tab.value)}
            >
              {tab.label}
              <span>{tab.count}</span>
            </button>
          ))}
        </div>

        {filteredWorkers.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No workers in this view."
            body="Healthcare-worker accounts will appear here after registration."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Language</th>
                  <th>Patients</th>
                  <th>Content</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th className="cell-actions">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map((worker) => (
                  <tr key={worker.id}>
                    <td>
                      <span className="table-primary">{worker.full_name}</span>
                      <span className="table-secondary">{worker.email}</span>
                    </td>
                    <td>{languageShortName(worker.preferred_language)}</td>
                    <td>{worker.assigned_patient_count}</td>
                    <td>{worker.authored_content_count}</td>
                    <td>
                      <span
                        className={`status-chip ${
                          worker.is_approved
                            ? "status-chip--success"
                            : "status-chip--warning"
                        }`}
                      >
                        {worker.is_approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td>{formatDate(worker.created_at)}</td>
                    <td className="cell-actions">
                      <Button
                        variant={worker.is_approved ? "ghost" : "primary"}
                        size="sm"
                        loading={busyId === worker.id}
                        onClick={() => handleApproval(worker)}
                        icon={
                          worker.is_approved ? (
                            <ShieldOff size={15} />
                          ) : (
                            <Check size={15} />
                          )
                        }
                      >
                        {worker.is_approved ? "Revoke access" : "Approve"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="workspace-grid workspace-grid--sidebar">
        <section className="workspace-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Patient-worker links</p>
              <h2>Active care assignments</h2>
            </div>
            <span className="panel-heading__meta">
              {assignments.length} assignment
              {assignments.length === 1 ? "" : "s"}
            </span>
          </div>

          {assignments.length === 0 ? (
            <EmptyState
              icon={Link2}
              title="No patients are assigned."
              body="Assign a patient to an approved healthcare worker to grant access to that patient's record summary."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Worker</th>
                    <th>Patient</th>
                    <th>Assigned by</th>
                    <th>Date</th>
                    <th className="cell-actions">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>{assignment.worker_name}</td>
                      <td>{assignment.patient_name}</td>
                      <td>{assignment.assigned_by_name ?? "—"}</td>
                      <td>{formatDate(assignment.created_at)}</td>
                      <td className="cell-actions">
                        <button
                          type="button"
                          className="icon-button icon-button--danger"
                          aria-label={`Remove assignment for ${assignment.patient_name}`}
                          disabled={busyId === assignment.id}
                          onClick={() => handleRemoveAssignment(assignment)}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="workspace-panel workspace-panel--sticky">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Grant record access</p>
              <h2>Assign a patient</h2>
            </div>
            <Plus size={20} aria-hidden="true" />
          </div>

          {approvedWorkers.length === 0 || patients.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title="Assignment cannot be created yet."
              body={
                approvedWorkers.length === 0
                  ? "Approve a healthcare worker before assigning patients."
                  : "There are no active patient accounts available."
              }
            />
          ) : (
            <form className="stacked-form" onSubmit={handleAssign} noValidate>
              {formError ? (
                <p className="inline-error" role="alert">
                  {formError}
                </p>
              ) : null}
              <label className="field" htmlFor="assignment-worker">
                <span className="field__label">Approved worker</span>
                <SelectInput
                  id="assignment-worker"
                  value={workerId}
                  onChange={(event) => setWorkerId(event.target.value)}
                  required
                >
                  <option value="">Select a worker</option>
                  {approvedWorkers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.full_name}
                    </option>
                  ))}
                </SelectInput>
              </label>
              <label className="field" htmlFor="assignment-patient">
                <span className="field__label">Active patient</span>
                <SelectInput
                  id="assignment-patient"
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
              </label>
              <p className="field__hint">
                The worker can only open records for patients assigned to them.
              </p>
              <Button type="submit" loading={creating}>
                {creating ? "Assigning…" : "Create assignment"}
              </Button>
            </form>
          )}
        </aside>
      </div>
    </>
  );
}
