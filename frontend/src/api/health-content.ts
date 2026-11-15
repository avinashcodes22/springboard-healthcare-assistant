import type {
  HealthContent,
  HealthContentPayload,
} from "../types";
import { apiJson } from "./client";

interface ContentFilters {
  language?: string;
  category?: string;
}

export function listPublishedContent(
  filters: ContentFilters = {},
): Promise<HealthContent[]> {
  const params = new URLSearchParams();

  if (filters.language) params.set("language", filters.language);
  if (filters.category) params.set("category", filters.category);

  const query = params.toString();
  return apiJson<HealthContent[]>(
    `/api/health-content${query ? `?${query}` : ""}`,
  );
}

export function getPublishedContent(id: number): Promise<HealthContent> {
  return apiJson<HealthContent>(`/api/health-content/${id}`, {
    auth: false,
    handleUnauthorized: false,
  });
}

export function listMyContent(): Promise<HealthContent[]> {
  return apiJson<HealthContent[]>("/api/health-content/mine");
}

export function createContent(
  payload: HealthContentPayload,
): Promise<HealthContent> {
  return apiJson<HealthContent>("/api/health-content", {
    method: "POST",
    body: payload,
  });
}

export function updateContent(
  id: number,
  payload: Partial<HealthContentPayload>,
): Promise<HealthContent> {
  return apiJson<HealthContent>(`/api/health-content/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteContent(id: number): Promise<void> {
  return apiJson<void>(`/api/health-content/${id}`, {
    method: "DELETE",
  });
}
