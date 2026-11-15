import type { LoginResponse, RegisterPayload, User } from "../types";
import { apiJson } from "./client";

export function loginRequest(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return apiJson<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
    handleUnauthorized: false,
  });
}

export function registerPatientRequest(
  payload: RegisterPayload,
): Promise<User> {
  return apiJson<User>("/api/auth/register", {
    method: "POST",
    body: payload,
    auth: false,
  });
}

export function registerWorkerRequest(
  payload: RegisterPayload,
): Promise<User> {
  return apiJson<User>("/api/auth/register/healthcare-worker", {
    method: "POST",
    body: payload,
    auth: false,
  });
}
