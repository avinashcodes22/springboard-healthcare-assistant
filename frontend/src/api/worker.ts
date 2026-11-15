import type {
  FollowUp,
  FollowUpPayload,
  FollowUpStatus,
  FollowUpUpdatePayload,
  WorkerOverview,
  WorkerPatientDetail,
  WorkerPatientSummary,
} from "../types";
import { apiFetch, apiJson } from "./client";

export function getWorkerOverview(): Promise<WorkerOverview> {
  return apiJson<WorkerOverview>("/api/worker/overview");
}

export function listWorkerPatients(): Promise<WorkerPatientSummary[]> {
  return apiJson<WorkerPatientSummary[]>("/api/worker/patients");
}

export function getWorkerPatient(
  patientId: number,
): Promise<WorkerPatientDetail> {
  return apiJson<WorkerPatientDetail>(`/api/worker/patients/${patientId}`);
}

export async function downloadWorkerPatientDocument(
  patientId: number,
  file: { id: number; original_filename: string },
): Promise<void> {
  const response = await apiFetch(
    `/api/worker/patients/${patientId}/documents/${file.id}/download`,
  );
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.original_filename || "document";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function listFollowUps(status?: FollowUpStatus): Promise<FollowUp[]> {
  const query = status ? `?status=${status}` : "";
  return apiJson<FollowUp[]>(`/api/worker/follow-ups${query}`);
}

export function createFollowUp(payload: FollowUpPayload): Promise<FollowUp> {
  return apiJson<FollowUp>("/api/worker/follow-ups", {
    method: "POST",
    body: payload,
  });
}

export function updateFollowUp(
  id: number,
  payload: FollowUpUpdatePayload,
): Promise<FollowUp> {
  return apiJson<FollowUp>(`/api/worker/follow-ups/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteFollowUp(id: number): Promise<void> {
  return apiJson<void>(`/api/worker/follow-ups/${id}`, {
    method: "DELETE",
  });
}
