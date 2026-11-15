export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export const TOKEN_KEY = "sahaaya.accessToken";
export const USER_KEY = "sahaaya.user";
export const SESSION_EXPIRED_EVENT = "sahaaya:session-expired";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function storeAccessToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function notifySessionExpired(): void {
  clearAccessToken();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

function detailFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const detail = (payload as { detail?: unknown }).detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const message = (item as { msg?: unknown }).msg;
        return typeof message === "string" ? message : null;
      })
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) return messages.join(" ");
  }

  return null;
}

async function errorFromResponse(response: Response): Promise<ApiError> {
  let detail = `Request failed with status ${response.status}.`;

  try {
    const payload: unknown = await response.json();
    const parsed = detailFromPayload(payload);
    if (parsed) detail = parsed;
  } catch {
    // The response did not contain JSON.
  }

  return new ApiError(response.status, detail);
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  handleUnauthorized?: boolean;
}

export async function apiFetch(
  path: string,
  options: RequestOptions = {},
): Promise<Response> {
  const {
    method = "GET",
    body,
    auth = true,
    handleUnauthorized = true,
  } = options;

  const headers = new Headers();
  headers.set("Accept", "application/json");

  if (auth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let requestBody: BodyInit | undefined;

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: requestBody,
  });

  if (response.status === 401 && handleUnauthorized && auth) {
    notifySessionExpired();
  }

  if (!response.ok) {
    throw await errorFromResponse(response);
  }

  return response;
}

export async function apiJson<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await apiFetch(path, options);

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.detail) return error.detail;
  if (error instanceof TypeError) {
    return "Unable to reach Sahaaya. Check that the backend is running and try again.";
  }
  return fallback;
}
