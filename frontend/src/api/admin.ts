import type {
  AdminAnalytics,
  AdminAssignment,
  AdminMonitoring,
  AdminOverview,
  AdminUser,
  AdminWorker,
  ContentStatus,
  HealthContent,
} from "../types";
import { apiJson } from "./client";

interface UserFilters {
  role?: string;
  status?: string;
  search?: string;
}

export function getAdminOverview(): Promise<AdminOverview> {
  return apiJson<AdminOverview>("/api/admin/overview");
}

export function listAdminUsers(filters: UserFilters = {}): Promise<AdminUser[]> {
  const params = new URLSearchParams();
  if (filters.role) params.set("role", filters.role);
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  const query = params.toString();
  return apiJson<AdminUser[]>(`/api/admin/users${query ? `?${query}` : ""}`);
}

export function updateAdminUserStatus(
  userId: number,
  isActive: boolean,
): Promise<AdminUser> {
  return apiJson<AdminUser>(`/api/admin/users/${userId}/status`, {
    method: "PATCH",
    body: { is_active: isActive },
  });
}

export function listAdminWorkers(
  approval: "all" | "approved" | "pending" = "all",
): Promise<AdminWorker[]> {
  return apiJson<AdminWorker[]>(
    `/api/admin/workers?approval=${approval}`,
  );
}

export function approveAdminWorker(workerId: number): Promise<AdminWorker> {
  return apiJson<AdminWorker>(`/api/admin/workers/${workerId}/approve`, {
    method: "POST",
  });
}

export function revokeAdminWorker(workerId: number): Promise<AdminWorker> {
  return apiJson<AdminWorker>(`/api/admin/workers/${workerId}/revoke`, {
    method: "POST",
  });
}

export function listAdminContent(
  status?: ContentStatus,
): Promise<HealthContent[]> {
  const query = status ? `?status=${status}` : "";
  return apiJson<HealthContent[]>(`/api/admin/content${query}`);
}

export function updateAdminContent(
  contentId: number,
  payload: {
    status?: ContentStatus;
    category?: string;
    language?: string;
  },
): Promise<HealthContent> {
  return apiJson<HealthContent>(`/api/admin/content/${contentId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function getAdminAnalytics(): Promise<AdminAnalytics> {
  return apiJson<AdminAnalytics>("/api/admin/analytics");
}

export function getAdminMonitoring(): Promise<AdminMonitoring> {
  return apiJson<AdminMonitoring>("/api/admin/monitoring");
}

export function listAdminAssignments(): Promise<AdminAssignment[]> {
  return apiJson<AdminAssignment[]>("/api/admin/assignments");
}

export function createAdminAssignment(
  workerId: number,
  patientId: number,
): Promise<AdminAssignment> {
  return apiJson<AdminAssignment>("/api/admin/assignments", {
    method: "POST",
    body: { worker_id: workerId, patient_id: patientId },
  });
}

export function deleteAdminAssignment(id: number): Promise<void> {
  return apiJson<void>(`/api/admin/assignments/${id}`, {
    method: "DELETE",
  });
}
