import type {
  HistoryItem,
  ProfileUpdatePayload,
  User,
} from "../types";
import { apiJson } from "./client";

export function getMe(): Promise<User> {
  return apiJson<User>("/api/users/me");
}

export function updateMe(payload: ProfileUpdatePayload): Promise<User> {
  return apiJson<User>("/api/users/me", {
    method: "PATCH",
    body: payload,
  });
}

export function getHistory(): Promise<HistoryItem[]> {
  return apiJson<HistoryItem[]>("/api/users/me/history");
}
