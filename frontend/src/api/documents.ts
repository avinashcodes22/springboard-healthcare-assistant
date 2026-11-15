import type { DocumentCategory, MedicalDocument } from "../types";
import {
  API_BASE_URL,
  ApiError,
  apiFetch,
  apiJson,
  clearAccessToken,
  getAccessToken,
  notifySessionExpired,
} from "./client";

export function listDocuments(): Promise<MedicalDocument[]> {
  return apiJson<MedicalDocument[]>("/api/documents");
}

export function getDocument(id: number): Promise<MedicalDocument> {
  return apiJson<MedicalDocument>(`/api/documents/${id}`);
}

export function deleteDocument(id: number): Promise<void> {
  return apiJson<void>(`/api/documents/${id}`, { method: "DELETE" });
}

export function uploadDocument(
  file: File,
  category: DocumentCategory,
  onProgress: (percent: number) => void,
): Promise<MedicalDocument> {
  return new Promise((resolve, reject) => {
    const token = getAccessToken();
    const formData = new FormData();
    formData.append("category", category);
    formData.append("file", file);

    const request = new XMLHttpRequest();
    request.open("POST", `${API_BASE_URL}/api/documents/upload`);

    if (token) {
      request.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    request.setRequestHeader("Accept", "application/json");

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onerror = () => {
      reject(
        new ApiError(
          0,
          "Unable to reach Sahaaya. Check that the backend is running.",
        ),
      );
    };

    request.onload = () => {
      let payload: unknown = null;

      try {
        payload = request.responseText
          ? JSON.parse(request.responseText)
          : null;
      } catch {
        payload = null;
      }

      if (request.status === 401) {
        clearAccessToken();
        notifySessionExpired();
      }

      if (request.status >= 200 && request.status < 300) {
        resolve(payload as MedicalDocument);
        return;
      }

      let detail = "The document could not be uploaded.";
      if (payload && typeof payload === "object") {
        const value = (payload as { detail?: unknown }).detail;
        if (typeof value === "string") detail = value;
      }

      reject(new ApiError(request.status, detail));
    };

    request.send(formData);
  });
}

export async function downloadDocument(
  doc: Pick<MedicalDocument, "id" | "original_filename">,
): Promise<void> {
  const response = await apiFetch(`/api/documents/${doc.id}/download`);

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = doc.original_filename || "document";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
